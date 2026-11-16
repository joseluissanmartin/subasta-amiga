import { describe, expect, it } from 'vitest';
import { EXTENSION_MS, EXTENSION_WINDOW_MS, MAX_WAIT_MS } from '../config';
import { applyBid, nextMinBid, statusOf } from './auction';
import { formatCLP, incrementFor, parseCLP } from './money';
import type { Auction } from './types';

const T0 = 1_000_000_000_000;
const DUR = 5 * 60_000;

function auction(over: Partial<Auction> = {}): Auction {
  return {
    id: 'a1', sellerId: 'vendedor', title: 'Mesa', description: '', condition: 'buen-estado',
    defects: '', category: 'muebles', region: 'RM', comuna: 'Ñuñoa', photos: [],
    minPrice: 10_000, durationMs: DUR, createdAt: T0, bidCount: 0, extensions: 0, ...over,
  };
}

function bid(a: Auction, who: string, amount: number, now: number) {
  const r = applyBid(a, who, amount, now);
  if (!r.ok) throw new Error('esperaba éxito: ' + r.error.code);
  return r.value;
}

describe('montos en CLP', () => {
  it('formatea con punto de miles y sin decimales', () => {
    expect(formatCLP(25000)).toBe('$25.000 CLP');
    expect(formatCLP(1500000, false)).toBe('$1.500.000');
  });
  it('acepta las formas habituales de escribir montos', () => {
    for (const s of ['25000', '25.000', '$25.000', '$ 25.000 CLP', ' 25000 ']) expect(parseCLP(s)).toBe(25000);
  });
  it('rechaza montos ambiguos o con decimales', () => {
    for (const s of ['', '25.5', '25,000', '25.000,50', 'abc', '2.50.000', '-100']) expect(parseCLP(s)).toBeNull();
  });
  it('usa incrementos por tramos', () => {
    expect(incrementFor(3000)).toBe(500);
    expect(incrementFor(10_000)).toBe(500);
    expect(incrementFor(10_001)).toBe(1000);
    expect(incrementFor(80_000)).toBe(5000);
    expect(incrementFor(500_000)).toBe(10_000);
  });
});

describe('reglas de la subasta', () => {
  it('espera la primera oferta sin reloj y vence tras el plazo máximo', () => {
    const a = auction();
    expect(statusOf(a, T0 + 1000)).toBe('esperando');
    expect(statusOf(a, T0 + MAX_WAIT_MS)).toBe('vencida');
  });

  it('la primera oferta igual al mínimo inicia el reloj', () => {
    const now = T0 + 10_000;
    const r = bid(auction(), 'rosa', 10_000, now);
    expect(r.started).toBe(true);
    expect(r.auction.startedAt).toBe(now);
    expect(r.auction.endsAt).toBe(now + DUR);
    expect(statusOf(r.auction, now + 1)).toBe('en-curso');
  });

  it('rechaza una primera oferta bajo el mínimo', () => {
    const r = applyBid(auction(), 'rosa', 9_999, T0);
    expect(r.ok).toBe(false);
  });

  it('la segunda oferta no reinicia el reloj y debe superar el incremento', () => {
    const a1 = bid(auction(), 'rosa', 10_000, T0).auction;
    expect(nextMinBid(a1)).toBe(10_500);
    const bajo = applyBid(a1, 'jorge', 10_400, T0 + 1000);
    expect(bajo.ok).toBe(false);
    if (!bajo.ok) expect(bajo.error).toEqual({ code: 'bajo-minimo', nextMin: 10_500, current: 10_000 });
    const a2 = bid(a1, 'jorge', 10_500, T0 + 1000);
    expect(a2.started).toBe(false);
    expect(a2.auction.endsAt).toBe(a1.endsAt);
    expect(a2.previousLeaderId).toBe('rosa');
  });

  it('no permite empates: la misma cifra que la vigente se rechaza', () => {
    const a1 = bid(auction(), 'rosa', 12_000, T0).auction;
    expect(applyBid(a1, 'jorge', 12_000, T0 + 1).ok).toBe(false);
  });

  it('dos ofertas "simultáneas" con el mismo monto: solo la primera procesada gana', () => {
    const a = auction();
    const primera = bid(a, 'rosa', 10_000, T0);
    // la segunda se valida contra el estado ya actualizado
    expect(applyBid(primera.auction, 'jorge', 10_000, T0).ok).toBe(false);
  });

  it('bloquea ofertar por un artículo propio', () => {
    const r = applyBid(auction(), 'vendedor', 20_000, T0);
    expect(!r.ok && r.error.code).toBe('propia');
  });

  it('no deja subirse la oferta a quien ya va ganando', () => {
    const a1 = bid(auction(), 'rosa', 10_000, T0).auction;
    const r = applyBid(a1, 'rosa', 15_000, T0 + 1);
    expect(!r.ok && r.error.code).toBe('ya-lidera');
  });

  it('rechaza ofertas después del cierre aunque nadie haya "cerrado" la subasta', () => {
    const a1 = bid(auction(), 'rosa', 10_000, T0).auction;
    const r = applyBid(a1, 'jorge', 50_000, a1.endsAt!);
    expect(!r.ok && r.error.code).toBe('cerrada');
    expect(statusOf(a1, a1.endsAt!)).toBe('terminada');
  });

  it('una oferta de último momento alarga el plazo', () => {
    const a1 = bid(auction(), 'rosa', 10_000, T0).auction;
    const casiFin = a1.endsAt! - 10_000;
    const r = bid(a1, 'jorge', 11_000, casiFin);
    expect(r.extended).toBe(true);
    expect(r.auction.endsAt).toBe(casiFin + EXTENSION_MS);
    expect(r.auction.extensions).toBe(1);
  });

  it('una oferta con tiempo de sobra no alarga el plazo', () => {
    const a1 = bid(auction(), 'rosa', 10_000, T0).auction;
    const r = bid(a1, 'jorge', 11_000, a1.endsAt! - EXTENSION_WINDOW_MS - 1);
    expect(r.extended).toBe(false);
    expect(r.auction.endsAt).toBe(a1.endsAt);
  });

  it('rechaza montos no enteros o absurdos', () => {
    expect(applyBid(auction(), 'rosa', 10_000.5, T0).ok).toBe(false);
    expect(applyBid(auction(), 'rosa', 1e12, T0).ok).toBe(false);
  });

  it('un artículo retirado no recibe ofertas', () => {
    const r = applyBid(auction({ withdrawnAt: T0 }), 'rosa', 20_000, T0 + 1);
    expect(!r.ok && r.error.code).toBe('retirada');
  });
});

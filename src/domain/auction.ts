import { EXTENSION_MS, EXTENSION_WINDOW_MS, MAX_AMOUNT, MAX_WAIT_MS } from '../config';
import { incrementFor } from './money';
import type { Auction, AuctionStatus, Id } from './types';

/** El estado se deriva de la hora: una subasta vencida está cerrada aunque nadie la haya "cerrado". */
export function statusOf(a: Auction, now: number): AuctionStatus {
  if (a.withdrawnAt) return 'retirada';
  if (a.startedAt === undefined || a.endsAt === undefined) {
    return now >= a.createdAt + MAX_WAIT_MS ? 'vencida' : 'esperando';
  }
  return now < a.endsAt ? 'en-curso' : 'terminada';
}

export function nextMinBid(a: Auction): number {
  if (a.currentPrice === undefined) return a.minPrice;
  return a.currentPrice + incrementFor(a.currentPrice);
}

/** Tres montos sugeridos para tocar en vez de escribir. */
export function quickBids(a: Auction): number[] {
  const first = nextMinBid(a);
  const step = incrementFor(first);
  return [first, first + step, first + 4 * step];
}

export type BidError =
  | { code: 'retirada' }
  | { code: 'cerrada' }
  | { code: 'propia' }
  | { code: 'ya-lidera'; current: number }
  | { code: 'monto-invalido' }
  | { code: 'bajo-minimo'; nextMin: number; current?: number };

export interface BidSuccess {
  auction: Auction;
  started: boolean;
  extended: boolean;
  previousLeaderId?: Id;
}

/**
 * Valida y aplica una oferta. Es pura: el "servidor" la ejecuta dentro de un
 * bloqueo para que dos ofertas simultáneas se procesen una tras otra
 * (en Supabase será una función de Postgres dentro de una transacción).
 */
export function applyBid(
  a: Auction,
  bidderId: Id,
  amount: number,
  now: number,
): { ok: true; value: BidSuccess } | { ok: false; error: BidError } {
  const status = statusOf(a, now);
  if (status === 'retirada') return { ok: false, error: { code: 'retirada' } };
  if (status === 'terminada' || status === 'vencida') return { ok: false, error: { code: 'cerrada' } };
  if (a.sellerId === bidderId) return { ok: false, error: { code: 'propia' } };
  if (a.leaderId === bidderId && a.currentPrice !== undefined) {
    return { ok: false, error: { code: 'ya-lidera', current: a.currentPrice } };
  }
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return { ok: false, error: { code: 'monto-invalido' } };
  }
  const min = nextMinBid(a);
  if (amount < min) {
    return { ok: false, error: { code: 'bajo-minimo', nextMin: min, current: a.currentPrice } };
  }

  const started = a.startedAt === undefined;
  let endsAt = a.endsAt;
  let extended = false;
  if (started) {
    endsAt = now + a.durationMs;
  } else if (endsAt !== undefined && endsAt - now <= EXTENSION_WINDOW_MS) {
    const proposed = now + EXTENSION_MS;
    // Ignorar diferencias menores a 1 s para no anunciar alargues imperceptibles.
    if (proposed - endsAt >= 1000) {
      endsAt = proposed;
      extended = true;
    }
  }

  return {
    ok: true,
    value: {
      started,
      extended,
      previousLeaderId: a.leaderId,
      auction: {
        ...a,
        startedAt: started ? now : a.startedAt,
        endsAt,
        currentPrice: amount,
        leaderId: bidderId,
        bidCount: a.bidCount + 1,
        extensions: a.extensions + (extended ? 1 : 0),
      },
    },
  };
}

export function bidErrorMessage(e: BidError): string {
  switch (e.code) {
    case 'retirada':
      return 'Este artículo fue retirado y ya no recibe ofertas.';
    case 'cerrada':
      return 'La subasta ya terminó. Su oferta no fue registrada.';
    case 'propia':
      return 'No puede ofertar por un artículo que usted publicó.';
    case 'ya-lidera':
      return 'Usted ya tiene la oferta más alta. No necesita ofrecer de nuevo.';
    case 'monto-invalido':
      return 'El monto no es válido. Escríbalo solo con números, por ejemplo 15000.';
    case 'bajo-minimo':
      return e.current !== undefined
        ? 'Otra persona ofreció más antes que usted. Revise la nueva oferta mínima.'
        : 'El monto es menor al precio mínimo de este artículo.';
  }
}

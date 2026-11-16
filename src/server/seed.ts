import { TERMS_VERSION } from '../config';
import { incrementFor } from '../domain/money';
import type { AppNotification, Auction, Bid, Category, Condition, Report, User } from '../domain/types';
import { CATALOG } from './catalog';

export interface DB {
  users: User[];
  auctions: Auction[];
  bids: Bid[];
  notifications: AppNotification[];
  reports: Report[];
  /** Resultados ya entregados por requestId: evita ofertas duplicadas por doble clic o reintento. */
  processed: Record<string, unknown>;
}

/** Ilustración para artículos sin foto: fondo blanco (como una foto de producto) y un dibujo grande. */
export function placeholderImage(_category: Category, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ffffff"/><circle cx="200" cy="150" r="110" fill="#ff6f00" opacity="0.10"/><circle cx="200" cy="150" r="80" fill="#ff6f00" opacity="0.10"/><text x="200" y="192" font-size="120" text-anchor="middle">${emoji}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const CATEGORY_EMOJI: Record<Category, string> = {
  electrohogar: '🔌', tecnologia: '📱', muebles: '🪑', libros: '📚', decoracion: '🖼️', cocina: '🫖', herramientas: '🔨', ropa: '🧶', otros: '📦',
};

const COMUNAS = ['Ñuñoa', 'Providencia', 'La Florida', 'Maipú', 'Puente Alto', 'Las Condes', 'San Miguel', 'Viña del Mar', 'Concepción', 'Temuco'];
const REGION_OF: Record<string, string> = { 'Viña del Mar': 'Valparaíso', Concepción: 'Biobío', Temuco: 'La Araucanía' };
const CONDITIONS: Condition[] = ['como-nuevo', 'buen-estado', 'buen-estado', 'con-detalles', 'nuevo'];
const DEFECTS: Record<Condition, string> = {
  nuevo: 'Ninguno. Está en su caja, sin abrir.',
  'como-nuevo': 'Ninguno. Se usó muy pocas veces.',
  'buen-estado': 'Pequeñas marcas de uso normales.',
  'con-detalles': 'Tiene rayones visibles, pero funciona bien.',
};

const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);

export function createSeed(now: number): DB {
  const MIN = 60_000;
  const users: User[] = [
    { id: 'u-rosa', alias: 'Rosa', email: 'rosa@ejemplo.cl', whatsapp: '+56 9 1111 1111', createdAt: now - 90 * 86_400_000, termsVersion: TERMS_VERSION },
    { id: 'u-jorge', alias: 'Jorge', email: 'jorge@ejemplo.cl', whatsapp: '+56 9 2222 2222', createdAt: now - 40 * 86_400_000, termsVersion: TERMS_VERSION },
    { id: 'u-carmen', alias: 'Carmen', email: 'carmen@ejemplo.cl', createdAt: now - 10 * 86_400_000, termsVersion: TERMS_VERSION },
  ];
  const ids = users.map((u) => u.id);

  const auctions: Auction[] = [];
  const bids: Bid[] = [];

  CATALOG.forEach((item, i) => {
    const id = `a-${i + 1}`;
    const sellerId = ids[i % 3];
    const others = ids.filter((u) => u !== sellerId);
    const condition = CONDITIONS[i % CONDITIONS.length];
    const comuna = COMUNAS[i % COMUNAS.length];
    // Usado: precio mínimo cerca del 40% del valor nuevo.
    const minPrice = roundTo(item.ref * 0.4, item.ref < 100_000 ? 1_000 : 5_000);
    const durationMs = [5, 15, 15, 5][i % 4] * MIN;

    // Reparto de estados: 4 terminadas, 8 esperando oferta, el resto en curso.
    const kind = i % 10 === 9 || i === 4 ? 'terminada' : i % 4 === 3 ? 'esperando' : 'en-curso';
    const a: Auction = {
      id,
      sellerId,
      title: item.name,
      description:
        `${item.kind.replace(/s$/, '')}: ${item.name}.\n` +
        `Funciona correctamente. Se vende porque ya no lo uso.\n\n` +
        `Precio de referencia nuevo (SoloTodo.cl): $${item.ref.toLocaleString('es-CL')} CLP.`,
      condition,
      defects: DEFECTS[condition],
      category: item.category,
      region: REGION_OF[comuna] ?? 'Región Metropolitana',
      comuna,
      photos: [item.image],
      minPrice,
      durationMs,
      createdAt: now - (20 + i) * MIN,
      bidCount: 0,
      extensions: 0,
    };

    if (kind !== 'esperando') {
      const nBids = 1 + (i % 4);
      const endsAt = kind === 'terminada' ? now - (2 + i) * MIN : now + (1.5 + ((i * 7) % 13)) * MIN;
      const startedAt = endsAt - durationMs;
      let price = minPrice;
      for (let b = 0; b < nBids; b++) {
        const bidder = others[b % 2];
        bids.push({
          id: `b-${id}-${b}`, auctionId: id, bidderId: bidder, amount: price,
          at: Math.min(now - 1000, startedAt + ((b + 1) * (Math.min(endsAt, now) - startedAt)) / (nBids + 1)),
          requestId: `seed-${id}-${b}`, extended: false,
        });
        a.leaderId = bidder;
        a.currentPrice = price;
        price += incrementFor(price) * (1 + (b % 2));
      }
      a.bidCount = nBids;
      a.startedAt = startedAt;
      a.endsAt = endsAt;
    }
    auctions.push(a);
  });

  return { users, auctions, bids, notifications: [], reports: [], processed: {} };
}

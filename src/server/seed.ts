import { TERMS_VERSION } from '../config';
import type { AppNotification, Auction, Bid, Category, Report, User } from '../domain/types';

export interface DB {
  users: User[];
  auctions: Auction[];
  bids: Bid[];
  notifications: AppNotification[];
  reports: Report[];
  /** Resultados ya entregados por requestId: evita ofertas duplicadas por doble clic o reintento. */
  processed: Record<string, unknown>;
}

const PALETTE: Record<Category, [string, string]> = {
  muebles: ['#f6e3c5', '#c98a4b'],
  libros: ['#dfe9f5', '#4b78b0'],
  decoracion: ['#f5dfe8', '#b0577e'],
  cocina: ['#e3f1e0', '#4d8a45'],
  herramientas: ['#ece7dc', '#7a6a4f'],
  ropa: ['#efe2f5', '#7d55a3'],
  otros: ['#e8e8e8', '#666666'],
};

/** Ilustración simple para artículos sin foto (los de ejemplo). */
export function placeholderImage(category: Category, emoji: string): string {
  const [bg, fg] = PALETTE[category];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${bg}"/><circle cx="200" cy="150" r="105" fill="${fg}" opacity="0.15"/><text x="200" y="190" font-size="120" text-anchor="middle">${emoji}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const CATEGORY_EMOJI: Record<Category, string> = {
  muebles: '🪑', libros: '📚', decoracion: '🖼️', cocina: '🫖', herramientas: '🔨', ropa: '🧶', otros: '📦',
};

export function createSeed(now: number): DB {
  const MIN = 60_000;
  const users: User[] = [
    { id: 'u-rosa', alias: 'Rosa', email: 'rosa@ejemplo.cl', whatsapp: '+56 9 1111 1111', createdAt: now - 90 * 86_400_000, termsVersion: TERMS_VERSION },
    { id: 'u-jorge', alias: 'Jorge', email: 'jorge@ejemplo.cl', whatsapp: '+56 9 2222 2222', createdAt: now - 40 * 86_400_000, termsVersion: TERMS_VERSION },
    { id: 'u-carmen', alias: 'Carmen', email: 'carmen@ejemplo.cl', createdAt: now - 10 * 86_400_000, termsVersion: TERMS_VERSION },
  ];

  let n = 0;
  const bids: Bid[] = [];
  const mk = (
    p: Omit<Auction, 'id' | 'createdAt' | 'bidCount' | 'extensions' | 'photos' | 'region'> & {
      emoji: string; createdAgo: number; history?: [string, number, number][];
    },
  ): Auction => {
    const id = 'a-' + ++n;
    const { emoji, createdAgo, history = [], ...rest } = p;
    for (const [who, amount, agoMs] of history) {
      bids.push({ id: `b-${id}-${bids.length}`, auctionId: id, bidderId: who, amount, at: now - agoMs, requestId: `seed-${id}-${bids.length}`, extended: false });
    }
    const last = history[history.length - 1];
    return {
      ...rest,
      id,
      region: 'Región Metropolitana',
      createdAt: now - createdAgo,
      photos: [placeholderImage(rest.category, emoji)],
      bidCount: history.length,
      extensions: 0,
      currentPrice: last?.[1],
      leaderId: last?.[0],
    };
  };

  const auctions: Auction[] = [
    mk({
      sellerId: 'u-jorge', title: 'Silla de mimbre antigua', category: 'muebles', emoji: '🪑',
      description: 'Silla de mimbre de los años 70, muy cómoda. Ideal para terraza o dormitorio.',
      condition: 'buen-estado', defects: 'Un pequeño roce en la pata trasera izquierda.', comuna: 'Ñuñoa',
      minPrice: 15_000, durationMs: 15 * MIN, createdAgo: 30 * MIN,
      startedAt: now - 6 * MIN, endsAt: now + 9 * MIN,
      history: [['u-carmen', 15_000, 6 * MIN], ['u-rosa', 16_000, 4 * MIN]],
    }),
    mk({
      sellerId: 'u-rosa', title: 'Juego de té de loza (6 tazas)', category: 'cocina', emoji: '🫖',
      description: 'Juego de té completo: tetera, azucarero, lechero y 6 tazas con platillo. Loza blanca con flores azules.',
      condition: 'como-nuevo', defects: 'Ninguno conocido.', comuna: 'Providencia',
      minPrice: 20_000, durationMs: 5 * MIN, createdAgo: 20 * MIN,
      startedAt: now - 3 * MIN, endsAt: now + 2 * MIN,
      history: [['u-jorge', 20_000, 3 * MIN], ['u-carmen', 21_000, 2 * MIN]],
    }),
    mk({
      sellerId: 'u-carmen', title: 'Colección de novelas de Isabel Allende', category: 'libros', emoji: '📚',
      description: 'Ocho novelas en tapa blanda. Se entregan juntas.',
      condition: 'buen-estado', defects: 'Algunas hojas amarillas por el tiempo.', comuna: 'La Florida',
      minPrice: 8_000, durationMs: 5 * MIN, createdAgo: 10 * MIN,
    }),
    mk({
      sellerId: 'u-jorge', title: 'Caja de herramientas con 40 piezas', category: 'herramientas', emoji: '🔨',
      description: 'Caja metálica con destornilladores, llaves, alicate y martillo.',
      condition: 'buen-estado', defects: 'Le falta una llave de 10 mm.', comuna: 'Maipú',
      minPrice: 25_000, durationMs: 15 * MIN, createdAgo: 5 * MIN,
    }),
    mk({
      sellerId: 'u-rosa', title: 'Chaleco de lana tejido a mano', category: 'ropa', emoji: '🧶',
      description: 'Chaleco talla M, lana de oveja color crema. Tejido por mí.',
      condition: 'nuevo', defects: 'Ninguno.', comuna: 'Providencia',
      minPrice: 12_000, durationMs: 15 * MIN, createdAgo: 40 * MIN,
      startedAt: now - 12 * MIN, endsAt: now + 3 * MIN,
      history: [['u-jorge', 12_000, 12 * MIN]],
    }),
    mk({
      sellerId: 'u-carmen', title: 'Reloj de pared de madera', category: 'decoracion', emoji: '🕰️',
      description: 'Reloj a pilas con caja de madera. Funciona perfecto.',
      condition: 'buen-estado', defects: 'El vidrio tiene un rayón pequeño.', comuna: 'La Florida',
      minPrice: 18_000, durationMs: 5 * MIN, createdAgo: 50 * MIN,
      startedAt: now - 20 * MIN, endsAt: now - 15 * MIN,
      history: [['u-rosa', 18_000, 20 * MIN], ['u-jorge', 19_000, 18 * MIN], ['u-rosa', 20_000, 16 * MIN]],
    }),
  ];

  return { users, auctions, bids, notifications: [], reports: [], processed: {} };
}

export type Id = string;

export interface User {
  id: Id;
  alias: string;
  email: string;
  whatsapp?: string;
  createdAt: number;
  termsVersion: string;
}

export const CATEGORIES = {
  muebles: 'Muebles',
  libros: 'Libros y revistas',
  decoracion: 'Decoración',
  cocina: 'Cocina y loza',
  herramientas: 'Herramientas y jardín',
  ropa: 'Ropa y tejidos',
  otros: 'Otros',
} as const;
export type Category = keyof typeof CATEGORIES;

export const CONDITIONS = {
  nuevo: 'Nuevo, sin uso',
  'como-nuevo': 'Como nuevo',
  'buen-estado': 'Usado, en buen estado',
  'con-detalles': 'Usado, con detalles',
} as const;
export type Condition = keyof typeof CONDITIONS;

export interface Auction {
  id: Id;
  sellerId: Id;
  title: string;
  description: string;
  condition: Condition;
  defects: string;
  category: Category;
  region: string;
  comuna: string;
  /** Fotos como data URL (ya comprimidas en el navegador). */
  photos: string[];
  minPrice: number;
  durationMs: number;
  createdAt: number;
  /** Momento de la primera oferta válida; el reloj parte aquí. */
  startedAt?: number;
  /** Fin del plazo; puede alargarse con ofertas de último momento. */
  endsAt?: number;
  currentPrice?: number;
  leaderId?: Id;
  bidCount: number;
  extensions: number;
  withdrawnAt?: number;
  /** Cuando la tarea de cierre registró el resultado y envió avisos. */
  settledAt?: number;
  delivery?: { seller?: boolean; buyer?: boolean };
}

export interface Bid {
  id: Id;
  auctionId: Id;
  bidderId: Id;
  amount: number;
  at: number;
  requestId: string;
  extended: boolean;
}

export type NotificationKind =
  | 'superado'
  | 'primera-oferta'
  | 'ganaste'
  | 'no-ganaste'
  | 'subasta-terminada'
  | 'vencida';

export interface AppNotification {
  id: Id;
  userId: Id;
  auctionId: Id;
  kind: NotificationKind;
  text: string;
  at: number;
  read: boolean;
}

export interface Report {
  id: Id;
  auctionId: Id;
  reporterId: Id;
  reason: string;
  at: number;
}

export type AuctionStatus = 'esperando' | 'en-curso' | 'terminada' | 'vencida' | 'retirada';

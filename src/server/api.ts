/**
 * "Servidor" simulado del prototipo.
 *
 * Todo lo que la interfaz necesita pasa por las funciones exportadas aquí, con la
 * misma forma que tendrán al conectar Supabase. Para migrar se reemplaza este
 * archivo, sin tocar las pantallas.
 *
 * - Los datos viven en localStorage (compartidos entre pestañas del mismo navegador).
 * - La sesión es por pestaña: puede abrir dos pestañas con personas distintas.
 * - Las escrituras se hacen bajo un bloqueo (Web Locks), igual que una transacción.
 * - Los cambios se avisan entre pestañas con BroadcastChannel (simula Realtime).
 */
import { MAX_PHOTOS, MIN_PRICE, TERMS_VERSION, DURATION_OPTIONS } from '../config';
import { applyBid, statusOf, type BidError } from '../domain/auction';
import { formatCLP } from '../domain/money';
import type { AppNotification, Auction, Category, Condition, Id, NotificationKind, User } from '../domain/types';
import { createSeed, type DB } from './seed';

const DB_KEY = 'subastas-db-v1';
const SESSION_KEY = 'subastas-sesion';
const OFFLINE_KEY = 'subastas-sin-conexion';

// ---------- infraestructura interna ----------

export class OfflineError extends Error {
  constructor() {
    super('Sin conexión');
  }
}
export class ApiError extends Error {}

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('subastas') : null;
const listeners = new Set<() => void>();
channel?.addEventListener('message', () => listeners.forEach((l) => l()));

function emit() {
  listeners.forEach((l) => l());
  channel?.postMessage('cambio');
}

/** Suscribirse a cambios (equivalente a Supabase Realtime). */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function serverNow() {
  return Date.now();
}

function load(): DB {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw) as DB;
  const db = createSeed(serverNow());
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

function save(db: DB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new ApiError('No hay espacio suficiente para guardar. Intente con menos fotos.');
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simula la red: demora, y falla si se activó "sin conexión". */
async function network() {
  await sleep(250 + Math.random() * 400);
  if (isOffline()) throw new OfflineError();
}

async function read<T>(fn: (db: DB) => T): Promise<T> {
  await network();
  return fn(load());
}

async function write<T>(fn: (db: DB, now: number) => T): Promise<T> {
  await network();
  const run = () => {
    const db = load();
    const result = fn(db, serverNow());
    save(db);
    return result;
  };
  const result = navigator.locks ? await navigator.locks.request('subastas-db', run) : run();
  emit();
  return result;
}

const uid = (p: string) => p + '-' + crypto.randomUUID().slice(0, 8);

function notify(db: DB, userId: Id, auctionId: Id, kind: NotificationKind, text: string, now: number) {
  db.notifications.push({ id: uid('n'), userId, auctionId, kind, text, at: now, read: false });
}

function requireUser(db: DB): User {
  const id = sessionStorage.getItem(SESSION_KEY);
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new ApiError('Debe ingresar con su cuenta para hacer esto.');
  return user;
}

// ---------- herramientas del prototipo ----------

export function isOffline() {
  return sessionStorage.getItem(OFFLINE_KEY) === '1';
}
export function setOffline(v: boolean) {
  if (v) sessionStorage.setItem(OFFLINE_KEY, '1');
  else sessionStorage.removeItem(OFFLINE_KEY);
  listeners.forEach((l) => l());
}
export function resetDemoData() {
  localStorage.setItem(DB_KEY, JSON.stringify(createSeed(serverNow())));
  emit();
}
export function demoUsers(): { id: Id; alias: string }[] {
  return load().users.map((u) => ({ id: u.id, alias: u.alias }));
}
export function switchUser(id: Id | null) {
  if (id) sessionStorage.setItem(SESSION_KEY, id);
  else sessionStorage.removeItem(SESSION_KEY);
  listeners.forEach((l) => l());
}

// ---------- hora ----------

/** La interfaz calcula la diferencia con su propio reloj y la corrige. */
export async function getServerTime(): Promise<number> {
  await network();
  return serverNow();
}

// ---------- cuentas ----------

export function currentUserSync(): User | null {
  const id = sessionStorage.getItem(SESSION_KEY);
  return load().users.find((u) => u.id === id) ?? null;
}

const pendingCodes = new Map<string, string>();
const normEmail = (e: string) => e.trim().toLowerCase();

/** Envía un código de 6 dígitos al correo. En el prototipo se devuelve para mostrarlo en pantalla. */
export async function requestLoginCode(email: string): Promise<{ demoCode: string; exists: boolean }> {
  await network();
  const e = normEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new ApiError('El correo no parece válido. Revise que tenga @ y un punto, por ejemplo: nombre@gmail.com');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  pendingCodes.set(e, code);
  return { demoCode: code, exists: load().users.some((u) => u.email === e) };
}

export async function verifyLoginCode(email: string, code: string): Promise<{ user: User | null }> {
  await network();
  const e = normEmail(email);
  if (pendingCodes.get(e) !== code.replace(/\s/g, '')) throw new ApiError('El código no coincide. Revise el correo e inténtelo de nuevo.');
  const user = load().users.find((u) => u.email === e) ?? null;
  if (user) {
    pendingCodes.delete(e);
    switchUser(user.id);
  }
  return { user };
}

export async function register(input: { email: string; code: string; alias: string; whatsapp?: string }): Promise<User> {
  const e = normEmail(input.email);
  if (pendingCodes.get(e) !== input.code) throw new ApiError('La verificación expiró. Vuelva a pedir el código.');
  const alias = input.alias.trim();
  if (alias.length < 2 || alias.length > 30) throw new ApiError('El nombre debe tener entre 2 y 30 letras.');
  const user = await write((db, now) => {
    if (db.users.some((u) => u.email === e)) throw new ApiError('Ya existe una cuenta con ese correo.');
    const u: User = { id: uid('u'), alias, email: e, whatsapp: input.whatsapp?.trim() || undefined, createdAt: now, termsVersion: TERMS_VERSION };
    db.users.push(u);
    return u;
  });
  pendingCodes.delete(e);
  switchUser(user.id);
  return user;
}

export function logout() {
  switchUser(null);
}

// ---------- catálogo ----------

export interface AuctionSummary {
  auction: Auction;
  sellerAlias: string;
}

export async function listAuctions(): Promise<AuctionSummary[]> {
  return read((db) =>
    db.auctions.map((a) => ({ auction: a, sellerAlias: db.users.find((u) => u.id === a.sellerId)?.alias ?? '—' })),
  );
}

export interface AuctionDetail {
  auction: Auction;
  seller: { alias: string; memberSince: number; published: number; completed: number };
  /** Historial público: alias y monto, nunca correo ni teléfono. */
  bids: { alias: string; amount: number; at: number; mine: boolean; extended: boolean }[];
  leaderAlias?: string;
  iParticipated: boolean;
}

export async function getAuction(id: Id): Promise<AuctionDetail | null> {
  return read((db) => {
    const a = db.auctions.find((x) => x.id === id);
    if (!a) return null;
    const me = sessionStorage.getItem(SESSION_KEY);
    const alias = (uid: Id) => db.users.find((u) => u.id === uid)?.alias ?? '—';
    const seller = db.users.find((u) => u.id === a.sellerId)!;
    const own = db.auctions.filter((x) => x.sellerId === a.sellerId);
    const bids = db.bids
      .filter((b) => b.auctionId === id)
      .sort((x, y) => y.at - x.at)
      .map((b) => ({ alias: alias(b.bidderId), amount: b.amount, at: b.at, mine: b.bidderId === me, extended: b.extended }));
    return {
      auction: a,
      seller: { alias: seller.alias, memberSince: seller.createdAt, published: own.length, completed: own.filter((x) => x.delivery?.seller && x.delivery?.buyer).length },
      bids,
      leaderAlias: a.leaderId ? alias(a.leaderId) : undefined,
      iParticipated: bids.some((b) => b.mine),
    };
  });
}

// ---------- ofertas ----------

export type BidResult =
  | { ok: true; amount: number; started: boolean; extended: boolean; endsAt: number }
  | { ok: false; error: BidError; auction: Auction };

/**
 * Realiza una oferta. `requestId` lo genera la pantalla al confirmar; si la
 * misma solicitud llega dos veces (doble clic, reintento por mala conexión)
 * se devuelve el mismo resultado sin registrar otra oferta.
 */
export async function placeBid(auctionId: Id, amount: number, requestId: string): Promise<BidResult> {
  return write((db, now) => {
    if (db.processed[requestId]) return db.processed[requestId] as BidResult;
    const user = requireUser(db);
    const idx = db.auctions.findIndex((a) => a.id === auctionId);
    if (idx < 0) throw new ApiError('El artículo no existe.');
    const before = db.auctions[idx];
    const r = applyBid(before, user.id, amount, now);
    let result: BidResult;
    if (!r.ok) {
      result = { ok: false, error: r.error, auction: before };
    } else {
      const { auction, started, extended, previousLeaderId } = r.value;
      db.auctions[idx] = auction;
      db.bids.push({ id: uid('b'), auctionId, bidderId: user.id, amount, at: now, requestId, extended });
      if (started) {
        notify(db, auction.sellerId, auctionId, 'primera-oferta', `Su artículo «${auction.title}» recibió su primera oferta: ${formatCLP(amount)}. La cuenta regresiva comenzó.`, now);
      }
      if (previousLeaderId && previousLeaderId !== user.id) {
        notify(db, previousLeaderId, auctionId, 'superado', `Otra persona ofreció ${formatCLP(amount)} por «${auction.title}». Si quiere, puede ofrecer más.`, now);
      }
      result = { ok: true, amount, started, extended, endsAt: auction.endsAt! };
    }
    db.processed[requestId] = result;
    return result;
  });
}

// ---------- publicar ----------

export interface NewAuctionInput {
  title: string;
  description: string;
  condition: Condition;
  defects: string;
  category: Category;
  region: string;
  comuna: string;
  photos: string[];
  minPrice: number;
  durationMs: number;
}

export async function createAuction(input: NewAuctionInput): Promise<Id> {
  // Validación en el "servidor": nunca confiar solo en el formulario.
  if (input.title.trim().length < 3) throw new ApiError('El título es muy corto.');
  if (!Number.isInteger(input.minPrice) || input.minPrice < MIN_PRICE) throw new ApiError(`El precio mínimo debe ser al menos ${formatCLP(MIN_PRICE)}.`);
  if (!DURATION_OPTIONS.some((d) => d.ms === input.durationMs)) throw new ApiError('Duración no permitida.');
  if (input.photos.length > MAX_PHOTOS) throw new ApiError(`Máximo ${MAX_PHOTOS} fotos.`);
  return write((db, now) => {
    const user = requireUser(db);
    const a: Auction = { ...input, title: input.title.trim(), id: uid('a'), sellerId: user.id, createdAt: now, bidCount: 0, extensions: 0 };
    db.auctions.push(a);
    return a.id;
  });
}

/** Solo se puede retirar mientras espera la primera oferta. */
export async function withdrawAuction(id: Id): Promise<void> {
  return write((db, now) => {
    const user = requireUser(db);
    const a = db.auctions.find((x) => x.id === id);
    if (!a || a.sellerId !== user.id) throw new ApiError('No puede retirar este artículo.');
    if (statusOf(a, now) !== 'esperando') throw new ApiError('Solo se puede retirar un artículo que todavía no recibe ofertas.');
    a.withdrawnAt = now;
  });
}

// ---------- después del cierre ----------

export interface Contact {
  role: 'comprador' | 'vendedor';
  alias: string;
  email: string;
  whatsapp?: string;
}

/** Revela el contacto de la otra parte, solo al ganador y al vendedor, y solo tras el cierre. */
export async function getCounterpartContact(auctionId: Id): Promise<Contact | null> {
  return read((db) => {
    const me = sessionStorage.getItem(SESSION_KEY);
    const a = db.auctions.find((x) => x.id === auctionId);
    if (!a || !me || statusOf(a, serverNow()) !== 'terminada' || !a.leaderId) return null;
    const otherId = me === a.sellerId ? a.leaderId : me === a.leaderId ? a.sellerId : null;
    const other = db.users.find((u) => u.id === otherId);
    if (!other) return null;
    return { role: me === a.sellerId ? 'comprador' : 'vendedor', alias: other.alias, email: other.email, whatsapp: other.whatsapp };
  });
}

export async function setDeliveryOutcome(auctionId: Id, done: boolean): Promise<void> {
  return write((db, now) => {
    const user = requireUser(db);
    const a = db.auctions.find((x) => x.id === auctionId);
    if (!a || statusOf(a, now) !== 'terminada') throw new ApiError('La subasta aún no termina.');
    a.delivery ??= {};
    if (user.id === a.sellerId) a.delivery.seller = done;
    else if (user.id === a.leaderId) a.delivery.buyer = done;
    else throw new ApiError('Solo el vendedor y el ganador pueden responder.');
  });
}

export async function reportAuction(auctionId: Id, reason: string): Promise<void> {
  return write((db, now) => {
    const user = requireUser(db);
    db.reports.push({ id: uid('r'), auctionId, reporterId: user.id, reason: reason.trim().slice(0, 500), at: now });
  });
}

// ---------- mi cuenta ----------

export interface MyActivity {
  bidOn: { summary: AuctionSummary; myBest: number }[];
  published: AuctionSummary[];
}

export async function getMyActivity(): Promise<MyActivity> {
  return read((db) => {
    const user = requireUser(db);
    const sum = (a: Auction): AuctionSummary => ({ auction: a, sellerAlias: db.users.find((u) => u.id === a.sellerId)?.alias ?? '—' });
    const best = new Map<Id, number>();
    for (const b of db.bids) if (b.bidderId === user.id) best.set(b.auctionId, Math.max(best.get(b.auctionId) ?? 0, b.amount));
    return {
      bidOn: db.auctions.filter((a) => best.has(a.id)).map((a) => ({ summary: sum(a), myBest: best.get(a.id)! })),
      published: db.auctions.filter((a) => a.sellerId === user.id).map(sum),
    };
  });
}

export async function listNotifications(): Promise<AppNotification[]> {
  return read((db) => {
    const me = sessionStorage.getItem(SESSION_KEY);
    return db.notifications.filter((n) => n.userId === me).sort((a, b) => b.at - a.at);
  });
}

export async function markNotificationsRead(): Promise<void> {
  return write((db) => {
    const user = requireUser(db);
    for (const n of db.notifications) if (n.userId === user.id) n.read = true;
  });
}

// ---------- tarea de cierre (en Supabase: pg_cron cada minuto) ----------

/**
 * Registra el resultado de las subastas vencidas y envía avisos. No decide
 * quién gana (eso ya lo fija la hora de término): si esta tarea se atrasa, las
 * ofertas tardías se rechazan igual.
 */
export async function runSettlement(): Promise<void> {
  const run = () => {
    const db = load();
    const now = serverNow();
    let changed = false;
    for (const a of db.auctions) {
      if (a.settledAt) continue;
      const s = statusOf(a, now);
      if (s === 'terminada') {
        a.settledAt = now;
        changed = true;
        const price = formatCLP(a.currentPrice!);
        notify(db, a.leaderId!, a.id, 'ganaste', `¡Usted ganó «${a.title}» con ${price}! Ya puede ver los datos de contacto del vendedor.`, now);
        notify(db, a.sellerId, a.id, 'subasta-terminada', `Su subasta «${a.title}» terminó con una oferta ganadora de ${price}. Ya puede ver los datos de contacto del comprador.`, now);
        const losers = new Set(db.bids.filter((b) => b.auctionId === a.id && b.bidderId !== a.leaderId).map((b) => b.bidderId));
        for (const l of losers) notify(db, l, a.id, 'no-ganaste', `La subasta «${a.title}» terminó. Esta vez ganó otra persona con ${price}.`, now);
      } else if (s === 'vencida') {
        a.settledAt = now;
        changed = true;
        notify(db, a.sellerId, a.id, 'vencida', `Su artículo «${a.title}» no recibió ofertas y la publicación venció. Puede publicarlo de nuevo.`, now);
      }
    }
    if (changed) save(db);
    return changed;
  };
  const changed = navigator.locks ? await navigator.locks.request('subastas-db', run) : run();
  if (changed) emit();
}

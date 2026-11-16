import type { ReactNode } from 'react';
import { statusOf } from '../domain/auction';
import { formatCLP } from '../domain/money';
import type { Auction, AuctionStatus } from '../domain/types';
import type { AuctionSummary } from '../server/api';
import { formatEnd, formatRemaining } from './format';

export const STATUS_LABEL: Record<AuctionStatus, string> = {
  esperando: 'Esperando la primera oferta',
  'en-curso': 'En curso',
  terminada: 'Terminada',
  vencida: 'Venció sin ofertas',
  retirada: 'Retirada',
};

export function StatusBadge({ status }: { status: AuctionStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function Notice({ kind, title, children }: { kind: 'ok' | 'warn' | 'info' | 'error'; title?: string; children?: ReactNode }) {
  const icon = { ok: '✔', warn: '⚠', info: 'ℹ', error: '✖' }[kind];
  return (
    <div className={`notice notice-${kind}`}>
      <span className="notice-icon" aria-hidden="true">{icon}</span>
      <div>
        {title && <p className="notice-title">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** Precio: "Oferta actual", "Precio mínimo" o "Precio final" según el estado. */
export function PriceInfo({ auction, status }: { auction: Auction; status: AuctionStatus }) {
  if (auction.currentPrice === undefined) {
    return (
      <p className="price">
        <span className="price-label">Precio mínimo</span>
        <span className="price-amount">{formatCLP(auction.minPrice)}</span>
      </p>
    );
  }
  return (
    <p className="price">
      <span className="price-label">{status === 'terminada' ? 'Precio final' : 'Oferta actual'}</span>
      <span className="price-amount">{formatCLP(auction.currentPrice)}</span>
    </p>
  );
}

/**
 * Tiempo restante. El número que cambia cada segundo se oculta a los lectores
 * de pantalla (sería muy molesto); en su lugar leen la hora exacta de término.
 */
export function TimeInfo({ auction, status, now, compact }: { auction: Auction; status: AuctionStatus; now: number; compact?: boolean }) {
  if (status === 'esperando') {
    return <p className="time time-waiting">⏳ La cuenta regresiva comenzará con la primera oferta.</p>;
  }
  if (status === 'en-curso' && auction.endsAt) {
    const left = auction.endsAt - now;
    const urgent = left < 60_000;
    return (
      <div className={`time ${urgent ? 'time-urgent' : ''}`}>
        <p className="time-left" aria-hidden="true">
          ⏱ Quedan <strong>{formatRemaining(left)}</strong>
        </p>
        {!compact && <p className="time-end">Termina el {formatEnd(auction.endsAt)}</p>}
        {compact && <span className="sr-only">Termina el {formatEnd(auction.endsAt)}</span>}
      </div>
    );
  }
  if (status === 'terminada' && auction.endsAt) {
    return <p className="time">Terminó el {formatEnd(auction.endsAt)}</p>;
  }
  return null;
}

export function AuctionCard({ summary, now, meId }: { summary: AuctionSummary; now: number; meId?: string }) {
  const a = summary.auction;
  const status = statusOf(a, now);
  const leading = meId && a.leaderId === meId;
  return (
    <li className="card">
      <a href={`#/articulo/${a.id}`} className="card-link">
        <img src={a.photos[0]} alt="" className="card-img" />
        <div className="card-body">
          <h3 className="card-title">{a.title}</h3>
          <StatusBadge status={status} />
          {leading && status === 'en-curso' && <span className="badge badge-leading">Usted va ganando</span>}
          <PriceInfo auction={a} status={status} />
          <TimeInfo auction={a} status={status} now={now} compact />
          <p className="card-meta">
            {a.comuna} · Publicado por {summary.sellerAlias}
          </p>
          <span className="card-cta">Ver artículo →</span>
        </div>
      </a>
    </li>
  );
}

export function Loading() {
  return <p className="loading" role="status">Cargando…</p>;
}

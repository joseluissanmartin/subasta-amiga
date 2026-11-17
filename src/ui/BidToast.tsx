/**
 * Aviso flotante de "nueva oferta" en la página del artículo, y una pequeña
 * fiesta de confeti para quienes estaban mirando cuando otra persona ofertó.
 */
import { useEffect, useRef, useState } from 'react';
import { formatCLP } from '../domain/money';
import type { AuctionDetail } from '../server/api';

const SHOW_MS = 9000;
const PARTY_MS = 3500;
const CONFETTI = ['🎉', '🎊', '✨', '🪙', '🧡', '⭐'];

type Bid = AuctionDetail['bids'][number];

function reducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function BidToast({ bids }: { bids: AuctionDetail['bids'] }) {
  const latest = bids[0];
  const key = latest ? `${latest.at}-${latest.amount}` : '';
  const seen = useRef(key);
  const [toast, setToast] = useState<{ bid: Bid; n: number } | null>(null);
  const [party, setParty] = useState(0);

  // Solo se avisa de ofertas que llegan mientras la página está abierta.
  useEffect(() => {
    if (!latest || key === seen.current) return;
    seen.current = key;
    setToast((t) => ({ bid: latest, n: (t?.n ?? 0) + 1 }));
    if (!latest.mine && !reducedMotion()) setParty((p) => p + 1);
  }, [key, latest]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), SHOW_MS);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!party) return;
    const t = setTimeout(() => setParty(0), PARTY_MS);
    return () => clearTimeout(t);
  }, [party]);

  return (
    <>
      {party > 0 && (
        <div className="bid-party" key={party} aria-hidden="true">
          {Array.from({ length: 28 }, (_, k) => (
            <span key={k} style={{ ['--k' as string]: k, ['--x' as string]: `${(k * 37) % 100}%` }}>
              {CONFETTI[k % CONFETTI.length]}
            </span>
          ))}
        </div>
      )}
      <div className="bid-toast-area" role="status" aria-live="polite">
        {toast && (
          <div className={`bid-toast ${toast.bid.mine ? 'is-mine' : ''}`} key={toast.n}>
            <span className="bid-toast-icon" aria-hidden="true">
              {toast.bid.mine ? '✅' : '🔨'}
            </span>
            <span className="bid-toast-text">
              <span className="bid-toast-kicker">{toast.bid.mine ? 'Su oferta quedó registrada' : '¡Nueva oferta!'}</span>
              <span>
                <strong>{toast.bid.mine ? 'Usted' : toast.bid.alias}</strong> ofreció{' '}
                <strong className="bid-toast-amount">{formatCLP(toast.bid.amount)}</strong>
              </span>
            </span>
            <button className="bid-toast-close" onClick={() => setToast(null)} aria-label="Cerrar aviso">
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}

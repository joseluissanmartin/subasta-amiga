import { useState } from 'react';
import { HIGH_BID_FACTOR } from '../config';
import { bidErrorMessage, nextMinBid, quickBids } from '../domain/auction';
import { formatCLP, parseCLP } from '../domain/money';
import type { Auction, AuctionStatus, User } from '../domain/types';
import { OfflineError, placeBid, type BidResult } from '../server/api';
import { Notice } from './components';
import { formatEnd } from './format';
import { navigate } from './hooks';

type Step =
  | { s: 'elegir'; flash?: { kind: 'warn' | 'error'; text: string } }
  | { s: 'confirmar'; amount: number; requestId: string; high: boolean }
  | { s: 'enviando'; amount: number; requestId: string }
  | { s: 'aceptada'; result: Extract<BidResult, { ok: true }> }
  | { s: 'sin-conexion'; amount: number; requestId: string };

/**
 * Flujo: elegir monto → revisar → confirmar → resultado.
 * Nunca sube el monto automáticamente: si otra persona se adelanta, se le
 * muestra la nueva oferta mínima y decide de nuevo.
 */
export function BidPanel({ auction, status, user }: { auction: Auction; status: AuctionStatus; user: User | null }) {
  const [step, setStep] = useState<Step>({ s: 'elegir' });
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState('');
  const [fieldError, setFieldError] = useState('');

  const open = status === 'en-curso' || status === 'esperando';
  const min = nextMinBid(auction);

  const review = (amount: number) => {
    setStep({ s: 'confirmar', amount, requestId: crypto.randomUUID(), high: amount > min * HIGH_BID_FACTOR });
  };

  const send = async (amount: number, requestId: string) => {
    setStep({ s: 'enviando', amount, requestId });
    try {
      const r = await placeBid(auction.id, amount, requestId);
      if (r.ok) {
        setStep({ s: 'aceptada', result: r });
        setCustom(false);
        setText('');
      } else {
        const nm = nextMinBid(r.auction);
        const extra = r.error.code === 'bajo-minimo' ? ` La nueva oferta mínima es ${formatCLP(nm)}.` : '';
        setStep({ s: 'elegir', flash: { kind: 'warn', text: bidErrorMessage(r.error) + extra } });
      }
    } catch (e) {
      if (e instanceof OfflineError) setStep({ s: 'sin-conexion', amount, requestId });
      else setStep({ s: 'elegir', flash: { kind: 'error', text: (e as Error).message } });
    }
  };

  const live = (
    <div role="status" aria-live="polite" className="bid-live">
      {step.s === 'enviando' && <p className="sending">Enviando su oferta de {formatCLP(step.amount)}… Por favor espere.</p>}
      {step.s === 'aceptada' && (
        <Notice kind="ok" title={`Su oferta de ${formatCLP(step.result.amount)} fue aceptada.`}>
          <p>Usted va ganando por ahora.</p>
          {step.result.started && <p>La cuenta regresiva comenzó. Termina el {formatEnd(step.result.endsAt)}.</p>}
          {step.result.extended && <p>Como ofreció en los últimos minutos, el plazo se alargó hasta el {formatEnd(step.result.endsAt)}.</p>}
          <p>Le avisaremos en «Mi cuenta → Avisos» si otra persona ofrece más.</p>
        </Notice>
      )}
      {step.s === 'elegir' && step.flash && <Notice kind={step.flash.kind}>{step.flash.text}</Notice>}
      {step.s === 'sin-conexion' && (
        <Notice kind="error" title="No pudimos confirmar su oferta por un problema de conexión.">
          <p>Revise su internet y toque «Reintentar». Es seguro: su oferta nunca se registrará dos veces.</p>
        </Notice>
      )}
    </div>
  );

  if (!open) return null;

  if (!user) {
    return (
      <section className="bid-panel" aria-labelledby="bid-h">
        <h2 id="bid-h">Ofertar</h2>
        <p>Para ofertar necesita ingresar con su cuenta. Es gratis y no se pide contraseña.</p>
        <button className="btn btn-primary btn-block" onClick={() => navigate(`/ingresar?volver=/articulo/${auction.id}`)}>
          Ingresar o crear cuenta
        </button>
      </section>
    );
  }

  if (user.id === auction.sellerId) {
    return (
      <section className="bid-panel" aria-labelledby="bid-h">
        <h2 id="bid-h">Ofertar</h2>
        <Notice kind="info">Este artículo lo publicó usted, por eso no puede ofertar por él.</Notice>
      </section>
    );
  }

  const leading = auction.leaderId === user.id;

  return (
    <section className="bid-panel" aria-labelledby="bid-h">
      <h2 id="bid-h">Ofertar</h2>
      {live}

      {step.s === 'aceptada' && (
        <button className="btn btn-secondary btn-block" onClick={() => setStep({ s: 'elegir' })}>
          Entendido
        </button>
      )}

      {step.s === 'sin-conexion' && (
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => send(step.amount, step.requestId)}>
            Reintentar
          </button>
          <button className="btn btn-secondary" onClick={() => setStep({ s: 'elegir' })}>
            Cancelar
          </button>
        </div>
      )}

      {step.s === 'elegir' && leading && (
        <Notice kind="ok" title={`Usted va ganando con ${formatCLP(auction.currentPrice!)}.`}>
          <p>No necesita hacer nada más. Si otra persona ofrece más, le avisaremos.</p>
        </Notice>
      )}

      {step.s === 'elegir' && !leading && (
        <>
          <p className="bid-min">
            Oferta mínima: <strong>{formatCLP(min)}</strong>
          </p>
          <p>Toque el monto que quiere ofrecer. Después podrá revisarlo antes de confirmar.</p>
          <div className="quick-bids">
            {quickBids(auction).map((amt, i) => (
              <button key={amt} className={`btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} btn-block`} onClick={() => review(amt)}>
                Ofrecer {formatCLP(amt)}
              </button>
            ))}
          </div>
          {!custom ? (
            <button className="btn btn-link" onClick={() => setCustom(true)}>
              Prefiero escribir otro monto
            </button>
          ) : (
            <form
              className="custom-bid"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const v = parseCLP(text);
                if (v === null) return setFieldError('Escriba el monto solo con números, por ejemplo 15000 o 15.000.');
                if (v < min) return setFieldError(`El monto debe ser al menos ${formatCLP(min)}.`);
                setFieldError('');
                review(v);
              }}
            >
              <label htmlFor="monto">Monto en pesos chilenos</label>
              <p id="monto-ayuda" className="hint">
                Mínimo {formatCLP(min)}. Sin centavos.
              </p>
              <div className="money-input">
                <span aria-hidden="true">$</span>
                <input
                  id="monto"
                  inputMode="numeric"
                  autoComplete="off"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-describedby={fieldError ? 'monto-ayuda monto-error' : 'monto-ayuda'}
                  aria-invalid={!!fieldError}
                />
              </div>
              {parseCLP(text) !== null && <p className="hint">Usted escribió: {formatCLP(parseCLP(text)!)}</p>}
              {fieldError && (
                <p id="monto-error" className="field-error">
                  {fieldError}
                </p>
              )}
              <div className="btn-row">
                <button type="submit" className="btn btn-primary">
                  Revisar oferta
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setCustom(false); setFieldError(''); }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {step.s === 'confirmar' &&
        (step.amount < min ? (
          <>
            <Notice kind="warn" title="Mientras revisaba, otra persona ofreció más.">
              <p>Ahora la oferta mínima es {formatCLP(min)}. Su oferta de {formatCLP(step.amount)} ya no alcanza.</p>
            </Notice>
            <button className="btn btn-primary btn-block" onClick={() => setStep({ s: 'elegir' })}>
              Elegir otro monto
            </button>
          </>
        ) : (
          <div className="confirm">
            <p className="confirm-amount">
              Usted va a ofrecer <strong>{formatCLP(step.amount)}</strong> por «{auction.title}».
            </p>
            {step.high && (
              <Notice kind="warn" title="Revise el monto">
                <p>Es bastante más que la oferta mínima ({formatCLP(min)}). Fíjese que no tenga un cero de más.</p>
              </Notice>
            )}
            <p className="hint">
              No se realizará ningún cobro desde esta página. Si gana, se compromete a coordinar el pago y la entrega directamente con quien vende.
            </p>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => send(step.amount, step.requestId)}>
                Sí, confirmar mi oferta
              </button>
              <button className="btn btn-secondary" onClick={() => setStep({ s: 'elegir' })}>
                No, volver
              </button>
            </div>
          </div>
        ))}

      {step.s === 'enviando' && (
        <button className="btn btn-primary btn-block" disabled>
          Enviando…
        </button>
      )}
    </section>
  );
}

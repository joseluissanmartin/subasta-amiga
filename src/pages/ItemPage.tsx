import { useState } from 'react';
import { EXTENSION_MS, EXTENSION_WINDOW_MS } from '../config';
import { statusOf } from '../domain/auction';
import { formatCLP } from '../domain/money';
import { CATEGORIES, CONDITIONS, type User } from '../domain/types';
import {
  getAuction,
  getCounterpartContact,
  reportAuction,
  setDeliveryOutcome,
  withdrawAuction,
  type AuctionDetail,
} from '../server/api';
import { BidPanel } from '../ui/BidPanel';
import { BidToast } from '../ui/BidToast';
import { Loading, Notice, PriceInfo, StatusBadge, TimeInfo } from '../ui/components';
import { formatDate, formatDuration, formatMoment } from '../ui/format';
import { navigate, useCurrentUser, useFocusHeading, useLive, useNow } from '../ui/hooks';

export function ItemPage({ id }: { id: string }) {
  const { data, loading } = useLive(() => getAuction(id), [id]);
  const user = useCurrentUser();
  const now = useNow();

  if (loading && data === undefined) return <Loading />;
  if (!data) {
    return (
      <>
        <h1>No encontramos este artículo</h1>
        <a className="btn btn-secondary" href="#/">
          Volver a los artículos
        </a>
      </>
    );
  }
  return <Item detail={data} user={user} now={now} />;
}

function Item({ detail, user, now }: { detail: AuctionDetail; user: User | null; now: number }) {
  const h1 = useFocusHeading<HTMLHeadingElement>();
  const a = detail.auction;
  const status = statusOf(a, now);
  const [photo, setPhoto] = useState(0);
  const isSeller = user?.id === a.sellerId;
  const outbid = user && !isSeller && detail.iParticipated && a.leaderId !== user.id;

  return (
    <article className="item">
      <BidToast bids={detail.bids} />
      <a href="#/" className="back-link">
        ← Volver a los artículos
      </a>

      <div className="item-top">
        <div className="gallery">
          <img src={a.photos[photo] ?? a.photos[0]} alt={`Foto ${photo + 1} de ${a.photos.length}: ${a.title}`} className="gallery-main" />
          {a.photos.length > 1 && (
            <div className="thumbs">
              {a.photos.map((p, i) => (
                <button key={i} className={`thumb ${i === photo ? 'thumb-active' : ''}`} onClick={() => setPhoto(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={i === photo}>
                  <img src={p} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="item-side">
          <h1 ref={h1} tabIndex={-1}>
            {a.title}
          </h1>
          <StatusBadge status={status} />
          <PriceInfo auction={a} status={status} />
          <TimeInfo auction={a} status={status} now={now} />
          {status === 'esperando' && (
            <p className="hint">Cuando llegue la primera oferta, la subasta durará {formatDuration(a.durationMs)}.</p>
          )}

          {status === 'en-curso' && user && a.leaderId === user.id && <Notice kind="ok" title="Usted va ganando." />}
          {status === 'en-curso' && outbid && <Notice kind="warn" title="Otra persona ofreció más que usted." />}

          <BidPanel auction={a} status={status} user={user} />

          {(status === 'terminada' || status === 'vencida' || status === 'retirada') && <Result detail={detail} user={user} status={status} />}

          {isSeller && status === 'esperando' && <Withdraw id={a.id} />}
        </div>
      </div>

      {(status === 'en-curso' || status === 'esperando') && (
        <p className="rule-note">
          📌 Si alguien ofrece cuando quedan menos de {formatDuration(EXTENSION_WINDOW_MS)}, el plazo se alarga para que quede al menos{' '}
          {formatDuration(EXTENSION_MS)}. Así todos tienen tiempo de responder.
        </p>
      )}

      <section aria-labelledby="desc-h" className="section">
        <h2 id="desc-h">Descripción</h2>
        <p className="prewrap">{a.description}</p>
        <dl className="facts">
          <dt>Estado</dt>
          <dd>{CONDITIONS[a.condition]}</dd>
          <dt>Detalles o defectos</dt>
          <dd>{a.defects || 'No informados'}</dd>
          <dt>Categoría</dt>
          <dd>{CATEGORIES[a.category]}</dd>
          <dt>Ubicación</dt>
          <dd>
            {a.comuna}, {a.region}
          </dd>
        </dl>
      </section>

      <section aria-labelledby="seller-h" className="section">
        <h2 id="seller-h">Quién vende</h2>
        <p>
          <strong>{detail.seller.alias}</strong> · con cuenta desde el {formatDate(detail.seller.memberSince)}
        </p>
        <p>
          Publicaciones: {detail.seller.published} · Entregas confirmadas por ambas partes: {detail.seller.completed}
        </p>
      </section>

      <section aria-labelledby="hist-h" className="section">
        <h2 id="hist-h">Historial de ofertas</h2>
        {detail.bids.length === 0 ? (
          <p>Todavía no hay ofertas.</p>
        ) : (
          <table className="history">
            <thead>
              <tr>
                <th scope="col">Quién</th>
                <th scope="col">Monto</th>
                <th scope="col">Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {detail.bids.map((b, i) => (
                <tr key={i} className={i === 0 ? 'history-top' : ''}>
                  <td>
                    {b.mine ? 'Usted' : b.alias}
                    {i === 0 && <span className="sr-only"> (oferta más alta)</span>}
                  </td>
                  <td>{formatCLP(b.amount)}</td>
                  <td>
                    {formatMoment(b.at)}
                    {b.extended && <span className="hint"> · alargó el plazo</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {user && !isSeller && <ReportForm id={a.id} />}
    </article>
  );
}

function Result({ detail, user, status }: { detail: AuctionDetail; user: User | null; status: string }) {
  const a = detail.auction;
  const involved = !!user && !!a.leaderId && (user.id === a.sellerId || user.id === a.leaderId);
  const contact = useLive(() => (involved ? getCounterpartContact(a.id) : Promise.resolve(null)), [a.id, involved]);

  if (status === 'retirada') return <Notice kind="info" title="Quien vende retiró este artículo." />;
  if (status === 'vencida') {
    return (
      <Notice kind="info" title="Este artículo no recibió ofertas y la publicación venció.">
        {user?.id === a.sellerId && (
          <button className="btn btn-primary" onClick={() => navigate(`/publicar?copiar=${a.id}`)}>
            Publicarlo de nuevo
          </button>
        )}
      </Notice>
    );
  }

  const iWon = user?.id === a.leaderId;
  const iSell = user?.id === a.sellerId;
  const myAnswer = iSell ? a.delivery?.seller : iWon ? a.delivery?.buyer : undefined;

  return (
    <section className="result" aria-labelledby="result-h">
      <h2 id="result-h">Resultado</h2>
      {iWon ? (
        <Notice kind="ok" title={`¡Usted ganó con ${formatCLP(a.currentPrice!)}!`} />
      ) : iSell ? (
        <Notice kind="ok" title={`Su artículo se subastó en ${formatCLP(a.currentPrice!)}.`}>
          <p>Ganó {detail.leaderAlias}.</p>
        </Notice>
      ) : (
        <p>
          Ganó <strong>{detail.leaderAlias}</strong> con {formatCLP(a.currentPrice!)}.
        </p>
      )}

      {involved && contact.data && (
        <div className="contact">
          <h3>Datos para coordinar con {contact.data.role === 'comprador' ? 'quien compró' : 'quien vende'}</h3>
          <p>
            <strong>{contact.data.alias}</strong>
          </p>
          <p>Correo: {contact.data.email}</p>
          {contact.data.whatsapp && <p>WhatsApp: {contact.data.whatsapp}</p>}
          <p className="hint">
            Pónganse de acuerdo para el pago y la entrega. Por seguridad, reúnanse en un lugar público o pidan a un familiar que los acompañe. Esta página no
            participa en el pago.
          </p>

          <div className="delivery">
            <p>
              <strong>¿Se concretó la entrega?</strong>
            </p>
            {myAnswer !== undefined && <p>Usted respondió: {myAnswer ? 'Sí, se concretó' : 'No se concretó'}.</p>}
            <div className="btn-row">
              <button className="btn btn-secondary" aria-pressed={myAnswer === true} onClick={() => setDeliveryOutcome(a.id, true)}>
                Sí, se concretó
              </button>
              <button className="btn btn-secondary" aria-pressed={myAnswer === false} onClick={() => setDeliveryOutcome(a.id, false)}>
                No se concretó
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Withdraw({ id }: { id: string }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  if (!asking) {
    return (
      <button className="btn btn-secondary btn-block" onClick={() => setAsking(true)}>
        Retirar mi publicación
      </button>
    );
  }
  return (
    <div className="confirm">
      <p>¿Seguro que quiere retirar este artículo? Ya no aparecerá en la página.</p>
      {error && <p className="field-error">{error}</p>}
      <div className="btn-row">
        <button
          className="btn btn-danger"
          onClick={() => withdrawAuction(id).then(() => setAsking(false), (e: Error) => setError(e.message))}
        >
          Sí, retirarlo
        </button>
        <button className="btn btn-secondary" onClick={() => setAsking(false)}>
          No, mantenerlo
        </button>
      </div>
    </div>
  );
}

function ReportForm({ id }: { id: string }) {
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  return (
    <details className="report">
      <summary>Reportar un problema con este artículo</summary>
      {sent ? (
        <Notice kind="ok" title="Gracias. Revisaremos su reporte." />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim().length < 5) return setError('Cuéntenos brevemente qué ocurre.');
            reportAuction(id, reason).then(() => setSent(true), (er: Error) => setError(er.message));
          }}
        >
          <label htmlFor="motivo">¿Qué problema ve?</label>
          <textarea id="motivo" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'motivo-err' : undefined} />
          {error && (
            <p id="motivo-err" className="field-error">
              {error}
            </p>
          )}
          <button className="btn btn-secondary" type="submit">
            Enviar reporte
          </button>
        </form>
      )}
    </details>
  );
}

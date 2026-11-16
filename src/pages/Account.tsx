import { useEffect, useState } from 'react';
import { statusOf } from '../domain/auction';
import { formatCLP } from '../domain/money';
import { getMyActivity, listNotifications, logout, markNotificationsRead, type AuctionSummary } from '../server/api';
import { Loading, Notice, StatusBadge } from '../ui/components';
import { formatMoment, formatRemaining } from '../ui/format';
import { navigate, useCurrentUser, useFocusHeading, useLive, useNow } from '../ui/hooks';

type Tab = 'avisos' | 'ofertas' | 'publicaciones' | 'ganados';

export function Account() {
  const h1 = useFocusHeading<HTMLHeadingElement>();
  const user = useCurrentUser();
  const [tab, setTab] = useState<Tab>('avisos');

  if (!user) {
    return (
      <>
        <h1 ref={h1} tabIndex={-1}>
          Mi cuenta
        </h1>
        <p>Ingrese para ver sus ofertas, publicaciones y avisos.</p>
        <button className="btn btn-primary" onClick={() => navigate('/ingresar?volver=/cuenta')}>
          Ingresar o crear cuenta
        </button>
      </>
    );
  }

  return (
    <>
      <h1 ref={h1} tabIndex={-1}>
        Mi cuenta
      </h1>
      <p>
        Hola, <strong>{user.alias}</strong> ({user.email}).
      </p>
      <AccountTabs tab={tab} setTab={setTab} />
    </>
  );
}

function AccountTabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const now = useNow();
  const activity = useLive(getMyActivity, []);
  const notes = useLive(listNotifications, []);
  const meId = useCurrentUserId();
  const unread = notes.data?.filter((n) => !n.read).length ?? 0;

  const won = (activity.data?.bidOn ?? []).filter(({ summary }) => statusOf(summary.auction, now) === 'terminada' && summary.auction.leaderId === meId);

  const tabs: [Tab, string][] = [
    ['avisos', `Avisos${unread ? ` (${unread} nuevos)` : ''}`],
    ['ofertas', 'Mis ofertas'],
    ['publicaciones', 'Mis publicaciones'],
    ['ganados', `Ganados${won.length ? ` (${won.length})` : ''}`],
  ];

  return (
    <>
      <nav className="tabs" aria-label="Secciones de mi cuenta">
        {tabs.map(([k, label]) => (
          <button key={k} className={`tab ${tab === k ? 'tab-active' : ''}`} aria-pressed={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'avisos' && <Notifications live={notes} />}

      {tab === 'ofertas' &&
        (activity.loading && !activity.data ? (
          <Loading />
        ) : activity.data!.bidOn.length === 0 ? (
          <Empty text="Todavía no ha ofertado por ningún artículo." cta="Ver artículos" href="#/" />
        ) : (
          <ul className="rows">
            {[...activity.data!.bidOn]
              .sort((a, b) => (b.summary.auction.endsAt ?? 0) - (a.summary.auction.endsAt ?? 0))
              .map(({ summary, myBest }) => (
                <MyBidRow key={summary.auction.id} summary={summary} myBest={myBest} now={now} />
              ))}
          </ul>
        ))}

      {tab === 'publicaciones' &&
        (activity.loading && !activity.data ? (
          <Loading />
        ) : activity.data!.published.length === 0 ? (
          <Empty text="Todavía no ha publicado artículos." cta="Publicar un artículo" href="#/publicar" />
        ) : (
          <ul className="rows">
            {[...activity.data!.published]
              .sort((a, b) => b.auction.createdAt - a.auction.createdAt)
              .map((s) => {
                const st = statusOf(s.auction, now);
                return (
                  <Row key={s.auction.id} s={s}>
                    <StatusBadge status={st} />
                    <p>
                      {s.auction.currentPrice !== undefined ? `Oferta ${st === 'terminada' ? 'ganadora' : 'actual'}: ${formatCLP(s.auction.currentPrice)} · ${s.auction.bidCount} ofertas` : `Precio mínimo: ${formatCLP(s.auction.minPrice)} · sin ofertas aún`}
                    </p>
                    {st === 'en-curso' && <p aria-hidden="true">Quedan {formatRemaining(s.auction.endsAt! - now)}</p>}
                  </Row>
                );
              })}
          </ul>
        ))}

      {tab === 'ganados' &&
        (won.length === 0 ? (
          <Empty text="Todavía no ha ganado subastas." cta="Ver artículos" href="#/" />
        ) : (
          <ul className="rows">
            {won.map(({ summary }) => (
              <Row key={summary.auction.id} s={summary}>
                <p>
                  Ganó con <strong>{formatCLP(summary.auction.currentPrice!)}</strong>. Abra el artículo para ver los datos de contacto de {summary.sellerAlias}.
                </p>
              </Row>
            ))}
          </ul>
        ))}

      <button className="btn btn-secondary logout" onClick={() => { logout(); navigate('/'); }}>
        Salir de mi cuenta
      </button>
    </>
  );
}

// pequeño atajo para no pasar el usuario por props
function useCurrentUserId() {
  return useCurrentUser()?.id;
}

function MyBidRow({ summary, myBest, now }: { summary: AuctionSummary; myBest: number; now: number }) {
  const me = useCurrentUserId();
  const a = summary.auction;
  const st = statusOf(a, now);
  const leading = a.leaderId === me;
  let line;
  if (st === 'en-curso') {
    line = leading ? (
      <p className="good">✔ Va ganando con {formatCLP(myBest)}</p>
    ) : (
      <p className="bad">⚠ Le superaron. Oferta actual: {formatCLP(a.currentPrice!)}. Usted ofreció {formatCLP(myBest)}.</p>
    );
  } else if (st === 'terminada') {
    line = leading ? <p className="good">🏆 Ganó con {formatCLP(myBest)}</p> : <p>No ganó. Precio final: {formatCLP(a.currentPrice!)}</p>;
  } else {
    line = <p>Su oferta: {formatCLP(myBest)}</p>;
  }
  return (
    <Row s={summary}>
      <StatusBadge status={st} />
      {line}
      {st === 'en-curso' && <p aria-hidden="true">Quedan {formatRemaining(a.endsAt! - now)}</p>}
    </Row>
  );
}

function Row({ s, children }: { s: AuctionSummary; children: React.ReactNode }) {
  return (
    <li className="row">
      <img src={s.auction.photos[0]} alt="" />
      <div>
        <h3>
          <a href={`#/articulo/${s.auction.id}`}>{s.auction.title}</a>
        </h3>
        {children}
      </div>
    </li>
  );
}

function Empty({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <div className="empty">
      <p>{text}</p>
      <a className="btn btn-primary" href={href}>
        {cta}
      </a>
    </div>
  );
}

function Notifications({ live }: { live: ReturnType<typeof useLive<Awaited<ReturnType<typeof listNotifications>>>> }) {
  const unread = live.data?.some((n) => !n.read);
  // Marcar como leídos después de mostrarlos un momento.
  useEffect(() => {
    if (!unread) return;
    const t = setTimeout(() => markNotificationsRead().catch(() => {}), 2500);
    return () => clearTimeout(t);
  }, [unread]);

  if (live.loading && !live.data) return <Loading />;
  if (!live.data?.length) return <Notice kind="info" title="No tiene avisos por ahora." />;
  return (
    <ul className="rows">
      {live.data.map((n) => (
        <li key={n.id} className={`row notification ${n.read ? '' : 'unread'}`}>
          <div>
            {!n.read && <span className="badge badge-new">Nuevo</span>}
            <p>{n.text}</p>
            <p className="hint">
              {formatMoment(n.at)} · <a href={`#/articulo/${n.auctionId}`}>Ver artículo</a>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

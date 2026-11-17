import { useEffect, useState } from 'react';
import { DEMO } from './config';
import { Account } from './pages/Account';
import { Explore } from './pages/Explore';
import { Help } from './pages/Help';
import { ItemPage } from './pages/ItemPage';
import { Login } from './pages/Login';
import { Publish } from './pages/Publish';
import { demoUsers, listNotifications, resetDemoData, runSettlement, setOffline, switchUser, isOffline } from './server/api';
import { LogoMark } from './ui/Mascot';
import { ErrorBoundary, ThemeToggle, WhatsAppButton } from './ui/Extras';
import { syncClock, useCurrentUser, useLive, useOnline, useRoute, useTextSize, type TextSize } from './ui/hooks';

function parseRoute(route: string) {
  const [path, qs = ''] = route.split('?');
  return { path, query: new URLSearchParams(qs) };
}

export default function App() {
  const route = useRoute();
  const { path, query } = parseRoute(route);
  const online = useOnline();

  useEffect(() => {
    syncClock();
    // Simula la tarea programada de cierre (pg_cron en Supabase).
    runSettlement();
    const t = setInterval(() => runSettlement(), 3000);
    return () => clearInterval(t);
  }, []);

  let page;
  const item = path.match(/^\/articulo\/([\w-]+)$/);
  if (item) page = <ItemPage key={item[1]} id={item[1]} />;
  else if (path === '/publicar') page = <Publish key={route} copyFrom={query.get('copiar') ?? undefined} />;
  else if (path === '/cuenta') page = <Account />;
  else if (path === '/ingresar') page = <Login back={query.get('volver') ?? undefined} />;
  else if (path === '/ayuda') page = <Help />;
  else page = <Explore />;

  return (
    <>
      <a href="#contenido" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('contenido')?.focus(); }}>
        Saltar al contenido
      </a>
      <Header path={path} />
      {!online && (
        <div className="offline-banner" role="alert">
          ⚠ Sin conexión a internet. Lo que vea puede no estar al día y no se pueden enviar ofertas.
        </div>
      )}
      <main id="contenido" tabIndex={-1}>
        <ErrorBoundary key={route}>{page}</ErrorBoundary>
      </main>
      <footer className="footer">
        <p><strong>Subasta Amiga</strong> · Publica, oferta, gana · Prototipo · Las ofertas son en pesos chilenos (CLP). Esta página no realiza cobros.</p>
        {DEMO && <DemoTools />}
      </footer>
      <WhatsAppButton />
    </>
  );
}

function Header({ path }: { path: string }) {
  const user = useCurrentUser();
  const notes = useLive(() => (user ? listNotifications() : Promise.resolve([])), [user?.id]);
  const unread = notes.data?.filter((n) => !n.read).length ?? 0;
  const [size, setSize] = useTextSize();

  const link = (href: string, label: string, active: boolean, extra?: React.ReactNode) => (
    <a href={`#${href}`} className={`nav-link ${active ? 'nav-active' : ''}`} aria-current={active ? 'page' : undefined}>
      {label}
      {extra}
    </a>
  );

  return (
    <header className="header">
      <div className="header-top">
        <a href="#/" className="brand" aria-label="Subasta Amiga, ir al inicio">
          <LogoMark size={56} />
          <span className="brand-text">
            <span className="brand-name">
              SUBASTA<span className="accent">AMIGA</span>
            </span>
            <span className="brand-tagline">PUBLICA · OFERTA · GANA</span>
          </span>
        </a>
        <div className="header-tools">
          <ThemeToggle />
          <TextSizeControl size={size} setSize={setSize} />
          {user ? (
            <span className="who">
              Conectado como <strong>{user.alias}</strong>
            </span>
          ) : (
            <a href="#/ingresar" className="btn btn-secondary btn-small">
              Ingresar
            </a>
          )}
        </div>
      </div>
      <nav aria-label="Principal" className="nav">
        {link('/', 'Explorar', path === '/' || path.startsWith('/articulo'))}
        {link('/publicar', 'Publicar', path === '/publicar')}
        {link(
          '/cuenta',
          'Mi cuenta',
          path === '/cuenta',
          unread > 0 && (
            <span className="nav-count">
              {unread}
              <span className="sr-only"> avisos nuevos</span>
            </span>
          ),
        )}
        {link('/ayuda', 'Ayuda', path === '/ayuda')}
      </nav>
    </header>
  );
}

function TextSizeControl({ size, setSize }: { size: TextSize; setSize: (s: TextSize) => void }) {
  const opts: [TextSize, string, string][] = [
    ['normal', 'A', 'Letra normal'],
    ['grande', 'A+', 'Letra grande'],
    ['muy-grande', 'A++', 'Letra muy grande'],
  ];
  return (
    <div className="text-size" role="group" aria-label="Tamaño de la letra">
      <span className="text-size-label" aria-hidden="true">
        Letra:
      </span>
      {opts.map(([k, label, aria]) => (
        <button key={k} className={`size-btn size-${k}`} aria-pressed={size === k} aria-label={aria} onClick={() => setSize(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function DemoTools() {
  const user = useCurrentUser();
  const online = useOnline();
  const [users, setUsers] = useState(demoUsers);
  return (
    <details className="demo-tools" onToggle={() => setUsers(demoUsers())}>
      <summary>🧪 Herramientas del prototipo</summary>
      <p>
        Consejo: abra esta página en <strong>otra pestaña</strong> y entre con otra persona para ver cómo se actualizan las ofertas en vivo.
      </p>
      <div className="field">
        <label htmlFor="demo-user">Entrar como</label>
        <select id="demo-user" value={user?.id ?? ''} onChange={(e) => switchUser(e.target.value || null)}>
          <option value="">(sin sesión)</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.alias}
            </option>
          ))}
        </select>
      </div>
      <label className="choice">
        <input type="checkbox" checked={!online && isOffline()} onChange={(e) => setOffline(e.target.checked)} />
        Simular que esta pestaña perdió la conexión
      </label>
      <button
        className="btn btn-secondary"
        onClick={() => {
          resetDemoData();
          setUsers(demoUsers());
        }}
      >
        Reiniciar los datos de ejemplo
      </button>
    </details>
  );
}

import { Component, useEffect, useState, type ReactNode } from 'react';
import { SUPPORT_WHATSAPP, SUPPORT_WHATSAPP_LINK } from '../config';

// ---------- modo claro / oscuro ----------

type Theme = 'dark' | 'light';
const THEME_KEY = 'subastas-tema';

function initialTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === 'light' ? 'light' : 'dark';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#ffffff' : '#2c2a2a');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* sin almacenamiento: el tema dura solo esta visita */
    }
  }, [theme]);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button className="theme-btn" onClick={() => setTheme(next)} aria-label={next === 'light' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
      <span aria-hidden="true">{next === 'light' ? '☀️' : '🌙'}</span>
      {next === 'light' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  );
}

// ---------- WhatsApp flotante ----------

export function WhatsAppButton() {
  return (
    <a className="whatsapp-fab" href={SUPPORT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label={`Escribir por WhatsApp al ${SUPPORT_WHATSAPP} para hacer consultas`}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="24" fill="#fff" />
        <path
          fill="#25d366"
          d="M24 8.5a15.4 15.4 0 0 0-13.2 23.4L8.6 39.5l7.8-2.1A15.4 15.4 0 1 0 24 8.5Zm0 28.1c-2.4 0-4.7-.7-6.7-1.9l-.5-.3-4.6 1.2 1.2-4.5-.3-.5a12.7 12.7 0 1 1 10.9 6Z"
        />
        <path
          fill="#25d366"
          d="M31 26.9c-.4-.2-2.3-1.1-2.6-1.2-.4-.1-.6-.2-.9.2l-1.2 1.5c-.2.3-.4.3-.8.1a10.4 10.4 0 0 1-5.2-4.5c-.4-.7.4-.6 1.1-2 .1-.2.1-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.9-.6h-.7c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.2s1.4 3.7 1.6 4c.2.3 2.7 4.2 6.6 5.9 2.5 1.1 3.5 1.2 4.7 1 .8-.1 2.3-.9 2.6-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5Z"
        />
      </svg>
      <span className="fab-text">¿Consultas? Escríbanos</span>
    </a>
  );
}

// ---------- protección ante errores ----------

/**
 * Si una pantalla falla, en vez de quedar en negro se muestra un mensaje
 * claro con un botón para volver al inicio.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('[Subasta Amiga] Error en pantalla:', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="narrow" role="alert" style={{ padding: '2rem 0' }}>
        <h1>Algo no salió bien</h1>
        <p>Tuvimos un problema al mostrar esta página. Sus datos están a salvo.</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            this.setState({ error: null });
            window.location.hash = '/';
          }}
        >
          Volver al inicio
        </button>
        <p className="hint" style={{ marginTop: '1rem' }}>
          Detalle técnico: {this.state.error.message}
        </p>
      </div>
    );
  }
}

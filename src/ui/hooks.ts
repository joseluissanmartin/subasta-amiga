import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { currentUserSync, getServerTime, isOffline, subscribe } from '../server/api';
import type { User } from '../domain/types';

// ---------- rutas (hash: #/articulo/a-1) ----------

function getHash() {
  return window.location.hash.replace(/^#/, '') || '/';
}
function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}
export function useRoute(): string {
  return useSyncExternalStore(subscribeHash, getHash);
}
export function navigate(path: string) {
  window.location.hash = path;
}

// ---------- hora del servidor ----------

let offset = 0;
/** Se llama al iniciar: corrige el reloj del dispositivo con la hora del servidor. */
export async function syncClock() {
  try {
    const t0 = Date.now();
    const server = await getServerTime();
    const t1 = Date.now();
    offset = server - (t0 + t1) / 2;
  } catch {
    /* sin conexión: se usa el reloj local hasta el próximo intento */
  }
}
export const serverNow = () => Date.now() + offset;

/** Hora del servidor que se actualiza cada segundo. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

// ---------- sesión y conexión ----------

let cachedUser: User | null | undefined;
let cachedKey = '';
function refreshUser() {
  const u = currentUserSync();
  const key = u ? JSON.stringify(u) : '';
  if (key !== cachedKey || cachedUser === undefined) {
    cachedKey = key;
    cachedUser = u;
  }
}
function subscribeUser(cb: () => void) {
  return subscribe(() => {
    refreshUser();
    cb();
  });
}
function getUser() {
  if (cachedUser === undefined) refreshUser();
  return cachedUser ?? null;
}
export function useCurrentUser(): User | null {
  return useSyncExternalStore(subscribeUser, getUser);
}

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  const unsub = subscribe(cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
    unsub();
  };
}
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine && !isOffline());
}

// ---------- datos en vivo ----------

export interface Live<T> {
  data?: T;
  error?: unknown;
  loading: boolean;
  reload: () => void;
}

/**
 * Carga datos y los vuelve a pedir cuando el servidor avisa un cambio
 * (tiempo real) y, por si acaso, cada 15 segundos.
 */
export function useLive<T>(fetcher: () => Promise<T>, deps: unknown[]): Live<T> {
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({ loading: true });
  const seq = useRef(0);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const reload = useCallback(() => {
    const my = ++seq.current;
    fetchRef.current().then(
      (data) => my === seq.current && setState({ data, loading: false }),
      (error) => my === seq.current && setState((s) => ({ data: s.data, error, loading: false })),
    );
  }, []);

  useEffect(() => {
    setState({ loading: true });
    reload();
    const unsub = subscribe(reload);
    const t = setInterval(reload, 15_000);
    return () => {
      seq.current++;
      unsub();
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload };
}

/** Lleva el foco al título al cambiar de pantalla (lectores de pantalla y teclado). */
export function useFocusHeading<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
    window.scrollTo(0, 0);
  }, []);
  return ref;
}

// ---------- tamaño de letra ----------

export type TextSize = 'normal' | 'grande' | 'muy-grande';
const SIZE_KEY = 'subastas-letra';
export function useTextSize(): [TextSize, (s: TextSize) => void] {
  const [size, setSize] = useState<TextSize>(() => {
    try {
      return (localStorage.getItem(SIZE_KEY) as TextSize) || 'normal';
    } catch {
      return 'normal';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.letra = size;
    try {
      localStorage.setItem(SIZE_KEY, size);
    } catch {
      /* ignorar */
    }
  }, [size]);
  return [size, setSize];
}

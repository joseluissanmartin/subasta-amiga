/**
 * "Michi", la mascota de Subasta Amiga: un gato gordito naranja con un mazo de subasta.
 * Dibujado en SVG por partes (cola, orejas, ojos, brazo con mazo…) para poder animarlas.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const ORANGE = '#ff6f00';
const ORANGE_LIGHT = '#ff8f33';
const STRIPE = '#d45500';
const CREAM = '#ffe7cf';
const INNER_EAR = '#ffb38a';
const DARK = '#1a1a1a';

function Face() {
  return (
    <g className="m-head">
      <g className="m-ear-l">
        <path d="M52 62 L46 14 L92 42 Z" fill={ORANGE} />
        <path d="M58 52 L55 26 L80 42 Z" fill={INNER_EAR} />
      </g>
      <g className="m-ear-r">
        <path d="M148 62 L154 14 L108 42 Z" fill={ORANGE} />
        <path d="M142 52 L145 26 L120 42 Z" fill={INNER_EAR} />
      </g>
      <ellipse cx="100" cy="82" rx="60" ry="50" fill={ORANGE_LIGHT} />
      <path d="M100 33 v14 M86 36 l4 12 M114 36 l-4 12" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" />
      <g className="m-eye m-eye-l">
        <ellipse cx="80" cy="80" rx="11" ry="13" fill="#fff" />
        <circle className="m-pupil" cx="82" cy="82" r="7" fill={DARK} />
        <circle cx="85" cy="78" r="2.5" fill="#fff" />
      </g>
      <g className="m-eye m-eye-r">
        <ellipse cx="120" cy="80" rx="11" ry="13" fill="#fff" />
        <circle className="m-pupil" cx="118" cy="82" r="7" fill={DARK} />
        <circle cx="121" cy="78" r="2.5" fill="#fff" />
      </g>
      <circle cx="64" cy="100" r="9" fill="#ff5a3c" opacity="0.35" />
      <circle cx="136" cy="100" r="9" fill="#ff5a3c" opacity="0.35" />
      <path d="M94 95 h12 l-6 7 Z" fill="#e94b6a" />
      <path d="M100 102 q-4 9 -12 5 M100 102 q4 9 12 5" stroke={DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M58 96 l-26 -6 M58 103 l-26 4 M142 96 l26 -6 M142 103 l26 4" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/** Mascota completa (estática). */
export function Mascot({ size = 220, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} className={className} aria-hidden="true">
      <ellipse className="m-shadow" cx="110" cy="228" rx="78" ry="9" fill="#000" opacity="0.35" />
      <g className="m-all">
        <path className="m-tail" d="M168 190 q48 -6 40 -58 q-4 -18 -18 -10 q14 30 -26 48" fill="none" stroke={ORANGE} strokeWidth="18" strokeLinecap="round" />
        <ellipse cx="105" cy="168" rx="78" ry="60" fill={ORANGE} />
        <ellipse cx="105" cy="178" rx="48" ry="42" fill={CREAM} />
        <path d="M40 150 q8 4 12 14 M170 150 q-8 4 -12 14" stroke={STRIPE} strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="72" cy="222" rx="22" ry="11" fill={CREAM} />
        <ellipse cx="138" cy="222" rx="22" ry="11" fill={CREAM} />
        <ellipse className="m-arm-l" cx="62" cy="168" rx="14" ry="20" fill={ORANGE_LIGHT} transform="rotate(-20 62 168)" />
        <g className="m-gavel">
          <rect x="160" y="96" width="9" height="74" rx="4" fill="#8a5a2b" transform="rotate(30 165 133)" />
          <rect x="166" y="66" width="52" height="26" rx="7" fill="#6b3f1d" transform="rotate(30 192 79)" />
          <rect x="172" y="70" width="8" height="26" rx="3" fill="#a8743f" transform="rotate(30 192 79)" />
          <ellipse cx="156" cy="152" rx="15" ry="19" fill={ORANGE_LIGHT} transform="rotate(25 156 152)" />
        </g>
        <g transform="translate(5 0)">
          <Face />
        </g>
      </g>
    </svg>
  );
}

/** Logo: cara de Michi. */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="20 0 160 140" width={size} height={size * (140 / 160)} aria-hidden="true" className="logo-mark">
      <Face />
    </svg>
  );
}

// ---------- Michi animado ----------

type Particles = { emoji: string[]; mode: 'rain' | 'float' | 'burst' };
interface Act {
  /** Animación del cuerpo (clase CSS act-*). */
  body: 'gavel' | 'jump' | 'spin' | 'shake' | 'dance' | 'wag' | 'ears' | 'pulse' | 'peek' | 'sleep' | 'wink' | 'tilt' | 'wave';
  bubble?: string;
  prop?: string;
  particles?: Particles;
}

/** 30 travesuras de Michi, todas sobre subastas. */
export const ACTS: Act[] = [
  { body: 'gavel', bubble: '¡Vendido!', particles: { emoji: ['✨'], mode: 'burst' } },
  { body: 'gavel', bubble: '¡A la una, a las dos… a las tres!' },
  { body: 'jump', particles: { emoji: ['🪙'], mode: 'rain' }, bubble: '¡Lluvia de ofertas!' },
  { body: 'wag', particles: { emoji: ['💸'], mode: 'float' } },
  { body: 'jump', bubble: '¡Nueva oferta!', prop: '📈' },
  { body: 'wag', bubble: 'Miau… ¿ya vio las ofertas?' },
  { body: 'wink', bubble: 'Psst… ¡oferte antes que termine!' },
  { body: 'ears', bubble: '¿Escuchó eso? ¡Una puja!' },
  { body: 'spin', bubble: '¡Ganó!', particles: { emoji: ['🎉'], mode: 'burst' } },
  { body: 'pulse', prop: '🏆', bubble: '¡Felicidades al ganador!' },
  { body: 'shake', prop: '⏰', bubble: '¡Quedan segundos!' },
  { body: 'shake', bubble: '¡Se acaba el tiempo!', particles: { emoji: ['💦'], mode: 'float' } },
  { body: 'pulse', particles: { emoji: ['🧡', '💛'], mode: 'float' }, bubble: '¡Me encanta este artículo!' },
  { body: 'tilt', prop: '🔍', bubble: 'Buscando gangas…' },
  { body: 'jump', prop: '💰', bubble: '¡Qué buen precio!' },
  { body: 'wave', prop: '🪧', bubble: '¡Yo ofrezco!' },
  { body: 'pulse', particles: { emoji: ['✨', '⭐'], mode: 'burst' } },
  { body: 'dance', particles: { emoji: ['🎊', '🎉'], mode: 'rain' }, bubble: '¡Subasta cerrada!' },
  { body: 'sleep', particles: { emoji: ['💤'], mode: 'float' }, bubble: 'Esperando la primera oferta…' },
  { body: 'ears', prop: '🔔', bubble: '¡Le avisamos si lo superan!' },
  { body: 'jump', particles: { emoji: ['⬆️'], mode: 'float' }, bubble: '¡La oferta sube!' },
  { body: 'dance', particles: { emoji: ['👏'], mode: 'burst' }, bubble: '¡Bravo!' },
  { body: 'dance', particles: { emoji: ['🎵', '🎶'], mode: 'float' } },
  { body: 'peek', bubble: '¿Hay ofertas nuevas?' },
  { body: 'pulse', particles: { emoji: ['💲'], mode: 'float' } },
  { body: 'jump', prop: '🎁', bubble: '¡Gran oportunidad!' },
  { body: 'shake', prop: '🚀', bubble: '¡Precio por las nubes!' },
  { body: 'tilt', particles: { emoji: ['❓'], mode: 'float' }, bubble: '¿Cuánto ofrezco?' },
  { body: 'wave', bubble: '¡Hola! Soy Michi 🐾' },
  { body: 'gavel', prop: '📣', bubble: '¡Atención, comienza la subasta!' },
];

const ACT_MS = 3200;

function reducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Michi con travesuras al azar cada pocos segundos. Al tocarlo hace otra.
 * Es decorativo: los lectores de pantalla lo ignoran. Si la persona pidió
 * reducir el movimiento, no se anima solo.
 */
export function AnimatedMascot({ size = 240, className }: { size?: number; className?: string }) {
  const [act, setAct] = useState<{ i: number; n: number } | null>(null);
  const last = useRef(-1);
  const first = useRef(true);
  const reduced = reducedMotion();

  const play = useCallback(() => {
    let i = Math.floor(Math.random() * ACTS.length);
    if (i === last.current) i = (i + 1) % ACTS.length;
    last.current = i;
    setAct((a) => ({ i, n: (a?.n ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (reduced) return;
    // Cada travesura dura ~3 s; luego descansa entre 2,5 y 5 s.
    const delay = act ? ACT_MS : first.current ? 1200 : 2500 + Math.random() * 2500;
    first.current = false;
    const t = setTimeout(() => (act ? setAct(null) : play()), delay);
    return () => clearTimeout(t);
  }, [act, play, reduced]);

  const a = act ? ACTS[act.i] : null;

  return (
    <div className={`michi ${className ?? ''} ${a ? `act act-${a.body}` : 'idle'}`} style={{ width: size, height: size }}>
      <button type="button" className="michi-hit" onClick={play} aria-label="Michi, la mascota. Tocar para ver una travesura" />
      <div className="michi-stage" key={act?.n ?? 0}>
      <Mascot size={size} />
      {a?.bubble && (
        <span className="michi-bubble" aria-hidden="true">
          {a.bubble}
        </span>
      )}
      {a?.prop && (
        <span className="michi-prop" aria-hidden="true">
          {a.prop}
        </span>
      )}
      {a?.particles && (
        <span className={`michi-particles p-${a.particles.mode}`} aria-hidden="true">
          {Array.from({ length: 9 }, (_, k) => (
            <span key={k} style={{ ['--k' as string]: k, ['--x' as string]: `${(k * 37) % 100}%` }}>
              {a.particles!.emoji[k % a.particles!.emoji.length]}
            </span>
          ))}
        </span>
      )}
      </div>
    </div>
  );
}

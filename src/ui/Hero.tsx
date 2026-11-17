import { useEffect, useRef, useState, type ReactNode } from 'react';
import { statusOf } from '../domain/auction';
import { formatCLP } from '../domain/money';
import type { AuctionSummary } from '../server/api';
import { formatRemaining } from './format';
import { AnimatedMascot } from './Mascot';

const AUTOPLAY_MS = 7000;

interface Slide {
  label: string;
  content: ReactNode;
}

/**
 * Carrusel principal. Accesible: botones grandes, pausa visible, se detiene al
 * pasar el mouse o al usar el teclado, y no avanza solo si la persona pidió
 * reducir el movimiento.
 */
export function HeroCarousel({ items, now }: { items: AuctionSummary[]; now: number }) {
  const endingSoon = items
    .filter((s) => statusOf(s.auction, now) === 'en-curso')
    .sort((a, b) => a.auction.endsAt! - b.auction.endsAt!)[0];

  const slides: Slide[] = [
    {
      label: 'Bienvenida',
      content: (
        <div className="slide slide-brand">
          <div className="slide-text">
            <span className="slide-kicker">Subastas simples, para todas las edades</span>
            <p className="slide-title">
              PUBLICA,
              <br />
              OFERTA,
              <br />
              <span className="accent">GANA</span>
            </p>
            <div className="slide-ctas">
              <button className="btn btn-primary" onClick={() => document.getElementById('articulos')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver artículos
              </button>
              <a className="btn btn-ghost" href="#/publicar">
                Publicar gratis
              </a>
            </div>
          </div>
          <AnimatedMascot size={260} className="slide-mascot" />
        </div>
      ),
    },
    ...(endingSoon
      ? [
          {
            label: 'Termina pronto',
            content: (
              <div className="slide slide-item">
                <div className="slide-text">
                  <span className="slide-kicker">⏱ ¡Termina pronto!</span>
                  <p className="slide-title slide-title-sm">{endingSoon.auction.title}</p>
                  <p className="slide-price">
                    Oferta actual <strong>{formatCLP(endingSoon.auction.currentPrice!)}</strong>
                  </p>
                  <p className="slide-sub" aria-hidden="true">
                    Quedan {formatRemaining(endingSoon.auction.endsAt! - now)}
                  </p>
                  <div className="slide-ctas">
                    <a className="btn btn-primary" href={`#/articulo/${endingSoon.auction.id}`}>
                      Ofertar ahora
                    </a>
                  </div>
                </div>
                <img className="slide-product" src={endingSoon.auction.photos[0]} alt="" />
              </div>
            ),
          },
        ]
      : []),
    {
      label: 'Primera vez',
      content: (
        <div className="slide slide-help">
          <div className="slide-text">
            <span className="slide-kicker">¿Primera vez aquí?</span>
            <p className="slide-title slide-title-sm">
              Michi le explica <span className="accent">paso a paso</span>
            </p>
            <p className="slide-sub">Sin contraseñas, sin cobros y con ayuda de una persona por WhatsApp.</p>
            <div className="slide-ctas">
              <a className="btn btn-primary" href="#/ayuda">
                Cómo funciona
              </a>
            </div>
          </div>
          <AnimatedMascot size={240} className="slide-mascot" />
        </div>
      ),
    },
    {
      label: 'Publicar',
      content: (
        <div className="slide slide-sell">
          <div className="slide-text">
            <span className="slide-kicker">¿Tiene algo que ya no usa?</span>
            <p className="slide-title slide-title-sm">
              Publíquelo <span className="accent">gratis</span> y deje que ofrezcan
            </p>
            <p className="slide-sub">Usted elige el precio mínimo. La cuenta regresiva parte con la primera oferta.</p>
            <div className="slide-ctas">
              <a className="btn btn-primary" href="#/publicar">
                Publicar un artículo
              </a>
            </div>
          </div>
          <div className="slide-emojis" aria-hidden="true">
            📺 ☕ 🎧
            <br />
            📱 🍟 💻
          </div>
        </div>
      ),
    },
  ];

  const [index, setIndex] = useState(0);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduced);
  const [hover, setHover] = useState(false);
  const root = useRef<HTMLElement>(null);
  const n = slides.length;
  const current = index % n;

  useEffect(() => {
    if (!playing || hover) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % n), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, hover, current, n]);

  const go = (i: number) => setIndex(((i % n) + n) % n);

  return (
    <section
      ref={root}
      className="hero"
      aria-roledescription="carrusel"
      aria-label="Destacados"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setHover(false)}
    >
      <div className="hero-viewport" aria-live={playing ? 'off' : 'polite'}>
        {slides.map((s, i) => (
          <div
            key={s.label}
            className={`hero-slide ${i === current ? 'is-active' : ''}`}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${n}: ${s.label}`}
            hidden={i !== current}
          >
            {s.content}
          </div>
        ))}
      </div>

      <div className="hero-controls">
        <button className="hero-btn" onClick={() => go(current - 1)} aria-label="Anterior">
          ‹
        </button>
        <div className="hero-dots">
          {slides.map((s, i) => (
            <button key={s.label} className={`hero-dot ${i === current ? 'is-active' : ''}`} aria-label={`Ir a: ${s.label}`} aria-current={i === current} onClick={() => go(i)} />
          ))}
        </div>
        <button className="hero-btn" onClick={() => go(current + 1)} aria-label="Siguiente">
          ›
        </button>
        <button className="hero-pause" onClick={() => setPlaying((p) => !p)}>
          {playing ? '❚❚ Pausar' : '▶ Reanudar'}
        </button>
      </div>
    </section>
  );
}

/** Franja de beneficios bajo el carrusel. */
export function FeatureStrip() {
  const items = [
    ['🔒', 'Sin contraseñas', 'Entra con un código a su correo'],
    ['💸', 'Sin cobros', 'Ofertar y publicar es gratis'],
    ['🔔', 'Le avisamos', 'Si alguien ofrece más que usted'],
  ];
  return (
    <ul className="features">
      {items.map(([icon, title, text]) => (
        <li key={title}>
          <span className="feature-icon" aria-hidden="true">
            {icon}
          </span>
          <span>
            <strong>{title}</strong>
            <br />
            {text}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Fila deslizable de artículos con flechas (como "Recomendados para ti"). */
export function ItemsRow({ title, children }: { title: string; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="row-section" aria-label={title}>
      <div className="row-head">
        <h2>{title}</h2>
        <div className="row-arrows">
          <button className="hero-btn" onClick={() => scroll(-1)} aria-label={`Ver anteriores de ${title}`}>
            ‹
          </button>
          <button className="hero-btn" onClick={() => scroll(1)} aria-label={`Ver más de ${title}`}>
            ›
          </button>
        </div>
      </div>
      <ul className="row-track" ref={track}>
        {children}
      </ul>
    </section>
  );
}

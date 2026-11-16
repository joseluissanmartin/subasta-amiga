/**
 * "Michi", la mascota de Subasta Amiga: un gato gordito naranja con un mazo de subasta.
 * Dibujado en SVG para que se vea nítido en cualquier tamaño y pese casi nada.
 */

const ORANGE = '#ff6f00';
const ORANGE_LIGHT = '#ff8f33';
const STRIPE = '#d45500';
const CREAM = '#ffe7cf';
const INNER_EAR = '#ffb38a';
const DARK = '#1a1a1a';

function Face({ wink = false }: { wink?: boolean }) {
  return (
    <>
      {/* orejas */}
      <path d="M52 62 L46 14 L92 42 Z" fill={ORANGE} />
      <path d="M148 62 L154 14 L108 42 Z" fill={ORANGE} />
      <path d="M58 52 L55 26 L80 42 Z" fill={INNER_EAR} />
      <path d="M142 52 L145 26 L120 42 Z" fill={INNER_EAR} />
      {/* cabeza redonda */}
      <ellipse cx="100" cy="82" rx="60" ry="50" fill={ORANGE_LIGHT} />
      {/* rayas */}
      <path d="M100 33 v14 M86 36 l4 12 M114 36 l-4 12" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" />
      {/* ojos */}
      {wink ? (
        <path d="M70 82 q10 -10 20 0" stroke={DARK} strokeWidth="5" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx="80" cy="80" rx="11" ry="13" fill="#fff" />
          <circle cx="82" cy="82" r="7" fill={DARK} />
          <circle cx="85" cy="78" r="2.5" fill="#fff" />
        </>
      )}
      <ellipse cx="120" cy="80" rx="11" ry="13" fill="#fff" />
      <circle cx="118" cy="82" r="7" fill={DARK} />
      <circle cx="121" cy="78" r="2.5" fill="#fff" />
      {/* mejillas */}
      <circle cx="64" cy="100" r="9" fill="#ff5a3c" opacity="0.35" />
      <circle cx="136" cy="100" r="9" fill="#ff5a3c" opacity="0.35" />
      {/* nariz y boca */}
      <path d="M94 95 h12 l-6 7 Z" fill="#e94b6a" />
      <path d="M100 102 q-4 9 -12 5 M100 102 q4 9 12 5" stroke={DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* bigotes */}
      <path d="M58 96 l-26 -6 M58 103 l-26 4 M142 96 l26 -6 M142 103 l26 4" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

/** Mascota completa. `pose="mazo"` sostiene el martillo de subasta. */
export function Mascot({ size = 220, pose = 'mazo', wink = false, className }: { size?: number; pose?: 'mazo' | 'saludo'; wink?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} className={className} role="img" aria-label="Michi, el gato de Subasta Amiga">
      <ellipse cx="110" cy="228" rx="78" ry="9" fill="#000" opacity="0.35" />
      {/* cola */}
      <path d="M168 190 q48 -6 40 -58 q-4 -18 -18 -10 q14 30 -26 48" fill="none" stroke={ORANGE} strokeWidth="18" strokeLinecap="round" />
      {/* cuerpo gordito */}
      <ellipse cx="105" cy="168" rx="78" ry="60" fill={ORANGE} />
      <ellipse cx="105" cy="178" rx="48" ry="42" fill={CREAM} />
      <path d="M40 150 q8 4 12 14 M170 150 q-8 4 -12 14" stroke={STRIPE} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* patitas */}
      <ellipse cx="72" cy="222" rx="22" ry="11" fill={CREAM} />
      <ellipse cx="138" cy="222" rx="22" ry="11" fill={CREAM} />
      {/* brazo izquierdo sobre la panza */}
      <ellipse cx="62" cy="168" rx="14" ry="20" fill={ORANGE_LIGHT} transform="rotate(-20 62 168)" />

      {pose === 'mazo' ? (
        <g>
          {/* mazo de subasta */}
          <rect x="160" y="96" width="9" height="74" rx="4" fill="#8a5a2b" transform="rotate(30 165 133)" />
          <rect x="166" y="66" width="52" height="26" rx="7" fill="#6b3f1d" transform="rotate(30 192 79)" />
          <rect x="172" y="70" width="8" height="26" rx="3" fill="#a8743f" transform="rotate(30 192 79)" />
          <ellipse cx="156" cy="152" rx="15" ry="19" fill={ORANGE_LIGHT} transform="rotate(25 156 152)" />
        </g>
      ) : (
        <ellipse cx="170" cy="120" rx="14" ry="22" fill={ORANGE_LIGHT} transform="rotate(35 170 120)" />
      )}

      <g transform="translate(5 0)">
        <Face wink={wink} />
      </g>
    </svg>
  );
}

/** Logo: cara de Michi dentro de un círculo naranja. */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="20 0 160 140" width={size} height={size * (140 / 160)} aria-hidden="true">
      <Face />
    </svg>
  );
}

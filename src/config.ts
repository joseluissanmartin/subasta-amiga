// Configuración de reglas. En el prototipo los tiempos están acortados para poder
// probar subastas completas en minutos. Para producción basta con cambiar DEMO a false.

export const DEMO = true;

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export interface DurationOption {
  ms: number;
  label: string;
}

export const DURATION_OPTIONS: DurationOption[] = DEMO
  ? [
      { ms: 2 * MIN, label: '2 minutos (prueba)' },
      { ms: 5 * MIN, label: '5 minutos (prueba)' },
      { ms: 15 * MIN, label: '15 minutos (prueba)' },
    ]
  : [
      { ms: 1 * DAY, label: '1 día' },
      { ms: 3 * DAY, label: '3 días' },
      { ms: 7 * DAY, label: '7 días' },
    ];

/** Si llega una oferta cuando queda menos que esto, el plazo se alarga. */
export const EXTENSION_WINDOW_MS = DEMO ? 1 * MIN : 5 * MIN;
/** Cuánto tiempo queda como mínimo tras una oferta de último momento. */
export const EXTENSION_MS = DEMO ? 1 * MIN : 5 * MIN;
/** Tiempo máximo esperando la primera oferta antes de vencer. */
export const MAX_WAIT_MS = DEMO ? 60 * MIN : 30 * DAY;

/** Montos fuera de este rango se rechazan siempre. */
export const MIN_PRICE = 500;
export const MAX_AMOUNT = 100_000_000;

/** Pedir confirmación extra si la oferta supera X veces la próxima oferta mínima. */
export const HIGH_BID_FACTOR = 3;

export const MAX_PHOTOS = 4;
export const TERMS_VERSION = '2026-11-prototipo';

export const SUPPORT_WHATSAPP = '+56 9 9879 2372';
/** Número para el enlace wa.me (solo dígitos, con código de país). */
export const SUPPORT_WHATSAPP_LINK = 'https://wa.me/56998792372?text=' + encodeURIComponent('Hola, tengo una consulta sobre Subasta Amiga.');

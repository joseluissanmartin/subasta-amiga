const clp = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/** 25000 → "$25.000 CLP" */
export function formatCLP(amount: number, withCurrency = true): string {
  const s = '$' + clp.format(Math.round(amount));
  return withCurrency ? s + ' CLP' : s;
}

/**
 * Interpreta lo que escribe una persona en Chile: "25000", "25.000", "$25.000",
 * "$ 25.000 CLP". Devuelve null si es ambiguo o no es un entero
 * (por ejemplo "25.5" o "25.000,50").
 */
export function parseCLP(input: string): number | null {
  const s = input.replace(/clp/gi, '').replace(/\$/g, '').replace(/\s/g, '');
  if (s === '') return null;
  if (/^\d+$/.test(s)) return Number(s);
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''));
  return null;
}

/** Incremento mínimo según la oferta vigente (tabla por tramos). */
export function incrementFor(current: number): number {
  if (current <= 10_000) return 500;
  if (current <= 50_000) return 1_000;
  if (current <= 200_000) return 5_000;
  return 10_000;
}

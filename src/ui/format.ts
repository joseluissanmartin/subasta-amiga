import { DEMO } from '../config';

const TZ = 'America/Santiago';

const endFmt = new Intl.DateTimeFormat('es-CL', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  ...(DEMO ? { second: '2-digit' } : {}),
});

const dateFmt = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

/** "martes, 18 de noviembre, 20:30 (hora de Chile)" */
export function formatEnd(ts: number): string {
  return endFmt.format(ts) + ' (hora de Chile)';
}
export function formatDate(ts: number): string {
  return dateFmt.format(ts);
}
export function formatMoment(ts: number): string {
  return timeFmt.format(ts);
}

/** "2 días y 4 horas", "3 horas y 12 minutos", "2 minutos y 5 segundos" */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Terminó';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (d > 0) return `${p(d, 'día', 'días')} y ${p(h, 'hora', 'horas')}`;
  if (h > 0) return `${p(h, 'hora', 'horas')} y ${p(m, 'minuto', 'minutos')}`;
  if (m > 0) return `${p(m, 'minuto', 'minutos')} y ${p(sec, 'segundo', 'segundos')}`;
  return p(sec, 'segundo', 'segundos');
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min % 1440 === 0) return `${min / 1440} ${min === 1440 ? 'día' : 'días'}`;
  if (min % 60 === 0) return `${min / 60} ${min === 60 ? 'hora' : 'horas'}`;
  return `${min} ${min === 1 ? 'minuto' : 'minutos'}`;
}

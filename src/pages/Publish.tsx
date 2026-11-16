import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DURATION_OPTIONS, MAX_PHOTOS, MIN_PRICE } from '../config';
import { formatCLP, parseCLP } from '../domain/money';
import { CATEGORIES, CONDITIONS, type Category, type Condition } from '../domain/types';
import { createAuction, getAuction } from '../server/api';
import { CATEGORY_EMOJI, placeholderImage } from '../server/seed';
import { Notice } from '../ui/components';
import { formatDuration } from '../ui/format';
import { compressImage } from '../ui/images';
import { navigate, useCurrentUser, useFocusHeading } from '../ui/hooks';

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Región Metropolitana',
  "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

interface Draft {
  photos: string[];
  title: string;
  description: string;
  condition: Condition | '';
  defects: string;
  category: Category | '';
  region: string;
  comuna: string;
  price: string;
  durationMs: number | 0;
}

const EMPTY: Draft = { photos: [], title: '', description: '', condition: '', defects: '', category: '', region: 'Región Metropolitana', comuna: '', price: '', durationMs: 0 };

const STEPS = ['Fotos', 'Nombre del artículo', 'Descripción y estado', 'Categoría', 'Ubicación', 'Precio mínimo', 'Duración', 'Revisar y publicar'];

export function Publish({ copyFrom }: { copyFrom?: string }) {
  const h1 = useFocusHeading<HTMLHeadingElement>();
  const user = useCurrentUser();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // "Publicar de nuevo": copiar los datos de un artículo vencido.
  useEffect(() => {
    if (!copyFrom) return;
    getAuction(copyFrom).then((d) => {
      if (!d) return;
      const a = d.auction;
      setDraft({ photos: a.photos, title: a.title, description: a.description, condition: a.condition, defects: a.defects, category: a.category, region: a.region, comuna: a.comuna, price: String(a.minPrice), durationMs: a.durationMs });
      setStep(STEPS.length - 1);
    });
  }, [copyFrom]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    stepHeading.current?.focus();
  }, [step]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  if (!user) {
    return (
      <>
        <h1 ref={h1} tabIndex={-1}>
          Publicar un artículo
        </h1>
        <p>Para publicar necesita ingresar con su cuenta. Es gratis y no se pide contraseña.</p>
        <button className="btn btn-primary" onClick={() => navigate('/ingresar?volver=/publicar')}>
          Ingresar o crear cuenta
        </button>
      </>
    );
  }

  if (doneId) {
    return (
      <>
        <h1 ref={h1} tabIndex={-1}>
          ¡Su artículo ya está publicado!
        </h1>
        <Notice kind="ok" title="Ahora está esperando la primera oferta.">
          <p>Cuando alguien ofrezca, comenzará la cuenta regresiva y le avisaremos en «Mi cuenta → Avisos».</p>
        </Notice>
        <div className="btn-row">
          <a className="btn btn-primary" href={`#/articulo/${doneId}`}>
            Ver mi publicación
          </a>
          <button className="btn btn-secondary" onClick={() => { setDraft(EMPTY); setStep(0); setDoneId(null); }}>
            Publicar otro artículo
          </button>
        </div>
      </>
    );
  }

  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 1) {
      const t = draft.title.trim();
      if (t.length < 3) e.title = 'Escriba un nombre de al menos 3 letras. Por ejemplo: «Mesa de comedor de madera».';
      if (t.length > 80) e.title = 'El nombre es muy largo. Use menos de 80 letras.';
    }
    if (s === 2) {
      if (draft.description.trim().length < 10) e.description = 'Cuente un poco más del artículo (al menos 10 letras).';
      if (!draft.condition) e.condition = 'Elija el estado del artículo.';
    }
    if (s === 3 && !draft.category) e.category = 'Elija una categoría.';
    if (s === 4) {
      if (!draft.region) e.region = 'Elija una región.';
      if (draft.comuna.trim().length < 2) e.comuna = 'Escriba su comuna. No pedimos su dirección.';
    }
    if (s === 5) {
      const v = parseCLP(draft.price);
      if (v === null) e.price = 'Escriba el precio solo con números, por ejemplo 10000 o 10.000.';
      else if (v < MIN_PRICE) e.price = `El precio mínimo debe ser al menos ${formatCLP(MIN_PRICE)}.`;
    }
    if (s === 6 && !draft.durationMs) e.durationMs = 'Elija cuánto durará la subasta.';
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(step + 1);
  };

  const publish = async () => {
    for (let s = 0; s < STEPS.length - 1; s++) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setBusy(true);
    try {
      const category = draft.category as Category;
      const id = await createAuction({
        title: draft.title,
        description: draft.description.trim(),
        condition: draft.condition as Condition,
        defects: draft.defects.trim(),
        category,
        region: draft.region,
        comuna: draft.comuna.trim(),
        photos: draft.photos.length ? draft.photos : [placeholderImage(category, CATEGORY_EMOJI[category])],
        minPrice: parseCLP(draft.price)!,
        durationMs: draft.durationMs,
      });
      setDoneId(id);
    } catch (e) {
      setErrors({ general: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const price = parseCLP(draft.price);

  return (
    <>
      <h1 ref={h1} tabIndex={-1}>
        Publicar un artículo
      </h1>
      <p className="progress-text">
        Paso {step + 1} de {STEPS.length}
      </p>
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <form
        className="wizard"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step === STEPS.length - 1) publish();
          else next();
        }}
      >
        <h2 ref={stepHeading} tabIndex={-1}>
          {STEPS[step]}
        </h2>

        {step === 0 && <PhotosStep photos={draft.photos} onChange={(p) => set('photos', p)} />}

        {step === 1 && (
          <Field id="title" label="¿Qué artículo quiere subastar?" hint="Un nombre corto y claro. Por ejemplo: «Silla de mimbre antigua»." error={errors.title}>
            <input id="title" value={draft.title} maxLength={80} onChange={(e) => set('title', e.target.value)} {...aria('title', errors)} />
          </Field>
        )}

        {step === 2 && (
          <>
            <Field id="description" label="Descripción" hint="Medidas, material, antigüedad, lo que crea importante." error={errors.description}>
              <textarea id="description" rows={5} value={draft.description} onChange={(e) => set('description', e.target.value)} {...aria('description', errors)} />
            </Field>
            <fieldset className="choices" aria-describedby={errors.condition ? 'condition-err' : undefined}>
              <legend>¿En qué estado está?</legend>
              {Object.entries(CONDITIONS).map(([k, v]) => (
                <label key={k} className="choice">
                  <input type="radio" name="condition" checked={draft.condition === k} onChange={() => set('condition', k as Condition)} />
                  {v}
                </label>
              ))}
              {errors.condition && <p id="condition-err" className="field-error">{errors.condition}</p>}
            </fieldset>
            <Field id="defects" label="Detalles o defectos conocidos (opcional)" hint="Ser honesto evita problemas después.">
              <input id="defects" value={draft.defects} onChange={(e) => set('defects', e.target.value)} />
            </Field>
          </>
        )}

        {step === 3 && (
          <fieldset className="choices" aria-describedby={errors.category ? 'category-err' : undefined}>
            <legend>Elija la categoría que mejor lo describe</legend>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <label key={k} className="choice">
                <input type="radio" name="category" checked={draft.category === k} onChange={() => set('category', k as Category)} />
                <span aria-hidden="true">{CATEGORY_EMOJI[k as Category]}</span> {v}
              </label>
            ))}
            {errors.category && <p id="category-err" className="field-error">{errors.category}</p>}
          </fieldset>
        )}

        {step === 4 && (
          <>
            <p>Solo mostraremos la comuna. Nunca su dirección.</p>
            <Field id="region" label="Región" error={errors.region}>
              <select id="region" value={draft.region} onChange={(e) => set('region', e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field id="comuna" label="Comuna" hint="Por ejemplo: Ñuñoa" error={errors.comuna}>
              <input id="comuna" value={draft.comuna} autoComplete="address-level2" onChange={(e) => set('comuna', e.target.value)} {...aria('comuna', errors)} />
            </Field>
          </>
        )}

        {step === 5 && (
          <Field id="price" label="Precio mínimo en pesos chilenos" hint="Es lo mínimo que aceptaría. La primera oferta debe ser igual o mayor." error={errors.price}>
            <div className="money-input">
              <span aria-hidden="true">$</span>
              <input id="price" inputMode="numeric" value={draft.price} onChange={(e) => set('price', e.target.value)} {...aria('price', errors)} />
            </div>
            {price !== null && <p className="hint">Usted escribió: {formatCLP(price)}</p>}
          </Field>
        )}

        {step === 6 && (
          <fieldset className="choices" aria-describedby={errors.durationMs ? 'dur-err' : 'dur-hint'}>
            <legend>¿Cuánto durará la subasta desde la primera oferta?</legend>
            <p id="dur-hint" className="hint">
              El tiempo empieza a correr solo cuando llega la primera oferta.
            </p>
            {DURATION_OPTIONS.map((d) => (
              <label key={d.ms} className="choice">
                <input type="radio" name="duration" checked={draft.durationMs === d.ms} onChange={() => set('durationMs', d.ms)} />
                {d.label}
              </label>
            ))}
            {errors.durationMs && <p id="dur-err" className="field-error">{errors.durationMs}</p>}
          </fieldset>
        )}

        {step === 7 && (
          <div className="summary">
            {draft.photos.length > 0 && (
              <div className="summary-photos">
                {draft.photos.map((p, i) => (
                  <img key={i} src={p} alt={`Foto ${i + 1}`} />
                ))}
              </div>
            )}
            <dl className="facts">
              <SummaryRow label="Nombre" value={draft.title} onEdit={() => setStep(1)} />
              <SummaryRow label="Descripción" value={draft.description} onEdit={() => setStep(2)} />
              <SummaryRow label="Estado" value={draft.condition ? CONDITIONS[draft.condition] : ''} onEdit={() => setStep(2)} />
              <SummaryRow label="Categoría" value={draft.category ? CATEGORIES[draft.category] : ''} onEdit={() => setStep(3)} />
              <SummaryRow label="Ubicación" value={`${draft.comuna}, ${draft.region}`} onEdit={() => setStep(4)} />
              <SummaryRow label="Precio mínimo" value={price !== null ? formatCLP(price) : ''} onEdit={() => setStep(5)} />
              <SummaryRow label="Duración" value={draft.durationMs ? formatDuration(draft.durationMs) + ' desde la primera oferta' : ''} onEdit={() => setStep(6)} />
              <SummaryRow label="Fotos" value={draft.photos.length ? `${draft.photos.length}` : 'Sin fotos (usaremos un dibujo)'} onEdit={() => setStep(0)} />
            </dl>
            <Notice kind="warn" title="Importante">
              <p>La cuenta regresiva comenzará cuando llegue la primera oferta válida. Desde ese momento no podrá cambiar el precio mínimo ni la duración, ni retirar el artículo.</p>
            </Notice>
            {errors.general && <Notice kind="error">{errors.general}</Notice>}
          </div>
        )}

        <div className="btn-row wizard-nav">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {step === STEPS.length - 1 ? (busy ? 'Publicando…' : 'Publicar artículo') : 'Continuar'}
          </button>
          {step > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => { setErrors({}); setStep(step - 1); }}>
              Volver
            </button>
          )}
        </div>
      </form>
    </>
  );
}

function aria(id: string, errors: Record<string, string>) {
  return { 'aria-invalid': !!errors[id], 'aria-describedby': [errors[id] ? `${id}-err` : '', `${id}-hint`].filter(Boolean).join(' ') };
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <span className="prewrap">{value}</span>{' '}
        <button type="button" className="btn-link" onClick={onEdit}>
          Cambiar<span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      </dd>
    </>
  );
}

function PhotosStep({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | null) => {
    if (!files) return;
    setError('');
    const room = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`Puede subir hasta ${MAX_PHOTOS} fotos. Agregamos solo las primeras.`);
    setBusy(true);
    try {
      const out: string[] = [];
      for (const f of list) out.push(await compressImage(f));
      onChange([...photos, ...out]);
    } catch {
      setError('No pudimos leer una de las fotos. Pruebe con otra.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <>
      <p>Agregue hasta {MAX_PHOTOS} fotos con buena luz. Es opcional: si no tiene, mostraremos un dibujo.</p>
      {photos.length > 0 && (
        <ul className="photo-list">
          {photos.map((p, i) => (
            <li key={i}>
              <img src={p} alt={`Foto ${i + 1}`} />
              <button type="button" className="btn btn-secondary" onClick={() => onChange(photos.filter((_, j) => j !== i))}>
                Quitar foto {i + 1}
              </button>
            </li>
          ))}
        </ul>
      )}
      {photos.length < MAX_PHOTOS && (
        <div className="field">
          <input ref={input} id="fotos" className="sr-only file-input" type="file" accept="image/*" multiple onChange={(e) => add(e.target.files)} />
          <label htmlFor="fotos" className="btn btn-secondary file-btn">
            📷 {photos.length ? 'Agregar otra foto' : 'Elegir fotos'}
          </label>
        </div>
      )}
      {busy && <p role="status">Preparando las fotos…</p>}
      {error && <p className="field-error">{error}</p>}
    </>
  );
}

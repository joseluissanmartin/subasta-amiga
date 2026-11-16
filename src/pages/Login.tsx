import { useEffect, useRef, useState } from 'react';
import { DEMO } from '../config';
import { register, requestLoginCode, verifyLoginCode } from '../server/api';
import { Notice } from '../ui/components';
import { navigate, useFocusHeading } from '../ui/hooks';

type Step = 'correo' | 'codigo' | 'registro';

/** Acceso sin contraseña: se envía un código de 6 dígitos al correo. */
export function Login({ back }: { back?: string }) {
  const h1 = useFocusHeading<HTMLHeadingElement>();
  const [step, setStep] = useState<Step>('correo');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [alias, setAlias] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const stepRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepRef.current?.focus();
  }, [step]);

  const done = () => navigate(back && back.startsWith('/') ? back : '/');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="narrow">
      <h1 ref={h1} tabIndex={-1}>
        Ingresar
      </h1>

      {step === 'correo' && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await requestLoginCode(email);
              setDemoCode(r.demoCode);
              setStep('codigo');
            });
          }}
        >
          <h2 ref={stepRef} tabIndex={-1} className="step-title">
            Paso 1: su correo
          </h2>
          <p>No necesita contraseña. Le enviaremos un código de 6 números a su correo para entrar.</p>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'login-err' : undefined} />
          </div>
          {error && <p id="login-err" className="field-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviarme el código'}
          </button>
          {DEMO && (
            <Notice kind="info" title="Prototipo">
              <p>Puede usar una cuenta de ejemplo: rosa@ejemplo.cl, jorge@ejemplo.cl o carmen@ejemplo.cl. O escriba cualquier correo para crear una nueva.</p>
            </Notice>
          )}
        </form>
      )}

      {step === 'codigo' && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await verifyLoginCode(email, code);
              if (r.user) done();
              else setStep('registro');
            });
          }}
        >
          <h2 ref={stepRef} tabIndex={-1} className="step-title">
            Paso 2: el código
          </h2>
          <p>
            Enviamos un código a <strong>{email}</strong>. Revise también la carpeta de «correo no deseado».
          </p>
          {DEMO && (
            <Notice kind="info" title="Prototipo: no se envían correos de verdad">
              <p>
                Su código es <strong className="demo-code">{demoCode}</strong>
              </p>
            </Notice>
          )}
          <div className="field">
            <label htmlFor="code">Código de 6 números</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} className="code-input" value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'code-err' : undefined} />
          </div>
          {error && <p id="code-err" className="field-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Revisando…' : 'Entrar'}
          </button>
          <button type="button" className="btn btn-link" onClick={() => { setCode(''); setError(''); setStep('correo'); }}>
            Usar otro correo
          </button>
        </form>
      )}

      {step === 'registro' && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!adult || !terms) return setError('Para continuar debe confirmar que es mayor de edad y aceptar las reglas.');
            run(async () => {
              await register({ email, code: code.replace(/\s/g, ''), alias, whatsapp });
              done();
            });
          }}
        >
          <h2 ref={stepRef} tabIndex={-1} className="step-title">
            Paso 3: crear su cuenta
          </h2>
          <p>Es la primera vez que entra con este correo. Solo necesitamos dos datos.</p>
          <div className="field">
            <label htmlFor="alias">¿Cómo quiere que lo vean los demás?</label>
            <p id="alias-hint" className="hint">
              Su nombre o un apodo. Por ejemplo: «Rosa M.»
            </p>
            <input id="alias" autoComplete="nickname" value={alias} onChange={(e) => setAlias(e.target.value)} aria-describedby="alias-hint" />
          </div>
          <div className="field">
            <label htmlFor="wa">WhatsApp o teléfono (opcional)</label>
            <p id="wa-hint" className="hint">
              Solo lo verá la otra persona cuando termine una subasta en la que ustedes dos participen, para coordinar la entrega.
            </p>
            <input id="wa" type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} aria-describedby="wa-hint" />
          </div>
          <label className="choice">
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
            Soy mayor de 18 años
          </label>
          <label className="choice">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            Acepto las <a href="#/ayuda" target="_blank" rel="noreferrer">reglas de uso y privacidad</a>
          </label>
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Creando…' : 'Crear mi cuenta'}
          </button>
        </form>
      )}
    </div>
  );
}

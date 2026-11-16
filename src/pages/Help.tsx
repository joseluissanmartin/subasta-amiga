import { EXTENSION_MS, EXTENSION_WINDOW_MS, SUPPORT_WHATSAPP } from '../config';
import { formatDuration } from '../ui/format';
import { useFocusHeading } from '../ui/hooks';

const FAQ: [string, string][] = [
  ['¿Cómo funciona una subasta?', 'Quien vende publica un artículo con un precio mínimo. Cuando alguien ofrece ese precio o más, empieza una cuenta regresiva. Mientras dure, otras personas pueden ofrecer más. Al terminar el tiempo, gana la oferta más alta.'],
  ['¿Cuándo empieza la cuenta regresiva?', 'Con la primera oferta. Antes de eso, el artículo aparece como «Esperando la primera oferta».'],
  ['¿Qué pasa si alguien ofrece en el último momento?', `Si alguien ofrece cuando quedan menos de ${formatDuration(EXTENSION_WINDOW_MS)}, el plazo se alarga para que quede al menos ${formatDuration(EXTENSION_MS)}. Así nadie gana por ofrecer en el último segundo.`],
  ['¿Esta página me cobra algo?', 'No. Ofertar no tiene costo y esta página no recibe pagos. Si gana, usted y quien vende acuerdan directamente el pago y la entrega.'],
  ['¿Puedo arrepentirme de una oferta?', 'Antes de enviarla siempre le pediremos que la revise y confirme. Una vez confirmada no se puede retirar sola; si se equivocó, escríbanos y lo revisaremos.'],
  ['¿Cómo sé si voy ganando?', 'En el artículo verá «Usted va ganando» en verde. En «Mi cuenta → Mis ofertas» también aparece. Si alguien ofrece más, le dejaremos un aviso.'],
  ['¿Quién ve mis datos?', 'Los demás solo ven el nombre o apodo que usted eligió. Su correo y teléfono solo los ve la otra persona cuando termina una subasta en la que ustedes dos participaron, para coordinar la entrega.'],
  ['Consejos de seguridad', 'Reúnase en un lugar público y de día, o pida a un familiar que lo acompañe. No entregue el artículo ni el dinero hasta revisar ambos. Nunca comparta claves ni códigos que le lleguen por correo.'],
];

export function Help() {
  const h1 = useFocusHeading<HTMLHeadingElement>();
  return (
    <div className="narrow">
      <h1 ref={h1} tabIndex={-1}>
        Ayuda
      </h1>
      <div className="support">
        <p>
          <strong>¿Necesita ayuda de una persona?</strong>
        </p>
        <p>Escríbanos por WhatsApp al {SUPPORT_WHATSAPP}, de lunes a viernes de 9:00 a 18:00.</p>
      </div>
      <h2>Preguntas frecuentes</h2>
      {FAQ.map(([q, a]) => (
        <details key={q} className="faq">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <h2 id="reglas">Reglas de uso y privacidad (resumen del prototipo)</h2>
      <ul className="plain-list">
        <li>Debe ser mayor de 18 años.</li>
        <li>Solo publique artículos que le pertenecen y que sean legales. No se permiten animales, medicamentos, armas ni vehículos.</li>
        <li>Describa con honestidad el estado y los defectos.</li>
        <li>Al ofertar se compromete a comprar si gana.</li>
        <li>No haga ofertas por sus propios artículos con otra cuenta.</li>
        <li>Guardamos solo los datos necesarios para que la subasta funcione.</li>
      </ul>
    </div>
  );
}

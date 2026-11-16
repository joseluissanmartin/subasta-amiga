import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { placeholderImage } from './server/seed';

// Si una foto externa no carga (sin internet o el sitio la cambió), mostrar un dibujo en su lugar.
const FALLBACK = placeholderImage('otros', '📦');
document.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.src !== FALLBACK) img.src = FALLBACK;
  },
  true,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

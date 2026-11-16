# Subasta Amiga — prototipo

Web app de subastas en CLP pensada para personas mayores. Prototipo sin servicios externos:
los datos viven en el navegador (localStorage) y los tiempos están acortados para probar rápido.

## Cómo usarlo

```bash
npm install
npm run dev      # abre http://localhost:5173
npm test         # pruebas de las reglas de la subasta
npm run build    # versión para publicar (carpeta dist/)
```

- Cuentas de ejemplo: rosa@ejemplo.cl, jorge@ejemplo.cl, carmen@ejemplo.cl (el código se muestra en pantalla).
- Abajo de cada página: **Herramientas del prototipo** (cambiar de persona, simular sin conexión, reiniciar datos).
- Abra dos pestañas con personas distintas para ver las ofertas en vivo.

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `src/config.ts` | Reglas ajustables: duraciones, alargue, plazos. `DEMO = false` para tiempos reales. |
| `src/domain/` | Reglas puras de la subasta y montos CLP (con pruebas). |
| `src/server/api.ts` | "Servidor" simulado. **Es lo único que se reemplaza al conectar Supabase.** |
| `src/pages/` | Pantallas: Explorar, Artículo, Publicar, Ingresar, Mi cuenta, Ayuda. |
| `src/ui/` | Componentes, panel de ofertas, formato de fechas, compresión de fotos. |

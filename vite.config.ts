import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' permite publicar en cualquier subcarpeta (por ejemplo GitHub Pages:
// https://usuario.github.io/nombre-repo/). Las rutas usan # así que no requieren
// configuración extra del servidor.
export default defineConfig({
  base: './',
  plugins: [react()],
})

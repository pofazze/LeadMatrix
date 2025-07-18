import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acesso via LAN
    port: 5173, // (Opcional) Garante a porta 5173
    proxy: {
      '/api': {
        target: 'https://primary-lhz6-production.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/webhook': {
        target: 'https://primary-lhz6-production.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/webhook/, '/webhook'),
      },
    },
  },
})

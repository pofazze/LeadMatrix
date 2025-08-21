import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_TARGET = env.VITE_API_BASE_URL || env.API_TARGET || 'http://localhost:4000';
  const WEBHOOK_TARGET = env.VITE_WEBHOOK_TARGET || env.WEBHOOK_TARGET || 'https://primary-lhz6-production.up.railway.app';
  const PORT = Number(env.VITE_PORT || env.PORT || 5173);
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: PORT,
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        '/webhook': {
          target: WEBHOOK_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/webhook/, '/webhook'),
        },
      },
    },
  }
})

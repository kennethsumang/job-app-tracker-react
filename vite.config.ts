import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Same-origin auth requests from better-auth; the browser sees
        // `/api/auth/*` on the Vite origin, so cookies are set here.
        // The API's `CORS_ORIGIN`/trusted origins must include this origin
        // because the browser's Origin header is forwarded.
        '/api/auth': {
          target: apiUrl,
          changeOrigin: false,
        },
      },
    },
  }
})

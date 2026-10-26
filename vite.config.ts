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
        // All API traffic (better-auth under `/api/auth` and the versioned
        // feature routes) is proxied so the browser sees it as same-origin.
        // Cookies are set on this origin, which lets the shared API client
        // use relative `/api` URLs. The API's `CORS_ORIGIN`/trusted origins
        // must still include this origin because the Origin header is
        // forwarded.
        '/api': {
          target: apiUrl,
          changeOrigin: false,
        },
      },
    },
  }
})

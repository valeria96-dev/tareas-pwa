import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // El navegador siempre llama a /api en el mismo origen; Vite reenvía a la API de la Unidad 2.
  const proxy = {
    '/api': { target: env.API_TARGET || 'http://localhost:3000', changeOrigin: true },
  }

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Mis Tareas',
          short_name: 'Tareas',
          description: 'Organiza tus tareas personales: crea, edita, filtra y adjunta archivos.',
          lang: 'es',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#f5f6fa',
          theme_color: '#3b4cca',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache: solo el "app shell" (HTML, JS, CSS e iconos generados por el build).
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          cleanupOutdatedCaches: true,
          // Cualquier ruta de la SPA abre index.html desde la caché, incluso sin red…
          navigateFallback: 'index.html',
          // …excepto la API, que nunca se responde con HTML.
          navigateFallbackDenylist: [/^\/api\//],
          // La API nunca se guarda en la caché del service worker: son datos privados
          // de cada usuario y dependen de la cookie de sesión.
          runtimeCaching: [
            { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
          ],
        },
      }),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { proxy },
    preview: { proxy },
    test: { environment: 'jsdom' },
  }
})

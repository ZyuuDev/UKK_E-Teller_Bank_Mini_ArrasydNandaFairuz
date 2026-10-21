import { cwd } from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const settings = loadEnv(mode, cwd(), 'BANK_')
  const enabled = settings.BANK_ENABLE_PWA === '1'
  return {
    plugins: [
      react(),
      ...(enabled
        ? [
            VitePWA({
              registerType: 'prompt',
              injectRegister: 'script',
              manifest: {
                name: 'Bank Mini SMKN 1 Bantul',
                short_name: 'Bank Mini',
                theme_color: '#1677ff',
                background_color: '#f7f9fc',
                display: 'standalone',
                start_url: '/',
                icons: [
                  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
                navigateFallbackDenylist: [/^\/api(?:\/|$)/],
                runtimeCaching: [{ urlPattern: /\/api(?:\/|$)/, handler: 'NetworkOnly' }],
              },
            }),
          ]
        : []),
    ],
    server: {
      port: 5173,
      proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
    },
  }
})

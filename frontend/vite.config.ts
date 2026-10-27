
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// Adaptación exclusiva del proxy local de desarrollo.
// El backend conserva su configuración HTTPS original.
function adaptSessionCookie(cookie: string): string {
  if (!/^\s*sid=/i.test(cookie)) {
    return cookie
  }

  return (
    cookie
      .replace(
        /;\s*SameSite=(?:None|Lax|Strict)\b/gi,
        ''
      )
      .replace(/;\s*Secure\b/gi, '') +
    '; SameSite=Lax'
  )
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const target =
    env.API_PROXY_TARGET ||
    'https://alertaincendios.duckdns.org'

  return {
    plugins: [vue(), tailwindcss()],

    server: {
      port: 5173,

      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          cookieDomainRewrite: '',

          configure(proxy) {
            proxy.on('proxyRes', (proxyRes) => {
              const cookies =
                proxyRes.headers['set-cookie']

              if (!cookies) return

              proxyRes.headers['set-cookie'] =
                cookies.map(adaptSessionCookie)
            })
          },
        },

        '/socket.io': {
          target,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})

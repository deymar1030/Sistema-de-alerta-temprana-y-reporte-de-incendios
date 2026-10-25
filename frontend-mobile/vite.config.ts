
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const target = (
    env.API_PROXY_TARGET ||
    'https://alertaincendios.duckdns.org'
  ).replace(/\/+$/, '')

  return {
    plugins: [
      vue(),
      legacy(),
    ],

    server: {
      port: 5174,

      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          cookieDomainRewrite: '',
        },

        '/socket.io': {
          target,
          changeOrigin: true,
          ws: true,
          cookieDomainRewrite: '',
        },
      },
    },
  }
})

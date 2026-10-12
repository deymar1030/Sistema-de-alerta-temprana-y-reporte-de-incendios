import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    vue(),
    legacy(),
  ],

  server: {
    proxy: {
      '/api': {
        target:
          'http://ht9hjabqfsvtjzra7sqej7uz.173.212.227.208.sslip.io',

        changeOrigin: true,

        headers: {
          Origin: 'http://localhost:5173',
        },
      },
    },
  },
})
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],

  server: {
    proxy: {
      '/api': {
        target: 'http://ht9hjabqfsvtjzra7sqej7uz.173.212.227.208.sslip.io',
        changeOrigin: true,
      },
    },
  },
})
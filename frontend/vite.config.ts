import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 990,
    allowedHosts: true,
    watch: { usePolling: true },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://l2sc:991',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_URL || 'http://l2sc:991',
        changeOrigin: true,
      },
    },
  },
})

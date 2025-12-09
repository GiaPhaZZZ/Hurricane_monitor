import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy for CloudFront (bypass CORS in development)
      '/api/cloudfront': {
        target: 'https://d3lj47ilp0fgxy.cloudfront.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cloudfront/, ''),
        secure: true,
      },
    },
  },
})
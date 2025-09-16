import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/proxy": {
        target: "https://partners.inuvo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/proxy/,
            "/analytics/GetAdsenseOnlineRealtimeByChannel"
          ),
      },
      "/api/geo": {
        target: "https://partners.inuvo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/geo/,
            "/analytics/GetAdsenseOnlineByGeoRealtimeByChannel"
          ),
      },
    },
  },
});

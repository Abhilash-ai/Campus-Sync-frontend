import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Raise warning threshold and add manual code splitting
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React framework code — rarely changes, cached by browser
          'vendor-react': ['react', 'react-dom'],
          // Routing — stable dependency
          'vendor-router': ['react-router-dom'],
          // Charts — largest dependency, split for lazy loading
          'vendor-charts': ['recharts'],
        }
      }
    }
  }
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Split code into smaller chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunk
          vendor: ['react', 'react-dom'],
          axios: ['axios'],
        }
      }
    },
    // Warn if chunk is larger than 500kb
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios']
  }
})
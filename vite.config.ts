import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Explicitly set public directory
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'public/index.html') // Point to HTML in public
    }
  }
})

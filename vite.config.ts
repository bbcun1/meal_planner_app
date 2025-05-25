import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Add this line
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})

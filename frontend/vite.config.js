import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend-only PoC. No proxy / backend required.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})

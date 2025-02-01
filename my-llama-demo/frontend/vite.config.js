// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // <-- Add this to listen on all interfaces
    port: 5173,        // optional, pick your own
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const LAN_HOST = '0.0.0.0'
const DEV_PORT = 5173

export default defineConfig({
  plugins: [react()],
  server: {
    host: LAN_HOST,
    port: DEV_PORT,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      host: process.env.VITE_HMR_HOST || '192.168.2.111',
      clientPort: DEV_PORT,
    },
  },
  preview: {
    host: LAN_HOST,
    port: DEV_PORT,
    strictPort: true,
    allowedHosts: true,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    tailwindcss(), 
    react(),
    nodePolyfills({
      include: ['crypto', 'buffer', 'process', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],

server: {
  host: '0.0.0.0',
  strictPort: true,
  allowedHosts: 'all'
}
})
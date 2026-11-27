import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rolldownOptions: {
      // two pages: the React app and the standalone 3D campus it embeds in an iframe
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        campus3d: fileURLToPath(new URL('./campus3d.html', import.meta.url)),
      },
    },
  },
})

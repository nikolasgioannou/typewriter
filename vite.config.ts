import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src/client',
  build: { outDir: '../../public', emptyOutDir: true },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@server': resolve(__dirname, 'src/server'),
      '@client': resolve(__dirname, 'src/client'),
      '@shared': resolve(__dirname, 'src/types'),
      '@ui': resolve(__dirname, 'src/client/components/ui'),
      '@hooks': resolve(__dirname, 'src/client/hooks'),
      '@store': resolve(__dirname, 'src/client/store'),
      '@lib': resolve(__dirname, 'src/client/lib'),
    },
  },
})

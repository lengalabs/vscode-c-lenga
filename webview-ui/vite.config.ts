import { defineConfig } from 'vite'
import { resolve, basename } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    rollupOptions: {
      // multi-entry
      input: {
        graphView: resolve(__dirname, 'src/graphView.html'),
        structuredView: resolve(__dirname, 'src/structuredView.html'),
      },
      output: {
        // each view gets its own folder
        entryFileNames: ({ name }) => `${name}/${name}.js`,
        chunkFileNames: 'shared/[name].js',
        assetFileNames: ({ name }) => {
          if (!name) return 'shared/[name].[ext]'
          // force CSS of each view into its own folder
          if (name.endsWith('.css')) {
            const view = name.includes('graphView') ? 'graphView' : 'structuredView'
            return `${view}/${basename(name)}`
          }
          return 'shared/[name].[ext]'
        },
      },
    },
  },
})

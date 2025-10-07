import { defineConfig, transformWithEsbuild } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { yamlPlugin } from 'esbuild-plugin-yaml'
import babel from 'vite-plugin-babel'
import fs from 'fs-extra'
import react from '@vitejs/plugin-react'
import ViteYaml from '@modyfi/vite-plugin-yaml'

/**
 * Helper function to copy a file based on an env variable.
 * Copy occurs upon startup and each time the file is modified for hot reloading.
 * @param {string} envVar The name of the environment variable that contains the custom file.
 * @param {string|(arg: string) => string} getDestFile The destination file or a function that computes it based on the extracted custom file.
 * @param {string} defaultFile Optional file to fall back on if no custom file is extracted from the environment variable.
 */
function customFile (envVar, getDestFile, defaultFile) {
  const fileName = (process.env && process.env[envVar]) || defaultFile
  if (fileName) {
    const destFile =
      typeof getDestFile === 'function' ? getDestFile(fileName) : getDestFile
    fs.copySync(fileName, destFile)
    // In development mode only, copy the original custom file to tmp whenever it is changed for hot reloading.
    if (process.env.NODE_ENV === 'development') {
      fs.watch(fileName, { recursive: true }, (eventType) => {
        if (eventType === 'change') {
          fs.copySync(fileName, destFile)
        }
      })
    }
  }
}

// Empty tmp folder before copying stuff there.
fs.emptyDirSync('./tmp')
// The YML file is copied with a fixed name, that name is being used for import.
customFile('YAML_CONFIG', './tmp/config.yml')

export default defineConfig({
  build: {
    // Flatten the output for mastarm deploy (mastarm doesn't support uploading subfolders).
    assetsDir: ''
  },
  optimizeDeps: {
    esbuildOptions: {
      // Point JS files to the JSX loader (needed in addition to the JS-JSX conversion plugin below)
      // From https://stackoverflow.com/questions/74620427/how-to-configure-vite-to-allow-jsx-syntax-in-js-files
      loader: {
        '.js': 'jsx'
      },
      plugins: [yamlPlugin()]
    }
  },
  plugins: [
    babel({
      // Taken from https://thinkdrastic.net/journal/2024/01/02/using-flow-types-with-vite-the-hermes-way/
      babelConfig: {
        babelrc: false,
        configFile: false,
        plugins: ['babel-plugin-syntax-hermes-parser'],
        parserOpts: { flow: 'detect' },
        presets: ['@babel/preset-flow']
      }
    }),
    {
      name: 'treat-js-files-as-jsx',
      async transform (code, id) {
        if (!id.match(/(lib|tmp)\/.*\.js$/)) return null

        // Use the exposed transform from Vite, instead of directly transforming with esbuild.
        // This is needed in addition to the esbuild js loader option above.
        // See https://stackoverflow.com/questions/74620427/how-to-configure-vite-to-allow-jsx-syntax-in-js-files
        return transformWithEsbuild(code, id, {
          jsx: 'automatic',
          loader: 'jsx'
        })
      }
    },

    ViteYaml(),
    // Support very old libraries such as blob-stream and its dependencies
    nodePolyfills({
      protocolImports: true
    }),
    react()
  ],
  server: {
    port: 9966,
    proxy: {
      '/api': 'http://localhost:4000'
    },
    strictPort: true
  }
})

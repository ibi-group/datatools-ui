import { defineConfig, transformWithEsbuild } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { safeLoad } from 'js-yaml'
import { yamlPlugin } from 'esbuild-plugin-yaml'
import babel from 'vite-plugin-babel'
import fs from 'fs-extra'
import react from '@vitejs/plugin-react'
import ViteYaml from '@modyfi/vite-plugin-yaml'

/**
 * Reads and rename top-level entries from a YAML file to begin with process.env
 * for replacement throughout the repo by esbuild.
 * @param {string} envVar The name of the environment variable that contains the custom file.
 */
function getProcessEnvEntries (envVar) {
  const fileName = (process.env && process.env[envVar])
  if (fileName) {
    const yaml = safeLoad(fs.readFileSync(fileName))

    // Prefix all entries so that all process.env.* in the code
    // get replaced by esbuild.
    // Everything has to be stringified (they are constants).
    const prefixedYaml = {}
    Object.entries(yaml).forEach(([k, v]) => {
      prefixedYaml[`process.env.${k}`] = JSON.stringify(v)
    })

    return prefixedYaml
  }

  return {}
}

const config = getProcessEnvEntries('YAML_CONFIG')

export default defineConfig({
  build: {
    // Flatten the output for mastarm deploy (mastarm doesn't support uploading subfolders).
    assetsDir: ''
  },
  // Makes esbuild replace config vars (or declare them as globals).
  define: config,
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

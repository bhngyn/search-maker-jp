// Vite config for Arabic Boolean Query Builder.
//
// Output is a single self-contained `dist/index.html` that opens via file://
// with no runtime dependencies, no network calls, and no persistence.
// `vite-plugin-singlefile` inlines every CSS/JS chunk into the HTML.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  root: 'src',
  base: './',
  plugins: [viteSingleFile()],
  define: {
    // Burned-in at build time; bump package.json's "version" to roll forward.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});

import { defineConfig } from 'vite';
import path from 'path';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  base: './',
  plugins: [
    nip5aManifest({
      nappletType: 'demo-chat',
    }),
  ],
  resolve: {
    alias: {
      '@napplet/shim': path.resolve(__dirname, '../../../../packages/shim/src/index.ts'),
      '@napplet/sdk': path.resolve(__dirname, '../../../../packages/sdk/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
  },
});

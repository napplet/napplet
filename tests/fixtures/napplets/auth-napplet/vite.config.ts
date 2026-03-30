import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  base: './',
  plugins: [
    nip5aManifest({
      nappType: 'auth-test',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
  },
});

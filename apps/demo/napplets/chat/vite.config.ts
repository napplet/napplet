import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  base: './',
  plugins: [
    nip5aManifest({
      nappletType: 'demo-chat',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
  },
});

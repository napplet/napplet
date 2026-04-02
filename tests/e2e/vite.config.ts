import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      '@napplet/shell': path.resolve(__dirname, '../../packages/shell/src/index.ts'),
      '@napplet/shim': path.resolve(__dirname, '../../packages/shim/src/index.ts'),
    },
  },
  server: {
    port: 4173,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});

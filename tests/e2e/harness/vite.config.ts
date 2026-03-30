import { defineConfig, type Plugin } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

const nappletFixturesDir = path.resolve(__dirname, '../../fixtures/napplets');

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

function serveNappletFile(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const urlPath = (req.url?.split('?')[0] || '').replace(/^\//, '');
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length < 1) { next(); return; }

  const nappletName = parts[0];
  const filePath = parts.slice(1).join('/') || 'index.html';
  const fullPath = path.join(nappletFixturesDir, nappletName, 'dist', filePath);

  if (fs.existsSync(fullPath)) {
    const ext = path.extname(fullPath);
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    // CORS headers required for sandboxed iframes (origin: null) to load scripts
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    fs.createReadStream(fullPath).pipe(res);
  } else {
    res.statusCode = 404;
    res.end(`Napplet file not found: ${fullPath}`);
  }
}

/**
 * Custom Vite plugin to serve pre-built test napplets at /napplets/{name}/
 */
function serveNapplets(): Plugin {
  return {
    name: 'serve-napplets',
    configureServer(server) {
      server.middlewares.use('/napplets', serveNappletFile);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/napplets', serveNappletFile);
    },
  };
}

export default defineConfig({
  root: __dirname,
  plugins: [serveNapplets()],
  resolve: {
    alias: {
      '@test/helpers': path.resolve(__dirname, '../../helpers'),
    },
  },
  server: {
    port: 4173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});

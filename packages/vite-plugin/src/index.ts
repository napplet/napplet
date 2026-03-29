/**
 * @napplet/vite-plugin — NIP-5A manifest generation plugin for Vite.
 *
 * - transformIndexHtml: injects <meta name="hyprgate-aggregate-hash"> into HTML
 * - closeBundle (build only): walks dist/, computes per-file SHA-256 hashes,
 *   computes aggregate hash, signs a kind 35128 manifest event, writes it to
 *   dist/.nip5a-manifest.json, and updates the meta tag in dist/index.html.
 *
 * Config:
 *   VITE_DEV_PRIVKEY_HEX — hex-encoded 32-byte private key for signing manifests.
 *   If not set, the plugin is a no-op (graceful skip for devs without keys).
 */

import type { Plugin, IndexHtmlTransformResult } from 'vite';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/** Configuration options for the NIP-5A manifest plugin. */
export interface Nip5aManifestOptions {
  /** Napp type/dtag (e.g., 'feed', 'chat') */
  nappType: string;
}

/** Walk a directory recursively and return all file paths (relative to root). */
function walkDir(dir: string, root?: string): string[] {
  root = root ?? dir;
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, root));
    } else {
      results.push(path.relative(root, fullPath));
    }
  }
  return results;
}

/** Compute SHA-256 hash of a file's contents. */
function sha256File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** Compute aggregate hash from [sha256hex, relativePath] pairs. */
function computeAggregateHash(xTags: Array<[string, string]>): string {
  const lines = xTags.map(([hash, p]) => `${hash} ${p}\n`);
  lines.sort();
  const concatenated = lines.join('');
  return crypto.createHash('sha256').update(concatenated).digest('hex');
}

/**
 * Vite plugin for NIP-5A manifest generation.
 *
 * Computes per-file SHA-256 hashes, an aggregate hash, and optionally signs
 * a kind 35128 manifest event at build time. The aggregate hash is injected
 * into index.html via a meta tag for the napplet shim to read at runtime.
 *
 * @param options - Plugin configuration (nappType is required)
 * @returns Vite Plugin instance
 */
export function nip5aManifest(options: Nip5aManifestOptions): Plugin {
  let outDir = 'dist';

  return {
    name: 'vite-plugin-nip5a-manifest',

    configResolved(config) {
      outDir = config.build?.outDir ?? 'dist';
    },

    transformIndexHtml(): IndexHtmlTransformResult {
      // Inject meta tag (empty in dev, populated in closeBundle for build)
      return [
        {
          tag: 'meta',
          attrs: {
            name: 'hyprgate-aggregate-hash',
            content: '',
          },
          injectTo: 'head',
        },
      ];
    },

    async closeBundle() {
      const privkeyHex = process.env.VITE_DEV_PRIVKEY_HEX;
      if (!privkeyHex) {
        console.log('[nip5a-manifest] VITE_DEV_PRIVKEY_HEX not set — skipping manifest generation');
        return;
      }

      const distPath = path.resolve(outDir);
      if (!fs.existsSync(distPath)) {
        console.error(`[nip5a-manifest] dist directory not found: ${distPath}`);
        return;
      }

      // Walk dist/ and compute per-file SHA-256
      const files = walkDir(distPath);
      const xTags: Array<[string, string]> = [];
      for (const relativePath of files) {
        // Skip the manifest file itself if it exists from a previous build
        if (relativePath === '.nip5a-manifest.json') continue;
        const fullPath = path.join(distPath, relativePath);
        const hash = sha256File(fullPath);
        xTags.push([hash, relativePath]);
      }

      // Compute aggregate hash
      const aggregateHash = computeAggregateHash(xTags);

      // Build kind 35128 manifest event (unsigned template)
      const manifest = {
        kind: 35128,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['d', options.nappType],
          ...xTags.map(([hash, p]) => ['x', hash, p]),
        ],
        content: '',
        aggregateHash,
      };

      // Try to sign with nostr-tools if available
      try {
        // Dynamic import to avoid requiring nostr-tools as a build dependency
        const { finalizeEvent, getPublicKey } = await import('nostr-tools/pure');
        const { hexToBytes } = await import('nostr-tools/utils');
        const privkeyBytes = hexToBytes(privkeyHex);
        const pubkey = getPublicKey(privkeyBytes);

        const signedEvent = finalizeEvent({
          kind: 35128,
          created_at: manifest.created_at,
          tags: manifest.tags,
          content: manifest.content,
        }, privkeyBytes);

        // Write signed manifest
        const manifestWithMeta = { ...signedEvent, aggregateHash, pubkey };
        fs.writeFileSync(
          path.join(distPath, '.nip5a-manifest.json'),
          JSON.stringify(manifestWithMeta, null, 2),
        );

        console.log(`[nip5a-manifest] ${options.nappType}: manifest signed by ${pubkey.slice(0, 8)}...`);
      } catch {
        // nostr-tools not available at build time — write unsigned manifest
        fs.writeFileSync(
          path.join(distPath, '.nip5a-manifest.json'),
          JSON.stringify(manifest, null, 2),
        );
        console.log(`[nip5a-manifest] ${options.nappType}: unsigned manifest written (nostr-tools not available at build)`);
      }

      // Update index.html meta tag with aggregate hash
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = html.replace(
          /<meta name="hyprgate-aggregate-hash" content="">/,
          `<meta name="hyprgate-aggregate-hash" content="${aggregateHash}">`,
        );
        fs.writeFileSync(indexPath, html);
        console.log(`[nip5a-manifest] ${options.nappType}: hash ${aggregateHash.slice(0, 12)}... injected into index.html`);
      }
    },
  };
}

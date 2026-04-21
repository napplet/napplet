/**
 * @napplet/vite-plugin — NIP-5A manifest generation plugin for Vite.
 *
 * - transformIndexHtml: injects <meta name="napplet-aggregate-hash"> into HTML
 * - closeBundle (build only): walks dist/, computes per-file SHA-256 hashes,
 *   computes aggregate hash, signs a kind 35128 manifest event, writes it to
 *   dist/.nip5a-manifest.json, and updates the meta tag in dist/index.html.
 *
 * Config:
 *   VITE_DEV_PRIVKEY_HEX — hex-encoded 32-byte private key for signing manifests.
 *   If not set, the plugin is a no-op (graceful skip for devs without keys).
 */

import type { Plugin, IndexHtmlTransformResult } from 'vite';
import type { JSONSchema7 } from 'json-schema';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeConnectOrigin } from '@napplet/nub/connect/types';

/**
 * Synthetic xTag paths — folded into `aggregateHash` but excluded from the
 * `['x', ...]` tag projection on the signed manifest. Each entry is a pseudo
 * path in `<nub>:<kind>` format; the colon prevents collision with real
 * dist-relative file paths on all platforms.
 *
 * Exported for testability and as the single extension point: future synthetic
 * xTags (new NUBs folding bytes into aggregateHash) MUST add their pseudo-path
 * here rather than adding a sibling hardcoded filter. (Mitigates BUILD-P3 drift.)
 */
export const SYNTHETIC_XTAG_PATHS: ReadonlySet<string> = new Set([
  'config:schema',
  'connect:origins',
]);

/** Configuration options for the NIP-5A manifest plugin. */
export interface Nip5aManifestOptions {
  /** Napplet type/dtag identifier (e.g., 'feed', 'chat'). Used as the NIP-5A 'd' tag and injected as napplet-type meta attribute. */
  nappletType: string;
  /** Service dependencies this napplet requires (e.g., ['audio', 'notifications']). Optional. */
  requires?: string[];
  /**
   * Napplet config schema (NUB-CONFIG). Either an inline JSON Schema (draft-07+)
   * object describing the napplet's settings surface, or a string path (relative
   * to the Vite project root) pointing to a JSON file to load.
   *
   * When omitted, the plugin falls back to (in order):
   * 1. `config.schema.json` at the Vite project root (convention file).
   * 2. `napplet.config.ts` / `.js` / `.mjs` exporting a `configSchema` named export.
   *
   * If no schema is found via any of these paths, the plugin emits NO config
   * tag on the NIP-5A manifest and NO `<meta name="napplet-config-schema">` tag
   * in index.html — fully backward compatible with napplets that declare no
   * config surface.
   *
   * Schemas are structurally validated at build time against the NUB-CONFIG
   * Core Subset; root must be `{ type: "object" }`; external `$ref` is forbidden;
   * `pattern` is forbidden (CVE-2025-69873 class / ReDoS); `x-napplet-secret: true`
   * combined with `default` is forbidden. Violating schemas fail the build.
   *
   * @see NUB-CONFIG spec (napplet/nubs#13)
   */
  configSchema?: JSONSchema7 | string;

  /**
   * @deprecated v0.29.0 — the shell is now the sole CSP authority. This option has NO effect
   * and will be hard-removed in v0.30.0 (tracked as REMOVE-STRICTCSP). The plugin emits a
   * one-shot `console.warn` per build when this field is set so existing v0.28.0 consumers
   * discover the deprecation on upgrade without their `vite.config.ts` breaking.
   *
   * Typed as `unknown` to remain assignment-compatible with the removed
   * `boolean | object` shape — any prior value parses cleanly; no branch reads it.
   */
  strictCsp?: unknown;

  /**
   * Direct-network-access origins this napplet intends to reach from the sandbox
   * (NUB-CONNECT). Each entry is an **origin** — scheme + host + optional
   * non-default port — validated against the NUB-CONNECT Origin Format rules
   * and emitted as one `['connect', <origin>]` tag per origin on the signed
   * NIP-5A manifest.
   *
   * **Origin format rules** (delegated to the shared
   * {@link normalizeConnectOrigin} validator from `@napplet/nub/connect/types`):
   * - Scheme MUST be one of `https:` / `wss:` / `http:` / `ws:` (lowercase).
   * - Host MUST be lowercase. Wildcards (`*`) are not permitted.
   * - Default ports MUST be omitted (`:443` on `https:`/`wss:`, `:80` on `http:`/`ws:`).
   * - IDN hosts MUST be Punycode-encoded before emission (`xn--` form, lowercase).
   *   IPv4 literals are accepted; IPv6 literals are out of v1 scope.
   * - Path / query / fragment MUST NOT appear.
   *
   * **Build-time behaviors:**
   * 1. Each origin is normalized through the shared validator in `configResolved`;
   *    violations throw a `[nip5a-manifest]`-prefixed error that chains the
   *    nub's diagnostic so authors see exactly which origin failed and why.
   * 2. Normalized origins are folded into `aggregateHash` via the NUB-CONNECT
   *    canonical fold (lowercase → ASCII-ascending sort → LF-join → UTF-8 →
   *    SHA-256 → lowercase hex) and pushed as the synthetic xTag entry
   *    `[<hash>, 'connect:origins']`. Any origin-list change flips
   *    `aggregateHash`, which auto-invalidates shell grants keyed on
   *    `(dTag, aggregateHash)`.
   * 3. One `['connect', <normalized-origin>]` manifest tag is emitted per
   *    origin in author-declared order, placed between `['x', ...]` tags and
   *    `['config', ...]` tags on the signed event.
   * 4. Cleartext origins (`http:` / `ws:`) trigger an informational
   *    `console.warn` describing browser mixed-content rules. Non-blocking.
   * 5. When Vite is running in dev mode (`vite serve`), an optional
   *    `<meta name="napplet-connect-requires" content="...">` tag is injected
   *    for shell-less local preview. This name is **distinct** from the
   *    shell-authoritative `napplet-connect-granted` meta — the plugin MUST
   *    NEVER emit the `granted` name; the shell is the sole writer per
   *    NUB-CONNECT §Runtime API.
   *
   * When omitted or empty, the plugin emits no `connect` tags, performs no
   * fold, and the napplet is treated as NUB-CLASS-1 (strict / no-user-declared-
   * origins) by conformant shells.
   *
   * @see NUB-CONNECT spec — napplet/nubs#NUB-CONNECT
   */
  connect?: string[];
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
 * Three-path schema discovery. Returns the resolved schema + source name, or
 * null/null when no schema is declared anywhere.
 *
 * Precedence (each step is strict — later steps run only when the earlier
 * step yielded no schema):
 *   1. `options.configSchema` is an object -> use it directly (source: 'inline option').
 *   2. `options.configSchema` is a string -> resolve relative to `root`, read+parse as JSON (source: 'inline option: <path>').
 *   3. `config.schema.json` exists at `root` -> read+parse as JSON (source: 'config.schema.json').
 *   4. `napplet.config.ts` / `.js` / `.mjs` exists at `root` -> dynamic import, read `configSchema` named export (source: 'napplet.config.<ext>').
 *   5. None -> return { schema: null, source: null }.
 *
 * Parse / import / missing-export failures throw with an explanatory message.
 * The "file does not exist" case is NOT an error — it advances to the next path.
 *
 * @param options - Nip5aManifestOptions (reads `configSchema` only).
 * @param root - Absolute Vite project root (from `configResolved(config).root`).
 * @returns Object with resolved schema (or null) and source name (or null).
 * @throws Error with `[nip5a-manifest]` prefix when a present-but-unreadable
 *         path is encountered (JSON parse failure, import failure, missing export).
 */
async function discoverConfigSchema(
  options: Nip5aManifestOptions,
  root: string,
): Promise<{ schema: JSONSchema7 | null; source: string | null }> {
  // Step 1 + 2: inline option
  if (options.configSchema !== undefined) {
    if (typeof options.configSchema === 'object') {
      return { schema: options.configSchema, source: 'inline option' };
    }
    if (typeof options.configSchema === 'string') {
      const p = path.isAbsolute(options.configSchema)
        ? options.configSchema
        : path.resolve(root, options.configSchema);
      if (!fs.existsSync(p)) {
        throw new Error(
          `[nip5a-manifest] configSchema path does not exist: ${p}`,
        );
      }
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        return { schema: JSON.parse(raw) as JSONSchema7, source: `inline option: ${p}` };
      } catch (err) {
        throw new Error(
          `[nip5a-manifest] failed to parse configSchema file ${p}: ${(err as Error).message}`,
        );
      }
    }
  }

  // Step 3: convention file
  const conventionPath = path.resolve(root, 'config.schema.json');
  if (fs.existsSync(conventionPath)) {
    try {
      const raw = fs.readFileSync(conventionPath, 'utf-8');
      return { schema: JSON.parse(raw) as JSONSchema7, source: 'config.schema.json' };
    } catch (err) {
      throw new Error(
        `[nip5a-manifest] failed to parse config.schema.json at ${conventionPath}: ${(err as Error).message}`,
      );
    }
  }

  // Step 4: napplet.config.* dynamic import (ts -> js -> mjs precedence)
  for (const ext of ['ts', 'js', 'mjs'] as const) {
    const cfgPath = path.resolve(root, `napplet.config.${ext}`);
    if (!fs.existsSync(cfgPath)) continue;
    try {
      // Convert to file:// URL for ESM dynamic import on Windows + Linux
      const url = new URL(`file://${cfgPath}`).href;
      const mod = await import(url);
      const schema = (mod.configSchema ?? mod.default?.configSchema) as JSONSchema7 | undefined;
      if (schema === undefined) {
        throw new Error(
          `[nip5a-manifest] napplet.config.${ext} at ${cfgPath} does not export \`configSchema\` (neither as a named export nor on the default export)`,
        );
      }
      return { schema, source: `napplet.config.${ext}` };
    } catch (err) {
      throw new Error(
        `[nip5a-manifest] failed to load napplet.config.${ext} at ${cfgPath}: ${(err as Error).message}`,
      );
    }
  }

  // Step 5: nothing found — silent, backward compatible
  return { schema: null, source: null };
}

/**
 * Structural guard for napplet config schemas at build time.
 *
 * NOT a full JSON Schema validator. Only checks the four rejection rules that
 * MUST fail the build early — full Core Subset enforcement lives in the shell
 * at `config.registerSchema` time. See NUB-CONFIG Schema Contract / Exclusions.
 *
 * Rejection rules:
 * 1. Root MUST be `{ type: "object", ... }`. Anything else -> 'invalid-schema'.
 * 2. `pattern` keyword anywhere in the tree -> 'pattern-not-allowed' (ReDoS,
 *    CVE-2025-69873 class).
 * 3. `$ref` whose value does not start with `#/` anywhere in the tree ->
 *    'ref-not-allowed' (external reference ban; same-document refs are still
 *    forbidden by the spec but are caught by the shell-side Core Subset
 *    enforcer at registerSchema time).
 * 4. Any property node where both `x-napplet-secret: true` and the `default`
 *    key are present -> 'secret-with-default'.
 *
 * Collects every violation; returns them all in one pass so the build log
 * surfaces every problem at once.
 *
 * @param schema - the unvalidated schema loaded from options / config.schema.json / napplet.config.*
 * @returns `{ ok: true }` on pass, `{ ok: false, errors }` on failure (errors is
 *          a string array with one entry per distinct violation discovered).
 */
function validateConfigSchema(
  schema: unknown,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  // Rule 1: root shape
  if (
    schema === null ||
    typeof schema !== 'object' ||
    Array.isArray(schema) ||
    (schema as Record<string, unknown>).type !== 'object'
  ) {
    const got =
      schema === null
        ? 'null'
        : Array.isArray(schema)
          ? 'array'
          : typeof schema === 'object'
            ? `type=${JSON.stringify((schema as Record<string, unknown>).type)}`
            : typeof schema;
    errors.push(
      `invalid-schema: schema root must be { type: "object", ... } (got ${got})`,
    );
    // Do not recurse when root is malformed — nothing meaningful to walk.
    return { ok: false, errors };
  }

  // Rules 2-4: recursive walk
  walk(schema as Record<string, unknown>, '$', errors);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/**
 * Internal: recursively walks a schema node, accumulating rule violations.
 *
 * Recurses into every JSON-Schema child-carrying keyword we care about so the
 * four build-time rejection rules apply at any depth. JSON Schema combinators
 * (`oneOf` / `anyOf` / `allOf` / `not`) and reference containers (`definitions`
 * / `$defs`) are walked — shell-side Core Subset enforcement rejects them
 * outright at `registerSchema` time, but the build-time guard stays narrower
 * and still surfaces nested `pattern` / `$ref` / `secret-with-default`
 * violations through them.
 *
 * @param node   - arbitrary schema sub-tree (may be object, array, or primitive)
 * @param path   - dot-joined JSON-Pointer-ish location used in error messages
 * @param errors - mutable accumulator to which violations are pushed
 */
function walk(node: unknown, path: string, errors: string[]): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walk(node[i], `${path}[${i}]`, errors);
    }
    return;
  }

  const obj = node as Record<string, unknown>;

  // Rule 2: pattern keyword forbidden anywhere.
  if ('pattern' in obj) {
    errors.push(
      `pattern-not-allowed: \`pattern\` keyword found at ${path} — the Core Subset excludes \`pattern\` due to ReDoS risk (CVE-2025-69873 class). Use \`enum\`, \`minLength\`, or \`maxLength\` for constrained strings.`,
    );
  }

  // Rule 3: external $ref forbidden.
  if ('$ref' in obj) {
    const ref = obj.$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) {
      errors.push(
        `ref-not-allowed: \`$ref\` at ${path} must start with \`#/\` (got ${JSON.stringify(ref)}). External $ref is forbidden per NUB-CONFIG Security Considerations.`,
      );
    }
  }

  // Rule 4: x-napplet-secret:true + default coexistence forbidden.
  if (obj['x-napplet-secret'] === true && 'default' in obj) {
    errors.push(
      `secret-with-default: property at ${path} declares both \`x-napplet-secret: true\` and a \`default\` value. A secret with a hardcoded default is not a secret.`,
    );
  }

  // Recurse into child schemas. JSON Schema child-carrying keys we care about:
  //   properties          — map of name -> schema
  //   items               — schema OR array of schemas (tuple form, walked too)
  //   additionalProperties — schema or boolean (schema form walked)
  //   patternProperties   — map (child schemas walked; a `pattern` inside any
  //                         child is still caught by rule 2)
  //   oneOf / anyOf / allOf — arrays of schemas (walked)
  //   not                 — schema (walked)
  //   definitions / $defs — maps of name -> schema (walked)
  if (
    typeof obj.properties === 'object' &&
    obj.properties !== null &&
    !Array.isArray(obj.properties)
  ) {
    for (const [key, child] of Object.entries(obj.properties as Record<string, unknown>)) {
      walk(child, `${path}.properties.${key}`, errors);
    }
  }
  if ('items' in obj) {
    walk(obj.items, `${path}.items`, errors);
  }
  if ('additionalProperties' in obj && typeof obj.additionalProperties === 'object') {
    walk(obj.additionalProperties, `${path}.additionalProperties`, errors);
  }
  if (
    typeof obj.patternProperties === 'object' &&
    obj.patternProperties !== null &&
    !Array.isArray(obj.patternProperties)
  ) {
    for (const [key, child] of Object.entries(
      obj.patternProperties as Record<string, unknown>,
    )) {
      walk(child, `${path}.patternProperties.${key}`, errors);
    }
  }
  for (const combiner of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (Array.isArray(obj[combiner])) {
      (obj[combiner] as unknown[]).forEach((child, i) =>
        walk(child, `${path}.${combiner}[${i}]`, errors),
      );
    }
  }
  if ('not' in obj) walk(obj.not, `${path}.not`, errors);
  for (const defs of ['definitions', '$defs'] as const) {
    if (
      typeof obj[defs] === 'object' &&
      obj[defs] !== null &&
      !Array.isArray(obj[defs])
    ) {
      for (const [key, child] of Object.entries(obj[defs] as Record<string, unknown>)) {
        walk(child, `${path}.${defs}.${key}`, errors);
      }
    }
  }
}

/**
 * Vite plugin for NIP-5A manifest generation.
 *
 * Computes per-file SHA-256 hashes, an aggregate hash, and optionally signs
 * a kind 35128 manifest event at build time. The aggregate hash is injected
 * into index.html via a meta tag for the napplet shim to read at runtime.
 *
 * @param options - Plugin configuration (nappletType is required)
 * @returns Vite Plugin instance
 */
export function nip5aManifest(options: Nip5aManifestOptions): Plugin {
  let outDir = 'dist';
  let projectRoot: string = process.cwd();
  let resolvedSchema: JSONSchema7 | null = null;
  let resolvedSchemaSource: string | null = null;
  let normalizedConnect: string[] = [];

  return {
    name: 'vite-plugin-nip5a-manifest',

    async configResolved(config) {
      outDir = config.build?.outDir ?? 'dist';
      projectRoot = config.root;
      const result = await discoverConfigSchema(options, projectRoot);
      resolvedSchema = result.schema;
      resolvedSchemaSource = result.source;
      if (resolvedSchema !== null) {
        // Structural guard: four NUB-CONFIG rejection rules must pass before
        // any downstream consumer (manifest tag in closeBundle, meta injection
        // in transformIndexHtml) sees the schema. Malformed schemas abort the
        // build — they MUST NOT silently propagate to the shell as runtime
        // `config.schemaError` pushes when the error is structurally
        // detectable at build time.
        const validation = validateConfigSchema(resolvedSchema);
        if (!validation.ok) {
          const header = `[nip5a-manifest] configSchema validation failed (source: ${resolvedSchemaSource ?? 'unknown'})`;
          const body = validation.errors.map((e) => `  - ${e}`).join('\n');
          throw new Error(`${header}\n${body}`);
        }
        console.log(
          `[nip5a-manifest] ${options.nappletType}: config schema discovered via ${resolvedSchemaSource} — validated`,
        );
      }

      // v0.29.0 deprecation shim: `strictCsp` option is @deprecated and has no effect.
      // Shell is now the sole CSP authority. Warn once per build so upgrading consumers
      // discover the deprecation without their v0.28.0 vite.config.ts breaking on type-check
      // or build. Hard removal tracked as REMOVE-STRICTCSP in REQUIREMENTS.md for v0.30.0.
      // configResolved is called exactly once per plugin invocation by Vite, so this
      // is effectively once-per-build with no external guard variable needed.
      if (options.strictCsp !== undefined) {
        console.warn(
          '[nip5a-manifest] strictCsp is deprecated in v0.29.0 and has no effect — the shell is now the sole CSP authority. Remove this option from your vite.config.ts. See v0.29.0 changelog for migration. (REMOVE-STRICTCSP tracks hard removal in v0.30.0.)',
        );
      }

      // VITE-03 / VITE-04 / VITE-09: NUB-CONNECT origin declaration.
      //
      // Validate each origin through the shared `normalizeConnectOrigin()` from
      // `@napplet/nub/connect/types` — this is the single source of truth used
      // on BOTH the build side (here) and the shell side (at manifest-load
      // time) per NUB-CONNECT §Origin Format. Chaining the nub's diagnostic
      // into a `[nip5a-manifest]`-prefixed error keeps the plugin's namespace
      // visible to authors while preserving the specific reason.
      //
      // Cleartext origins (http:/ws:) are legal for localhost dev but warrant
      // an informational warning because browser mixed-content rules silently
      // block them from HTTPS shells unless they're localhost/127.0.0.1 (the
      // secure-context exception). Non-blocking per RUNTIME-P2 mitigation.
      if (options.connect !== undefined) {
        if (!Array.isArray(options.connect)) {
          throw new Error(
            '[nip5a-manifest] connect option must be an array of origin strings',
          );
        }
        const normalized: string[] = [];
        for (const origin of options.connect) {
          try {
            normalized.push(normalizeConnectOrigin(origin));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`[nip5a-manifest] invalid connect origin: ${msg}`);
          }
        }
        normalizedConnect = normalized;

        const cleartext = normalizedConnect.filter(
          (o) => o.startsWith('http://') || o.startsWith('ws://'),
        );
        if (cleartext.length > 0) {
          console.warn(
            `[@napplet/vite-plugin] connect includes cleartext origin(s): ${cleartext.join(', ')} — browser mixed-content rules will silently block http:/ws: fetches from HTTPS shells unless the origin is http://localhost or http://127.0.0.1. Some shells refuse cleartext entirely (check \`shell.supports('connect:scheme:http')\`). See NUB-CONNECT for details.`,
          );
        }
      }
    },

    transformIndexHtml(_html: string, _ctx?: unknown): IndexHtmlTransformResult {
      const tags: IndexHtmlTransformResult = [];

      // Existing meta tags — preserve byte-identical output for backward
      // compat with pre-v0.29.0 consumers (minus the now-removed CSP meta).
      tags.push({
        tag: 'meta',
        attrs: { name: 'napplet-aggregate-hash', content: '' },
        injectTo: 'head' as const,
      });
      tags.push({
        tag: 'meta',
        attrs: { name: 'napplet-type', content: options.nappletType },
        injectTo: 'head' as const,
      });

      if (options.requires && options.requires.length > 0) {
        tags.push({
          tag: 'meta',
          attrs: { name: 'napplet-requires', content: options.requires.join(',') },
          injectTo: 'head' as const,
        });
      }

      if (resolvedSchema !== null) {
        tags.push({
          tag: 'meta',
          attrs: { name: 'napplet-config-schema', content: JSON.stringify(resolvedSchema) },
          injectTo: 'head' as const,
        });
      }

      return tags;
    },

    async closeBundle() {
      const distPath = path.resolve(outDir);

      const privkeyHex = process.env.VITE_DEV_PRIVKEY_HEX;
      if (!privkeyHex) {
        console.log('[nip5a-manifest] VITE_DEV_PRIVKEY_HEX not set — skipping manifest generation');
        return;
      }

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

      // NUB-CONFIG: include the config schema bytes in aggregateHash via a
      // synthetic path. The colon in 'config:schema' ensures no collision with
      // any real file path (dist/-relative paths use platform separators, not
      // colons). Any schema change flips the schema-bytes sha and therefore
      // flips aggregateHash — which in turn re-scopes the napplet's storage
      // per NIP-5D (dTag, aggregateHash) keying. Schemas thus implicitly
      // version their own storage without requiring `$version` cooperation.
      // The synthetic entry is excluded from the manifest's ['x', ...] tag
      // projection below so only real files surface as x-tags.
      if (resolvedSchema !== null) {
        const schemaHash = crypto.createHash('sha256').update(JSON.stringify(resolvedSchema)).digest('hex');
        xTags.push([schemaHash, 'config:schema']);
      }

      // Compute aggregate hash (includes synthetic config:schema entry when
      // a schema is declared)
      const aggregateHash = computeAggregateHash(xTags);

      // Build requires tags from plugin options
      const requiresTags = (options.requires ?? []).map((name) => ['requires', name]);

      // Filter synthetic xTag entries out of the ['x', ...] tag projection —
      // these entries participate in aggregateHash but are NOT real dist/
      // files, so emitting them as x-tags would leak misleading file-hash
      // records. Synthetic paths live in SYNTHETIC_XTAG_PATHS (module scope)
      // so adding a new NUB fold doesn't require patching the filter twice.
      // (VITE-07 / BUILD-P3 mitigation.)
      //
      // Each synthetic entry surfaces on the manifest via its own dedicated
      // tag: `config:schema` → `['config', ...]`, `connect:origins` →
      // `['connect', ...]` (one per origin).
      const manifestXTags = xTags
        .filter(([, p]) => !SYNTHETIC_XTAG_PATHS.has(p))
        .map(([hash, p]) => ['x', hash, p]);

      // NUB-CONFIG: dedicated ['config', JSON.stringify(schema)] manifest tag.
      // Placed between x-tags and requires-tags per phase 114 context
      // decisions block. Only emitted when a schema is declared — napplets
      // without a config surface produce a manifest byte-identical to the
      // pre-phase-114 shape.
      const configTags: string[][] =
        resolvedSchema !== null ? [['config', JSON.stringify(resolvedSchema)]] : [];

      // Build kind 35128 manifest event (unsigned template)
      const manifest = {
        kind: 35128,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['d', options.nappletType],
          ...manifestXTags,
          ...configTags,
          ...requiresTags,
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

        console.log(`[nip5a-manifest] ${options.nappletType}: manifest signed by ${pubkey.slice(0, 8)}...`);
      } catch {
        // nostr-tools not available at build time — write unsigned manifest
        fs.writeFileSync(
          path.join(distPath, '.nip5a-manifest.json'),
          JSON.stringify(manifest, null, 2),
        );
        console.log(`[nip5a-manifest] ${options.nappletType}: unsigned manifest written (nostr-tools not available at build)`);
      }

      // Update index.html meta tag with aggregate hash
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = html.replace(
          /<meta name="napplet-aggregate-hash" content="">/,
          `<meta name="napplet-aggregate-hash" content="${aggregateHash}">`,
        );
        fs.writeFileSync(indexPath, html);
        console.log(`[nip5a-manifest] ${options.nappletType}: hash ${aggregateHash.slice(0, 12)}... injected into index.html`);
      }

      if (requiresTags.length > 0) {
        console.log(`[nip5a-manifest] ${options.nappletType}: requires [${(options.requires ?? []).join(', ')}]`);
      }
    },
  };
}

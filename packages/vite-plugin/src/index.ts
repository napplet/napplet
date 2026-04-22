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
import {
  buildBaselineCsp,
  validateStrictCspOptions,
  assertNoDevLeakage,
  assertMetaIsFirstHeadChild,
  type StrictCspOptions,
} from './csp.js';

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
   * Strict CSP enforcement (CSP-01). When `true`, emits a 10-directive baseline
   * policy via `<meta http-equiv="Content-Security-Policy">` injected as the
   * LITERAL first child of `<head>`. When set to a `StrictCspOptions` object,
   * allows per-directive source-expression appends to the baseline (extend, not
   * relax).
   *
   * Baseline (production): default-src 'none'; script-src 'nonce-...' 'self';
   * connect-src 'none'; img-src blob: data:; font-src blob: data:; style-src 'self';
   * worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'.
   *
   * Dev mode (Vite serve): connect-src is relaxed to
   * `'self' ws://localhost:* wss://localhost:*` for HMR. Build-time assertion
   * guarantees the dev relaxation never appears in the production manifest
   * (Pitfall 18 mitigation).
   *
   * Build FAILS if:
   * - Any `<script>`, `<style>`, or `<link>` element precedes the CSP meta in
   *   `<head>` (Pitfall 1 — meta CSP only binds elements parsed AFTER it)
   * - User-supplied options include header-only directives (`frame-ancestors`,
   *   `sandbox`, `report-uri`, `report-to`) — silently ignored by browsers in
   *   meta delivery per W3C CSP3 §4.2 (Pitfall 2)
   * - `script-src` contains `'unsafe-inline'` or `'unsafe-eval'` (Pitfall 19)
   *
   * Pairs with shells advertising `shell.supports('perm:strict-csp')` (CAP-03).
   * The capability identifier is shell-side; this option is napplet-author-side.
   * Setting this option does NOT itself negotiate the capability — it only
   * ensures the napplet ships with a policy the browser will enforce when the
   * shell honors it.
   *
   * @see NUB-RESOURCE spec (forthcoming napplet/nubs PR — Phase 132)
   * @see NIP-5D §Security Considerations (forthcoming — Phase 131)
   */
  strictCsp?: boolean | StrictCspOptions;
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

  // Strict CSP runtime state (CSP-01..07). When `options.strictCsp` is undefined
  // or false, all CSP-related code paths are inert and the plugin's HTML output
  // is byte-identical to pre-phase-130 — back-compat for napplets not opting in.
  let cspNonce: string | null = null;
  let cspMode: 'dev' | 'prod' = 'prod';
  let strictCspOptions: StrictCspOptions | undefined = undefined;
  const strictCspEnabled = options.strictCsp !== undefined && options.strictCsp !== false;

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

      // CSP-04 / CSP-07 — fail-fast validation of user-supplied StrictCspOptions.
      // Runs in configResolved (earliest hook with full config) so the build
      // aborts before any HTML emission if the user supplied an invalid policy
      // override.
      if (strictCspEnabled) {
        strictCspOptions = typeof options.strictCsp === 'object' ? options.strictCsp : {};
        validateStrictCspOptions(strictCspOptions); // throws on header-only or unsafe-*
        cspMode = config.command === 'serve' ? 'dev' : 'prod';
        // Generate fresh nonce per build. crypto.randomBytes(16).toString('base64url')
        // yields 128 bits of entropy (>= W3C CSP3 § Nonce-source minimum). Use
        // the explicit override if provided (StrictCspOptions.nonce — for tests
        // / reproducible builds).
        cspNonce = strictCspOptions.nonce ?? crypto.randomBytes(16).toString('base64url');
        console.log(`[nip5a-manifest] ${options.nappletType}: strict CSP enabled (mode: ${cspMode})`);
      }
    },

    transformIndexHtml: {
      order: 'pre' as const, // Pitfall 1: run BEFORE Vite's HMR client injection
      handler(_html: string, ctx: { server?: unknown }): IndexHtmlTransformResult {
        // dev vs prod fallback — configResolved already set cspMode, but
        // ctx.server is the authoritative runtime signal (test harnesses may
        // not call configResolved).
        const isDev = !!ctx.server;
        const tags: IndexHtmlTransformResult = [];

        // CSP META — MUST be first head child (Pitfall 1 / CSP-02).
        // injectTo: 'head-prepend' ensures Vite places this BEFORE any other
        // plugin's head injections, AND combined with order: 'pre' on the hook
        // itself ensures THIS plugin's head-prepend runs before Vite's own HMR
        // client head-prepend. closeBundle does the post-build assert.
        if (strictCspEnabled && cspNonce) {
          const policyValue = buildBaselineCsp(isDev ? 'dev' : 'prod', cspNonce, strictCspOptions);
          tags.push({
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: policyValue,
            },
            injectTo: 'head-prepend' as const, // FIRST in head
          });
        }

        // Existing meta tags — preserve byte-identical output for backward
        // compat. These remain injectTo: 'head' (append, not prepend) so they
        // land AFTER the CSP meta. The CSP meta MUST be first; everything else
        // is fine after.
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
    },

    async closeBundle() {
      const distPath = path.resolve(outDir);

      // CSP-03 / Pitfall 1 — post-build assertion that the CSP meta is the
      // literal first child of <head>. Runs BEFORE the manifest-signing branch
      // (which gates on VITE_DEV_PRIVKEY_HEX) because strict CSP enforcement
      // is independent of manifest signing — a napplet author may opt into
      // strict CSP without configuring a manifest privkey, and the build-time
      // gates MUST still fire. The transformIndexHtml hook with `order: 'pre'`
      // + `injectTo: 'head-prepend'` SHOULD have placed the meta correctly,
      // but we MUST verify on disk because plugin-order interactions with
      // other plugins are not contractually guaranteed by Vite. This is the
      // load-bearing build-time gate: if any other plugin sneaks something in
      // before our CSP meta, the browser would silently parse-and-execute the
      // early element WITHOUT the policy in force (project-killer per
      // Pitfall 1).
      const indexPathForCsp = path.join(distPath, 'index.html');
      if (strictCspEnabled && fs.existsSync(indexPathForCsp)) {
        const finalHtml = fs.readFileSync(indexPathForCsp, 'utf-8');
        assertMetaIsFirstHeadChild(finalHtml); // throws on Pitfall 1 violation
        // CSP-05 / Pitfall 18 — production manifest MUST NOT contain ws:// or
        // wss:// anywhere in the CSP. Extract the policy from the meta tag
        // and check. The content attribute is double-quoted (Vite-emitted)
        // and itself contains single quotes (e.g. 'none', 'self'), so the
        // capture group accepts any non-double-quote character — using
        // [^"'] would truncate at the first single quote and miss ws:// in
        // the tail (Rule 1 bug fix found via Phase 130 smoke test Case 3).
        const cspMatch = /<meta\s+http-equiv\s*=\s*"Content-Security-Policy"\s+content\s*=\s*"([^"]+)"/i.exec(finalHtml);
        if (cspMatch) {
          assertNoDevLeakage(cspMatch[1], cspMode); // throws if prod policy contains ws://
        }
        console.log(`[nip5a-manifest] ${options.nappletType}: strict CSP verified (meta-first + no-dev-leak)`);
      }

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

      // Filter the synthetic config:schema entry out of the ['x', ...] tag
      // projection — the schema participates in aggregateHash but is NOT a
      // real dist/ file, so emitting it as an x-tag would leak a misleading
      // file-hash record. The schema is instead surfaced via its dedicated
      // ['config', ...] tag below.
      const manifestXTags = xTags
        .filter(([, p]) => p !== 'config:schema')
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

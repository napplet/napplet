/**
 * @napplet/vite-plugin — strict CSP builder for napplet HTML.
 *
 * Centralizes the four project-killer mitigations for browser-enforced isolation:
 *
 * - 10-directive baseline (CSP-06): default-src 'none'; script-src 'nonce-...' 'self';
 *   connect-src ...; img-src blob: data:; font-src blob: data:; style-src 'self';
 *   worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'.
 * - Header-only directive rejection (CSP-04 / Pitfall 2): frame-ancestors, sandbox,
 *   report-uri, report-to are silently ignored when delivered via <meta http-equiv>
 *   per W3C CSP3 §4.2 — reject at build time so authors don't ship policies that
 *   look enforced but are not.
 * - Dev/prod connect-src split (CSP-05 / Pitfall 18): dev mode allows ws://localhost:*
 *   wss://localhost:* for Vite HMR; production builds emit connect-src 'none'.
 *   Build-time assertion guarantees dev relaxation never leaks into prod manifest.
 * - Nonce-based script-src (CSP-07 / Pitfall 19): never 'unsafe-inline', never
 *   'unsafe-eval' — strict CSP MUST use nonce-source for any inline script.
 * - Meta-must-be-first-head-child (CSP-03 / Pitfall 1): a CSP delivered via
 *   <meta http-equiv> only binds elements parsed AFTER it; if any <script>,
 *   <style>, or <link> precedes the CSP meta, those elements run unenforced.
 *
 * CAP-03: When the napplet runs in a shell that advertises shell.supports('perm:strict-csp'),
 * the policy emitted by this module is enforced by the browser and the shell's
 * advertisement is honest. The capability identifier is shell-side; this module is
 * napplet-author-side.
 *
 * Zero runtime dependencies — hand-rolled regex parser and string builder. Per
 * STACK.md "What NOT to Use", htmlparser2/parse5/csp-typed-directives are NOT
 * needed for a 10-directive deterministic grammar with a 4-element reject list.
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Directives that browsers SILENTLY IGNORE when delivered via <meta http-equiv>
 * per W3C CSP3 §4.2 — they only take effect via HTTP response header. Reject at
 * build time per Pitfall 2 (project-killer): an author who ships a meta CSP with
 * frame-ancestors thinks the page is protected against framing, but the browser
 * never enforces it.
 */
export const HEADER_ONLY_DIRECTIVES: readonly string[] = [
  'frame-ancestors',
  'sandbox',
  'report-uri',
  'report-to',
] as const;

/**
 * Canonical 10-directive ordering (CSP-06). The output of buildBaselineCsp emits
 * directives in exactly this order so byte-comparison of the policy string is
 * deterministic across builds with the same nonce.
 */
export const BASELINE_DIRECTIVE_ORDER: readonly string[] = [
  'default-src',
  'script-src',
  'connect-src',
  'img-src',
  'font-src',
  'style-src',
  'worker-src',
  'object-src',
  'base-uri',
  'form-action',
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Per-build configuration for strict CSP emission.
 *
 * When the napplet runs in a shell that advertises shell.supports('perm:strict-csp'),
 * this module's emitted policy is enforced by the browser and the shell's
 * advertisement is honest. The capability identifier is shell-side; this type is
 * napplet-author-side. (CAP-03)
 */
export interface StrictCspOptions {
  /**
   * Per-directive overrides. Values are arrays of source expressions APPENDED to
   * the baseline value for that directive (extend, not replace). To keep the
   * baseline value untouched, omit the directive.
   *
   * Example:
   *   { directives: { 'connect-src': ['https://api.example.com'] } }
   * Yields connect-src 'self' ws://localhost:* wss://localhost:* https://api.example.com
   * in dev mode and connect-src 'none' https://api.example.com in prod (which is
   * invalid CSP — 'none' must appear alone — and the browser will reject it; the
   * append-only contract intentionally surfaces this as user error rather than
   * silently dropping the baseline).
   *
   * Header-only directives (frame-ancestors, sandbox, report-uri, report-to) are
   * REJECTED at build time per CSP-04 / Pitfall 2.
   *
   * 'unsafe-inline' and 'unsafe-eval' are REJECTED at build time when added to
   * script-src per CSP-07 / Pitfall 19.
   */
  directives?: Partial<Record<typeof BASELINE_DIRECTIVE_ORDER[number], string[]>>;

  /**
   * Optional explicit nonce — for tests / reproducible builds. When omitted, the
   * plugin generates a fresh cryptographic nonce per build (32+ bits of entropy).
   */
  nonce?: string;
}

// ─── Builder ───────────────────────────────────────────────────────────────────

/**
 * Build the canonical CSP string for the given mode, nonce, and optional overrides.
 *
 * Returns a single-line CSP value (directives joined with `; `, no trailing
 * semicolon) suitable for the `content` attribute of <meta http-equiv>.
 *
 * Mode-aware behavior (CSP-05 / Pitfall 18):
 * - 'prod': connect-src 'none'
 * - 'dev':  connect-src 'self' ws://localhost:* wss://localhost:* (for Vite HMR)
 *
 * script-src is ALWAYS `'nonce-{nonce}' 'self'` baseline — never 'unsafe-inline',
 * never 'unsafe-eval' (CSP-07 / Pitfall 19).
 *
 * @param mode - 'dev' (Vite serve) or 'prod' (Vite build)
 * @param nonce - Per-build cryptographic nonce (caller-supplied)
 * @param options - Optional StrictCspOptions for per-directive appends
 * @returns Single-line CSP string ready for meta `content` attribute
 *
 * @example
 *   buildBaselineCsp('prod', 'abc123');
 *   // => "default-src 'none'; script-src 'nonce-abc123' 'self'; connect-src 'none'; ..."
 */
export function buildBaselineCsp(
  mode: 'dev' | 'prod',
  nonce: string,
  options?: StrictCspOptions,
): string {
  // Per-directive baseline values — exact strings locked in CONTEXT.md decisions block.
  const baseline: Record<typeof BASELINE_DIRECTIVE_ORDER[number], string> = {
    'default-src': "'none'",
    'script-src': `'nonce-${nonce}' 'self'`,
    'connect-src': mode === 'dev' ? "'self' ws://localhost:* wss://localhost:*" : "'none'",
    'img-src': 'blob: data:',
    'font-src': 'blob: data:',
    'style-src': "'self'",
    'worker-src': "'none'",
    'object-src': "'none'",
    'base-uri': "'none'",
    'form-action': "'none'",
  };

  const overrides = options?.directives ?? {};
  const parts: string[] = [];

  for (const directive of BASELINE_DIRECTIVE_ORDER) {
    const baseValue = baseline[directive];
    const appendValues = overrides[directive];
    const value =
      appendValues && appendValues.length > 0
        ? `${baseValue} ${appendValues.join(' ')}`
        : baseValue;
    parts.push(`${directive} ${value}`);
  }

  return parts.join('; ');
}

// ─── Validators ────────────────────────────────────────────────────────────────

/**
 * Validate user-supplied StrictCspOptions, throwing on the project-killer conditions.
 *
 * Rejects (each independently — first violation throws with a single-failure
 * diagnostic so the author sees one clear problem at a time):
 *
 * - Any header-only directive (frame-ancestors, sandbox, report-uri, report-to)
 *   in `directives` — CSP-04 / Pitfall 2.
 * - 'unsafe-inline' or 'unsafe-eval' tokens in `directives['script-src']` —
 *   CSP-07 / Pitfall 19.
 *
 * @param opts - StrictCspOptions to validate (or undefined for no-op)
 * @throws Error with `[nip5a-manifest]` prefix on first violation
 */
export function validateStrictCspOptions(opts: StrictCspOptions | undefined): void {
  if (opts === undefined || opts.directives === undefined) return;

  for (const name of Object.keys(opts.directives)) {
    // CSP-04 / Pitfall 2: header-only directives silently ignored in meta delivery.
    if (HEADER_ONLY_DIRECTIVES.includes(name)) {
      throw new Error(
        `[nip5a-manifest] header-only directive "${name}" not allowed in meta CSP — per W3C CSP3 §4.2 this directive is silently ignored when delivered via <meta http-equiv>. Deliver via HTTP response header instead, or remove it.`,
      );
    }

    // CSP-07 / Pitfall 19: unsafe-* in script-src defeats nonce-based strict CSP.
    if (name === 'script-src') {
      const sources = (opts.directives as Record<string, string[]>)[name] ?? [];
      for (const src of sources) {
        if (src === "'unsafe-inline'" || src === "'unsafe-eval'") {
          throw new Error(
            `[nip5a-manifest] ${src} is forbidden in script-src — strict CSP MUST use nonce-based script-src per Pitfall 19. Remove the unsafe-* token.`,
          );
        }
      }
    }
  }
}

/**
 * Assert that a production-mode emitted CSP does NOT contain dev-only ws:// or
 * wss:// HMR relaxations (CSP-05 / Pitfall 18 — project-killer).
 *
 * The dev/prod split is the load-bearing isolation guarantee: developers who
 * test napplets locally with HMR must NEVER ship a manifest where the same
 * relaxation is present, because that would let the napplet open arbitrary
 * websocket connections in production.
 *
 * @param emittedPolicy - The CSP value (without `Content-Security-Policy:` prefix)
 * @param mode - 'dev' (no-op) or 'prod' (asserts)
 * @throws Error with `[nip5a-manifest]` prefix when ws:// or wss:// found in prod
 */
export function assertNoDevLeakage(emittedPolicy: string, mode: 'dev' | 'prod'): void {
  if (mode === 'dev') return;
  if (/\b(?:ws|wss):\/\//i.test(emittedPolicy)) {
    throw new Error(
      `[nip5a-manifest] dev relaxation leaked to production: emitted CSP contains ws:// or wss:// — production builds MUST emit connect-src 'none' per CSP-05. Check StrictCspOptions.directives['connect-src'] for accidental dev tokens.`,
    );
  }
}

/**
 * Assert that the <meta http-equiv="Content-Security-Policy"> element is the
 * literal first child of <head> (after an optional <meta charset>). This is the
 * CSP-03 / Pitfall 1 project-killer guard.
 *
 * Per W3C HTML spec, a CSP delivered via <meta> only binds elements parsed AFTER
 * it. If any <script>, <style>, or <link> precedes the CSP meta, those elements
 * execute or load WITHOUT the policy in force — the napplet thinks it is
 * sandboxed but is not.
 *
 * Walks the HTML with hand-rolled regex (no DOM parser dep) — the <head> opening
 * tag is located, leading whitespace and an optional <meta charset> element are
 * skipped, and the first remaining element MUST be the CSP meta.
 *
 * @param html - Final HTML string to assert (typically from dist/index.html)
 * @throws Error with `[nip5a-manifest]` prefix when first head child is not CSP meta
 */
export function assertMetaIsFirstHeadChild(html: string): void {
  const headOpenMatch = /<head[^>]*>/i.exec(html);
  if (!headOpenMatch) return; // No <head> = nothing to assert (defensive — SPA builds always have one)

  const headEndIdx = html.indexOf('</head>');
  if (headEndIdx === -1) return; // Malformed — defer to other validators

  const headInner = html.slice(headOpenMatch.index + headOpenMatch[0].length, headEndIdx);

  // Strip leading whitespace, then strip an optional <meta charset=...> (only
  // <meta charset> may legitimately precede CSP per CONTEXT.md "Discretion to
  // executor: whether <meta charset> is permitted to precede" — answer: YES).
  let stripped = headInner.replace(/^\s+/, '');
  const charsetMatch = /^<meta\s+charset\s*=\s*["']?[^"'>]+["']?\s*\/?\s*>/i.exec(stripped);
  if (charsetMatch) {
    stripped = stripped.slice(charsetMatch[0].length).replace(/^\s+/, '');
  }

  // Match the first element after stripping whitespace + charset.
  const firstElMatch = /<([a-z][a-z0-9-]*)([^>]*)>/i.exec(stripped);
  if (!firstElMatch) return; // Empty <head> — nothing to assert

  const tagName = firstElMatch[1].toLowerCase();
  const isCspMeta =
    tagName === 'meta' &&
    /http-equiv\s*=\s*["']?Content-Security-Policy["']?/i.test(firstElMatch[0]);

  if (!isCspMeta) {
    throw new Error(
      `[nip5a-manifest] CSP meta must be first <head> child (after optional <meta charset>); found <${tagName}> first. Per Pitfall 1: meta CSP only binds elements parsed AFTER it. Move the <meta http-equiv="Content-Security-Policy"> to position 1 in <head>.`,
    );
  }
}

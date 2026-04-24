# Phase 138: `@napplet/vite-plugin` Surgery - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Smart discuss — 1 grey area (4 questions) resolved with user

<domain>
## Phase Boundary

Large subtractive + additive surgery on `@napplet/vite-plugin`. Removes ~250 LOC of v0.28.0 strict-CSP production machinery; adds ~80 LOC for the new `connect?: string[]` option (origin normalization, aggregateHash fold, manifest tag emission), a fail-loud inline-script diagnostic, and a synthetic-xTag-path registry. NO vite-plugin changes required for NUB-CLASS — class is shell-determined at runtime, not build-declared.

**In scope:**
- `packages/vite-plugin/src/index.ts` — surgery targets (line numbers approximate, may shift as edits land):
  - Remove imports from `./csp.js` (lines ~20-25)
  - Remove `strictCsp?: boolean | StrictCspOptions` field from `Nip5aManifestOptions` (line ~89) and add `@deprecated` accept-but-warn path
  - Remove CSP runtime state variables (lines ~390-396, ~429-439)
  - Remove CSP meta injection in `transformIndexHtml` (lines ~456-466)
  - Remove `closeBundle` CSP assertions (lines ~519-535)
  - Add `connect?: string[]` option on `Nip5aManifestOptions`
  - Add `normalizeConnectOrigins()` call in `configResolved()` — imports `normalizeConnectOrigin` from `@napplet/nub/connect/types` (shared source of truth from Phase 137)
  - Add inline-script diagnostic in `closeBundle`
  - Add aggregateHash fold for connect origins (sort → `\n`-join → SHA-256 → `[hash, 'connect:origins']` pushed into xTags)
  - Extract synthetic xTag filter into `SYNTHETIC_XTAG_PATHS` set/constant (currently a hardcoded `p !== 'config:schema'` check at line ~586; extend to cover `connect:origins`)
  - Add `['connect', origin]` manifest tags emission (one per origin, placed between manifestXTags and configTags)
- `packages/vite-plugin/src/csp.ts` — **DELETE entirely**. No dev-only retention. Clean break.

**Out of scope:**
- NUB-CLASS support in vite-plugin (class is runtime-shell-determined, not build-declared)
- Central shim/SDK integration (Phase 139)
- Shell-deployer policy docs (Phase 140)

</domain>

<decisions>
## Implementation Decisions

### Grey Area 1/1: vite-plugin Surgery Decisions — RESOLVED

- **Q1 Inline-script detection strategy:** Zero-dep regex. Matches existing `csp.ts:244` `assertMetaIsFirstHeadChild` ethos (hand-rolled regex for DOM-shape scans). Add a new function to vite-plugin (likely `assertNoInlineScripts(html: string): void`) that uses a regex to detect `<script>` elements without a `src` attribute in `dist/index.html`. Edge cases documented: comments (`<!-- ... -->`), CDATA, `<script type="importmap">` (treat as inline — rejected same way), script with empty `src=""` (reject — treat as inline), `<script nomodule src="...">` (accept — has src), `<script async defer src="...">` (accept). Regex approach: positive pattern match `<script(?:\s[^>]*?)?(?!\s+src=|.*?\ssrc=)[^>]*>` or equivalent; confirm via test fixtures with edge-case HTML snippets.
- **Q2 `packages/vite-plugin/src/csp.ts` disposition:** Delete entirely. Production path goes away; dev-mode meta CSP for shell-less preview isn't a normative feature (napplet authors running `vite serve` without a shell aren't testing the real security posture anyway). Clean break.
- **Q3 `strictCsp` option deprecation:** `@deprecated` accept-but-warn for one cycle. When authors set `strictCsp: true` or `strictCsp: { ... }` in their vite.config.ts, the plugin emits `console.warn("[nip5a-manifest] strictCsp is deprecated in v0.29.0 and has no effect — the shell is now the sole CSP authority. Remove this option from your vite.config.ts. See v0.29.0 changelog for migration.")` exactly once per build. No CSP meta is emitted (dev or prod). Option will be hard-removed in v0.30.0 (track via new Future Requirement `REMOVE-STRICTCSP`).
- **Q4 Inline-script diagnostic severity:** Hard error. Fails the `pnpm build` with a `[nip5a-manifest]`-prefixed `Error` thrown in `closeBundle` listing the offending `<script>` line numbers. Message: "Inline <script> elements are not allowed in napplet HTML under the v0.29.0 shell-as-CSP-authority model. The shell emits `script-src 'self'` which blocks inline scripts at runtime. Move inline JS to a file and reference it via `<script src='...'>`. Offending locations: <line:col, line:col, ...>."

### Additional locked decisions

- Synthetic xTag path registry: extract the filter from line ~586 of `packages/vite-plugin/src/index.ts` into a new constant `SYNTHETIC_XTAG_PATHS: Set<string>` (or equivalent) containing `'config:schema'` + `'connect:origins'`. Future synthetic entries extend this set without patching the projection filter twice. (Prevents BUILD-P3 drift per research/PITFALLS.md.)
- Origin normalization sourcing: import `normalizeConnectOrigin` from `@napplet/nub/connect/types` (Phase 137 scaffold). This maintains the zero-dep principle for `@napplet/core` while allowing `@napplet/vite-plugin` (which already depends on nostr-tools) to have a new dependency edge on `@napplet/nub/connect/types`. Add `@napplet/nub` as a devDependency or peerDependency in the vite-plugin package.json — type-only import suffices if set up carefully.
- Build-time cleartext warning: when `http:` or `ws:` origins appear in `connect`, emit a `console.log` (NOT a warn/error) explaining browser mixed-content rules (silently fails from HTTPS shell unless localhost/127.0.0.1). Informational, not blocking.
- `REMOVE-STRICTCSP` and `REMOVE-STRICTCSP-CAP` added to Future Requirements in REQUIREMENTS.md — v0.30.0 cleanup candidates.

### Claude's Discretion

All code-level naming (helper function names, constant names, error message wording beyond what's locked above) and exact regex syntax for inline-script detection are at Claude's discretion during planning/execution. The shape of each edit is locked.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/vite-plugin/src/index.ts` — target file. Current state includes `strictCsp` option + CSP emission + assertions. See line numbers in Phase Boundary above (approximate).
- `packages/vite-plugin/src/csp.ts` — target for deletion. Current functions: `buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`, `HEADER_ONLY_DIRECTIVES`, `BASELINE_DIRECTIVE_ORDER`, `StrictCspOptions` interface. All go.
- `packages/nub/src/connect/types.ts` (Phase 137) — exports `normalizeConnectOrigin(origin: string): string`. Vite-plugin imports this.
- `packages/vite-plugin/src/index.ts:568` — existing `config:schema` synthetic-xTag precedent. Extend to `SYNTHETIC_XTAG_PATHS` set.
- `packages/vite-plugin/src/index.ts:586` — existing projection filter. Update to use the new set.
- `packages/vite-plugin/package.json` — dependency graph. Check if `@napplet/nub` is already a workspace peer/dep; add if not.

### Established Patterns

- `@napplet/vite-plugin` is a build-time dev dependency; zero napplet-runtime impact. Adding `@napplet/nub` as a type-only import keeps this property.
- Error messages prefixed with `[nip5a-manifest]` (or `[@napplet/vite-plugin]` — verify existing convention).
- Synthetic xTag entries always use `path:subpath` format (e.g., `config:schema`, `connect:origins`) — colon prevents collision with real dist-relative file paths.
- `configResolved()` hook for option validation; `closeBundle()` for post-build processing (manifest emission, assertions, hash computation).

### Integration Points

- **Consumes:** `normalizeConnectOrigin` from `@napplet/nub/connect/types` (Phase 137)
- **Produces:** `['connect', origin]` manifest tags on the NIP-5A kind 35128 event written to `dist/.nip5a-manifest.json`; updated aggregateHash via `connect:origins` fold; no more CSP meta in `dist/index.html`
- **Consumed by:** napplet authors' `vite.config.ts` via the `connect?: string[]` option; Phase 140's SHELL-CONNECT-POLICY.md references the canonical fold procedure (spec already authored in Phase 135's NUB-CONNECT.md)
- **Breaking change:** napplets with `strictCsp: true` in their vite.config.ts still work (deprecation warn, no effect) — migrate in v0.30.0 hard-remove

</code_context>

<specifics>
## Specific Ideas

- Inline-script regex: positive-match a valid `<script>` opening tag WITHOUT a `src` attribute. Allow-list: `async`, `defer`, `nomodule`, `type`, `nonce` (though nonce is unused under v0.29.0 shell CSP), `crossorigin`, `integrity`, `referrerpolicy`. Require `src` to contain at least one non-whitespace character (rejects `src=""`).
- Build-time cleartext warning wording: "[@napplet/vite-plugin] connect includes cleartext origin <origin> — browser mixed-content rules will silently block http:/ws: fetches from HTTPS shells unless the origin is http://localhost or http://127.0.0.1. See NUB-CONNECT for details."
- `SYNTHETIC_XTAG_PATHS` location: top-of-file constant in `packages/vite-plugin/src/index.ts`, exported for testability: `export const SYNTHETIC_XTAG_PATHS = new Set(['config:schema', 'connect:origins']);`
- Aggregate hash fold code structure (approximate):
  ```ts
  if (options.connect !== undefined && options.connect.length > 0) {
    const normalized = [...options.connect].map(normalizeConnectOrigin).sort();
    const canonical = normalized.join('\n');
    const originsHash = crypto.createHash('sha256').update(canonical).digest('hex');
    xTags.push([originsHash, 'connect:origins']);
  }
  ```

</specifics>

<deferred>
## Deferred Ideas

- NUB-CLASS vite-plugin surface — class is runtime-shell-determined; no build-declared tags needed
- Hard-remove `strictCsp` — v0.30.0 scope (track via new Future Requirement `REMOVE-STRICTCSP`)
- Hard-remove `perm:strict-csp` capability advertisement support — v0.30.0 scope (track via `REMOVE-STRICTCSP-CAP`)
- Central shim/SDK wiring (Phase 139)
- Shell-deployer policy docs (Phase 140)
- Build-time SPEC-02 conformance test (verify the actual fold procedure produces the same hash as the NUB-CONNECT.md conformance fixture) — Phase 142 VER scope

</deferred>

# ARCHITECTURE — v0.29.0 NUB-CONNECT + Shell as CSP Authority

**Researched:** 2026-04-21
**Confidence:** HIGH

## Summary

Classes are not in the SDK's type system — "Class 1 / Class 2" is a spec concept exposed indirectly through a single runtime field: `window.napplet.connect.granted`. There is no `class: 1 | 2` discriminant in SDK code.

Grant discovery should be meta-tag-driven (shell injects `<meta name="napplet-connect-granted">` at serve time) — matches three existing precedents (`napplet-aggregate-hash`, `napplet-type`, `napplet-config-schema`). Synchronous at `installConnectShim()`, no wire round-trip.

The aggregateHash fold is a near-verbatim clone of `config:schema` at `packages/vite-plugin/src/index.ts:568`.

Critical path: B1 → C1 → C1c → D1 → E1. Everything else parallelizes around it.

v0.28.0 CSP infrastructure is a delete-not-refactor move. Fail-loud inline-script diagnostic is new.

## Integration Points

### New Files

| Path | Purpose | Template / Mirror |
|------|---------|-------------------|
| `packages/nub/src/connect/types.ts` | `DOMAIN = 'connect'`, `NappletConnect` interface, no wire messages | `packages/nub/src/theme/types.ts` (types-only NUB) |
| `packages/nub/src/connect/shim.ts` | `installConnectShim()` — reads `<meta name="napplet-connect-granted">`, populates `window.napplet.connect.{granted, origins}`. No message handler. | Structurally closest to `config/shim.ts` meta-tag read path |
| `packages/nub/src/connect/sdk.ts` | `connectGranted()`, `connectOrigins()` thin wrappers (optional — could be types-only if namespace is read-only state) | `resource/sdk.ts` |
| `packages/nub/src/connect/index.ts` | Barrel: `export { DOMAIN, installConnectShim }`, `export type { NappletConnect }`, `registerNub(DOMAIN, noop)` | `resource/index.ts` |
| `specs/SHELL-CONNECT-POLICY.md` | Shell-deployer checklist: HTTP responder requirement, CSP header shape, residual-meta-CSP scan for Class-2, mixed-content warning, cleartext scheme policy | `specs/SHELL-RESOURCE-POLICY.md` |
| `.changeset/<name>.md` | v0.29.0 breaking-change changeset | existing changesets |

### Modified Files

| Path | Change |
|------|--------|
| `packages/core/src/envelope.ts` | Line 67: add `'connect'` to `NubDomain` union. Line 80: add `'connect'` to `NUB_DOMAINS`. |
| `packages/core/src/types.ts` | Add `connect: NappletConnect` to `NappletGlobal` interface near line 570, mirroring `resource:` block. Mark `perm:strict-csp` as `@deprecated` in JSDoc. |
| `packages/nub/package.json` | Add 4 subpath exports: `./connect`, `./connect/types`, `./connect/shim`, `./connect/sdk`. Bump version. |
| `packages/nub/tsup.config.ts` | Add 4 entry points: `connect/index`, `connect/types`, `connect/shim`, `connect/sdk`. |
| `packages/shim/src/index.ts` | Import `installConnectShim` from `@napplet/nub/connect/shim`. Add `connect: { granted, origins }` block to `window.napplet` literal. Call `installConnectShim()` in init. No central-dispatch router entry — NUB-CONNECT has no wire messages. |
| `packages/sdk/src/index.ts` | Add `connect` namespace block (parallel to `resource`). Re-export types from `@napplet/nub/connect`. Export `DOMAIN as CONNECT_DOMAIN`. Export `installConnectShim`. |
| `packages/vite-plugin/src/index.ts` | Large surgery — see "vite-plugin surgery" section below. |
| `packages/vite-plugin/src/csp.ts` | Delete entirely (preferred) OR retain only `buildBaselineCsp` behind a dev-only flag for shell-less preview. |
| `specs/NIP-5D.md` | Amendment: delegate Class-1 / Class-2 distinction to NUBs track. Design doc leans "one-line pointer" — NUB-CONNECT prose is sufficient. |
| `README.md` (root) | Update two-class posture, connect API, "default to NUB-RESOURCE" guidance. |
| `packages/nub/README.md` | Add `connect` row to the NUB table. |
| `packages/vite-plugin/README.md` | Remove strict-CSP docs. Add `connect` option docs. Add inline-script-diagnostic docs. |
| `packages/shim/README.md` | Add `window.napplet.connect` surface. |
| `packages/sdk/README.md` | Add `connect` namespace. |
| `skills/build-napplet/SKILL.md` | Two classes, connect API, "default to NUB-RESOURCE" guidance. |

### Cross-Repo (Not In This Repo)

| Repo / Path | Change |
|------|--------|
| `napplet/nubs` new spec `NUB-CONNECT.md` | Drafted by human following established manual flow. Blocks nothing in this repo's build order. |

## vite-plugin Surgery (`packages/vite-plugin/src/index.ts`)

**Removals:**
- Line 20-25: imports from `./csp.js` (`buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`, `StrictCspOptions`).
- Line 89: `strictCsp?: boolean | StrictCspOptions` field from `Nip5aManifestOptions`.
- Lines 390-396, 429-439: CSP runtime state (`cspNonce`, `cspMode`, `strictCspOptions`, `strictCspEnabled`).
- Lines 456-466: CSP meta injection in `transformIndexHtml`.
- Lines 519-535: `closeBundle` CSP assertions (`assertMetaIsFirstHeadChild`, `assertNoDevLeakage`).

**Additions:**
- New `connect?: string[]` field on `Nip5aManifestOptions`.
- `configResolved()`: `normalizeConnectOrigins(options.connect)` — validates scheme, host, port, path, IDN. Throws on violation with `[nip5a-manifest]` prefix.
- `closeBundle()`: inline-script diagnostic — scan `dist/index.html` for `<script>` without `src`; throw on match.
- `closeBundle()`: aggregateHash fold for connect origins:
  ```ts
  if (options.connect !== undefined && options.connect.length > 0) {
    const normalized = [...normalizedOrigins].sort();
    const canonical = normalized.join('\n');
    const originsHash = crypto.createHash('sha256').update(canonical).digest('hex');
    xTags.push([originsHash, 'connect:origins']);
  }
  ```
- `closeBundle()`: manifest tag emission — `['connect', origin]` tags (one per origin), placed between `manifestXTags` and `configTags`.
- Line 586 filter update: `p !== 'config:schema' && p !== 'connect:origins'` (both synthetic entries excluded from `['x', …]` projection). Consider extracting to a `SYNTHETIC_XTAG_PATHS` set for maintainability (flagged in PITFALLS.md BUILD-P3).
- Optional: dev-mode-only `<meta name="napplet-connect-requires" content="...">` for shell-less preview.

## Build Order (Critical Path)

```
Phase A (parallel, no in-repo deps):
├── A1: specs/SHELL-CONNECT-POLICY.md         (independent — shell-deployer prose)
├── A2: specs/NIP-5D.md amendment             (independent — spec prose)
└── A3: NUB-CONNECT spec in napplet/nubs      (cross-repo — blocks nothing here)

Phase B (single blocking node):
└── B1: packages/core/src/envelope.ts         (add 'connect' to NubDomain + NUB_DOMAINS)
    └── packages/core/src/types.ts            (add connect to NappletGlobal)

Phase C (parallel, depend on B):
├── C1: packages/nub/src/connect/types.ts     (blocks shim + sdk + index barrel)
│    └── C1a: packages/nub/src/connect/shim.ts
│    └── C1b: packages/nub/src/connect/sdk.ts
│    └── C1c: packages/nub/src/connect/index.ts (depends on types + shim + sdk)
│    └── C1d: packages/nub/package.json + tsup.config.ts (subpath exports)
└── C2: packages/vite-plugin/src/index.ts      (CSP removal + connect option + aggregateHash fold
                                                + inline-script diagnostic) — depends ONLY on B

Phase D (depends on C1 exports):
├── D1: packages/shim/src/index.ts            (add connect install block)
└── D2: packages/sdk/src/index.ts             (add connect namespace + re-exports)

Phase E (depends on everything):
├── E1: Doc sweep (root README + 4 package READMEs + skills/build-napplet/SKILL.md)
├── E2: Changeset authoring
└── E3: Verification gates (pnpm -r build + pnpm -r type-check + tree-shake proof)
```

**Critical path** (longest chain): B1 → C1 → C1c → D1 → E1.

**Blocking edges:**
- NUB-CONNECT spec (A3) blocks nothing in this repo.
- `SHELL-CONNECT-POLICY.md` (A1) blocks nothing — independent prose.
- NIP-5D amendment (A2) blocks nothing — independent prose.
- `core/envelope.ts` (B1) blocks C1, C2.
- `nub/src/connect/types.ts` (C1) blocks C1a, C1b, D1, D2.
- `vite-plugin/src/index.ts` (C2) is independent of shim/SDK.
- Doc sweep (E1) depends on everything else being shape-locked.

## Data Flow

**Build time (napplet author, `pnpm build`):**

1. Author writes `vite.config.ts`: `nip5aManifest({ nappletType: 'foo', connect: ['https://api.example.com', 'wss://stream.example.com'] })`.
2. `configResolved()`: `normalizeConnectOrigins(options.connect)` validates each origin (scheme in `{https, wss, http, ws}`, no path/query/fragment, no default port, lowercase host, Punycode for IDN).
3. `transformIndexHtml`: NO CSP meta emitted (production). Dev-mode may still emit a meta CSP for shell-less preview.
4. `closeBundle`: inline-script diagnostic scans `dist/index.html` for `<script>` without `src`; throws on match.
5. `closeBundle`: aggregateHash fold — if `options.connect?.length`, sort lowercased origins, join with `\n`, sha256, push `[hash, 'connect:origins']` into xTags.
6. `closeBundle`: `['connect', origin]` tags emitted (one per origin) between `manifestXTags` and `configTags`.
7. Signed manifest written to `dist/.nip5a-manifest.json`; `napplet-aggregate-hash` meta tag injected.

**Load time (shell serves napplet HTML):**

1. Shell fetches napplet manifest from downstream relay/pinned location.
2. Shell verifies `aggregateHash` (existing v0.28.0 path).
3. Shell parses `['connect', …]` tags. Malformed → refuse to serve.
4. Shell looks up `(dTag, aggregateHash)` in grant store.
5. Shell prompts user if no grant exists (Class 2, first load).
6. Shell assembles CSP string:
   - `connect-src 'none'` if Class 1, Denied, or ungranted.
   - `connect-src <origin1> <origin2> …` if Approved.
7. Shell serves napplet HTML with:
   - `Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src {VARIABLE}; img-src blob: data:; font-src blob: data:; style-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'` HTTP response header (authoritative).
   - `<meta name="napplet-connect-granted" content="origin1 origin2 …">` injected into `<head>` (empty when denied).
8. Shell pre-serve scan: for Class-2 napplets, refuse to serve if HTML contains `<meta http-equiv="Content-Security-Policy">` (residual meta CSP would intersect-down the grant).

**Runtime (napplet iframe):**

1. Browser parses HTML; CSP header is in force before any script runs.
2. `@napplet/shim` loads as first script.
3. `installConnectShim()`:
   - Reads `<meta name="napplet-connect-granted">`.
   - Parses `content` on whitespace: empty → `origins = []`, `granted = false`; non-empty → populated.
   - Assigns to `window.napplet.connect` via readonly getters / `Object.freeze`.
4. Napplet code calls `fetch('https://api.example.com/foo')` — browser enforces CSP at network-layer.
5. Napplet may check `window.napplet.shell.supports('nub:connect')` for shell implementation detection.

## Grant-Discovery Mechanism (Recommendation)

**Recommended: meta-tag injection by the shell.**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Meta tag** (`<meta name="napplet-connect-granted">`) | Synchronous at shim install. No race. Matches 3 existing precedents. Zero new wire messages. | Shell DOM-injects at serve time (already required per spec). | ✓ Recommended |
| postMessage on iframe load | Aligns with NUB patterns. | Race: napplet's first `fetch()` may fire before grant message arrives. Requires shim to queue. Adds a wire message to a spec explicitly without wire protocol. | Rejected (design doc: "no postMessage message types") |
| Shim queries via round-trip | Consistent with `relay.query` shape. | Same race + extra RTT. | Rejected |

**Caveat:** vite-plugin should NOT emit `napplet-connect-granted` at build time (shell is sole writer). A distinct `napplet-connect-requires` for shell-less local preview avoids authority ambiguity.

## Class 1 / Class 2 — Where It Lives in Code

- Not a runtime check — no `if (class === 2) { … }` branch in SDK code.
- Not a build-time check — vite-plugin doesn't emit a class marker.
- Pure documentation concept — the spec describes two postures; code doesn't discriminate.
- Runtime proxy for "am I Class 2?": `window.napplet.connect.origins.length > 0` OR `window.napplet.connect.granted === true`.
- **"Class is a manifest property the shell inspects, not a runtime field the napplet reads."**

Implication for the plan: zero new code paths in the SDK need a class discriminant.

## aggregateHash Canonicalization

```ts
if (options.connect !== undefined && options.connect.length > 0) {
  const normalized = [...normalizedOrigins].sort();
  const canonical = normalized.join('\n');
  const originsHash = crypto.createHash('sha256').update(canonical).digest('hex');
  xTags.push([originsHash, 'connect:origins']);
}
```

- Sort: lexicographic of normalized origin strings. Array order of `connect` option MUST NOT affect hash.
- Case: hosts already lowercase via `normalizeConnectOrigins`.
- Delimiter: `\n` safe — CSP origins forbid whitespace.
- Synthetic path: `'connect:origins'` — colon prevents collision with real dist paths.
- Projection filter: update line 586 to `p !== 'config:schema' && p !== 'connect:origins'`.

**Invariant:** origin list change → new `originsHash` → new `aggregateHash` → grant auto-invalidated.

## Tree-Shaking Contract

Following v0.26.0-proven pattern (theme NUB = types-only = 39-byte bundle):

- `@napplet/nub/connect/types` — zero runtime code. `NappletConnect`, `DOMAIN` const.
- `@napplet/nub/connect/shim` — `installConnectShim()` function. Loaded by `@napplet/shim` or explicit consumers.
- `@napplet/nub/connect/sdk` — thin wrappers. Loaded by `@napplet/sdk` consumers.
- `@napplet/nub/connect` barrel — re-exports all three; triggers `registerNub('connect', noop)` side-effect.

**Verification:** extend existing tree-shake bundle test (v0.26.0 VER-03, v0.28.0 VER-01) with "types-only connect consumer" case — should produce zero `installConnectShim` and zero `registerNub` in final bundle.

**Subpath exports** (identical to resource):
```json
"./connect": { "types": "./dist/connect/index.d.ts", "import": "./dist/connect/index.js" },
"./connect/types": { "types": "./dist/connect/types.d.ts", "import": "./dist/connect/types.js" },
"./connect/shim": { "types": "./dist/connect/shim.d.ts", "import": "./dist/connect/shim.js" },
"./connect/sdk": { "types": "./dist/connect/sdk.d.ts", "import": "./dist/connect/sdk.js" }
```

## Open Questions for Phase Planning

1. Should `packages/vite-plugin/src/csp.ts` be deleted entirely or retained for dev-only use? Design doc leans "retain for shell-less local preview, mark deprecated."
2. Inline-script diagnostic: warn or hard-error? Design doc leans hard-error.
3. Should `@napplet/sdk`'s `connect` namespace expose the readonly state as getters or live functions? Or omit `sdk.ts` entirely and let consumers read `window.napplet.connect.granted` directly?
4. Shell-injected meta tag name: `napplet-connect-granted` (verbose, recommended) or `napplet-connect` (terse)? Precedent is verbose-and-explicit.

## Confidence

HIGH across all sections. Every file path verified against on-disk repo structure; line numbers cited from direct reads; build-order graph derived from explicit import statements and the design doc's Responsibility Split.

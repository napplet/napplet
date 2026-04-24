# Research Summary — v0.29.0 NUB-CONNECT + Shell as CSP Authority

**Project:** Napplet Protocol SDK
**Researched:** 2026-04-21
**Mode:** Subsequent-milestone synthesis of Stack + Features + Architecture + Pitfalls
**Overall confidence:** HIGH

## Executive Summary

v0.29.0 is a **subtractive + additive breaking-change milestone** that moves CSP authority out of the napplet build and into the shell's HTTP response, while introducing a new NUB (`connect`) for user-gated direct `fetch`/`WebSocket`/`SSE` access to pre-declared origins.

- **Load-bearing architectural shift:** shell is now sole runtime CSP authority; vite-plugin drops ~250 LOC of `strictCsp` machinery.
- **Scope boundary:** NUB-CONNECT has zero wire protocol. Grants are expressed through CSP + a shell-injected discovery meta tag (`<meta name="napplet-connect-granted">`) read synchronously at shim install.
- **Class taxonomy:** Class 1 / Class 2 are a spec concept with no code discriminant. Runtime proxy: `window.napplet.connect.origins.length > 0`.
- **Breaking-change impact:** anyone setting `strictCsp: true` in `vite.config.ts`; downstream shells relying on meta-CSP emission; imports of the removed `StrictCspOptions` type.

## Stack Deltas

**Additions (stdlib only, zero new runtime deps):**

- `node:url` (`domainToASCII`) — Punycode IDN conversion in origin normalizer
- `node:crypto` (`createHash('sha256')`) — reused for `connect:origins` aggregateHash fold, byte-mirroring `config:schema` precedent at `packages/vite-plugin/src/index.ts:568`
- Playwright `page.route()` + `securitypolicyviolation` listener — extends v0.28.0 CSP-test patterns

**Removals from `@napplet/vite-plugin`:**

- `buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`, `HEADER_ONLY_DIRECTIVES`, `BASELINE_DIRECTIVE_ORDER`, `StrictCspOptions` interface
- `transformIndexHtml` CSP meta injection (lines 456–466) + `closeBundle` CSP assertions (lines 519–535)
- Nonce generation (line 437)
- `strictCsp?: boolean | StrictCspOptions` option (hard-remove vs. deprecated-no-op — UNRESOLVED)

**Net LOC delta in vite-plugin:** ≈ −170 (−250 removed, +80 added for connect normalizer + guard + hash fold). Simplification, not rewrite.

**Integration Points (file-by-file):**

- `packages/core/src/envelope.ts:67,80` — add `'connect'` to `NubDomain` + `NUB_DOMAINS`
- `packages/core/src/types.ts` (~line 570) — add `connect: NappletConnect` to `NappletGlobal`; `@deprecated` on `perm:strict-csp`
- `packages/nub/src/connect/{types,shim,sdk,index}.ts` — 4 new files mirroring `/resource` layout
- `packages/nub/package.json` + `tsup.config.ts` — 4 new subpath exports (38 → 42 subpaths)
- `packages/shim/src/index.ts` — import `installConnectShim`, call at bootstrap (no dispatch entry)
- `packages/sdk/src/index.ts` — re-export `@napplet/nub/connect/sdk` (one line)
- `packages/vite-plugin/src/index.ts` — surgery (CSP removal + `connect` option + normalizer + hash fold + inline-script diagnostic + manifest tag emission)
- `packages/vite-plugin/src/csp.ts` — delete OR retain dev-only helper (UNRESOLVED)
- `specs/NIP-5D.md` — soften lines 115–130 to forward pointer
- `specs/SHELL-CONNECT-POLICY.md` — new file (parallels `SHELL-RESOURCE-POLICY.md`)
- Cross-repo `napplet/nubs` — new `NUB-CONNECT.md` + NUBs-track class advisory

**UNRESOLVED — Inline-script detection:** STACK recommends zero-dep regex (matches v0.28.0 `csp.ts` ethos); PITFALLS/BUILD-P1 leans `parse5`/`htmlparser2` as dev-dep only (zero napplet-runtime impact) for cleaner edge-case handling (newlines in attrs, HTML comments, non-executing `type=` values, empty `src=""`). Either viable with tests; decide before Phase 4.

## Feature Categories (7 digest)

1. **NUB-CONNECT spec (`napplet/nubs`)** — Complexity L. Full spec authoring. Dependencies: none (blocks informationally; parallel-safe).
2. **NIP-5D amendment + NUBs-track advisory** — Complexity S/M. Delegation mechanism only, not class enumeration. Parallel-safe.
3. **`@napplet/nub/connect` subpath (4 files)** — Complexity M. Mirrors `/resource` template. Blocks shim+SDK integration. Houses shared `normalizeConnectOrigin()` pure function.
4. **`@napplet/vite-plugin` surgery** — Complexity L. Subtractive (drop strictCsp) + additive (`connect` option, normalizer call, hash fold, manifest tag, inline-script diagnostic, `SYNTHETIC_XTAG_PATHS` registry extraction). Depends on B1 (core types).
5. **Central shim + SDK integration** — Complexity S/M. Mirrors v0.28.0 Phase 128. MUST default to `{granted: false, origins: []}` (never `undefined`) on pre-v0.29 shells.
6. **`specs/SHELL-CONNECT-POLICY.md`** — Complexity L. Per-delivery-mode sections, residual-meta-CSP scan + 5-fixture bundle, consent-prompt language checklist, composite-key requirement, explicit N/A on private-IP block. Parallel-safe.
7. **Documentation sweep** — Complexity L. Terminal phase. Root + 4 package READMEs + `skills/build-napplet/SKILL.md`. Changesets with loud breaking-change markers.

## Build Order / Critical Path

Critical path (longest chain): **B1 → C1 → C1c → D1 → E1**.

- **Phase A (parallel, independent):** A1 SHELL-CONNECT-POLICY, A2 NIP-5D amendment, A3 cross-repo NUB-CONNECT spec
- **Phase B (single blocking node):** B1 core types (`envelope.ts` + `types.ts`)
- **Phase C (parallel after B):** C1 `@napplet/nub/connect` subpath (C1a shim, C1b sdk, C1c barrel, C1d package/tsup config); C2 vite-plugin surgery (parallel with C1)
- **Phase D (depends on C1 exports):** D1 central shim, D2 central SDK
- **Phase E (depends on everything):** E1 doc sweep, E2 changeset authoring, E3 verification gates

## Pitfall Highlights (5 Critical)

1. **SPEC-P1 — aggregateHash canonical-hashing underspecified at byte level** (Critical). Build + shell must produce byte-identical hashes. **Prevention:** normative pseudocode in NUB-CONNECT spec (lowercase → ASCII sort → `\n`-join no trailing → UTF-8 → SHA-256 → lowercase hex) + conformance fixture + shared normalizer in `@napplet/nub/connect/types`.
2. **BUILD-P2 — Origin normalization drift between build and shell** (Critical). **Prevention:** single pure `normalizeConnectOrigin()` in `@napplet/nub/connect/types` consumed by both sides; table-driven tests covering uppercase scheme/host, trailing slash, default ports (×4 schemes), UTF-8 IDN, wildcards, path/query/fragment, IPv6/IPv4 literals, invalid schemes.
3. **BUILD-P4 — `strictCsp` option deprecation is itself a breaking change** (High). **Prevention:** decide hard-remove vs. accept-but-warn (design leans warn for one cycle); dev-mode meta CSP retained with `@deprecated` comment; changeset loudly flags breaking nature.
4. **SHELL-P1 — Missing or buggy residual-meta-CSP scan** (Critical, project-killer). Intersection silently suppresses grants to `'none'`. **Prevention:** SHELL-CONNECT-POLICY.md dedicates "Residual Meta CSP Scan" section with parser-based example (not regex), tricky-case list, 5-fixture conformance bundle; scan runs on BOTH classes (Class-1 residual is harmless but log to drive migration).
5. **SHELL-P3 — Shell HTTP-responder precondition (serving-mode gotchas)** (Critical). Each mode has its own pitfall (`blob:` no headers → meta-first-head-child returns; `srcdoc` `about:srcdoc` origin → `'self'` resolves differently; proxy may strip/cache CSP; direct serve may have upstream CDN caching). **Prevention:** per-mode checklist sections; require meta-CSP-as-first-head-child for `blob:`/`srcdoc`; optional `shell.supports('connect:serve:direct|blob|srcdoc|proxy')` for debuggability.

**Remaining 12 pitfalls (category digest):**

- *Spec:* P2 IDN conversion-direction ownership (build converts, shell rejects non-Punycode); P3 default-port rationale (hygiene, not CSP correctness — shell MUST NOT "helpfully" normalize); P4 NIP-5D delegation mechanism only, not class enumeration.
- *Build:* P1 inline-script regex-vs-parser decision (see UNRESOLVED); P3 `SYNTHETIC_XTAG_PATHS` registry extraction to avoid filter duplication.
- *Runtime:* P1 graceful degradation default (`{granted: false, origins: []}` never `undefined`); P2 mixed-content silent-fail with build-time cleartext warning + localhost secure-context exception; P3 blob revocation lifetime (posture doc + "revoke + reload" UX); P4 consent-prompt MUST capture "send AND receive" + shell-blind; P5 consent fatigue advisory (all-or-nothing v1 acknowledged).
- *Shell-Deploy:* P2 cleartext-refusal diagnostic clarity; P4 grant-persistence composite-key requirement.
- *Cross-Repo:* P1 spec/SDK drift controls (SHELL-CONNECT-POLICY as non-normative companion; zero-grep audit; shared conformance fixtures); P2 `perm:strict-csp` deprecation-target synchronization; P3 downstream-shell-repo demo-tracking issue.

## Unresolved Decisions for Plan Phase

1. **Inline-script detection:** parse5/htmlparser2 dev-dep vs. zero-dep regex
2. **`packages/vite-plugin/src/csp.ts`:** delete entirely vs. retain trimmed dev-only helper vs. split-by-concern
3. **Inline-script diagnostic:** warn vs. hard-error (design leans hard-error)
4. **`sdk.ts` for connect:** omit (types-only like theme) vs. include readonly getters
5. **Meta tag name:** `napplet-connect-granted` (verbose, recommended) vs. `napplet-connect` (terse); precedent is verbose-explicit
6. **NIP-5D amendment:** one-line pointer vs. richer section (design leans one-line)
7. **`strictCsp` option:** hard-remove vs. `@deprecated` accept-but-warn for one cycle
8. **IPv6 literal / bare IPv4 acceptance in origin format:** spec silent; likely reject in v0.29.0

## Roadmap Recommendations (8 phases)

1. **Phase 1 — Cross-repo spec work** (NUB-CONNECT draft + NIP-5D amendment + NUBs-track advisory). Parallel-safe.
2. **Phase 2 — Core type surface (B1)** — `'connect'` in `NubDomain` + `NUB_DOMAINS` + `NappletGlobal`. Blocking node.
3. **Phase 3 — `@napplet/nub/connect` subpath scaffold (C1)** — 4 files + subpath exports. Houses shared normalizer.
4. **Phase 4 — `@napplet/vite-plugin` surgery (C2, parallel with C1)** — CSP removal + `connect` option + hash fold + inline-script diagnostic + synthetic-path registry.
5. **Phase 5 — Central shim + SDK integration (D1/D2)** — MUST default `{granted: false, origins: []}` on pre-v0.29 shells.
6. **Phase 6 — `specs/SHELL-CONNECT-POLICY.md` authoring** — Parallel-safe after Phase 1.
7. **Phase 7 — Documentation sweep (E1)** — Terminal; all API shapes shape-locked.
8. **Phase 8 — Verification + changeset + milestone close (E2/E3)** — `pnpm -r build` + `type-check` green; tree-shake proof; cross-repo zero-grep audit; demo-tracking issue confirmation; carry PUB-04 forward.

**Research flags:** Phase 4 (inline-script decision interlocking with deprecation-warning semantics) and Phase 6 (residual-meta-CSP parser example + fixture bundle + serving-mode concrete tests) both warrant a 30-min `/gsd:research-phase` spike. Phases 2, 3, 5, 7, 8 use standard patterns (skip research).

## What NOT to Add

- Per-origin partial grants (v2)
- Wildcard subdomains (v2)
- Quota / rate-limiting on post-grant traffic (no browser hook)
- Audit logging of individual network calls (no browser hook)
- Any postMessage wire messages for NUB-CONNECT (explicit spec Non-Goal)
- Service-Worker-based grant mechanisms (sandbox forbids SW registration)
- Shell visibility into post-grant traffic (documented fundamental tradeoff)
- `strictCsp` emission as supported production path (architecturally incoherent)
- Nonce generation (dead code under `script-src 'self'`)
- Runtime `connect.request(origin)` method (breaks content-addressing)
- `connect.onGrantChange(callback)` subscription (reload is the response)
- Private-IP block list (DNS rebinding bypasses; not real control; documented N/A)
- Separate `@napplet/nub-connect` workspace package (inverts v0.26.0 consolidation)
- MIME sniffing / SVG rasterization caps / redirect limits (NUB-RESOURCE concerns)
- NPM publish gate (PUB-04 — carry forward)
- Demo napplets in this repo (Option B — downstream shell repo)
- Historical changelog bullet rewrites (v0.27.0 precedent: preserve byte-identical)

## Confidence

| Area | Confidence |
|------|------------|
| Stack | HIGH |
| Features | HIGH |
| Architecture | HIGH |
| Pitfalls | HIGH |

**Overall:** HIGH. All four lanes corroborate; every integration point is a verified file:line; every pitfall has v0.28.0 precedent, documented browser behavior, or a known class the project has navigated before.

**Gaps:** 8 plan-phase decisions (listed above) — none block roadmap authoring, all inform phase-content granularity.

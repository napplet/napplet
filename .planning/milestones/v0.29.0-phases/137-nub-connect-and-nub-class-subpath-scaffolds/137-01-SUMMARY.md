---
phase: 137-nub-connect-and-nub-class-subpath-scaffolds
plan: 01
subsystem: nub-types
tags: [nub, connect, class, types-only, origin-normalization, typescript, verbatim-module-syntax]

requires:
  - phase: 136-core-type-surface
    provides: "NubDomain union with 'connect' + 'class', NappletGlobal.connect structural contract, NappletGlobal.class? optional, NappletMessage envelope base"
  - phase: 135-cross-repo-spec-work
    provides: "NUB-CONNECT.md draft (origin format rules, canonical fold), NUB-CLASS.md draft (class.assigned wire shape)"

provides:
  - "packages/nub/src/connect/types.ts — DOMAIN='connect' const, NappletConnect interface, pure normalizeConnectOrigin() validator"
  - "packages/nub/src/class/types.ts — DOMAIN='class' const, ClassMessage base, ClassAssignedMessage wire type, NappletClass runtime state, ClassNubMessage union"
  - "Shared origin-validation source-of-truth for Phase 138 (vite-plugin) and shell implementations"

affects: [phase-137-02, phase-137-03, phase-138, phase-139, phase-142]

tech-stack:
  added: []
  patterns:
    - "Types-only NUB entry with embedded pure validator (extends theme/types.ts precedent by including one stateless function)"
    - "Error-message prefix convention: [@napplet/nub/<domain>] for downstream re-prefixing"

key-files:
  created:
    - packages/nub/src/connect/types.ts
    - packages/nub/src/class/types.ts
  modified: []

key-decisions:
  - "IPv4 accepted (including 127.0.0.1 and private ranges via RFC-1918); IPv6 rejected for v1 (bracket notation AND colon-in-host after port strip both throw)"
  - "normalizeConnectOrigin returns byte-identical input on success — no canonicalization-side-effects, caller must supply canonical form"
  - "Error messages prefixed [@napplet/nub/connect] so Phase 138 vite-plugin can re-prefix with [nip5a-manifest] without losing source context"
  - "NappletConnect inlined in connect/types.ts (structurally matches NappletGlobal['connect']) rather than imported from @napplet/core — lets types.ts have zero imports, preserves tree-shake guarantee"
  - "class/types.ts uses `import type { NappletMessage } from '@napplet/core'` — verbatimModuleSyntax compliance; type-only import is elided at emit time"
  - "ClassAssignedMessage.class is bare `number` (not 1|2 literal union) — class space extensible via NUB-CLASS-$N sub-track"

patterns-established:
  - "Types-only NUB file CAN contain one pure validator function when it serves as single-source-of-truth across build-side + runtime-side consumers (connect)"
  - "Hostname validation: split on '.', per-label RFC-1123 check (1-63 chars, [a-z0-9-], no leading/trailing hyphen) — Punycode passes since 'xn--' is valid ASCII with hyphen mid-label"
  - "IPv4 acceptance is strict dotted-decimal — no shortened forms, no leading zeros, each octet Number.isInteger ∈ [0,255]"

requirements-completed: [NUB-01, CLASS-01]

duration: 4min
completed: 2026-04-21
---

# Phase 137 Plan 01: NUB Subpath Types — Connect + Class Summary

**Two zero-dep types.ts files establishing the connect + class NUB subpaths: connect exports the shared normalizeConnectOrigin validator that becomes single-source-of-truth for Phase 138 and shell origin-validation; class exports the terminal class.assigned wire envelope type for Plan 02's dispatcher.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-21T13:42:23Z
- **Completed:** 2026-04-21T13:45:50Z (approx)
- **Tasks:** 2 / 2
- **Files modified:** 2 (both created)

## Accomplishments

- Types-only scaffolds for `@napplet/nub/connect/types` and `@napplet/nub/class/types` with zero runtime side effects (connect carries one pure validator function; class is pure types).
- `normalizeConnectOrigin()` validated against 28 smoke-test cases (7 accept, 21 reject) — full validation matrix below.
- `NappletConnect` interface proven structurally bidirectional-assignable with `NappletGlobal['connect']` from `@napplet/core` (lockdown cross-package contract).
- `ClassAssignedMessage` wire type matches NUB-CLASS.md draft exactly: `{ type: 'class.assigned'; id: string; class: number }`.
- `pnpm --filter @napplet/nub type-check` passes with the two new subpaths added; no regressions on the existing 10 NUB domains.

## Task Commits

1. **Task 1: Create packages/nub/src/connect/types.ts (NUB-01)** — `98012f7` (feat)
2. **Task 2: Create packages/nub/src/class/types.ts (CLASS-01)** — `1067509` (feat)

_Final docs commit follows this SUMMARY._

## Files Created/Modified

- `packages/nub/src/connect/types.ts` (198 lines) — DOMAIN='connect' const, NappletConnect interface (readonly granted: boolean, readonly origins: readonly string[]), pure normalizeConnectOrigin(origin: string): string validator with [@napplet/nub/connect]-prefixed error messages. Zero imports (uses only built-in JS regex + Set/Record).
- `packages/nub/src/class/types.ts` (93 lines) — DOMAIN='class' const, ClassMessage base interface extending NappletMessage with template-literal `class.${string}` type, ClassAssignedMessage wire type, NappletClass runtime state interface (`readonly class: number | undefined`), ClassNubMessage discriminated-union alias (single-member v1). Single `import type { NappletMessage } from '@napplet/core'` (type-only import, elided at emit).

## Normalizer Validation Matrix (`normalizeConnectOrigin`)

### Accept (7/7 smoke-tested, returns byte-identical input)

| Input | Reason |
| --- | --- |
| `https://api.example.com` | Canonical HTTPS |
| `wss://stream.example.com:8443` | WSS + explicit non-default port |
| `http://127.0.0.1` | IPv4 loopback literal (secure-context exception) |
| `http://localhost` | Localhost DNS (secure-context exception) |
| `https://xn--caf-dma.example.com` | Punycode IDN |
| `ws://192.168.1.1:3000` | IPv4 private + non-default port + WS scheme |
| `http://10.0.0.1` | IPv4 private range |

### Reject (21/21 smoke-tested, all throw with `[@napplet/nub/connect]` prefix)

| Input | Rule Violated |
| --- | --- |
| `` (empty string) | non-empty string required |
| `no-scheme.example.com` | missing scheme separator `://` |
| `ftp://example.com` | unknown scheme (only https\|wss\|http\|ws accepted) |
| `HTTPS://example.com` | uppercase scheme |
| `https://API.example.com` | uppercase host |
| `https://*.example.com` | wildcard host |
| `https://example.com/path` | path present |
| `https://example.com?q=1` | query present |
| `https://example.com#frag` | fragment present |
| `https://example.com:443` | default port on https |
| `http://example.com:80` | default port on http |
| `wss://example.com:443` | default port on wss |
| `ws://example.com:80` | default port on ws |
| `https://café.example.com` | non-Punycode IDN (non-ASCII host) |
| `https://[::1]` | IPv6 bracketed (v1 scope) |
| `https://256.1.1.1` | IPv4 octet out of range |
| `https://01.2.3.4` | IPv4 octet with leading zero |
| `https://example.com:70000` | port out of range |
| `https://example.com:abc` | non-decimal port |
| `https://-example.com` | host label leading hyphen |
| `https://example-.com` | host label trailing hyphen |

### Structural Guarantees

- Pure function — no side effects, no state, no I/O.
- Idempotent — `normalizeConnectOrigin(normalizeConnectOrigin(x)) === normalizeConnectOrigin(x)` for valid `x`.
- Deterministic — same input → same output/exception, always.
- No mutation of input; reference-equality preserved on success.
- Error messages all begin with the literal string `[@napplet/nub/connect]` so downstream callers (Phase 138 vite-plugin with `[nip5a-manifest]` diagnostics, shell implementations) can re-prefix without losing provenance.

## `NappletConnect` Locked Cross-Package Contract

```typescript
export interface NappletConnect {
  readonly granted: boolean;
  readonly origins: readonly string[];
}
```

Verified bidirectional structural assignability:
- `const _a: NappletConnect = {} as NappletGlobal['connect'];` — typechecks
- `const _b: NappletGlobal['connect'] = {} as NappletConnect;` — typechecks

This shape is the locked contract between `@napplet/core` (owns the declaration on `NappletGlobal`) and `@napplet/nub/connect` (owns the standalone interface for consumers that don't want to pull in the full `NappletGlobal` surface). Any future change to these two fields must happen in both locations simultaneously.

## `ClassAssignedMessage` Locked Wire Contract

```typescript
export interface ClassAssignedMessage extends ClassMessage {
  type: 'class.assigned';
  id: string;
  class: number;
}
```

Matches NUB-CLASS.md draft exactly:
- Shell → napplet only (fire-and-forget).
- At-most-one terminal envelope per napplet lifecycle.
- Sent after iframe ready, before any other napplet-bound envelope.
- Duplicate envelopes are protocol violations (enforced by Plan 02's handler logic — idempotent last-write-wins only exists as scaffolding for the v2 dynamic re-classification expansion).
- `class` is bare `number`, not a literal union — class space is extensible via NUB-CLASS-$N sub-track.

## Decisions Made

See `key-decisions` in frontmatter. All decisions were locked at CONTEXT.md gather time; no deviations during execution.

## Deviations from Plan

None — plan executed exactly as written. Both tasks followed the template code in the `<action>` blocks byte-for-byte, with minor whitespace-only formatting consistency checked against `packages/nub/src/resource/types.ts` (the structural template).

## Issues Encountered

### Pre-existing `@napplet/shim` Type Error (out of scope — Phase 139)

**Status:** Pre-existing, tracked, out of scope.

`pnpm -r type-check` fails on `packages/shim` with:

```
src/index.ts(130,1): error TS2741: Property 'connect' is missing in type '{ relay: ... }' but required in type 'NappletGlobal'.
```

This error was introduced by **Phase 136 / CORE-02** (which added the required `connect` field to `NappletGlobal`) and is **the designated responsibility of Phase 139 / SHIM-01 + SHIM-02** to fix (requires wiring `connect: { granted, origins }` into the central `window.napplet` literal + calling `installConnectShim()` at shim bootstrap).

Verified pre-existence: `git stash && pnpm --filter @napplet/shim type-check` reproduces the identical error before any Plan 137-01 changes.

Per the GSD scope-boundary rule, this is a direct consequence of a prior phase's intentional progression, not a deviation introduced by this plan, and fixing it here would violate the Phase 137 boundary (CONTEXT.md out-of-scope line 27 — "Central @napplet/shim integration (Phase 139)"). The error is tracked in STATE.md's Pending Todos section and in the SHIM-01/SHIM-02 requirement entries in REQUIREMENTS.md.

Package-scoped type-check on `@napplet/nub` itself (the package this plan modifies) passes clean.

## Next Plan Readiness

- **Plan 137-02** (shim.ts + sdk.ts + index.ts barrels for connect and class) is unblocked — both types.ts files export all identifiers the barrels will re-export (`DOMAIN`, `NappletConnect`, `normalizeConnectOrigin`, `ClassAssignedMessage`, `ClassMessage`, `NappletClass`, `ClassNubMessage`).
- **Plan 137-03** (package.json + tsup.config.ts subpath wiring) is unblocked — file paths are fixed.
- **Phase 138** (vite-plugin surgery) has its import target finalized: `import { normalizeConnectOrigin } from '@napplet/nub/connect/types'`.
- **Phase 139** (central shim/SDK) has NappletConnect shape locked for the `window.napplet.connect` literal block.

## Self-Check: PASSED

- `packages/nub/src/connect/types.ts` — FOUND
- `packages/nub/src/class/types.ts` — FOUND
- commit `98012f7` (Task 1) — FOUND in git log
- commit `1067509` (Task 2) — FOUND in git log
- `pnpm --filter @napplet/nub type-check` — exits 0

---
*Phase: 137-nub-connect-and-nub-class-subpath-scaffolds*
*Completed: 2026-04-21*

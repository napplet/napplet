---
phase: 137-nub-connect-and-nub-class-subpath-scaffolds
plan: 02
subsystem: nub-runtime
tags: [nub, connect, class, shim, sdk, barrel, meta-tag, wire-handler, register-nub, typescript]

requires:
  - phase: 137-01
    provides: "packages/nub/src/connect/types.ts (DOMAIN, NappletConnect, normalizeConnectOrigin), packages/nub/src/class/types.ts (DOMAIN, ClassMessage, ClassAssignedMessage, NappletClass, ClassNubMessage)"
  - phase: 136-core-type-surface
    provides: "NappletGlobal.connect structural contract, NappletGlobal.class? optional, NubDomain includes 'connect' + 'class'"

provides:
  - "packages/nub/src/connect/shim.ts — installConnectShim() meta-tag reader mounting window.napplet.connect"
  - "packages/nub/src/connect/sdk.ts — connectGranted() + connectOrigins() named-export readonly getters"
  - "packages/nub/src/connect/index.ts — barrel + registerNub('connect', noop) side-effect"
  - "packages/nub/src/class/shim.ts — installClassShim() + handleClassMessage() wire dispatcher handler"
  - "packages/nub/src/class/sdk.ts — getClass() thin readonly getter (undefined-tolerant)"
  - "packages/nub/src/class/index.ts — barrel + registerNub('class', handleClassMessage) side-effect"

affects: [phase-137-03, phase-138, phase-139, phase-142]

tech-stack:
  added: []
  patterns:
    - "Meta-tag-reader installer pattern (connect/shim): mirrors config/shim.ts readManifestSchema precedent, reads shell-injected tag at install time, mounts readonly getters via Object.defineProperty"
    - "Wire-handler installer pattern (class/shim): exports handleClassMessage with dispatcher-compatible signature ({type: string; [key: string]: unknown}), installer mounts window getter over module-local state"
    - "Barrel side-effect registration (connect=noop, class=handleClassMessage): importing @napplet/nub/<domain> is sufficient for central dispatch routing without requiring the installer to be called"
    - "NubHandler parameter-contravariance bridge: `as unknown as NubHandler` cast in index.ts to reconcile dispatcher-compatible handler signature with narrower NappletMessage type — sound at runtime, localized to registration site"
    - "Double-install guard on installers: second call is no-op + returns no-op cleanup, matches resource/shim.ts + config/shim.ts precedent"

key-files:
  created:
    - packages/nub/src/connect/shim.ts
    - packages/nub/src/connect/sdk.ts
    - packages/nub/src/connect/index.ts
    - packages/nub/src/class/shim.ts
    - packages/nub/src/class/sdk.ts
    - packages/nub/src/class/index.ts
  modified: []

key-decisions:
  - "installConnectShim reads meta synchronously at install time — single read, no re-read on mutation (graceful-degradation contract does NOT require live meta observation)"
  - "Empty <meta name='napplet-connect-granted' content=''> → {granted: false, origins: []} (content-empty indistinguishable from meta-absent per NUB-CONNECT spec)"
  - "window.napplet.connect uses Object.defineProperty getters (not direct object fields) so the shim can later extend with dynamic mutation without breaking the API shape"
  - "window.napplet.class defineProperty is configurable:true (unlike connect which is configurable:false) because cleanup() must be able to delete the getter — class has no mount object to swap out since the single numeric value lives in module state"
  - "handleClassMessage validates non-negative integer and silently drops invalid shapes per NUB-CLASS graceful-degradation — no console warning in v1 (would clutter sandboxed napplet consoles with no actionable signal)"
  - "installClassShim does NOT call registerNub — that's index.ts's job. Installer owns only the window mount; barrel owns the dispatcher wiring. Separating concerns lets napplets import @napplet/nub/class for dispatcher registration only (without mounting)"
  - "class/index.ts uses `handleClassMessage as unknown as NubHandler` cast (not closure wrapper) — keeps the handler reference direct so v1 NubHandler widening in a future core release would simply remove the cast without other changes"
  - "connect/sdk.ts getters THROW when window.napplet.connect is absent (matches resource/sdk.ts pattern); class/sdk.ts getClass does NOT throw (undefined is legitimate default state — matches graceful-degradation contract per CLASS-04)"

patterns-established:
  - "Wire-handler NUB barrel pattern: `registerNub(DOMAIN, handleXxxMessage as unknown as NubHandler)` is the canonical way to wire a handler with the dispatcher-compatible signature. Applies to any NUB that both exports a handler AND wants module-import to automatically register it."
  - "Zero-wire NUB barrel pattern: `registerNub(DOMAIN, (_msg) => { /* noop */ })` with inline comment explaining why (e.g., 'NUB-X has no wire; pure meta tag + CSP' for connect). Identifies to readers that the noop is intentional."
  - "Meta-tag name constant: each NUB that reads a shell-injected meta tag declares the tag name as a module-local `const` (e.g., `GRANTED_META_NAME = 'napplet-connect-granted'`). Keeps the spec-defined tag name adjacent to the reader helper."

requirements-completed: [NUB-02, NUB-03, NUB-04, CLASS-02, CLASS-03, CLASS-04]

duration: 4min
completed: 2026-04-21
---

# Phase 137 Plan 02: NUB Subpath Runtime Triads — Connect + Class Summary

**Six new runtime-surface files complete the @napplet/nub/connect and @napplet/nub/class subpath scaffolds: connect mounts window.napplet.connect from a shell-injected meta tag (no wire), class mounts window.napplet.class as a readonly getter updated by a wire-dispatcher handler for class.assigned envelopes. Both barrels register their NUB domain on module evaluation — connect with an intentional noop (pure meta-tag NUB), class with the dispatcher handler wired via an `as unknown as NubHandler` contravariance bridge.**

## Performance

- **Duration:** ~4 min (213 s)
- **Started:** 2026-04-21T13:49:52Z
- **Completed:** 2026-04-21T13:53:25Z (approx, pre-summary)
- **Tasks:** 2 / 2
- **Files created:** 6 (3 per subpath)

## Accomplishments

- **Connect triad (NUB-02, NUB-03, NUB-04):** Reads `<meta name="napplet-connect-granted" content="...">` at install time, parses whitespace-separated origins, mounts `window.napplet.connect` as readonly state with default `{granted: false, origins: []}` via Object.defineProperty getters. Thin SDK helpers `connectGranted()` + `connectOrigins()` throw when shim not installed. Barrel registers noop handler for dispatch introspection.
- **Class triad (CLASS-02, CLASS-03, CLASS-04):** Wire-handler NUB with `handleClassMessage({type, ...})` routing `class.assigned` envelopes, validating non-negative integer, idempotently writing to module-local state. `installClassShim()` mounts `window.napplet.class` via configurable readonly getter (undefined until wire). `getClass()` tolerant of undefined (no throw). Barrel wires the handler via `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler)`.
- `pnpm --filter @napplet/nub type-check` exits 0 cleanly — all 10 pre-existing NUB subpaths plus the 2 new ones (connect + class) compile without error or warning.
- `window.napplet.connect` structural shape verified assignment-compatible with `NappletGlobal['connect']` (Phase 136 CORE-02 contract) at compile time via the installer's `NappletConnect` return type.
- `window.napplet.class` getter wired via `Object.defineProperty` with `configurable: true` so cleanup can delete the property (matches optional `class?: number` declaration in `NappletGlobal`).

## Task Commits

1. **Task 1: Create connect/{shim,sdk,index}.ts (NUB-02, NUB-03, NUB-04)** — `37558f2` (feat)
2. **Task 2: Create class/{shim,sdk,index}.ts (CLASS-02, CLASS-03, CLASS-04)** — `e732c41` (feat)

_Final docs commit follows this SUMMARY._

## Files Created

- `packages/nub/src/connect/shim.ts` (114 lines) — `GRANTED_META_NAME = 'napplet-connect-granted'` const; `readGrantedMeta()` helper (document.querySelector); `parseOrigins()` helper (split `/\s+/` filter empty); `installConnectShim()` installer with double-install guard, meta-read at install, Object.defineProperty mount on window.napplet.connect, cleanup returns
- `packages/nub/src/connect/sdk.ts` (63 lines) — `requireConnect()` guard throwing if shim not installed; `connectGranted(): boolean`; `connectOrigins(): readonly string[]`; full JSDoc with @example blocks
- `packages/nub/src/connect/index.ts` (56 lines) — barrel re-exporting DOMAIN, NappletConnect (type), normalizeConnectOrigin, installConnectShim, connectGranted, connectOrigins; side-effect `registerNub(DOMAIN, noop)` with inline rationale comment
- `packages/nub/src/class/shim.ts` (115 lines) — module-local `currentClass: number | undefined`; `handleClassMessage()` dispatcher-compatible handler validating non-negative integer; `installClassShim()` installer with double-install guard, Object.defineProperty `configurable: true` getter on window.napplet.class, cleanup deletes property
- `packages/nub/src/class/sdk.ts` (40 lines) — `getClass(): number | undefined`; tolerant of missing `window.napplet` (returns undefined, does NOT throw); full JSDoc documenting the three undefined-return states
- `packages/nub/src/class/index.ts` (69 lines) — barrel re-exporting DOMAIN, ClassMessage, ClassAssignedMessage, NappletClass, ClassNubMessage (types), installClassShim, handleClassMessage, getClass; side-effect `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler)` with rationale comment

## `window.napplet.connect` Mount Contract

Locked cross-package contract; Phase 139 SHIM-01/SHIM-02 consumes this at the central `@napplet/shim` bootstrap.

```typescript
// Default state (meta absent OR content empty):
window.napplet.connect === { granted: false, origins: [] }

// Populated state (meta present with non-empty content):
// <meta name="napplet-connect-granted" content="https://api.example.com wss://stream.example.com">
window.napplet.connect === { granted: true, origins: ['https://api.example.com', 'wss://stream.example.com'] }
```

- `granted` and `origins` are readonly getters (Object.defineProperty, `configurable: false`).
- `origins` array is frozen via `Object.freeze` at install time.
- Mount object is created fresh per install; cleanup deletes if the current mount matches (guards against other shim code racing).
- Idempotent installer: second call returns a no-op cleanup without re-reading the meta tag.
- Never `undefined` after `installConnectShim()` returns.

## `window.napplet.class` Mount Contract

Locked cross-package contract; Phase 139 SHIM-03/SHIM-04 consumes this at the central `@napplet/shim` bootstrap.

```typescript
// Default state (before class.assigned wire arrives, or shell does not implement nub:class):
window.napplet.class === undefined

// After shell sends { type: 'class.assigned', id: 'c1', class: 2 }:
window.napplet.class === 2
```

- Single `number | undefined` field exposed via Object.defineProperty getter (`configurable: true` so cleanup can delete).
- Module-local `currentClass` state is written ONLY by `handleClassMessage` on valid envelopes; the getter reads current state at each access.
- Idempotent last-write-wins on duplicate envelopes (v1 protocol violation, accepted silently per graceful-degradation).
- Getter delivers `undefined` pre-wire AND post-shim-cleanup — napplets MUST use `=== undefined` or optional chaining to detect pre-assignment state (NEVER test for `0` or `null`).

## Two Domain Registrations (Phase 139 shim integration reference)

When `@napplet/shim` bootstraps and imports these barrels, the following registrations happen as module-evaluation side effects:

```typescript
// From packages/nub/src/connect/index.ts:
registerNub('connect', (_msg) => { /* noop — NUB-CONNECT has no wire */ });

// From packages/nub/src/class/index.ts:
registerNub('class', handleClassMessage as unknown as NubHandler);
```

`dispatch.getRegisteredDomains()` will include both `'connect'` and `'class'` after these modules are imported. Shell-side capability introspection (via the core dispatch singleton) can rely on both domains being present without further shim-level configuration.

## `handleClassMessage` Dispatcher Handler Contract

Phase 139 will route `class.*` envelopes to this handler via the central shim's dispatcher loop. The exact signature is the key contract:

```typescript
export function handleClassMessage(msg: { type: string; [key: string]: unknown }): void {
  if (msg.type !== 'class.assigned') return;           // Early return on other class.* actions
  const assigned = msg as unknown as ClassAssignedMessage;
  const value = assigned.class;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return;
  currentClass = value;                                 // Idempotent last-write-wins
}
```

- **Signature:** `{ type: string; [key: string]: unknown }` — matches resource/shim.ts handleResourceMessage exactly. The `[key: string]: unknown` index signature is what `@napplet/shim`'s central dispatcher passes after parsing a MessageEvent envelope.
- **Action routing:** Only `class.assigned` is recognized (v1 wire has one terminal envelope). Other `class.*` types are silently ignored (forward-compatibility scaffolding).
- **Validation:** Non-negative integer required; all other shapes silently dropped. No throw, no console warning.
- **State write:** Idempotent last-write-wins. Duplicate envelopes are protocol violations but accepted silently.

## Deviations from Plan

### [Rule 3 - Blocking] NubHandler contravariance bridge in class/index.ts

**Found during:** Task 2 verification (pnpm type-check)

**Issue:** The plan's action template wrote `registerNub(DOMAIN, handleClassMessage);` literally. TypeScript rejected this with TS2345:

```
error TS2345: Argument of type '(msg: { [key: string]: unknown; type: string; }) => void' is not assignable to parameter of type 'NubHandler'.
  Types of parameters 'msg' and 'message' are incompatible.
    Type 'NappletMessage' is not assignable to type '{ [key: string]: unknown; type: string; }'.
      Index signature for type 'string' is missing in type 'NappletMessage'.
```

Root cause: `NubHandler` in `@napplet/core/dispatch.ts` is typed as `(message: NappletMessage) => void`, and `NappletMessage` is `{ type: string }` with no index signature. `handleClassMessage`'s parameter `{ type: string; [key: string]: unknown }` is MORE restrictive (every key must be unknown-typed), so TypeScript parameter contravariance rejects the assignment.

**Why this didn't affect resource (the precedent):** `packages/nub/src/resource/index.ts` registers a NOOP handler `(_msg) => { /* ... */ }`, NOT `handleResourceMessage` directly. The central `@napplet/shim` wires the real handler separately at Phase 128 bootstrap. This is the first NUB that registers a handler with the richer dispatcher signature at the barrel level.

**Fix:** Added `as unknown as NubHandler` cast at the registration site. Also imported `NubHandler` type from `@napplet/core` (type-only import, elided at emit per verbatimModuleSyntax).

```typescript
import { registerNub, type NubHandler } from '@napplet/core';
// ...
registerNub(DOMAIN, handleClassMessage as unknown as NubHandler);
```

**Why the cast is sound at runtime:** At runtime, any envelope arriving at a NUB handler is a parsed JSON object — which structurally is `{ type: string; [key: string]: unknown }`. The cast is a type-system concession, not a behavior concession. Central dispatcher callers already invoke handlers with full envelope objects; the parameter narrowing in `NappletMessage` is a convenience fiction for the registry.

**Alternative considered (rejected):** Widen `NubHandler` in `@napplet/core` to `(message: { type: string; [key: string]: unknown }) => void`. Rejected because it's out of scope for Phase 137 (would require a core type change touching every existing handler's site). Future phases (139 central shim integration) or a v0.30.0 core cleanup can revisit.

**Commit:** `e732c41` (documented inline in class/index.ts with JSDoc rationale comment on the registerNub call).

### Plan verify-regex drift (cosmetic, non-functional)

The plan's `<verify>` block for Task 2 includes `grep -q "registerNub(DOMAIN, handleClassMessage)" packages/nub/src/class/index.ts`. Due to the `as unknown as NubHandler` cast, the exact literal `registerNub(DOMAIN, handleClassMessage)` (with closing paren immediately after the identifier) no longer appears in the file — the line reads `registerNub(DOMAIN, handleClassMessage as unknown as NubHandler);`. The substring `registerNub(DOMAIN, handleClassMessage` still appears (partial match), and the `grep -q "registerNub(DOMAIN, handleClassMessage"` (without trailing paren) check from phase-level verification pattern does match. No functional impact — the handler IS registered; the regex was just too strict relative to TypeScript's parameter contravariance requirement.

## Issues Encountered

No other issues beyond the deviation documented above. Plan executed cleanly per the <action> templates with the single type-system adjustment noted.

### Pre-existing `@napplet/shim` Type Error (carried forward — still Phase 139 scope)

Identical to 137-01 SUMMARY's disclosure: `pnpm -r type-check` fails on `packages/shim/src/index.ts(130,1)` with missing `connect` property on `NappletGlobal`. This was introduced by Phase 136 CORE-02 and remains the designated responsibility of Phase 139 SHIM-01/SHIM-02. Package-scoped check on `@napplet/nub` (the package this plan modifies) passes clean. Not a 137-02 deviation.

## Self-Check: PASSED

- `packages/nub/src/connect/shim.ts` — FOUND
- `packages/nub/src/connect/sdk.ts` — FOUND
- `packages/nub/src/connect/index.ts` — FOUND
- `packages/nub/src/class/shim.ts` — FOUND
- `packages/nub/src/class/sdk.ts` — FOUND
- `packages/nub/src/class/index.ts` — FOUND
- commit `37558f2` (Task 1) — FOUND in git log
- commit `e732c41` (Task 2) — FOUND in git log
- `pnpm --filter @napplet/nub type-check` — exits 0

## Next Plan Readiness

- **Plan 137-03** (package.json + tsup.config.ts subpath wiring) is unblocked — all 8 source files (4 per subpath: types + shim + sdk + index) now exist under `packages/nub/src/{connect,class}/` and can be wired as subpath exports and tsup entry points.
- **Phase 138** (vite-plugin surgery) — `normalizeConnectOrigin` already importable from `@napplet/nub/connect/types` (Plan 01 output). Plan 02 does not change that surface.
- **Phase 139** (central shim + SDK integration) — the `installConnectShim`, `installClassShim`, `handleClassMessage`, `connectGranted`, `connectOrigins`, `getClass` symbols are all exported from their respective barrels and ready for central consumption. The `{ type: string; [key: string]: unknown }` handler-signature contract is locked by this plan's class/shim.ts and matches the resource precedent — the central shim's dispatcher loop will pass envelopes into `handleClassMessage` (imported directly from `@napplet/nub/class`) without needing the NubHandler cast at the consumer site.

---
*Phase: 137-nub-connect-and-nub-class-subpath-scaffolds*
*Completed: 2026-04-21*

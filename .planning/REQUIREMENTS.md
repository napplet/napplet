# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-02
**Milestone:** v0.8.0 Shim/SDK Split
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.8.0 Requirements

### PKG — Package Structure

- [ ] **PKG-01**: `@napplet/shim` has zero named exports — it is a pure window-installer; importing it is a side-effect-only operation
- [ ] **PKG-02**: New `@napplet/sdk` package exists in the monorepo with its own `package.json`, `tsup.config.ts`, and `tsconfig.json`
- [ ] **PKG-03**: `@napplet/sdk` has no dependency on `@napplet/shim` — it wraps `window.napplet.*` at runtime; the two packages are independent siblings

### WIN — Window API Shape

- [ ] **WIN-01**: `window.napplet.relay` exposes `{ subscribe, publish, query }` with existing signatures (no behavior changes)
- [ ] **WIN-02**: `window.napplet.ipc` exposes `{ emit, on }` — napplet↔napplet pubsub through the shell
- [ ] **WIN-03**: `window.napplet.services` exposes `{ list, has }` — `list()` returns `Promise<ServiceInfo[]>`; `has(name, version?)` returns `Promise<boolean>`
- [ ] **WIN-04**: `window.napplet.storage` exposes `{ getItem, setItem, removeItem, keys }` — proxied napplet-scoped persistence

### SDK — SDK Exports

- [ ] **SDK-01**: `@napplet/sdk` exports `relay`, `ipc`, `services`, `storage` as namespaced objects — each mirrors its `window.napplet.*` counterpart exactly
- [ ] **SDK-02**: `@napplet/sdk` exports all public types: `NostrEvent`, `NostrFilter`, `ServiceInfo`, `Subscription`, `EventTemplate`
- [ ] **SDK-03**: `import * as napplet from '@napplet/sdk'` produces an object structurally identical to `window.napplet`

### DEP — Deprecation Removal

- [ ] **DEP-01**: `discoverServices`, `hasService`, `hasServiceVersion` removed from `@napplet/shim` exports (replaced by `window.napplet.services`)
- [ ] **DEP-02**: `nappState`, `nappStorage`, `nappletState` removed from `@napplet/shim` exports (replaced by `window.napplet.storage`)

### ECO — Ecosystem Updates

- [ ] **ECO-01**: Demo napplets updated to use new `window.napplet.relay.*`, `window.napplet.ipc.*`, `window.napplet.storage.*` API
- [ ] **ECO-02**: All tests (Playwright e2e + Vitest unit) updated for new `window.napplet` API shape
- [ ] **ECO-03**: SPEC.md `window.napplet` section updated — namespaced shape documented; `relay`/`ipc`/`services`/`storage` sub-objects defined
- [ ] **ECO-04**: `@napplet/shim` README updated — documents window-only install, new `window.napplet` shape
- [ ] **ECO-05**: `@napplet/sdk` README written — documents namespaced exports, usage with and without bundler, relationship to shim

## Future Requirements

### Relay Targeting (deferred from v0.8.0)

- **REL-FUTURE-01**: `relay.subscribe` / `relay.query` / `relay.publish` accept optional `relays?: string[]` — explicit relay URLs to target
- **REL-FUTURE-02**: `exclusive?: boolean` option controls whether specified relays supplement the pool (`false`, default) or replace it (`true`)

### Deprecation Cleanup (scheduled v0.9.0)

- **DEP-FUTURE-01**: `RuntimeHooks` deprecated alias removed — deprecated in v0.7.0, removal window expires
- **DEP-FUTURE-02**: `ShellHooks` deprecated alias removed — deprecated in v0.7.0, removal window expires

## Out of Scope

| Feature | Reason |
|---------|--------|
| `relays` / `exclusive` option on relay API | Sweeping implications for ShellBridge routing and spec; deferred to dedicated milestone |
| `RuntimeHooks` / `ShellHooks` alias removal | Scheduled for v0.9.0 — migration window must complete first |
| New protocol features | This milestone is restructuring only; no new message types or capabilities |
| npm publish | Blocked on human npm auth; separate milestone |
| NIP-29 scoped relay API changes | Existing `options.relay` / `options.group` on subscribe kept as-is; NIP-29 overhaul is separate |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01 | Phase 41 | Pending |
| PKG-02 | Phase 42 | Pending |
| PKG-03 | Phase 42 | Pending |
| WIN-01 | Phase 41 | Pending |
| WIN-02 | Phase 41 | Pending |
| WIN-03 | Phase 41 | Pending |
| WIN-04 | Phase 41 | Pending |
| SDK-01 | Phase 42 | Pending |
| SDK-02 | Phase 42 | Pending |
| SDK-03 | Phase 42 | Pending |
| DEP-01 | Phase 41 | Pending |
| DEP-02 | Phase 41 | Pending |
| ECO-01 | Phase 43 | Pending |
| ECO-02 | Phase 43 | Pending |
| ECO-03 | Phase 44 | Pending |
| ECO-04 | Phase 44 | Pending |
| ECO-05 | Phase 44 | Pending |

**Coverage:**
- v0.8.0 requirements: 17 total
- Mapped to phases: 17/17
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 — roadmap phase mapping complete*

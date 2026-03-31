# Requirements: Napplet Protocol SDK

**Defined:** 2026-03-31
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.5.0 Requirements

Requirements for Documentation & Developer Skills milestone.

### READMEs

- [ ] **README-01**: Root README.md reflects all 7 packages (`@napplet/shim`, `@napplet/shell`, `@napplet/acl`, `@napplet/core`, `@napplet/runtime`, `@napplet/services`, `@napplet/vite-plugin`) with correct API names and updated architecture diagram
- [ ] **README-02**: `@napplet/shim` README updated — reflects v0.4.0 API (`nappStorage`, `window.napplet`, `discoverServices/hasService/hasServiceVersion`) and removes outdated references
- [ ] **README-03**: `@napplet/shell` README updated — reflects `createShellBridge` factory, `RuntimeHooks`, service registry, and correct package architecture
- [ ] **README-04**: `@napplet/vite-plugin` README updated — reflects `requires` tags injection and v0.4.0 vite-plugin behavior
- [ ] **README-05**: `@napplet/acl` README created — documents bitfield capability API, `AclState`, `AclEntry`, `check()`, mutation functions
- [ ] **README-06**: `@napplet/core` README created — documents shared types (`NostrEvent`, `NostrFilter`, `BusKind`, `ServiceDescriptor`, topics)
- [ ] **README-07**: `@napplet/runtime` README created — documents `createRuntime()`, `RuntimeHooks` interface, `ServiceHandler`/`ServiceRegistry`, discovery protocol
- [ ] **README-08**: `@napplet/services` README created — documents `createAudioService()` and `createNotificationService()` with usage examples

### SPEC

- [ ] **SPEC-01**: Section 11 (kind 29010 service discovery) updated to match implemented protocol — `s`/`v`/`d` tags, sentinel pubkey/sig, live subscription behavior, empty registry → immediate EOSE
- [ ] **SPEC-02**: Any legacy references to `PseudoRelay`/`createPseudoRelay`/`PSEUDO_RELAY_URI` updated to `ShellBridge`/`createShellBridge`/`SHELL_BRIDGE_URI`
- [ ] **SPEC-03**: Section covering manifest `requires` tags and `CompatibilityReport` protocol added or updated (napplet dependency declaration, strict/permissive mode, undeclared service consent)

### Skills

- [ ] **SKILL-01**: `skills/build-napplet/SKILL.md` — agentskills.io-format skill for writing a napplet using `@napplet/shim`: subscribe, publish, nappStorage, window.nostr, service discovery API (`discoverServices`, `hasService`)
- [ ] **SKILL-02**: `skills/integrate-shell/SKILL.md` — agentskills.io-format skill for integrating `@napplet/shell` into a host app: `createShellBridge(hooks)`, `RuntimeHooks` implementation, iframe setup, consent handling, service registration
- [ ] **SKILL-03**: `skills/add-service/SKILL.md` — agentskills.io-format skill for implementing a `ServiceHandler` and registering it: descriptor, `handleMessage(windowId, message, send)`, `onWindowDestroyed`, and wiring into `RuntimeHooks.services`

## Future Requirements

Deferred to post-v0.5.0 milestones.

### Publishing

- **PUB-01**: Publish all @napplet/* packages to npm
- **PUB-02**: @napplet/create CLI / starter template
- **PUB-03**: Deploy demo as production nsite

### Advanced Skills

- **SKILL-04**: skills/acl-capabilities/SKILL.md — per-capability ACL configuration
- **SKILL-05**: skills/storage-proxy/SKILL.md — nappStorage scoping and quota management

### Protocol Hardening

- **HARD-01**: Event-ID triggered aggregate hash revalidation
- **HARD-02**: Salt-based deterministic keypair derivation
- **HARD-03**: Manifest signature verification in shell

## Out of Scope

Explicitly excluded from v0.5.0 with reasoning.

| Feature | Reason |
|---------|--------|
| API reference docs (typedoc/jsdoc site) | JSDoc exists in source; generated reference site is a separate publishing task |
| Changelog / migration guides | Not needed until public npm publish |
| Interactive tutorial / playground docs | Demo app serves this purpose |
| Service ACL (SACL-01/02) | Protocol work, not docs |
| npm publishing | Human auth required, blocked |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| README-01 | Phase 24 | Pending |
| README-02 | Phase 24 | Pending |
| README-03 | Phase 24 | Pending |
| README-04 | Phase 24 | Pending |
| README-05 | Phase 23 | Pending |
| README-06 | Phase 23 | Pending |
| README-07 | Phase 23 | Pending |
| README-08 | Phase 23 | Pending |
| SPEC-01 | Phase 25 | Pending |
| SPEC-02 | Phase 25 | Pending |
| SPEC-03 | Phase 25 | Pending |
| SKILL-01 | Phase 26 | Pending |
| SKILL-02 | Phase 26 | Pending |
| SKILL-03 | Phase 26 | Pending |

**Coverage:**
- v0.5.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-31*

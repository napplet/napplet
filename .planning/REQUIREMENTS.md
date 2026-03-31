# Requirements: Napplet Protocol SDK

**Defined:** 2026-03-31
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.4.0 Requirements

Requirements for Feature Negotiation & Service Discovery milestone.

### Service Discovery Protocol

- [ ] **DISC-01**: Runtime responds to kind 29010 REQ with EVENT per registered service followed by EOSE
- [ ] **DISC-02**: Each discovery response event contains service name, semver version, and optional description (s/v/d tags per SPEC.md Section 11.2)
- [ ] **DISC-03**: Discovery includes both core infrastructure services (relay pool, cache) and optional services (audio, notifications) — unified mechanism
- [ ] **DISC-04**: Shell with no registered services responds with EOSE immediately (zero events)

### Core Types & Utilities

- [ ] **CORE-01**: ServiceDescriptor type lives in @napplet/core (shared by shim, runtime, shell)
- [ ] **CORE-02**: ServiceHandler and ServiceRegistry interfaces live in @napplet/runtime
- [ ] **CORE-03**: Service matching is name-only (presence/absence check) — no semver version ranges

### Runtime Negotiation

- [ ] **NEG-01**: Runtime reads manifest requires tags and checks them against ServiceRegistry at napplet load time
- [ ] **NEG-02**: Runtime raises onCompatibilityIssue hook callback when required services are missing or version-incompatible
- [ ] **NEG-03**: In strict mode, missing required service blocks napplet loading
- [ ] **NEG-04**: In permissive mode (default), missing required service loads napplet with warning — shell host decides UX
- [ ] **NEG-05**: Runtime detects undeclared service usage at dispatch time and raises consent-style warning (same pattern as ConsentRequest for destructive signing kinds)
- [ ] **NEG-06**: Strict/permissive mode is configurable via RuntimeHooks

### Runtime Service Dispatch

- [ ] **DISP-01**: Runtime routes INTER_PANE events to the correct ServiceHandler based on topic prefix ({service-name}:{action})
- [ ] **DISP-02**: Runtime calls ServiceHandler.onWindowDestroyed() on window teardown for per-window state cleanup
- [ ] **DISP-03**: RuntimeHooks accepts a services registry for the shell/host to register service handlers

### Shim Discovery API

- [ ] **SHIM-01**: Napplet can call discoverServices() on a window global and receive typed ServiceInfo[]
- [ ] **SHIM-02**: Napplet can call hasService(name) to check if a specific service is available
- [ ] **SHIM-03**: Napplet can call hasServiceVersion(name, version) to check if discovered service matches a specific version string
- [ ] **SHIM-04**: Discovery API is accessible via window global (same access pattern as window.nostr)

### Manifest & Compatibility

- [x] **COMPAT-01**: Vite plugin injects requires tags (["requires", "service-name", "version-range"]) into NIP-5A manifest
- [ ] **COMPAT-02**: CompatibilityReport with available/missing/incompatible services and compatible boolean is surfaced via runtime hook
- [ ] **COMPAT-03**: Shell host receives compatibility info before napplet starts real work (pre-load or post-AUTH, before first user interaction)

### Concrete Services

- [x] **SVC-01**: Audio service wraps existing audio-manager as a ServiceHandler with descriptor (name: 'audio', version, description)
- [x] **SVC-02**: Audio service uses audio:* topic prefix only — shell:audio-* legacy prefix deleted (alpha, no external consumers)
- [x] **SVC-03**: Notification service implemented as second ServiceHandler (proves the pattern generalizes beyond audio)
- [ ] **SVC-04**: Core infrastructure (relay pool, cache) exposed as discoverable services with descriptors

## Future Requirements

Deferred to post-v0.4.0 milestones.

### Service ACL

- **SACL-01**: Per-service ACL capability strings (service:audio, service:notifications) for fine-grained access control
- **SACL-02**: ACL-gated service discovery (napplet only sees services it has permission for)

### Advanced Negotiation

- **ANEG-01**: Hot-reload service registration (dynamic add/remove at runtime with change notifications)
- **ANEG-02**: Auto-discovery on init (opt-in: shim queries services automatically post-AUTH without napplet code)
- **ANEG-03**: Service dependency graphs (service A requires service B)

### Publishing & Deployment

- **PUB-01**: Publish @napplet/shim, @napplet/shell, @napplet/acl, @napplet/core, @napplet/runtime, @napplet/vite-plugin to npm
- **PUB-02**: Napplet boilerplate / starter template (@napplet/create CLI)
- **PUB-03**: Deploy demo as production nsite (blossom + relay + NIP-5A gateway)

### Protocol Hardening

- **HARD-01**: Event-ID triggered aggregate hash revalidation
- **HARD-02**: Salt-based deterministic keypair derivation
- **HARD-03**: Manifest signature verification in shell

## Out of Scope

Explicitly excluded from v0.4.0 with reasoning.

| Feature | Reason |
|---------|--------|
| Bilateral capability negotiation | Shell is authority, napplet is consumer — asymmetric by design |
| Service installation/provisioning | Shell declares what it provides; napplets adapt, not vice versa |
| Permission prompt UX in the SDK | SDK provides data (CompatibilityReport); shell host owns presentation |
| Complex inter-service dependencies | 1-5 services in practice; DAGs are over-engineering |
| Offline service caching | Discovery is in-process (no network); caching adds state for zero benefit |
| Multiple simultaneous service versions | One version per service name per shell instance |
| Generic extension/plugin system beyond ServiceRegistry | Services ARE the extension mechanism |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 18 | Pending |
| CORE-02 | Phase 18 | Pending |
| CORE-03 | Phase 18 | Pending |
| DISP-01 | Phase 18 | Pending |
| DISP-02 | Phase 18 | Pending |
| DISP-03 | Phase 18 | Pending |
| DISC-01 | Phase 19 | Pending |
| DISC-02 | Phase 19 | Pending |
| DISC-03 | Phase 19 | Pending |
| DISC-04 | Phase 19 | Pending |
| SVC-01 | Phase 20 | Complete |
| SVC-02 | Phase 20 | Complete |
| SVC-03 | Phase 20 | Complete |
| SVC-04 | Phase 22.1 | Pending |
| SHIM-01 | Phase 21 | Pending |
| SHIM-02 | Phase 21 | Pending |
| SHIM-03 | Phase 21 | Pending |
| SHIM-04 | Phase 21 | Pending |
| NEG-01 | Phase 22 | Pending |
| NEG-02 | Phase 22 | Pending |
| NEG-03 | Phase 22 | Pending |
| NEG-04 | Phase 22 | Pending |
| NEG-05 | Phase 22 | Pending |
| NEG-06 | Phase 22 | Pending |
| COMPAT-01 | Phase 22 | Complete |
| COMPAT-02 | Phase 22 | Pending |
| COMPAT-03 | Phase 22 | Pending |

**Coverage:**
- v0.4.0 requirements: 27 total (corrected from initial 24 count)
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*

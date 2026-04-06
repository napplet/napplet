# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-06
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.14.0 Requirements

Requirements for Repo Cleanup & Audit milestone. Audit @napplet for dead code, stale docs, and leftover artifacts from v0.13.0 extraction.

### Source Audit

- [ ] **SRC-01**: No unused exports in packages/core (dead code removed)
- [ ] **SRC-02**: No unused exports in packages/shim, packages/sdk, packages/vite-plugin
- [ ] **SRC-03**: vitest.config.ts cleaned (stale aliases removed)
- [ ] **SRC-04**: turbo.json cleaned (dead test:e2e task removed)

### Docs Audit

- [ ] **DOC-01**: RUNTIME-SPEC.md references to extracted packages updated or removed
- [ ] **DOC-02**: skills/ files updated — @napplet/shell → @kehto/shell, @napplet/services → @kehto/services
- [ ] **DOC-03**: specs/nubs/ references to extracted packages updated
- [ ] **DOC-04**: PRBODY.md and any stray root files cleaned up

### Config Cleanup

- [ ] **CFG-01**: test-results/ directory removed (stale Playwright artifacts)
- [ ] **CFG-02**: Root package.json scripts audited (no references to deleted packages)
- [ ] **CFG-03**: .changeset/config.json verified for 4-package scope

### Migration Candidates

- [ ] **MIG-01**: Audit report identifying any remaining code/docs that belong in @kehto
- [ ] **MIG-02**: specs/nubs/ evaluated — stay in @napplet or move to napplet/nubs repo
- [ ] **MIG-03**: skills/ evaluated — which skills belong in @napplet vs @kehto

## Future Requirements

- Publish @napplet packages to npm (PUB-04 from v0.13.0)
- Remove kehto workspace override after npm publish (KEHTO-04)
- @kehto CI/CD setup

## Out of Scope

| Feature | Reason |
|---------|--------|
| Moving specs/nubs/ to nubs repo | Evaluation only — actual move is separate task |
| @kehto cleanup | Kehto's own milestone |
| npm publish | Blocked on human auth, not a cleanup concern |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRC-01 | — | Pending |
| SRC-02 | — | Pending |
| SRC-03 | — | Pending |
| SRC-04 | — | Pending |
| DOC-01 | — | Pending |
| DOC-02 | — | Pending |
| DOC-03 | — | Pending |
| DOC-04 | — | Pending |
| CFG-01 | — | Pending |
| CFG-02 | — | Pending |
| CFG-03 | — | Pending |
| MIG-01 | — | Pending |
| MIG-02 | — | Pending |
| MIG-03 | — | Pending |

**Coverage:**
- v0.14.0 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after initial definition*

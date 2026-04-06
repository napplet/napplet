# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-06
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.13.0 Requirements

Requirements for Runtime Decoupling & Publish milestone. Extract runtime/shell/acl/services/demo into @kehto org, clean up @napplet for npm publish.

### Kehto Bootstrap

- [x] **KEHTO-01**: ~/Develop/kehto initialized as pnpm monorepo with turborepo, tsconfig, ESM-only config
- [x] **KEHTO-02**: @kehto/acl, @kehto/runtime, @kehto/shell, @kehto/services packages created with correct package.json
- [x] **KEHTO-03**: Source copied from @napplet with internal imports updated to @kehto/*
- [x] **KEHTO-04**: @napplet/core consumed as npm dependency (published from @napplet repo)
- [x] **KEHTO-05**: Demo playground copied and running against @kehto packages
- [x] **KEHTO-06**: Relevant Playwright e2e and Vitest tests copied and passing
- [x] **KEHTO-07**: pnpm build + pnpm type-check succeeds in kehto monorepo
- [x] **KEHTO-08**: PROJECT.md and .planning/ seeded for future /gsd:new-project

### Napplet Cleanup

- [x] **CLEAN-01**: packages/acl, packages/runtime, packages/shell, packages/services removed from @napplet
- [x] **CLEAN-02**: demo/ directory removed from @napplet
- [x] **CLEAN-03**: pnpm workspace, turborepo, root tsconfig updated for 4 packages (core, shim, sdk, vite-plugin)
- [x] **CLEAN-04**: pnpm build + pnpm type-check succeeds with 4-package monorepo

### Publish @napplet

- [x] **PUB-01**: GitHub Actions CI workflow: type-check, build on PR
- [x] **PUB-02**: GitHub Actions publish workflow: changesets version + npm publish
- [x] **PUB-03**: changesets configured for @napplet scope
- [ ] **PUB-04**: @napplet packages published to npm (core, shim, sdk, vite-plugin)

### Documentation

- [x] **DOC-01**: Root README updated for 4-package @napplet SDK with kehto cross-reference
- [x] **DOC-02**: Package READMEs (core, shim, sdk, vite-plugin) updated to reference @kehto for runtime/shell needs

## Future Requirements

- @kehto CI/CD workflow and npm publishing
- NIP-5D PR submission to nostr-protocol/nips
- Package alignment with NIP-5D (remove signer proxy kinds 29001/29002)
- Channel/pipe protocol implementation (NUB-PIPES)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Publishing @kehto to npm | Kehto's own milestone |
| @kehto CI/CD workflow | Kehto's own milestone |
| NIP-5D PR submission | Separate concern, not blocked on this |
| NUB governance (NUB-01/02/03) | Lives at github.com/napplet/nubs (~/Develop/nubs) |
| Moving specs/nubs/ to nubs repo | Separate task, not part of this milestone |
| Package alignment with NIP-5D | Post-split cleanup in future milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KEHTO-01 | Phase 62 | Complete |
| KEHTO-02 | Phase 62 | Complete |
| KEHTO-03 | Phase 63 | Complete |
| KEHTO-04 | Phase 67 | Complete |
| KEHTO-05 | Phase 64 | Complete |
| KEHTO-06 | Phase 64 | Complete |
| KEHTO-07 | Phase 63 | Complete |
| KEHTO-08 | Phase 62 | Complete |
| CLEAN-01 | Phase 65 | Complete |
| CLEAN-02 | Phase 65 | Complete |
| CLEAN-03 | Phase 65 | Complete |
| CLEAN-04 | Phase 65 | Complete |
| PUB-01 | Phase 66 | Complete |
| PUB-02 | Phase 66 | Complete |
| PUB-03 | Phase 66 | Complete |
| PUB-04 | Phase 66 | Pending |
| DOC-01 | Phase 67 | Complete |
| DOC-02 | Phase 67 | Complete |

**Coverage:**
- v0.13.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after roadmap creation*

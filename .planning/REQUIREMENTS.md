# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-06
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.13.0 Requirements

Requirements for Runtime Decoupling & Publish milestone. Extract runtime/shell/acl/services/demo into @kehto org, clean up @napplet for npm publish.

### Kehto Bootstrap

- [ ] **KEHTO-01**: ~/Develop/kehto initialized as pnpm monorepo with turborepo, tsconfig, ESM-only config
- [ ] **KEHTO-02**: @kehto/acl, @kehto/runtime, @kehto/shell, @kehto/services packages created with correct package.json
- [ ] **KEHTO-03**: Source copied from @napplet with internal imports updated to @kehto/*
- [ ] **KEHTO-04**: @napplet/core consumed as npm dependency (published from @napplet repo)
- [ ] **KEHTO-05**: Demo playground copied and running against @kehto packages
- [ ] **KEHTO-06**: Relevant Playwright e2e and Vitest tests copied and passing
- [ ] **KEHTO-07**: pnpm build + pnpm type-check succeeds in kehto monorepo
- [ ] **KEHTO-08**: PROJECT.md and .planning/ seeded for future /gsd:new-project

### Napplet Cleanup

- [ ] **CLEAN-01**: packages/acl, packages/runtime, packages/shell, packages/services removed from @napplet
- [ ] **CLEAN-02**: demo/ directory removed from @napplet
- [ ] **CLEAN-03**: pnpm workspace, turborepo, root tsconfig updated for 4 packages (core, shim, sdk, vite-plugin)
- [ ] **CLEAN-04**: pnpm build + pnpm type-check succeeds with 4-package monorepo

### Publish @napplet

- [ ] **PUB-01**: GitHub Actions CI workflow: type-check, build on PR
- [ ] **PUB-02**: GitHub Actions publish workflow: changesets version + npm publish
- [ ] **PUB-03**: changesets configured for @napplet scope
- [ ] **PUB-04**: @napplet packages published to npm (core, shim, sdk, vite-plugin)

### Documentation

- [ ] **DOC-01**: Root README updated for 4-package @napplet SDK with kehto cross-reference
- [ ] **DOC-02**: Package READMEs (core, shim, sdk, vite-plugin) updated to reference @kehto for runtime/shell needs

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
| KEHTO-01 | — | Pending |
| KEHTO-02 | — | Pending |
| KEHTO-03 | — | Pending |
| KEHTO-04 | — | Pending |
| KEHTO-05 | — | Pending |
| KEHTO-06 | — | Pending |
| KEHTO-07 | — | Pending |
| KEHTO-08 | — | Pending |
| CLEAN-01 | — | Pending |
| CLEAN-02 | — | Pending |
| CLEAN-03 | — | Pending |
| CLEAN-04 | — | Pending |
| PUB-01 | — | Pending |
| PUB-02 | — | Pending |
| PUB-03 | — | Pending |
| PUB-04 | — | Pending |
| DOC-01 | — | Pending |
| DOC-02 | — | Pending |

**Coverage:**
- v0.13.0 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after initial definition*

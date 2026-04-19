# Requirements: Napplet Protocol SDK — v0.26.0 Better Packages

**Defined:** 2026-04-19
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## Milestone v0.26.0 Requirements

Consolidate the 9 separate `@napplet/nub-*` packages into a single tree-shakable `@napplet/nub` package with layered subpath exports. Preserve every existing import surface by shipping the old packages as deprecation re-export shims for one release cycle.

### Package Structure

- [x] **PKG-01**: New `@napplet/nub` package at `packages/nub/` with 9 domain subdirectories (relay, storage, ifc, keys, theme, media, notify, identity, config)
- [x] **PKG-02**: `@napplet/nub` declares `@napplet/core` as its sole runtime dep; preserves `json-schema-to-ts` as optional peerDep (for config domain's `FromSchema` inference)
- [x] **PKG-03**: `@napplet/nub` publishes with `sideEffects: false` so every subpath is tree-shakable

### Subpath Exports

- [x] **EXP-01**: Per-domain barrel subpath `@napplet/nub/<domain>` re-exports `{ types, shim, sdk }` for each of the 9 domains
- [x] **EXP-02**: Granular subpaths `@napplet/nub/<domain>/types`, `@napplet/nub/<domain>/shim`, `@napplet/nub/<domain>/sdk` are individually importable for each of the 9 domains (27 granular entry points total)
- [x] **EXP-03**: `package.json` `exports` field maps all 36 entry points (9 barrels + 27 granular) with `types` + `import` conditions
- [x] **EXP-04**: No root `@napplet/nub` import — consumers MUST use a domain subpath (prevents accidental whole-tree imports)

### Build

- [x] **BUILD-01**: `tsup` config emits one ESM file per entry point with co-located `.d.ts`
- [x] **BUILD-02**: Build completes with zero TypeScript errors; every subpath emits a `.d.ts`

### Deprecation Shims

- [x] **MIG-01**: Each of the 9 `@napplet/nub-<domain>` packages keeps its published name and becomes a 1-line re-export of `@napplet/nub/<domain>` (zero behavioral change for existing consumers)
- [x] **MIG-02**: Each deprecated package adds a top-of-README deprecation banner pointing to `@napplet/nub/<domain>` and states the removal milestone
- [x] **MIG-03**: Each deprecated package adds `@deprecated` to its `package.json` description + publishes one more version

### Internal Consumer Migration

- [x] **CONS-01**: `@napplet/shim` imports from `@napplet/nub/<domain>/shim` paths instead of `@napplet/nub-<domain>`
- [x] **CONS-02**: `@napplet/sdk` imports from `@napplet/nub/<domain>` barrels instead of `@napplet/nub-<domain>` (preserving its `export * as <domain>` pattern)
- [x] **CONS-03**: Any in-repo demo/test consumers migrated to the new paths

### Documentation

- [x] **DOC-01**: New `@napplet/nub` README covering install, 9-domain layout, subpath pattern (barrel vs granular), and tree-shaking contract
- [x] **DOC-02**: Root README, `@napplet/core` README, `@napplet/shim` README, `@napplet/sdk` README updated to reference `@napplet/nub/<domain>` paths
- [x] **DOC-03**: NIP-5D reference (where it shows example imports) updated to new paths
- [x] **DOC-04**: Skills directory (`skills/`) updated to reference `@napplet/nub/<domain>` in examples

### Verification

- [ ] **VER-01**: Full monorepo `pnpm build` + `pnpm type-check` exits 0 across all packages (new + deprecated shims + unchanged)
- [ ] **VER-02**: Subpath tree-shaking verified — a minimal consumer importing only `@napplet/nub/relay/types` produces a bundle containing none of the other 8 domains' code
- [ ] **VER-03**: Old `@napplet/nub-<domain>` packages still import + type-check under their deprecation shim (no breakage for pinned consumers)

## Future Requirements

Deferred to a later milestone.

### Deprecation Removal

- **REMOVE-01**: Delete the 9 `@napplet/nub-<domain>` packages from the repo
- **REMOVE-02**: Remove the deprecated packages from the publish workflow and `pnpm-workspace.yaml`
- **REMOVE-03**: Remove all deprecation banners / `@deprecated` metadata references

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Changes to wire protocol or NIP-5D envelope shape | Pure packaging refactor — no behavioral/protocol changes |
| Merging `@napplet/shim` + `@napplet/sdk` | User scoped consolidation to NUBs only |
| Merging `@napplet/core` into `@napplet/nub` | Core stays standalone (zero-dep protocol types) |
| Merging `@napplet/vite-plugin` into `@napplet/nub` | Build-time plugin; different publish/consume axis from runtime NUBs |
| Deleting the deprecated `@napplet/nub-<domain>` packages | Deferred to `REMOVE-01..03` so one release ships both paths |
| Publishing `@napplet/nub` to npm | `PUB-04` blocker from v0.13.0 still carries — out of scope here |
| Adding new NUB domains | None planned this milestone |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01      | 117   | Complete |
| PKG-02      | 117   | Complete |
| PKG-03      | 117   | Complete |
| EXP-01      | 117   | Complete |
| EXP-02      | 117   | Complete |
| EXP-03      | 117   | Complete |
| EXP-04      | 117   | Complete |
| BUILD-01    | 117   | Complete |
| BUILD-02    | 117   | Complete |
| MIG-01      | 118   | Complete |
| MIG-02      | 118   | Complete |
| MIG-03      | 118   | Complete |
| CONS-01     | 119   | Complete |
| CONS-02     | 119   | Complete |
| CONS-03     | 119   | Complete |
| DOC-01      | 120   | Complete |
| DOC-02      | 120   | Complete |
| DOC-03      | 120   | Complete |
| DOC-04      | 120   | Complete |
| VER-01      | 121   | Pending |
| VER-02      | 121   | Pending |
| VER-03      | 121   | Pending |

**Coverage:**
- v0.26.0 requirements: 22 total
- Mapped to phases: 22 ✓
- Unmapped: 0

**Phase distribution:**
- Phase 117 (@napplet/nub Package Foundation): 9 requirements (PKG-01..03, EXP-01..04, BUILD-01..02)
- Phase 118 (Deprecation Re-Export Shims): 3 requirements (MIG-01..03)
- Phase 119 (Internal Consumer Migration): 3 requirements (CONS-01..03)
- Phase 120 (Documentation Update): 4 requirements (DOC-01..04)
- Phase 121 (Verification & Sign-Off): 3 requirements (VER-01..03)

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 — traceability filled by roadmapper (22/22 mapped across phases 117-121)*

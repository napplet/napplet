# Phase 138 — Deferred Items

## `@napplet/shim` DTS build fails — pre-existing, out of scope for Phase 138

**Discovered during:** Plan 138-02 Task 4 post-commit monorepo build verification.

**Error:**

```
packages/shim/src/index.ts(130,1): error TS2741: Property 'connect' is missing in type '{ relay: ... }' but required in type 'NappletGlobal'.
```

**Root cause:** Phase 136-01 commit `b8f214e` (`feat(136-01): add connect namespace and class?: number to NappletGlobal`) added a required `connect: NappletConnect` field to `NappletGlobal` in `packages/core/src/types.ts` without updating the `window.napplet` literal assembly in `packages/shim/src/index.ts`. This predates Phase 138 by one wave and is unrelated to the vite-plugin surgery.

**Why deferred (not auto-fixed):**

- Files outside the Plan 138-02 `files_modified` scope (`packages/shim/src/index.ts` is not listed).
- This is `SHIM-01` / `SHIM-02` in `.planning/REQUIREMENTS.md` — explicitly scheduled for Phase 139 (`Central Shim + SDK Integration`).
- Fixing it here would duplicate work that Phase 139 plans are already authored to do and would widen Plan 138-02's commit scope.

**Verified not caused by Phase 138 work:** The failing type error references `NappletGlobal`'s `connect` field, which is added in `packages/core/src/types.ts`, not in `packages/vite-plugin/src/index.ts`. Plan 138-02 touched only the vite-plugin. The shim has been in this broken state since the Phase 136-01 commit landed.

**Verification after Plan 138-02 closes:**

- `pnpm --filter @napplet/vite-plugin build` → exit 0 ✓
- `pnpm --filter @napplet/vite-plugin type-check` → exit 0 ✓
- `pnpm build` (monorepo) → fails on `@napplet/shim#build` only; all other packages (`@napplet/core`, `@napplet/nub`, `@napplet/vite-plugin`, all nub-*) build cleanly.

**Resolution path:** Phase 139 plans `SHIM-01`, `SHIM-02` (connect wiring) and `SHIM-03`, `SHIM-04` (class wiring) will install `installConnectShim()` / `installClassShim()` and add the `connect: { granted: false, origins: [] }` block to the shim's `window.napplet` literal. That work is blocked on Phase 138 (vite-plugin) only because both land in Wave 2.

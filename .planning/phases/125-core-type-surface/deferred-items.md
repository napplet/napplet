# Deferred Items — Phase 125

## DEF-125-01: `@napplet/shim` workspace type-check failure (expected, planned)

**Found during:** Phase 125 plan 01 final verification (`pnpm -r type-check`)

**Symptom:**
```
packages/shim type-check: src/index.ts(118,1): error TS2741:
  Property 'resource' is missing in type '{ relay: ..., ifc: ..., ... }'
  but required in type 'NappletGlobal'.
```

**Cause:** Phase 125 widened `NappletGlobal` to add a required `resource` namespace. The shim's `window.napplet` object literal in `packages/shim/src/index.ts` does not yet provide a `resource` property. This is by design per the plan's explicit scope: Phase 125 only modifies `@napplet/core`; the shim is wired in Phase 128 (Central Shim Integration, SHIM-01..03).

**Status:** Expected planned breakage. Plan 125-01 success criterion #7 explicitly says "No runtime behavior added; no other packages modified," and the plan's `<verification>` section only requires `pnpm --filter @napplet/core` to pass.

**Resolution:** Phase 128 (Central Shim Integration) will add the resource shim wiring at which point `pnpm -r type-check` will go green again. Phase 126 (Resource NUB Scaffold) and Phase 127 (NUB-RELAY Sidecar) do not modify the shim either, so this temporary workspace-level breakage persists for ~3 phases.

**Mitigation while broken:** Continue using `pnpm --filter @napplet/core` for per-package validation; avoid `pnpm -r type-check` as a gating signal until Phase 128 lands.

**Follow-up:** Confirm Phase 128 plan includes SHIM-01 work that adds `resource: { bytes, bytesAsObjectURL }` to the shim's `window.napplet` literal.

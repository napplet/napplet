---
'@napplet/nub-config': minor
'@napplet/nub-identity': minor
'@napplet/nub-ifc': minor
'@napplet/nub-keys': minor
'@napplet/nub-media': minor
'@napplet/nub-notify': minor
'@napplet/nub-relay': minor
'@napplet/nub-storage': minor
'@napplet/nub-theme': minor
---

Convert all 9 `@napplet/nub-<domain>` packages into 1-line re-export shims that forward to `@napplet/nub/<domain>`.

- Source reduced to a single `index.ts` per package (`export * from '@napplet/nub/<domain>';` with `@deprecated` JSDoc).
- `package.json` `description` prefixed with `[DEPRECATED]` and names the new `@napplet/nub/<domain>` import path.
- Runtime dependency switched from `@napplet/core` to `@napplet/nub` (the new package transitively depends on core).
- README on each package carries a top deprecation banner pointing at `@napplet/nub/<domain>` and flagging removal in a future milestone.
- `@napplet/nub-config` preserves its optional `json-schema-to-ts` peerDep and `@types/json-schema` devDep — API-surface contracts are unchanged behind the shim.

Zero behavioral change for pinned consumers — `export *` preserves types, runtime exports, and the `registerNub` side effect (which now lives in `@napplet/nub/<domain>`).

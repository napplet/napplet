# Deferred Items

## 162-01

- `pnpm dlx aislop@0.12.0 scan --changes --base origin/main .` reports an unused `randomBytes` import in `.planning/spikes/001-blossom-build-optimization/prototype.mjs` and known dependency advisories for `js-yaml`, `nanoid`, and `postcss` in the unowned root dependency set. These pre-date and are outside the Plan 162-01 Vite-plugin implementation; no unrelated changes were made.

## 162-09

- `pnpm dlx aislop@0.12.0 scan --json packages/vite-plugin/src` reports a style-only `complexity/function-too-long` warning for `createNodeOptimizationServices` in `packages/vite-plugin/src/optimizer/node-services.ts:107`. That Plan 162-08 file was not changed by 162-09; the live orchestration files have no format, lint, AI-slop, or security findings.

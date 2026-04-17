---
status: passed
phase: 114-vite-plugin-extension
score: 7/7
date: 2026-04-17
method: manual (orchestrator — all acceptance greps + build + monorepo type-check green)
---

# Phase 114 Verification — Vite-Plugin Extension

## Phase Goal
`@napplet/vite-plugin` accepts a `configSchema` option (with convention-file and `napplet.config.ts` discovery fallbacks), embeds the schema into the kind 35128 NIP-5A manifest as a `['config', …]` tag, includes the schema bytes in `aggregateHash` via a synthetic path prefix, injects a `<meta name="napplet-config-schema">` tag into `index.html`, and rejects malformed schemas at build time.

## Must-Haves — 7/7 Passed

| REQ | Plan | Verified |
|-----|------|----------|
| VITE-01 (inline option) | 114-01 | ✓ `Nip5aManifestOptions.configSchema?` accepts schema object or path string |
| VITE-02 (config.schema.json convention) | 114-01 | ✓ Fallback implemented when option absent |
| VITE-03 (napplet.config.ts export) | 114-01 | ✓ Dynamic import of `configSchema` named export |
| VITE-04 (manifest tag) | 114-03 | ✓ `['config', JSON.stringify(schema)]` emitted on kind 35128 |
| VITE-05 (aggregateHash) | 114-03 | ✓ Synthetic `config:schema` path in hash stream; filtered out of `['x', ...]` tag projection |
| VITE-06 (meta injection) | 114-03 | ✓ `<meta name="napplet-config-schema">` via `transformIndexHtml` |
| VITE-07 (build-time guards) | 114-02 | ✓ `validateConfigSchema` rejects: non-object root, external `$ref`, `pattern`, secret+default — with NUB-CONFIG spec error-code messages |

## Build/Type-Check Gate
- `pnpm --filter @napplet/vite-plugin build` → exit 0 (ESM 10.38 KB + DTS 2.66 KB + sourcemap)
- `pnpm type-check` (full monorepo, 13 packages, 22 turbo tasks) → all cached, all green

## Backward Compatibility
- When `resolvedSchema === null`: no config tag, no meta tag, no hash contribution → byte-identical to pre-phase-114 manifest output

## File State
- `packages/vite-plugin/src/index.ts` — 557 LOC (was 328 pre-phase)
- 34 occurrences of phase-114 tokens (`configSchema`, `config.schema.json`, `napplet-config-schema`, `config:schema`, `validateConfigSchema`) confirm integration density

**Status: passed** — Phase 114 goal achieved. Proceed to Phase 115.

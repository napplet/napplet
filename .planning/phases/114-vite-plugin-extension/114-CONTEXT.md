# Phase 114: Vite-Plugin Extension - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Extend `@napplet/vite-plugin` to accept a `configSchema` option, discover schemas via three paths (inline option / `config.schema.json` convention file / `napplet.config.ts` export), embed the schema into the NIP-5A manifest as a `['config', JSON.stringify(schema)]` tag, include schema bytes in `aggregateHash` via a synthetic `config:schema` path prefix, inject `<meta name="napplet-config-schema">` into index.html, and reject malformed schemas at build time (structural guards).

Addresses requirements VITE-01..07.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

Build-time structural guards (VITE-07) must reject:
- Schema root is not `{ type: "object" }`
- External `$ref` (anything not starting with `#/`)
- `pattern` keyword anywhere in schema
- `x-napplet-secret: true` combined with `default`

Use `@types/json-schema` devDep for TypeScript types (already available via workspace). No runtime validator library — structural guards are a ~40-line hand-rolled traversal.

### Discovery precedence (VITE-01/02/03)
1. Inline `configSchema` option wins
2. Fallback to `config.schema.json` at napplet project root
3. Fallback to `napplet.config.ts` / `.js` export named `configSchema`
4. If none found, no config tag or meta emitted (backward compatible — napplets without config still work)

### aggregateHash contribution (VITE-05)
Use synthetic path `config:schema` prefix in the existing aggregateHash file-enumeration loop. Schema bytes hashed into the same stream so any schema change bumps the aggregateHash.

### Manifest tag format (VITE-04)
Single tag on the kind 35128 event: `['config', JSON.stringify(schema)]`. Placed between existing `x` tags and `requires` tags in the tag array.

### Meta tag injection (VITE-06)
`<meta name="napplet-config-schema" content="{JSON-escaped schema}">` injected into built `index.html` head via HTML transform hook. JSON.stringify then HTML-escape quotes.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/vite-plugin/src/index.ts` — current manifest generation + aggregateHash computation (main edit target)
- `packages/vite-plugin/package.json` — workspace package config
- `packages/vite-plugin/README.md` — documents existing options (will be updated in phase 116)

### Established Patterns
- Vite plugin exports `nip5aManifest(options: Nip5aManifestOptions)` factory
- Plugin hooks: `config`, `configResolved`, `buildStart`, `generateBundle`, `transformIndexHtml`
- aggregateHash is computed over enumerated project files + meta
- nostr-tools used for event kind 35128 generation

### Integration Points
- `configSchema` option added to `Nip5aManifestOptions` type
- Plugin hooks: `configResolved` (read option + discover files), `buildStart` (validate guards), `generateBundle` (add manifest tag), `transformIndexHtml` (inject meta tag)
- `aggregateHash` computation updated to include `config:schema` synthetic path

</code_context>

<specifics>
## Specific Ideas

Structural guard implementation should be a single function `validateConfigSchema(schema: unknown): { ok: true } | { ok: false, errors: string[] }` that:
- Recursively walks properties
- Checks root `type === 'object'`
- Rejects any key named `pattern`
- Rejects any `$ref` not starting with `#/`
- Rejects any property with both `x-napplet-secret: true` and `default` present

Error messages should match the error codes in the NUB-CONFIG spec (`schema-too-deep`, `secret-with-default`, etc.) so build errors use consistent vocabulary.

</specifics>

<deferred>
## Deferred Ideas

None — phase is self-contained. Phase 115 wires `'config'` into NubDomain and mounts installConfigShim; Phase 116 documents the new vite-plugin option.

</deferred>

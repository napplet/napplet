# Phase 116: Documentation - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning
**Mode:** Auto-generated (documentation phase — discuss skipped)

<domain>
## Phase Boundary

All repository documentation reflects the addition of NUB-CONFIG:
1. Create `packages/nubs/config/README.md` — package purpose, install, window.napplet.config API surface, example schema, SDK usage, `FromSchema` type inference pattern
2. Update the NIP-5D "Known NUBs" table in /home/sandwich/Develop/nubs/NIP-5D.md (or wherever it lives in the public nubs repo) with a `config` row — spec number only, no `@napplet/*` references (PUBLIC repo rule)
3. Update `packages/core/README.md` — list `'config'` in NubDomain table
4. Update `packages/shim/README.md` — document `window.napplet.config` namespace
5. Update `packages/sdk/README.md` — document `config` SDK exports + `FromSchema` pattern
6. Update `packages/vite-plugin/README.md` — document `configSchema` option + convention-file + napplet.config.ts paths

Addresses requirements DOC-01..06.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All documentation wording at Claude's discretion. Match the existing README tone and structure from prior NUB packages (identity, notify, media). Include one concrete example schema in the nub-config README so authors can copy-paste.

### Repo boundaries
- NIP-5D lives in the PUBLIC napplet/nubs repo — NO @napplet/* references. Update via the `nub-config` branch (same branch used for NUB-CONFIG.md) OR a fresh branch if needed. Check where NIP-5D.md currently lives.
- All other READMEs are in this private napplet repo — @napplet/* references fine.

### Content to include in nub-config README
- Install (`pnpm add @napplet/nub-config`)
- Usage — manifest-driven path (via vite-plugin configSchema)
- Usage — runtime path (config.registerSchema)
- API reference (get, subscribe, openSettings, onSchemaError, schema)
- FromSchema type inference example (opt-in via json-schema-to-ts peer)
- Link to the public NUB-CONFIG spec (by spec URL only, not @napplet/*)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/nubs/identity/README.md` — most recent NUB README, template
- `packages/nubs/notify/README.md` — alternate template
- `packages/core/README.md` — existing NubDomain table (add config row)
- `packages/shim/README.md` — existing window.napplet namespace docs
- `packages/sdk/README.md` — existing SDK surface docs
- `packages/vite-plugin/README.md` — existing options docs
- /home/sandwich/Develop/nubs/ — public repo; check location of NIP-5D.md

### Established Patterns
- Package READMEs have: title, one-line purpose, Install, Usage, API, Examples
- Tables show Domain / Spec / Status rows for NUB registry

### Integration Points
- No code changes in this phase — purely markdown edits

</code_context>

<specifics>
## Specific Ideas

For the public NIP-5D table row in nubs repo: `| config | [NUB-CONFIG](NUB-CONFIG.md) | draft |` (format to match existing rows in that file).

For nub-config README FromSchema example:
```ts
import type { FromSchema } from 'json-schema-to-ts';
import { subscribe } from '@napplet/nub-config';

const schema = {
  type: 'object',
  properties: {
    theme: { type: 'string', enum: ['light', 'dark'], default: 'dark' },
  },
  required: ['theme'],
} as const;

type MyConfig = FromSchema<typeof schema>;

subscribe((values: MyConfig) => {
  // values.theme is typed as 'light' | 'dark'
});
```

</specifics>

<deferred>
## Deferred Ideas

None — this is the final phase of v0.25.0.

</deferred>

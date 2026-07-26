---
phase: quick-260726-ici
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/core/src/types/fs.ts
  - packages/core/src/types.ts
  - packages/core/src/types/global/service-api.ts
  - packages/core/src/types/global.ts
  - packages/core/src/envelope.ts
  - packages/core/src/index.test.ts
  - packages/nap/src/fs/types.ts
  - packages/nap/src/fs/shim.ts
  - packages/nap/src/fs/sdk.ts
  - packages/nap/src/fs/index.ts
  - packages/nap/src/fs/shim.test.ts
  - packages/nap/package.json
  - packages/nap/jsr.json
  - packages/nap/tsup.config.ts
  - packages/nap/README.md
  - packages/shim/src/runtime.ts
  - packages/sdk/src/nap-runtime.ts
  - packages/sdk/src/nap-types.ts
  - packages/sdk/src/services.ts
  - packages/sdk/src/index.ts
  - packages/conformance/src/validators/envelope.ts
  - packages/conformance/src/validators/envelope.test.ts
  - packages/conformance/src/shell/reference-shell.ts
  - packages/vite-plugin/src/requirements.ts
  - packages/cli/src/manifest-metadata.ts
  - packages/skills/src/index.test.ts
  - apps/docs/naps/index.md
  - apps/docs/packages/core.md
  - apps/docs/packages/nap.md
  - README.md
autonomous: true
requirements: [QUICK-260726-ici]

must_haves:
  truths:
    - "A napplet author can call the 8 byte-free NAP-FS operations through `window.napplet.fs`, `@napplet/nap/fs`, or `@napplet/sdk`."
    - "A napplet author can subscribe to runtime-pushed `fs.changed` events and receive `FsChange` payloads."
    - "Every `fs.*` discriminant that ships is present in the NAP-FS Wire Protocol table; nothing else is."
    - "`read` / `write` are absent from every layer, and the reason (undefined `bstr` encoding on the JSON envelope) is discoverable from the source and the package README."
    - "The conformance envelope validator accepts spec-shaped `fs.*` envelopes and the reference shell answers every `fs.*` request."
    - "`fs` appears everywhere the other active domains appear (core domain union, requirement inference, manifest metadata, skills, docs)."
  artifacts:
    - packages/core/src/types/fs.ts
    - packages/nap/src/fs/types.ts
    - packages/nap/src/fs/shim.ts
    - packages/nap/src/fs/sdk.ts
    - packages/nap/src/fs/index.ts
    - packages/nap/src/fs/shim.test.ts
    - .changeset/nap-fs-mvp.md
  key_links:
    - "`NAP_DOMAINS` includes 'fs' -> shim `installGlobal` injects `window.napplet.fs` -> conformance drift guard requires ENVELOPE_SPECS entries."
    - "`DOMAIN_ROUTERS` entry `['fs.', handleFsMessage]` is the only path by which runtime results reach pending fs promises."
    - "`packages/nap/package.json` exports and `packages/nap/jsr.json` exports must stay identical (`pnpm check:jsr` enforces it)."
---

<objective>
Implement the first MVP of NAP-FS (domain `fs`) across the napplet packages: the 8 byte-free operations (`info`, `stat`, `list`, `mkdir`, `remove`, `move`, `watch`, `unwatch`) plus the runtime-pushed `fs.changed` event.

Purpose: give napplet authors a typed, spec-faithful client binding for the shell-mediated virtual filesystem while the byte-carrying half of the spec is blocked upstream.

Output: a new `fs` NAP domain in `@napplet/core`, `@napplet/nap`, `@napplet/shim`, and `@napplet/sdk`; conformance envelope specs and reference-shell responses; tooling/docs/skills registration; one changeset. Three atomic commits on the existing `feat/nap-fs` branch.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md

Canonical spec (read it before writing any type or message name — do NOT work from this plan's paraphrase alone):
- `gh pr diff 88 --repo napplet/naps`
- read-only cache OUTSIDE the repo: `/tmp/claude-1000/-home-user-Projects-napplet-web/bf4d268e-65df-408b-90c6-be3b81201697/scratchpad/NAP-FS.diff`
- Do NOT copy the spec text into the repo (CLAUDE.md rule 5).

Structural template — the `serial` domain, landed the same way:
@packages/nap/src/serial/types.ts
@packages/nap/src/serial/shim.ts
@packages/nap/src/serial/sdk.ts
@packages/nap/src/serial/index.ts
@packages/nap/src/serial/shim.test.ts
@packages/core/src/types/serial.ts
</context>

<protocol_fidelity_contract>
CLAUDE.md's "Protocol fidelity — non-negotiable" section binds every task below. Concretely, for this work:

1. Every message type, field name, and enum value MUST come from the NAP-FS text. No field the spec does not define.
2. `read` and `write` are DEFERRED and MUST NOT appear as message types, `FsApi` methods, SDK helpers, shim handlers, conformance entries, or reference-shell responders. Blocked upstream: <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>.
   Rationale to preserve in the source comment and README: NAP-FS declares those payloads as `bstr` but never defines how `bstr` is encoded on NIP-5D's JSON envelope (its examples use a bytes placeholder). NAP-SERIAL closes that gap explicitly; NAP-FS does not. Picking an encoding here would be inventing wire surface.
3. Schema types tied ONLY to the deferred operations are also out of scope: the read-options, read-result, write-options, write-result, and write-mode shapes. `FsMkdirOptions` and `FsWatchOptions` ARE in scope (mkdir/watch use them). `FsLimits.maxReadBytes` and `maxWriteBytes` stay — the spec makes them required fields of `FsInfo` and they are advisory discovery data, not operations.
4. Add NO conformance check and NO build-time hard error that a spec-faithful napplet would trip. Conformance work here is envelope-shape validation plus reference-shell responses only.
5. `FsError` is a CLOSED enum in the spec — type it as a string-literal union, never as bare `string`.
6. If you find a gap between this plan and the canonical text, the SPEC wins. Stop and flag rather than inventing.

**One local-binding note, not protocol:** the JS callback registration name for `fs.changed` pushes (`onChange`) is a package-local ergonomic binding — it constrains nothing on the wire. Use `onChange` as specified below. Existing repo precedent for `<domain>.changed` pushes is `onChanged` (theme, identity, intent); record that naming observation in the task summary for the user, do not silently switch.
</protocol_fidelity_contract>

<wire_surface>
The exact and complete surface this MVP ships (from the NAP-FS Wire Protocol table). 8 outbound, 9 inbound, 17 total.

| Type | Direction | Payload fields |
|------|-----------|----------------|
| `fs.info` | out | `id` |
| `fs.info.result` | in | `id`, `info?`, `error?` |
| `fs.stat` | out | `id`, `path` |
| `fs.stat.result` | in | `id`, `metadata?`, `error?` |
| `fs.list` | out | `id`, `path` |
| `fs.list.result` | in | `id`, `entries?`, `error?` |
| `fs.mkdir` | out | `id`, `path`, `options?` |
| `fs.mkdir.result` | in | `id`, `error?` |
| `fs.remove` | out | `id`, `path`, `recursive?` |
| `fs.remove.result` | in | `id`, `error?` |
| `fs.move` | out | `id`, `fromPath`, `toPath` |
| `fs.move.result` | in | `id`, `error?` |
| `fs.watch` | out | `id`, `path`, `options?` |
| `fs.watch.result` | in | `id`, `watchId?`, `error?` |
| `fs.unwatch` | out | `id`, `watchId` |
| `fs.unwatch.result` | in | `id`, `error?` |
| `fs.changed` | in | `change` (push-only, NO `id`) |

Traps to respect:
- `fs.remove` carries `recursive` as a TOP-LEVEL boolean, not inside an options object. `fs.mkdir` and `fs.watch` carry theirs inside `options`.
- `fs.changed` has no `id` and its payload field is named `change`.
- Result success-field names differ per operation: `info`, `metadata`, `entries`, `watchId`. `mkdir`/`remove`/`move`/`unwatch` results carry only `id` and optional `error`.
- A successful result omits `error`; a failed result includes `error` and omits all success fields.
</wire_surface>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Register the `fs` domain and its schema types in @napplet/core</name>
  <files>packages/core/src/types/fs.ts, packages/core/src/types.ts, packages/core/src/types/global/service-api.ts, packages/core/src/types/global.ts, packages/core/src/envelope.ts, packages/core/src/index.test.ts</files>
  <behavior>
    - `NAP_DOMAINS` contains `'fs'` and `NapDomain` accepts `'fs'`.
    - `import type { FsInfo, FsChange, FsError } from '@napplet/core'` resolves.
    - `NappletGlobal['fs']` is optional and typed as `FsApi`.
  </behavior>
  <action>
Create `packages/core/src/types/fs.ts` mirroring the style of `packages/core/src/types/serial.ts` (one JSDoc line per exported type, no file-level import needed except `Subscription` is NOT needed here — that lives in the API interface file).

Export exactly these, transcribed from the NAP-FS Schemas block:
- `FsPermission` — union of the six permission literals.
- `FsEntryKind` — union of the three entry-kind literals.
- `FsChangeKind` — union of the five change-kind literals.
- `FsError` — closed union of the twelve error literals. Never widen to `string`.
- `FsInfo` — `{ roots: FsRoot[]; limits: FsLimits }`.
- `FsRoot` — `{ path: string; name: string; permissions: FsPermission[]; description?: string }`.
- `FsLimits` — `{ maxReadBytes: number; maxWriteBytes: number; maxWatchCount?: number; maxInFlightRequests?: number; maxInFlightBytes?: number }`.
- `FsMetadata` — `{ path: string; kind: FsEntryKind; size?: number; modifiedAt?: number; createdAt?: number; permissions?: FsPermission[]; revision?: string }`.
- `FsDirectoryEntry` — `{ name: string; path: string; kind: FsEntryKind; size?: number; modifiedAt?: number }`.
- `FsMkdirOptions` — `{ recursive?: boolean }`.
- `FsWatchOptions` — `{ recursive?: boolean }`.
- `FsChange` — `{ watchId: string; path: string; kind: FsChangeKind; fromPath?: string }`.

Do NOT export the byte-carrying option/result shapes or the write-mode enum — see the protocol_fidelity_contract, item 3.

At the top of this file add a deferral comment block that states: this module intentionally omits the byte-carrying halves of NAP-FS; the spec declares those payloads as CBOR `bstr` but does not define an encoding for NIP-5D's JSON envelope; choosing one would invent wire surface; tracked upstream at <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>. Also note that `FsLimits` keeps its byte limits because the spec makes them required advisory discovery fields of `FsInfo`.
<!-- planner-discipline-allow: read -->
<!-- planner-discipline-allow: write -->

Then wire it in:
- `packages/core/src/types.ts` — add `export type * from './types/fs.js';` alongside the sibling `export type *` lines, keeping the file's existing ordering convention.
- `packages/core/src/types/global/service-api.ts` — add an `FsApi` interface next to `SerialApi`. Import the fs value types from `'../fs.js'` in the same import-block style already used for `serial`/`outbox`/`upload`. `Subscription` is already imported in that file. Nine members, each with the repo-mandated JSDoc (`@param`, `@returns`):
  `info(): Promise<FsInfo>`;
  `stat(path: string): Promise<FsMetadata>`;
  `list(path: string): Promise<FsDirectoryEntry[]>`;
  `mkdir(path: string, options?: FsMkdirOptions): Promise<void>`;
  `remove(path: string, recursive?: boolean): Promise<void>`;
  `move(fromPath: string, toPath: string): Promise<void>`;
  `watch(path: string, options?: FsWatchOptions): Promise<string>` (resolves to the runtime-generated `watchId`);
  `unwatch(watchId: string): Promise<void>`;
  `onChange(handler: (change: FsChange) => void): Subscription`.
  Give the interface a JSDoc `@example` in the same shape as `SerialApi`'s, using a virtual path such as `/shared` — never a host-looking path.
- `packages/core/src/types/global.ts` — add `FsApi` to the existing `./global/service-api.js` type-import list and add an optional `fs?: FsApi;` property with a JSDoc block matching the neighbours (state that the runtime owns host paths, mounts, policy, and authorization; the napplet sees only virtual paths).
- `packages/core/src/envelope.ts` — add a `| \`fs\` | Shell-mediated virtual filesystem access |` row to the domain doc table, add `'fs'` to the `NapDomain` union, and add `'fs'` to the `NAP_DOMAINS` array. Insert at the same position in all three (place it after `serial` and before `common`, or pick one consistent position and use it in all three).
- `packages/core/src/index.test.ts` — add `expect(NAP_DOMAINS).toContain('fs');` next to the existing domain assertions. If that file also asserts a domain count, update the count.

Commit: `feat(core): add the fs NAP domain and NAP-FS schema types`
  </action>
  <verify>
    <automated>pnpm --filter @napplet/core type-check &amp;&amp; pnpm --filter @napplet/core test:unit</automated>
    <automated>grep -c "maxReadBytes" packages/core/src/types/fs.ts</automated>
    <automated>grep -v '^\s*\*' packages/core/src/types/fs.ts | grep -c "FsWriteMode\|FsReadResult\|FsWriteResult\|FsReadOptions\|FsWriteOptions"</automated>
  </verify>
  <done>
`@napplet/core` type-checks and its unit tests pass. `NAP_DOMAINS` contains `'fs'`. `packages/core/src/types/fs.ts` exports the 11 in-scope types, carries the deferral comment, and (outside comment lines) declares none of the five deferred byte-carrying shapes — the third grep returns 0.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Ship the @napplet/nap/fs domain module with shim tests</name>
  <files>packages/nap/src/fs/types.ts, packages/nap/src/fs/shim.ts, packages/nap/src/fs/sdk.ts, packages/nap/src/fs/index.ts, packages/nap/src/fs/shim.test.ts, packages/nap/package.json, packages/nap/jsr.json, packages/nap/tsup.config.ts, packages/nap/README.md</files>
  <behavior>
    - `info()` posts `{ type: 'fs.info', id }` and resolves with the `info` field of the matching result.
    - `stat('/shared/a')` posts `{ type: 'fs.stat', id, path }` and resolves with `metadata`.
    - `list('/shared')` resolves with `entries`.
    - `mkdir('/shared/p', { recursive: true })` posts `options` and resolves to `undefined`.
    - `remove('/shared/a', true)` posts `recursive` at the TOP LEVEL (not nested in `options`).
    - `move(from, to)` posts `fromPath` and `toPath`.
    - `watch('/shared', { recursive: true })` resolves with the runtime's `watchId` string.
    - `unwatch('watch-1')` posts `{ type: 'fs.unwatch', id, watchId }`.
    - A result carrying `error` rejects with that error string; a result missing its success field rejects rather than resolving `undefined`.
    - `onChange` fans out every `fs.changed` payload to live handlers and stops delivering after `close()`.
    - `handleFsMessage({ type: 'unknown.domain' })` and malformed known types are no-ops that do not throw.
  </behavior>
  <action>
Create `packages/nap/src/fs/` mirroring `packages/nap/src/serial/`.

**`types.ts`** — module JSDoc + `@module` header in the serial style. `export const DOMAIN = 'fs' as const;`. Re-export the fs value types from `@napplet/core` (type-only import + `export type { ... }`, exactly as serial does). Then declare the message interfaces for the 17 discriminants in the wire_surface table above:
- `FsMessage extends NappletMessage` with `` type: `fs.${string}` ``.
- One interface per discriminant, each field carrying a JSDoc line.
- Result interfaces type `error?: FsError` (closed union — not `string`).
- `FsChangedMessage` has `change: FsChange` and NO `id`; document that it is runtime-pushed.
- `FsOutboundMessage` (the 8 requests), `FsInboundMessage` (the 8 results + `FsChangedMessage`), `FsNapMessage` union.
Repeat the deferral comment here (short form, linking the upstream comment) so a reader of the nap-side types sees why there is no byte-carrying operation.
<!-- planner-discipline-allow: read -->
<!-- planner-discipline-allow: write -->

**`shim.ts`** — same file header style as `serial/shim.ts`; imports `postToShell` from `'../boundary.js'` and `Subscription` from `@napplet/core`.
Because there are 8 correlated operations, do NOT create 8 pending maps. Use ONE module-level `pending` map keyed by request id, holding `{ resolve: (msg: Record<string, unknown>) => void; reject: (reason: Error) => void; timeout: ReturnType<typeof setTimeout> }`, plus a private `request(msg)` helper that generates `crypto.randomUUID()`, arms a `REQUEST_TIMEOUT_MS` (30_000) timer, stores the entry, calls `postToShell`, and returns the raw result envelope. Each public function then narrows its own success field. Rejection rule: if the result carries `error`, reject with `new Error(error)`; if it carries neither `error` nor its declared success field, reject with a descriptive error naming the operation. Omit optional fields from the posted envelope when the caller did not supply them (use the `...(x === undefined ? {} : { x })` spread the serial shim uses) so no `undefined` keys reach the wire.
Export: `info`, `stat`, `list`, `mkdir`, `remove`, `move`, `watch`, `unwatch`, `onChange`, `handleFsMessage`, `installFsShim`.
`handleFsMessage` routes the 8 `*.result` types into the pending map and `fs.changed` into the change-handler set; anything else returns without throwing.
`installFsShim` is registration-only and returns a cleanup closure that clears timers, the pending map, the handler set, and the `installed` flag — same shape as `installSerialShim`.

**`sdk.ts`** — `requireFs()` guard in the `requireSerial()` shape (throw when `window.napplet.fs` is absent, with the same "runtime did not inject this domain" wording). Export `fsInfo`, `fsStat`, `fsList`, `fsMkdir`, `fsRemove`, `fsMove`, `fsWatch`, `fsUnwatch`, `fsOnChange`, each delegating to `requireFs().<method>` with full JSDoc.

**`index.ts`** — mirror `serial/index.ts`: `@packageDocumentation` header with a runnable `@example`, `export { DOMAIN }`, `export type { ... }` for every value type and message type, `export { ... } from './shim.js'`, `export { ... } from './sdk.js'`, then the `registerNap(DOMAIN, ...)` no-op registration at the bottom.

**`shim.test.ts`** — copy the harness from `serial/shim.test.ts` (stubbed `crypto.randomUUID` counter, stubbed `window.parent.postMessage`, `vi.resetModules()`), with the uuid prefix `fs-test-`. Cover every bullet in `<behavior>` above. Assert the posted envelopes by deep equality so a stray field fails the test. Include an explicit case asserting the `fs.remove` envelope has `recursive` as a top-level key and no `options` key.

**Package wiring:**
- `packages/nap/package.json` — add the four `./fs`, `./fs/types`, `./fs/shim`, `./fs/sdk` export entries in the same `types`/`import` dist shape as `./serial`, and add `fs` to the `description` domain list.
- `packages/nap/jsr.json` — add the same four subpaths pointing at `./src/fs/*.ts`. These two maps must stay identical or `pnpm check:jsr` fails.
- `packages/nap/tsup.config.ts` — add the four `fs/index`, `fs/types`, `fs/shim`, `fs/sdk` entries.
- `packages/nap/README.md` — add `fs` to the domain list in the blurb (line ~3), add a table row for `fs` next to `serial` describing the 8 byte-free operations plus `onChange`, add `@napplet/nap/fs` to the barrel list (line ~226), and add a short, clearly-marked deferral note stating that byte transfer is blocked on the upstream `bstr`-encoding question, with the link.

Commit: `feat(nap): add the @napplet/nap/fs domain subpaths`
  </action>
  <verify>
    <automated>pnpm --filter @napplet/nap test:unit &amp;&amp; pnpm --filter @napplet/nap type-check &amp;&amp; pnpm --filter @napplet/nap build</automated>
    <automated>node scripts/check-jsr-exports.mjs</automated>
    <automated>node -e "const e=require('./packages/nap/package.json').exports;const j=require('./packages/nap/jsr.json').exports;for(const s of ['./fs','./fs/types','./fs/shim','./fs/sdk']){if(!e[s]||!j[s])throw new Error('missing '+s)}console.log('fs subpaths ok')"</automated>
  </verify>
  <done>
`@napplet/nap` builds, type-checks, and its unit tests pass including the new fs shim suite. All four fs subpaths exist in both export maps and `check:jsr` is clean. The fs shim test asserts top-level `recursive` on `fs.remove`.
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire fs through shim, SDK, conformance, tooling, docs, and a changeset</name>
  <files>packages/shim/src/runtime.ts, packages/sdk/src/nap-runtime.ts, packages/sdk/src/nap-types.ts, packages/sdk/src/services.ts, packages/sdk/src/index.ts, packages/conformance/src/validators/envelope.ts, packages/conformance/src/validators/envelope.test.ts, packages/conformance/src/shell/reference-shell.ts, packages/vite-plugin/src/requirements.ts, packages/cli/src/manifest-metadata.ts, packages/skills/src/index.test.ts, apps/docs/naps/index.md, apps/docs/packages/core.md, apps/docs/packages/nap.md, README.md, .changeset/nap-fs-mvp.md</files>
  <action>
**`packages/shim/src/runtime.ts`** — three edits, each mirroring the `serial` lines:
1. Import block: `import { installFsShim, handleFsMessage, info as fsInfo, stat as fsStat, list as fsList, mkdir as fsMkdir, remove as fsRemove, move as fsMove, watch as fsWatch, unwatch as fsUnwatch, onChange as fsOnChange } from '@napplet/nap/fs/shim';`
2. `DOMAIN_ROUTERS`: add `['fs.', handleFsMessage],`.
3. The `domains.has('serial')` block's neighbourhood: add a `domains.has('fs')` block assigning all nine members to `napplet.fs`, and add a `case 'fs': installFsShim(); return;` arm to the per-domain installer switch.

**`packages/sdk`:**
- `nap-runtime.ts` — `export { DOMAIN as FS_DOMAIN } from '@napplet/nap/fs';`, `export { installFsShim } from '@napplet/nap/fs';`, and add the nine `fs*` helper names to the `@napplet/nap/fs` value re-export block.
- `nap-types.ts` — add an `// FS NAP (...)` section re-exporting every fs value type and message type from `@napplet/nap/fs`, matching the SERIAL section's layout.
- `services.ts` — add an `export const fs: SdkDomain<'fs'> = { ... }` object delegating each of the nine members to `requireDomain('fs')`, with JSDoc and an `@example` in the shape of the `serial` export. Update the file's header comment domain list.
- `index.ts` — add `fs` to the `export { link, count, lists, common, ble, serial, dm } from './services.js';` list.

**`packages/conformance`:**
- `src/validators/envelope.ts` — add an `// ── fs ──` section with the 17 entries from the wire_surface table. Outbound required fields: `fs.info` `{ ...ID }`; `fs.stat`/`fs.list`/`fs.mkdir`/`fs.remove`/`fs.watch` `{ ...ID, path: 'string' }`; `fs.move` `{ ...ID, fromPath: 'string', toPath: 'string' }`; `fs.unwatch` `{ ...ID, watchId: 'string' }`. All 8 results and `fs.changed` are `{ dir: 'in' }`. Do NOT mark optional fields (`options`, `recursive`) as required — a spec-faithful napplet omits them.
- `src/validators/envelope.test.ts` — add an `fs` entry to the per-domain `samples` table (use `fs.remove` with top-level `recursive` so the sample also documents that trap), and update the `ENVELOPE_SPECS invariants` counts from 208/100/108 to 225/108/117. If the actual counts differ after your edits, trust the test output over these numbers and fix the additions, not just the expectation.
- `src/shell/reference-shell.ts` — add an `// fs` section to `RESPONDERS` answering all 8 requests: `fs.info` returns an `info` with one virtual root (`/shared`, a curated label, a permissions array) and `limits` containing both byte limits; `fs.stat` returns `metadata` echoing the requested `path` with `kind: 'file'`; `fs.list` returns `entries: []`; `fs.watch` returns a deterministic `watchId` derived from `e.id`; `fs.mkdir`/`fs.remove`/`fs.move`/`fs.unwatch` return id-only results. Never emit a host-looking path, username, device name, or storage-provider label — the spec forbids the runtime disclosing them.
- The drift guard (`envelope.drift.test.ts`) needs no edit; it will now enforce exact correspondence between the fs discriminants declared in Task 2 and ENVELOPE_SPECS. If it reports a mismatch, the fix is to align the two, never to relax the guard.

**Tooling:** add `'fs'` to `packages/vite-plugin/src/requirements.ts` and `"fs"` to `packages/cli/src/manifest-metadata.ts`, matching the surrounding ordering.

**Skills:** resolve the real path first (`readlink skills` — root `skills/` symlinks into `packages/skills`) and edit through the real files. Add `fs` to the domain lists in `build-napplet`, `design-napplet`, `make-napplet`, and `port-nostr-app` SKILL.md (each has a prose list and/or a "when to use this domain" table row — add both where both exist; the description should say shell-mediated virtual filesystem access and note that byte transfer is not yet available). Add `'fs'` to the `implementedDomains` array in `packages/skills/src/index.test.ts`.

**Docs:**
- `apps/docs/packages/core.md` — add `'fs'` to the `NapDomain` union string.
- `apps/docs/packages/nap.md` — add `fs` to the domain list in the intro, bump the tree-shaking contract counts from 92 entry points / 22 per category to 96 / 23, and add an `fs` bullet to "Domain notes" that states the operations shipped and the byte-transfer deferral with the upstream link.
- `apps/docs/naps/index.md` — add `fs` to the core domain union list and add an `fs` section consistent with the neighbouring domain sections, including the deferral note.
- root `README.md` — add `fs` to the `@napplet/sdk` and `@napplet/nap` package-table domain lists.

**Changeset:** create `.changeset/nap-fs-mvp.md` bumping `@napplet/core`, `@napplet/nap`, `@napplet/shim`, `@napplet/sdk`, `@napplet/conformance`, `@napplet/vite-plugin`, `@napplet/cli`, and `@napplet/skills` — all `minor` (0.x additive). The summary must name the 8 shipped operations plus the change event AND state that byte transfer is deferred pending the upstream `bstr`-encoding question, with the link. Frame it as blocked on a spec gap, not as unfinished work.

Commit: `feat: wire the fs NAP domain through shim, sdk, conformance, and docs`

Then run the whole-repo gate (see `<verification>`) and fix anything it surfaces before finishing. Do NOT push and do NOT open a PR — this sandbox has no SSH key; the orchestrator surfaces that to the user.
  </action>
  <verify>
    <automated>pnpm build &amp;&amp; pnpm type-check &amp;&amp; pnpm -r test:unit</automated>
    <automated>pnpm --filter @napplet/conformance test:unit</automated>
    <automated>node -e "const{NAP_DOMAINS}=require('./packages/core/dist/index.js');" 2>/dev/null; grep -c "'fs'" packages/vite-plugin/src/requirements.ts packages/sdk/src/index.ts</automated>
  </verify>
  <done>
`pnpm build`, `pnpm type-check`, and `pnpm -r test:unit` are all green. The conformance drift guard and the ENVELOPE_SPECS count invariant both pass with the fs entries present. `fs` appears in the vite-plugin requirement list, CLI manifest metadata, the skills domain lists and their test, all four docs surfaces, and the root README. `.changeset/nap-fs-mvp.md` exists and names the deferral with its upstream link. Three atomic commits exist on `feat/nap-fs`; nothing is pushed.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| napplet -> runtime (postMessage) | Napplet-supplied `path`, `fromPath`, `toPath`, `watchId`, `recursive` cross here as untrusted request parameters. |
| runtime -> napplet (postMessage) | Runtime-supplied `info`, `metadata`, `entries`, `watchId`, `change`, `error` cross here into napplet-visible state. |

Scope note: this work ships the NAPPLET side (types + client shim + SDK) and a conformance reference shell. Authorization, path normalization, alias/mount resolution, and policy enforcement are runtime obligations under NAP-FS "Runtime Behavior" — they are not implementable in this package set and MUST NOT be simulated here as if they were.

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-fs-01 | Information disclosure | `reference-shell.ts` fs responders | medium | mitigate | Reference `info`/`stat` responses use only virtual paths and curated labels; no host path, username, device name, volume, or storage-provider string appears in any canned response (spec: `info()` disclosure rules). |
| T-fs-02 | Tampering | `handleFsMessage` correlation map | medium | mitigate | Results resolve strictly by `id` lookup in the pending map; an unknown `id` is dropped without throwing. `fs.changed` is handled on a separate path and never resolves a pending request. |
| T-fs-03 | Denial of service | fs shim pending map | low | mitigate | Every request arms a 30s timeout that deletes its pending entry and rejects; `installFsShim` cleanup clears all timers and the map, so an unresponsive runtime cannot leak entries or timers. |
| T-fs-04 | Elevation of privilege | `FsInfo` advisory permissions | medium | accept | Accepted at this layer by design: the spec states `info()` is advisory discovery, not an authorization token. Napplet-side code must not gate on it; the runtime authorizes every operation. Documented in the `FsApi` and `FsInfo` JSDoc. |
| T-fs-05 | Information disclosure | deferred byte operations | high | transfer | Byte transfer is not implemented; the encoding question is transferred upstream to napplet/naps#88 rather than resolved by inventing a JSON encoding for `bstr`. |
| T-fs-SC | Tampering | package installs | n/a | accept | No new npm/pip/cargo dependency is added by this work — every touched package already depends on what it needs. No legitimacy audit is required. |
</threat_model>

<verification>
Whole-repo gate, run from the repo root after Task 3:

1. `pnpm build`
2. `pnpm type-check`
3. `pnpm -r test:unit`
4. `pnpm check:jsr`
5. `npx --yes aislop scan -d` — restore to passing; a pre-existing warning outside the touched files is acceptable and should be named in the summary rather than "fixed" by disabling a rule.
6. `git diff --check`
7. `git log --oneline feat/nap-fs` shows the three task commits and nothing else new.

Spec-fidelity spot checks (do these by reading, not by grepping alone):
- Re-read the NAP-FS Wire Protocol table and confirm each shipped discriminant's payload fields match exactly — especially top-level `recursive` on `fs.remove` and the absence of `id` on `fs.changed`.
- Confirm no shipped `error` field is typed as bare `string`.
- Confirm no message type, `FsApi` method, SDK helper, shim handler, conformance entry, or reference-shell responder exists for the two deferred byte operations.
</verification>

<success_criteria>
- The 8 byte-free NAP-FS operations plus `fs.changed` are reachable from `window.napplet.fs`, `@napplet/nap/fs`, and `@napplet/sdk`.
- Every shipped `fs.*` discriminant is in the NAP-FS Wire Protocol table, and the conformance drift guard passes with no stale or missing entries.
- The two deferred byte operations are absent from every layer, and the reason plus the upstream link is discoverable from `packages/core/src/types/fs.ts`, `packages/nap/src/fs/types.ts`, `packages/nap/README.md`, `apps/docs/packages/nap.md`, and the changeset.
- `fs` is registered in `NAP_DOMAINS`, the vite-plugin requirement list, the CLI manifest metadata, the four skills, and all docs domain lists.
- The whole-repo gate is green and three atomic commits sit on `feat/nap-fs`.
</success_criteria>

<output>
Create `.planning/quick/260726-ici-lets-implement-the-first-mvp-of-nap-fs/260726-ici-SUMMARY.md` when done.

The summary MUST include, for the user to paste into the eventual PR body:
1. A prominent **"Deferred: byte transfer (blocked on a spec gap)"** section — the `bstr`-on-JSON-envelope gap, why choosing an encoding would be inventing wire surface, and the link to <https://github.com/napplet/naps/pull/88#issuecomment-5083402723>. Frame it as blocked upstream, not as unfinished.
2. The `onChange` vs repo-precedent `onChanged` naming observation from the protocol_fidelity_contract.
3. The verification command output.
4. A note that push and `gh pr create` were NOT run (no SSH key in this sandbox).
</output>

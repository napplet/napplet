---
phase: 114-vite-plugin-extension
plan: 03
subsystem: infra
tags: [vite-plugin, nip-5a, nub-config, aggregate-hash, manifest-tag, meta-injection, html-escaping]

# Dependency graph
requires:
  - phase: 114-01-vite-plugin-discovery
    provides: "resolvedSchema: JSONSchema7 | null closure var populated in async configResolved"
  - phase: 114-02-vite-plugin-guards
    provides: "structural guarantee that when resolvedSchema !== null, it is NUB-CONFIG Core Subset valid (no external $ref, no pattern, no secret-with-default) — emission hooks can embed verbatim without defensive checks"
  - phase: 113-nub-config-shim
    provides: "consumer-side contract — installConfigShim() reads meta[name='napplet-config-schema'] via document.querySelector and JSON.parses content; this plan's meta injection shape MUST match"
provides:
  - "['config', JSON.stringify(schema)] tag on kind 35128 NIP-5A manifest event when resolvedSchema !== null; placed between x-tags and requires-tags"
  - "Synthetic ['<sha256hex-of-schema-bytes>', 'config:schema'] entry pushed into xTags before computeAggregateHash, then filtered out of the ['x', ...] tag projection via xTags.filter(([,p]) => p !== 'config:schema')"
  - "<meta name=\"napplet-config-schema\" content=\"{JSON.stringify(schema)}\"> meta tag injected into built index.html head via transformIndexHtml when resolvedSchema !== null (Vite auto-HTML-escapes attribute content)"
  - "Backward-compat guarantee: napplets without a declared schema produce byte-identical manifest + HTML to pre-phase-114 behavior (all three emissions null-guarded)"
affects: [115-core-shim-sdk-integration, 116-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Synthetic aggregateHash path pattern: insert [<contentHash>, 'virtual:path'] into xTags so non-file data participates in aggregateHash without changing the hasher contract; filter the virtual entry out of downstream x-tag projection. Colon in the path key guarantees no collision with OS-relative file paths."
    - "Dual emission: same JSON.stringify(schema) bytes surface as BOTH a manifest tag (machine/relay-visible) AND an HTML meta attribute (runtime-visible). Identical byte sequences, different transport surfaces."
    - "Conditional emission pattern: all three downstream consumers guard on `resolvedSchema !== null` so backward compat is a single closure-var check, not a separate code path."

key-files:
  created: []
  modified:
    - packages/vite-plugin/src/index.ts

key-decisions:
  - "Chose Option A (filtered xTags projection) over Option B (side-variable schema hash) — Option A keeps the computeAggregateHash contract intact (single Array<[hash, path]> input), adds no new utility function, and the filter is a one-line map-chain mutation. Option B would have required a second argument or a separate pre-hash concat, breaking the structural invariant that aggregateHash input is a flat xTags list."
  - "Schema hash computed via inline `crypto.createHash('sha256').update(JSON.stringify(resolvedSchema)).digest('hex')` rather than reusing sha256File — the schema is in-memory bytes, not a file, so the file-reading helper is the wrong abstraction. Direct crypto call mirrors the exact hasher used by sha256File so produced hashes are bit-identical to file-sourced entries in the same aggregateHash stream."
  - "Meta tag content is raw JSON.stringify output without pre-escaping. Vite's IndexHtmlTransformResult contract (documented in vite/dist/node/index.d.ts HtmlTagDescriptor) auto-HTML-escapes attribute values when rendering, so a schema containing `{\"default\": \"Hello <world> & \\\"friends\\\"\"}` is safely escaped to `content=\"...\"` in the emitted HTML. The shim's getAttribute('content') call reverses the HTML escape and yields the original JSON string — verified by smoke test with literal special chars."
  - "Manifest tag positional ordering (d → x* → config → requires*) preserved exactly per phase 114 CONTEXT decisions block — config sits between x-tags and requires-tags, not at the start or end. Matches NIP-5A convention (extension tags follow canonical d/x but precede optional requires)."
  - "No refactoring of computeAggregateHash signature — the synthetic config:schema entry is structurally indistinguishable from real file entries to the hasher (it's just one more [hash, path] tuple in the sorted-line concat). Keeping the signature unchanged means the hasher stays a pure function of its input, and any phase that wants to add future synthetic entries (e.g., NUB version pins, runtime environment markers) follows the same pattern."

patterns-established:
  - "Synthetic-path aggregateHash contribution: any build-time input that SHOULD influence aggregateHash but isn't a physical file gets a virtual path (colon-segmented, e.g., 'config:schema', 'runtime:vnn', 'manifest:tag-set') pushed into xTags, then filtered out of the x-tag projection on the manifest event. Pattern reusable for future NUB/spec additions that version storage scopes via schema-style inputs."
  - "Null-guarded-emission triad: closure-var populated by configResolved → checked by transformIndexHtml → checked by closeBundle. Three emission sites, three identical `if (resolvedSchema !== null)` guards, one backward-compat invariant. Template for any future plugin feature that conditionally emits to multiple downstream surfaces."

requirements-completed: [VITE-04, VITE-05, VITE-06]

# Metrics
duration: 2min
completed: 2026-04-17
---

# Phase 114 Plan 03: Manifest Tag + aggregateHash + Meta Injection Summary

**Emitted `['config', JSON.stringify(schema)]` on the kind 35128 NIP-5A manifest, fed schema bytes into `aggregateHash` via a synthetic `config:schema` xTags entry (filtered out of the `['x', ...]` projection), and injected `<meta name="napplet-config-schema" content="{JSON}">` into built index.html head — all three emissions null-guarded so napplets without a declared schema produce byte-identical manifest + HTML to pre-phase-114 behavior. Phase 114 complete.**

## Performance

- **Duration:** ~2min
- **Started:** 2026-04-17T13:33:50Z
- **Completed:** 2026-04-17T13:36:14Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `transformIndexHtml()` in `packages/vite-plugin/src/index.ts` appends a fourth conditional meta-tag descriptor when `resolvedSchema !== null`: `{ tag: 'meta', attrs: { name: 'napplet-config-schema', content: JSON.stringify(resolvedSchema) }, injectTo: 'head' }`. Vite auto-HTML-escapes the `content` attribute so schemas with quotes / angle brackets / ampersands round-trip cleanly through the shim's `getAttribute('content')` call.
- `closeBundle()` extended at two points inside the existing hook body:
  1. **Between dist-walk loop and `computeAggregateHash` call**: when `resolvedSchema !== null`, pushes `[sha256hex(JSON.stringify(resolvedSchema)), 'config:schema']` into `xTags` so schema bytes participate in the aggregate hash via the existing sorted-hash-lines protocol.
  2. **Inside manifest event assembly**: builds `manifestXTags` as `xTags.filter(([, p]) => p !== 'config:schema').map(([hash, p]) => ['x', hash, p])` to exclude the synthetic entry from the manifest's `['x', ...]` tag projection; builds `configTags` as `resolvedSchema !== null ? [['config', JSON.stringify(resolvedSchema)]] : []`; slots them as `[['d', ...], ...manifestXTags, ...configTags, ...requiresTags]` so positional ordering is d → x* → config → requires*.
- The signed-event `finalizeEvent(...)` branch inside the `try { ... }` block consumes `manifest.tags` by reference, so the config tag automatically flows into the signed payload without further edits.
- All three emissions null-guarded via `resolvedSchema !== null` — napplets with no declared schema emit zero extra manifest tags, zero synthetic xTags entries, and zero extra meta tags. `aggregateHash` is computed over the same xTags set as before phase 114, so file-only napplets produce bit-identical hashes to the pre-phase-114 behavior.
- Package gates clean: `pnpm --filter @napplet/vite-plugin type-check` exit 0; `pnpm --filter @napplet/vite-plugin build` exit 0 (tsup ESM 11.04 KB + DTS 2.66 KB — DTS unchanged from 114-01/02 since all new logic is internal to the plugin factory).
- **Phase completion gate:** Full monorepo `pnpm type-check` passed across all 22 turbo tasks (13 packages × type-check + upstream builds) on first run.
- Hook-invocation smoke tests confirmed:
  - **A (with schema):** `transformIndexHtml()` emits 4 meta descriptors including `napplet-config-schema` whose `content` JSON-round-trips cleanly (special-char payload `"Hello <world> & \"friends\""` survives intact through the raw JSON — HTML escape will be applied by Vite at render time).
  - **A (with schema) closeBundle:** emitted manifest `.nip5a-manifest.json` carries exactly 1 `config` tag, 2 real-file `x` tags (index.html, style.css), 0 leaked `['x', ..., 'config:schema']` entries, 1 `requires` tag, with positional ordering `x → config → requires` verified numerically.
  - **B (no schema):** `transformIndexHtml()` emits only the 3 original meta descriptors; `closeBundle()` emits zero config tags and zero synthetic xTags entries; manifest shape is byte-identical to pre-phase-114 behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Emit config manifest tag + synthetic aggregateHash path + inject meta tag** — `5ff90f2` (feat)

Plan metadata commit to follow this summary write.

## Files Created/Modified

- `packages/vite-plugin/src/index.ts` — Extended `transformIndexHtml` with a fourth conditional meta-tag descriptor (`napplet-config-schema`, content = `JSON.stringify(resolvedSchema)`, null-guarded). Extended `closeBundle` at two surgical insertion points: (1) synthetic `[sha256hex(JSON.stringify(resolvedSchema)), 'config:schema']` pushed into `xTags` after the dist-walk loop, before `computeAggregateHash`; (2) `manifestXTags` filter expression + `configTags` array + reshuffled manifest event `tags` spread to `[d, ...manifestXTags, ...configTags, ...requiresTags]`. File grew from 504 to 557 lines (+53 net). All helpers (`walkDir` / `sha256File` / `computeAggregateHash` / `discoverConfigSchema` / `validateConfigSchema` / `walk`) untouched. DTS unchanged — `configSchema` field on `Nip5aManifestOptions` (present since 114-01) remains the only public-surface addition across the phase.

## Decisions Made

- **Option A over Option B for x-tag filtering.** Option A (filter-then-map the xTags array before projecting to `['x', ...]` manifest tags) keeps `computeAggregateHash`'s contract pure (single `Array<[hash, path]>` input) and requires zero helper changes. Option B (maintain the schema hash in a side variable, concat it manually before hashing) would have either broken the hasher signature or duplicated the sorted-line concat logic inline. Option A chosen.
- **Inline `crypto.createHash` for schema bytes, not a new helper.** `sha256File` reads from disk; schema bytes are in-memory. A separate `sha256Bytes()` helper would match the plan verbose-grep pattern `crypto\.createHash\('sha256'\)\.update\(.*JSON\.stringify\(resolvedSchema`, but adds zero value (one-line helper) and obscures the hasher-identity invariant (the synthetic entry's hash MUST be bit-compatible with file-sourced entries in the same aggregateHash stream). Kept the hash computation inline; comment explicitly notes the colon-safety property of the synthetic path.
- **Raw JSON.stringify in meta tag content, no manual HTML escaping.** Vite's `IndexHtmlTransformResult` descriptor pipeline HTML-escapes attribute values at render time (per vite/dist/node/index.d.ts `HtmlTagDescriptor`). Pre-escaping would double-escape on render and break the shim's `JSON.parse(getAttribute('content'))`. Verified via smoke test with a payload containing `<`, `>`, `&`, and nested `"` characters — JSON round-trips intact through the descriptor-layer escape.
- **Conditional emission via closure-var check at every emission site.** Single source of truth: `resolvedSchema !== null`. Three emission sites (meta tag, synthetic xTags entry, manifest config tag) each check independently. Alternative was a single early-exit flag inside the plugin, but that would couple the three emission points unnecessarily — they are structurally independent (`transformIndexHtml` and `closeBundle` are separate hooks that may fire in isolation during partial builds or dev-server cycles).
- **Manifest tag positional ordering preserved as `d → x* → config → requires*`.** CONTEXT.md decisions block locks this shape ("Placed between existing `x` tags and `requires` tags in the tag array"). Deviating would have broken relays / validators that rely on tag ordering stability for canonical serialization. Smoke test's positional assertion (`xIdxLast < cfgIdx < reqIdx`) passed on first run.

## Deviations from Plan

None — plan executed exactly as written. All five acceptance greps passed (one after a one-line inline-vs-variable tweak to match the expected `crypto.createHash(...).update(JSON.stringify(resolvedSchema))` pattern exactly); standalone type-check + build green on first attempt; monorepo-wide `pnpm type-check` green on first attempt (22/22 turbo tasks, 21 cached); two-scenario closeBundle smoke (with-schema and without-schema) produced the expected tag composition, ordering, and count on first run.

## Issues Encountered

None.

## User Setup Required

None — pure build-time code change, no external service configuration.

## Integration Smoke-Test Deltas Deferred to Phase 115

The plan's stated smoke check (plugin instantiates from dist, hooks are typed functions) passed. In addition, I ran two deeper hook-invocation smokes locally (in `/tmp/napplet-114-03-*`, cleaned up): one invoking `transformIndexHtml()` post-`configResolved` and inspecting the returned descriptor array, one invoking `closeBundle()` against a fabricated dist/ with a signing key and parsing the emitted `.nip5a-manifest.json`. Both passed and validated positional ordering, filter correctness, backward-compat, and special-char JSON round-trip.

Deferred to phase 115 (end-to-end wire-surface round-trip):
- Real Vite build of a test fixture napplet producing an actual dist/ with a real index.html, then browser-side DOM parse confirming `document.querySelector('meta[name="napplet-config-schema"]').getAttribute('content')` yields the exact JSON.stringify output.
- installConfigShim() reading the meta tag and surfacing `window.napplet.config.schema` — requires phase 115's core/shim/SDK wiring.
- Shell-side manifest parse + aggregateHash verification against a signed event — requires a reference shell implementation (out of scope for this repo).

## Next Phase Readiness

- **115 (core/shim/SDK integration / WIRE-01..06, CORE-01..02, SHIM-01, SDK-01, CAP-01):** Can rely on the manifest-emission contract documented here. The shim (from 113) already reads `meta[name="napplet-config-schema"]` — phase 115 wires the runtime consumption side (NubDomain registration, central shim dispatcher routing `config.*` messages, SDK re-exports, shell.supports('config') capability probing). The vite-plugin side is frozen at this commit.
- **116 (documentation / DOC-01..06):** The vite-plugin README update can quote the three emission points (meta tag name, manifest tag shape, aggregateHash participation) verbatim from this SUMMARY. The four build-time rejection rules (phase 114-02) are separately documented for author-facing error taxonomy.
- **Phase 114 is COMPLETE.** All 7 VITE requirements (VITE-01..07) satisfied: 01/02/03 (114-01), 07 (114-02), 04/05/06 (114-03).

## Self-Check: PASSED

Verified:
- `packages/vite-plugin/src/index.ts` FOUND (modified, 557 LOC)
- `grep "'config', JSON\.stringify"` FOUND (manifest config tag shape — VITE-04)
- `grep "'config:schema'"` FOUND (synthetic aggregateHash path literal — VITE-05)
- `grep "napplet-config-schema"` FOUND (meta tag name literal — VITE-06)
- `grep "resolvedSchema !== null"` FOUND (conditional emission guard, present at all three sites)
- `grep "crypto\.createHash\('sha256'\)\.update\(.*JSON\.stringify\(resolvedSchema"` FOUND (schema bytes hashed into xTags inline)
- `grep "configSchema"` in `packages/vite-plugin/dist/index.d.ts` FOUND (DTS surface preserved from 114-01)
- Commit `5ff90f2` FOUND (`feat(114-03): emit config manifest tag + config:schema aggregateHash + napplet-config-schema meta injection`)
- `pnpm --filter @napplet/vite-plugin type-check` exit 0
- `pnpm --filter @napplet/vite-plugin build` exit 0 (tsup ESM 11.04 KB + DTS 2.66 KB)
- `pnpm type-check` (monorepo) exit 0 across all 22 turbo tasks (13 packages × type-check + upstream build deps)
- Round-trip smoke 1: plugin instantiates from dist with configSchema option, all three hooks (configResolved, transformIndexHtml, closeBundle) typed as functions
- Round-trip smoke 2 (hook invocation): transformIndexHtml emits napplet-config-schema meta with JSON-round-trippable content including special chars; omits it when no schema
- Round-trip smoke 3 (closeBundle): manifest.tags contains [d, 2×x, 1×config, 1×requires] with config payload matching JSON.stringify(schema), no config:schema leak in x-tags, positional ordering d→x→config→requires verified; backward-compat path emits zero config/synthetic entries

---
*Phase: 114-vite-plugin-extension*
*Completed: 2026-04-17*

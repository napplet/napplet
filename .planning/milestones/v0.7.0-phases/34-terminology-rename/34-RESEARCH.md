# Phase 34: Terminology Rename — Research

**Phase:** 34
**Goal:** Eliminate the napp/napplet semantic collision so the codebase uses "napplet" consistently and "napp" never appears where "napplet" is meant

---

## Scope Analysis

### Occurrence Count

`grep -r 'napp[^l]' packages/ --include="*.ts" | grep -v node_modules | grep -v dist` returns **246 lines** across **30 files** in 7 packages.

### Files by Package

| Package | Files with hits |
|---------|----------------|
| `packages/shell` | origin-registry.ts, napp-key-registry.ts, shell-bridge.ts, audio-manager.ts, acl-store.ts, hooks-adapter.ts, state-proxy.ts, manifest-cache.ts, types.ts |
| `packages/runtime` | napp-key-registry.ts, types.ts, runtime.ts, state-handler.ts, event-buffer.ts, index.ts, enforce.ts, dispatch.test.ts, discovery.test.ts, manifest-cache.ts |
| `packages/shim` | napp-keypair.ts, state-shim.ts, index.ts, keyboard-shim.ts, nipdb-shim.ts |
| `packages/core` | topics.ts, index.test.ts |
| `packages/services` | audio-service.ts, types.ts |
| `packages/acl` | types.ts |
| `packages/vite-plugin` | index.ts |

### Docs/Skills

| Location | Files with hits |
|----------|----------------|
| `README.md` (root) | 2 occurrences (nappState in table/diagram) |
| `packages/*/README.md` | shell, shim, core, services, vite-plugin READMEs |
| `skills/build-napplet/SKILL.md` | nappStorage reference |

---

## Change Categories

### Category 1: File Renames (2 files)

| Current File | Renamed To | Importers |
|-------------|-----------|-----------|
| `packages/shim/src/napp-keypair.ts` | `packages/shim/src/napplet-keypair.ts` | `shim/src/index.ts`, `shim/src/keyboard-shim.ts`, `shim/src/nipdb-shim.ts` |
| `packages/runtime/src/napp-key-registry.ts` | `packages/runtime/src/session-registry.ts` | `runtime/src/runtime.ts`, `runtime/src/event-buffer.ts`, `runtime/src/state-handler.ts`, `runtime/src/enforce.ts`, `runtime/src/index.ts` |

Note: `packages/shell/src/napp-key-registry.ts` → `packages/shell/src/session-registry.ts` (separate singleton pattern)

### Category 2: Type/Interface Renames

| Current | Renamed To | Defined In | Used In |
|---------|-----------|-----------|---------|
| `NappKeyRegistry` | `SessionRegistry` | runtime/napp-key-registry.ts, shell/napp-key-registry.ts | runtime.ts, dispatch.test.ts, index.ts (both), hooks-adapter.ts |
| `NappKeyEntry` | `SessionEntry` | runtime/types.ts, shell/types.ts | napp-key-registry.ts (both), runtime.ts, state-handler.ts, event-buffer.ts, index.ts (both), dispatch.test.ts |
| `NappKeypair` | `NappletKeypair` | shim/src/napp-keypair.ts | shim/src/index.ts, shim/src/keyboard-shim.ts, shim/src/nipdb-shim.ts |
| `createNappKeyRegistry` | `createSessionRegistry` | runtime/napp-key-registry.ts | runtime/index.ts, runtime/runtime.ts |

### Category 3: Variable/Function Renames

| Current | Renamed To | File |
|---------|-----------|------|
| `nappKeyRegistry` (const) | `sessionRegistry` | shell/napp-key-registry.ts |
| `nappKeyRegistry` (local var) | `sessionRegistry` | runtime/runtime.ts |
| `loadOrCreateKeypair` | `loadOrCreateKeypair` | **NOT renamed in Phase 34** (Phase 38 scope: `createEphemeralKeypair`) |
| `getNappType()` | `getNappletType()` | shim/src/index.ts |
| `nappState` (export) | `nappletState` (canonical) + `nappState` deprecated alias | shim/src/state-shim.ts, shim/src/index.ts |
| `nappEntries` / local vars | `nappletEntries` etc. | runtime/runtime.ts (local only) |
| `nappPubkey` | `nappletPubkey` | runtime/runtime.ts (local only) |
| `nappInfoMap` | `nappletInfoMap` | runtime/runtime.ts (local only) |
| `nappType` (local var) | `nappletType` | runtime/runtime.ts (local only) |
| `nappClass` | `nappletClass` | services/types.ts, audio-service.ts, shell/audio-manager.ts |

### Category 4: Topic String Constants

| Current Value | New Value | File |
|--------------|----------|------|
| `'napp:state-response'` | `'napplet:state-response'` | core/topics.ts (STATE_RESPONSE constant) |
| `'napp:audio-muted'` | `'napplet:audio-muted'` | core/topics.ts (AUDIO_MUTED constant) |

**Consumers of STATE_RESPONSE:**
- `runtime/src/state-handler.ts:41` — hardcoded string literal `'napp:state-response'` (needs updating alongside constant)
- `shell/src/audio-manager.ts:104` — hardcoded `'napp:audio-muted'`
- `services/src/audio-service.ts:145` — hardcoded `'napp:audio-muted'`
- `core/src/index.test.ts:100` — test assertion expects `'napp:state-response'` (update to `'napplet:state-response'`)

### Category 5: localStorage Prefix Migration

| Current Prefix | New Prefix | Files |
|---------------|----------|-------|
| `napp-state:` | `napplet-state:` | runtime/src/state-handler.ts (4 occurrences: makeKey, prefix in get/set/clear) |
| `napp-state:` | `napplet-state:` | shell/src/state-proxy.ts (5 occurrences — dead code but still touched per D-09) |

**Dual-read pattern** (D-10): In `state-handler.ts` `handleStateRequest` for GET operations:
```ts
// Try napplet-state: first, fall back to napp-state: for migration
const newKey = `napplet-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;
const oldKey = `napp-state:${pubkey}:${dTag}:${aggregateHash}:${userKey}`;
const value = statePersistence.getItem(newKey) ?? statePersistence.getItem(oldKey) ?? null;
```

### Category 6: HTML Meta Attribute

| Current Attribute | New Attribute | Files |
|------------------|-------------|-------|
| `napplet-napp-type` | `napplet-type` | shim/src/index.ts (querySelector) |
| `napplet-napp-type` | `napplet-type` + backward compat old | vite-plugin/src/index.ts (injection) |

**Vite plugin** (D-17): Inject `napplet-type` as primary; also inject `napplet-napp-type` for one release cycle. The shim reads BOTH attrs:
```ts
// shim/src/index.ts
const meta = document.querySelector('meta[name="napplet-type"]')
  ?? document.querySelector('meta[name="napplet-napp-type"]'); // backward compat
```

### Category 7: Comments and JSDoc (napp → napplet where it means the iframe app)

Files with comment-only occurrences (no code change needed, but text updates needed):
- `shell/src/acl-store.ts` — JSDoc says "napp identity" → "napplet identity"
- `shell/src/manifest-cache.ts` — JSDoc says "napp build", "napp identity"
- `shell/src/origin-registry.ts` — comment says "napp iframes", "napp window"
- `runtime/src/enforce.ts` — comment says "nappKeyRegistry"
- `runtime/src/manifest-cache.ts` — JSDoc says "napp manifest entries"
- Many others with in-comment "napp" where napplet is meant

**Note:** "napps" used in the plural to refer to the general Nostr app ecosystem is fine. Only rename where it specifically refers to sandboxed iframe apps managed by this SDK.

### Category 8: Doc/README Updates

Files needing napp → napplet text updates:
- `packages/shell/README.md` — mentions `nappKeyRegistry`, `cleanupNappState`, `napp identity`
- `packages/shim/README.md` — `nappState` references (replace with `nappletState`; note `nappState` still available but deprecated)
- `packages/core/README.md` — topic constant examples show `'napp:state-response'` and `'napp:audio-muted'`
- `packages/services/README.md` — `nappClass`, `napp:audio-muted` topic
- `packages/vite-plugin/README.md` — `napplet-napp-type` meta attr, `nappType` option
- `skills/build-napplet/SKILL.md` — `nappStorage` → note deprecated alias
- `README.md` (root) — `nappState` in table

---

## Dependency Order / Wave Analysis

### Wave 1 — Core type definitions (no consumers to break)
1. `packages/runtime/src/types.ts` — rename `NappKeyEntry` → `SessionEntry`
2. `packages/core/src/topics.ts` — rename topic string constants

### Wave 2 — File renames + implementations (depend on Wave 1 types)
3. `packages/runtime/src/napp-key-registry.ts` → `session-registry.ts` — rename file + interface + factory + types
4. `packages/shell/src/napp-key-registry.ts` → `session-registry.ts` — rename file + exported const
5. `packages/shim/src/napp-keypair.ts` → `napplet-keypair.ts` — rename file + interface + comment
6. `packages/shell/src/types.ts` — rename `NappKeyEntry` → `SessionEntry` (shell's local copy)

### Wave 3 — Consumers of renamed types/files
7. `packages/runtime/src/runtime.ts` — update imports, local vars (`nappKeyRegistry` → `sessionRegistry`, `nappPubkey`, `nappEntries`, `nappInfoMap`, `nappType` locals, `nappEntry`)
8. `packages/runtime/src/state-handler.ts` — update import + prefix migration (dual-read) + topic string
9. `packages/runtime/src/event-buffer.ts` — update import
10. `packages/runtime/src/enforce.ts` — update comment
11. `packages/runtime/src/index.ts` — update exports (`createNappKeyRegistry` → `createSessionRegistry`, `NappKeyRegistry` → `SessionRegistry`, `NappKeyEntry` → `SessionEntry`)
12. `packages/shell/src/state-proxy.ts` — update prefix strings (dead code but still touched)
13. `packages/shell/src/shell-bridge.ts` — update import of napp-key-registry
14. `packages/shell/src/hooks-adapter.ts` — update import of napp-key-registry + type ref
15. `packages/shell/src/index.ts` — update exports
16. `packages/shell/src/audio-manager.ts` — rename `nappClass` → `nappletClass` + update topic
17. `packages/services/src/types.ts` — rename `nappClass` → `nappletClass`
18. `packages/services/src/audio-service.ts` — rename local var + update topic string
19. `packages/shim/src/index.ts` — update import + rename `getNappType` → `getNappletType`, meta attr, `nappState` → `nappletState` (with deprecated alias)
20. `packages/shim/src/state-shim.ts` — rename export `nappState` → `nappletState`, add deprecated alias
21. `packages/shim/src/keyboard-shim.ts` — update import + type ref
22. `packages/shim/src/nipdb-shim.ts` — update import + type ref
23. `packages/vite-plugin/src/index.ts` — update `nappType` option (keep as-is in public API, only fix meta attr injection)

### Wave 4 — Test updates
24. `packages/core/src/index.test.ts` — update topic string assertion
25. `packages/runtime/src/dispatch.test.ts` — update `nappKeyRegistry` refs, local var

### Wave 5 — Documentation
26. `packages/shell/README.md`
27. `packages/shim/README.md`
28. `packages/core/README.md`
29. `packages/services/README.md`
30. `packages/vite-plugin/README.md`
31. `skills/build-napplet/SKILL.md`
32. `README.md`

---

## Risk Areas

### High: Public API Breaking Changes

The following are exported from runtime/shell and used by hyprgate:
- `NappKeyEntry` → `SessionEntry` — **BREAKING** unless deprecated alias is exported
- `NappKeyRegistry` → `SessionRegistry` — **BREAKING** unless deprecated alias
- `createNappKeyRegistry` → `createSessionRegistry` — **BREAKING** unless deprecated alias
- `nappKeyRegistry` (shell singleton) → `sessionRegistry` — **BREAKING** unless deprecated alias
- `nappState` → `nappletState` — **BREAKING** unless deprecated alias (D-05 handles this)

**Resolution:** Export deprecated aliases alongside renamed versions for all public API surfaces. CONTEXT.md explicitly says to keep `nappState` as deprecated alias; same pattern applies to `NappKeyEntry`, `NappKeyRegistry`, etc.

### Medium: Topic String Protocol Break

`STATE_RESPONSE: 'napp:state-response'` and `AUDIO_MUTED: 'napp:audio-muted'` are **wire protocol strings** — not just code identifiers. Changing them breaks existing deployed napplets talking to deployed shells.

**Resolution per CONTEXT.md (D-14/D-15):** Change the constants. All existing callers in this monorepo will be updated simultaneously. Since this is pre-publish (no external consumers yet), the wire break is acceptable within this controlled codebase.

State-handler.ts has a hardcoded `'napp:state-response'` string that ALSO needs updating — it does NOT use the TOPICS constant, so it's a separate change.

### Medium: localStorage Dual-Read

The dual-read logic must be added ONLY to the GET path (`storage-get`). SET/REMOVE/CLEAR/KEYS operations write to the new `napplet-state:` prefix only. This avoids reading stale data for write operations.

### Low: Meta Attribute Backward Compat

The shim's `getNappletType()` should try BOTH `napplet-type` and `napplet-napp-type` meta names. The vite-plugin should inject `napplet-type` as the canonical tag and also inject `napplet-napp-type` for one release cycle.

---

## Validation Architecture

### Quick Validation (after each task)
```bash
cd /home/sandwich/Develop/napplet
pnpm type-check 2>&1 | tail -5
```

### Full Validation (after all waves)
```bash
cd /home/sandwich/Develop/napplet
pnpm build && pnpm type-check
grep -r 'napp[^l]' packages/ --include="*.ts" --exclude-dir=node_modules --exclude-dir=dist | grep -v test | wc -l
```

### Success Gate
- `grep -r 'napp[^l]' packages/ --include="*.ts" | grep -v node_modules | grep -v dist` returns zero hits for production code (tests may still have `test-napp` literal strings in data, not identifiers)
- `pnpm type-check` exits 0 across all 7 packages

---

## RESEARCH COMPLETE

Research confirms:
1. 246 lines across 30 files need updates in packages/
2. Additionally: 7 README/skill files + root README need doc updates
3. Dual-read migration only needed in `runtime/src/state-handler.ts` (active code); `shell/src/state-proxy.ts` is dead code, update prefix string only
4. Public API deprecated aliases required for: `NappKeyEntry`, `NappKeyRegistry`, `createNappKeyRegistry`, `nappKeyRegistry`, `nappState`
5. Topic string changes are wire-protocol changes — acceptable since pre-publish with no external consumers
6. File rename order: types first (Wave 1), then implementations (Wave 2), then consumers (Wave 3), then tests (Wave 4), then docs (Wave 5)
7. `nappClass` in services/audio types also needs rename to `nappletClass`
8. `vite-plugin`'s `nappType` option name stays — it's used as the `d` tag identifier, not an identifier that contains the napp/napplet collision. The meta attribute name changes from `napplet-napp-type` to `napplet-type`.

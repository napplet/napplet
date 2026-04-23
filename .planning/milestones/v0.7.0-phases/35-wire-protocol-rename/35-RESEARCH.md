# Phase 35: Wire Protocol Rename — Research

**Phase:** 35
**Goal:** Rename `BusKind.INTER_PANE` → `BusKind.IPC_PEER` across all packages and SPEC.md; simultaneously execute the SPEC.md combined pass (napp→napplet corrections + INTER-PANE→IPC-PEER + IPC-* namespace section)

---

## Scope Analysis

### Occurrence Count

`grep -r 'INTER_PANE\|INTER-PANE\|inter-pane' packages/ --include="*.ts" | grep -v node_modules | grep -v dist` returns **42 lines** across **17 files** in 6 packages.

`grep -c 'INTER.PANE\|inter.pane\|inter_pane' SPEC.md` returns **10 occurrences** in SPEC.md.

### Files by Package

| Package | Files with hits |
|---------|----------------|
| `packages/core` | constants.ts, topics.ts, index.test.ts |
| `packages/runtime` | runtime.ts, enforce.ts, service-dispatch.ts, state-handler.ts, dispatch.test.ts |
| `packages/services` | audio-service.ts, notification-service.ts, notification-service.test.ts |
| `packages/shell` | audio-manager.ts, state-proxy.ts |
| `packages/shim` | index.ts |
| `dist/ files` | Not modified — dist is regenerated on build |

---

## Change Categories

### Category 1: Core Constant Definition (1 change, highest priority)

| File | Change |
|------|--------|
| `packages/core/src/constants.ts` | `INTER_PANE: 29003` → `IPC_PEER: 29003`; JSDoc example updated; add IPC-* family table |

This is the single source of truth. All consumers import `BusKind.INTER_PANE` from here.

**No deprecated alias** per D-01. Clean rename only.

### Category 2: Core Module Prose Updates

| File | Current | New |
|------|---------|-----|
| `packages/core/src/topics.ts` | header JSDoc: "inter-pane event bus", "inter-pane INTER_PANE events" | "IPC-PEER event bus", "IPC-PEER events" |
| `packages/core/src/index.test.ts` | `BusKind.INTER_PANE` in assertion | `BusKind.IPC_PEER` |

### Category 3: Runtime Consumer Updates

| File | Changes |
|------|---------|
| `packages/runtime/src/runtime.ts` | `case BusKind.INTER_PANE:` (line 466) → `case BusKind.IPC_PEER:`, plus 3 synthetic-event `kind: BusKind.INTER_PANE` objects (lines 724, 832, 881) |
| `packages/runtime/src/enforce.ts` | `if (event.kind === BusKind.INTER_PANE)` (line 75) → `BusKind.IPC_PEER`; inline comment "Non-state inter-pane" → "Non-state IPC-PEER" |
| `packages/runtime/src/service-dispatch.ts` | JSDoc header comment "Routes INTER_PANE events" → "Routes IPC-PEER events"; `@param event` JSDoc "The INTER_PANE event" → "The IPC-PEER event" |
| `packages/runtime/src/state-handler.ts` | `kind: BusKind.INTER_PANE` (line 38) → `kind: BusKind.IPC_PEER` |

### Category 4: Services Consumer Updates

| File | Changes |
|------|---------|
| `packages/services/src/audio-service.ts` | JSDoc "Create a synthetic INTER_PANE event" → "Create a synthetic IPC-PEER event"; `kind: BusKind.INTER_PANE` → `kind: BusKind.IPC_PEER`; inline comment "Only handle INTER_PANE events" → "Only handle IPC-PEER events"; `if (event.kind !== BusKind.INTER_PANE)` → `!== BusKind.IPC_PEER` |
| `packages/services/src/notification-service.ts` | Same pattern as audio-service.ts (3 sites) |
| `packages/services/src/notification-service.test.ts` | `kind: BusKind.INTER_PANE` in fixture → `kind: BusKind.IPC_PEER` |

### Category 5: Shell Consumer Updates

| File | Changes |
|------|---------|
| `packages/shell/src/audio-manager.ts` | `kind: BusKind.INTER_PANE` (line 102) → `kind: BusKind.IPC_PEER` |
| `packages/shell/src/state-proxy.ts` | `kind: BusKind.INTER_PANE` (line 38) → `kind: BusKind.IPC_PEER` |

### Category 6: Shim Consumer Updates

| File | Changes |
|------|---------|
| `packages/shim/src/index.ts` | JSDoc "Broadcast an inter-pane event" → "Broadcast an IPC-PEER event"; "Subscribe to inter-pane events" → "Subscribe to IPC-PEER events"; "Thin wrapper around subscribe() that filters by inter-pane event kind" → "Thin wrapper around subscribe() that filters by IPC-PEER event kind"; `BusKind.INTER_PANE` (2 uses) → `BusKind.IPC_PEER`; inline comment "no action needed for inter-pane subscriptions" → "no action needed for IPC-PEER subscriptions" |

### Category 7: Runtime Test Updates

| File | Changes |
|------|---------|
| `packages/runtime/src/dispatch.test.ts` | 9 occurrences: `BusKind.INTER_PANE` → `BusKind.IPC_PEER`; inline comments "inter-pane event" → "IPC-PEER event"; `it('sends OK true for inter-pane events'` → `it('sends OK true for IPC-PEER events'` |

### Category 8: SPEC.md Combined Pass (inherited from Phase 34 D-07)

Per D-08, Phase 35 edits SPEC.md once with three changes applied together:

**8a — INTER-PANE/inter-pane → IPC-PEER (10 occurrences):**

| Line (approx) | Current | New |
|---------------|---------|-----|
| 406 | "inter-pane topic events (kind 29003)" | "IPC-PEER topic events (kind 29003)" |
| 437 | `29003 \| INTER_PANE \| Inter-napplet messaging...` | `29003 \| IPC_PEER \| Inter-napplet messaging...` |
| 539 | "kind 29003 (INTER_PANE) events" | "kind 29003 (IPC_PEER) events" |
| 630 | "kind 29003 INTER_PANE)" | "kind 29003 IPC_PEER)" |
| 638 | "kind 29003 INTER_PANE)" | "kind 29003 IPC_PEER)" |
| 664 | "kind 29003 (INTER_PANE) with" | "kind 29003 (IPC_PEER) with" |
| 757 | "kind 29003 (INTER_PANE)" | "kind 29003 (IPC_PEER)" |
| 897 | "Services receive messages via INTER_PANE events" | "Services receive messages via IPC-PEER events" |
| 908 | "The shell routes INTER_PANE events" | "The shell routes IPC-PEER events" |
| 920 | "napplet sends INTER_PANE events" | "napplet sends IPC-PEER events" |

**8b — napp → napplet corrections (standalone `napp` where `napplet` is meant):**

Key SPEC.md occurrences:
- Line 35: `napp pubkey prefix and napp type` → `napplet pubkey prefix and napplet type`
- Line 167: `blocked napp` → `blocked napplet`
- Line 250: `napp's published NIP-5A manifest` → `napplet's published NIP-5A manifest`
- Line 265: `blocked napp` → `blocked napplet`
- Line 348: `cross-napp subscription` → `cross-napplet subscription`
- Line 412-415: `blocked napp attempts` → `blocked napplet attempts`; `REQ from blocked napp` → `REQ from blocked napplet`; `EVENT from blocked napp` → `EVENT from blocked napplet`
- Line 599: `Each napp identity` → `Each napplet identity`
- Line 604: `napp state limit` → `napplet state limit`
- Line 606: `per-napp quota` → `per-napplet quota`
- Line 613: `napp-state:{pubkey}` — **DO NOT change** (this is the localStorage key prefix that was already migrated to `napplet-state:` in Phase 34; verify actual SPEC.md content)
- Line 620: `napp's aggregateHash changes` → `napplet's aggregateHash changes`
- Line 648: `napp:audio-muted` — **DO NOT change** (this is a topic string value already renamed in Phase 34)
- Line 702-710: `napp class identifier`, `napp URL`, `napp class identifier` → `napplet class identifier`, `napplet URL`, `napplet class identifier`
- Line 1041: `napp's NIP-5A manifest` → `napplet's NIP-5A manifest`
- Line 1085: `Per-napp state quota` → `Per-napplet state quota`
- Line 1141: `napp directory listings` → `napplet directory listings`
- Line 1159-1162: `napp publisher hex pubkey`, `napp_type` — examine for context; `napp_type` is an identifier in a JSON blob, context-dependent

**Note on SPEC.md napp→napplet:** Only standalone `napp` (meaning the sandboxed iframe app) is renamed. Do NOT rename `napp:state-response` or `napp:audio-muted` topic strings (those are wire values renamed in Phase 34). Do NOT rename package names or code identifiers in code blocks if they are still using old names (coordinate with Phase 34 completion).

**8c — IPC-* namespace section (new content):**

Add a new subsection within the BusKind table section (around line 437) documenting:
```
#### IPC-* Namespace

The `IPC-*` prefix is reserved for the inter-napplet communication bus. Current and reserved members:

| Constant | Kind | Status | Description |
|----------|------|--------|-------------|
| `IPC_PEER` | 29003 | Current | Directed peer-to-peer IPC between napplets and the shell |
| `IPC_BROADCAST` | TBD | Reserved | Future: broadcast to all napplets |
| `IPC_CHANNEL` | TBD | Reserved | Future: named channel pubsub |

See `@napplet/core` `constants.ts` for the authoritative BusKind definition.
```

---

## Dependency Order / Wave Analysis

### Wave 1 — Core constant definition (single source of truth)
1. `packages/core/src/constants.ts` — Rename `INTER_PANE` → `IPC_PEER`; update JSDoc; add IPC-* family table

**After Wave 1, TypeScript type-check will fail at all 30+ consumer sites. That's expected and resolved in Wave 2.**

### Wave 2 — All consumers (atomic — all must be updated together before type-check passes)
2. `packages/core/src/topics.ts` — Prose updates only (no code change needed — TOPICS constants don't reference BusKind)
3. `packages/runtime/src/runtime.ts` — 4 BusKind.IPC_PEER updates
4. `packages/runtime/src/enforce.ts` — 1 code + 1 comment
5. `packages/runtime/src/service-dispatch.ts` — Comments/JSDoc only
6. `packages/runtime/src/state-handler.ts` — 1 code change
7. `packages/services/src/audio-service.ts` — 3 code + 1 comment
8. `packages/services/src/notification-service.ts` — 3 code + 1 comment
9. `packages/shell/src/audio-manager.ts` — 1 code change
10. `packages/shell/src/state-proxy.ts` — 1 code change
11. `packages/shim/src/index.ts` — 2 code + 3 comment

### Wave 3 — Test updates
12. `packages/core/src/index.test.ts` — 2 BusKind.IPC_PEER
13. `packages/runtime/src/dispatch.test.ts` — 9 updates
14. `packages/services/src/notification-service.test.ts` — 1 update

### Wave 4 — SPEC.md combined pass (independent, no TypeScript dependency)
15. `SPEC.md` — Single edit: INTER-PANE→IPC-PEER (10 sites) + napp→napplet corrections + IPC-* namespace section

---

## Risk Areas

### Low: No Public API Breaking Changes

`BusKind` is an `as const` object. The rename affects the key name only, not the numeric value (29003). There is no deprecated alias (D-01). This is a clean break by design. Consumers of BusKind that live outside this monorepo (e.g., hyprgate) are expected to self-migrate.

### Low: No Wire Format Change

Kind 29003 numeric value is unchanged. Only the constant identifier changes. Any deployed napplet-shell communication continues to work correctly — the renaming has zero runtime impact.

### Low: SPEC.md Combined Pass

SPEC.md is documentation — no TypeScript compilation. The combined pass (D-08) simply requires care to apply all three changes (INTER-PANE, napp, IPC-* section) in a single edit session. No dependency on code compilation.

### Watch: dist/ files

`packages/*/dist/index.d.ts` files also contain `INTER_PANE`. These are build outputs and will be regenerated by `pnpm build`. Do NOT manually edit dist files — they are overwritten on build.

---

## Validation Architecture

### Quick Validation (after each wave)
```bash
cd /home/sandwich/Develop/napplet
pnpm type-check 2>&1 | tail -5
```

### Full Validation (after all waves)
```bash
cd /home/sandwich/Develop/napplet
pnpm build && pnpm type-check
grep -r 'INTER.PANE\|INTER_PANE\|inter.pane' packages/ --include="*.ts" --exclude-dir=node_modules --exclude-dir=dist | wc -l
grep -c 'INTER.PANE\|inter.pane\|inter_pane' SPEC.md
```

### Success Gate (WIRE-01, WIRE-02)
- `grep -r 'INTER_PANE\|INTER-PANE\|inter-pane' packages/ --include="*.ts" --exclude-dir=node_modules --exclude-dir=dist` returns zero hits
- `grep -c 'INTER.PANE\|INTER_PANE\|inter.pane' SPEC.md` returns 0
- `pnpm type-check` exits 0 across all packages
- All existing tests pass

---

## RESEARCH COMPLETE

Research confirms:
1. 42 lines across 17 source files need code/prose updates (excluding dist/)
2. No deprecated alias — clean rename (D-01)
3. No public API breakage — BusKind is internal; numeric value 29003 unchanged
4. SPEC.md needs 10 INTER-PANE replacements + ~20 napp→napplet prose corrections + 1 new IPC-* section
5. dist/ files are regenerated on build — do not manually edit
6. Wave order: constants.ts first (core), then all consumers (Wave 2 — can be done atomically in one plan), then tests (Wave 3), then SPEC.md (Wave 4, independent)
7. Plan split: Wave 1+2 in Plan 35-01 (core + consumers), Wave 3 in Plan 35-02 (tests), Wave 4 in Plan 35-03 (SPEC.md)

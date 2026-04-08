---
status: passed
phase: 84
phase_name: spec-gap-inventory
verified: 2026-04-08
requirement_ids: [GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, GAP-06, GAP-07, GAP-09]
---

# Phase 84 Verification: Spec Gap Inventory

## Phase Goal

Every piece of code not covered by NIP-5D or a NUB spec is documented with location, purpose, and a recommendation category.

## Must-Have Verification

### SC1: Gap inventory document exists

**Status:** PASSED

`.planning/SPEC-GAPS.md` exists (563 lines). Lists every unspecified type, constant, function, and behavior with file location, description, and recommendation category.

### SC2: Specific items documented

**Status:** PASSED

All required items present in the inventory:
- `Capability` type (GAP-01, shell-only)
- `ALL_CAPABILITIES` constant (GAP-01, shell-only)
- `TOPICS` constant with per-topic breakdown (GAP-02a/b/c)
- `SHELL_BRIDGE_URI` (GAP-03, superseded)
- `REPLAY_WINDOW_SECONDS` (GAP-04, shell-only)
- `PROTOCOL_VERSION` (GAP-05, unknown)

### SC3: Unspecified parallel protocols documented

**Status:** PASSED

- `window.nostrdb` proxy (nipdb-shim.ts) documented as GAP-06 (future-nub)
- `keyboard.forward` shim (keyboard-shim.ts) documented as GAP-07 (unknown)

### SC4: IFC channel types documented

**Status:** PASSED

9 IFC channel message types (`ifc.channel.*`) documented as GAP-09 (future-nub). Noted as defined-but-unimplemented -- types exist in `@napplet/nub-ifc` but shim has no channel support.

### SC5: Each entry has a recommendation category

**Status:** PASSED

All 10 entries (8 primary GAPs + 2 sub-IDs for GAP-02) have exactly one category from: `future-nub`, `unknown`, `superseded`, `shell-only`.

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| GAP-01 | Verified | Capability type + ALL_CAPABILITIES documented as shell-only |
| GAP-02 | Verified | 28 topics broken into 3 sub-categories (5 future-nub, 7 superseded, 16 unknown) |
| GAP-03 | Verified | SHELL_BRIDGE_URI documented as superseded |
| GAP-04 | Verified | REPLAY_WINDOW_SECONDS documented as shell-only |
| GAP-05 | Verified | PROTOCOL_VERSION documented as unknown |
| GAP-06 | Verified | window.nostrdb proxy documented as future-nub |
| GAP-07 | Verified | keyboard.forward shim documented as unknown |
| GAP-09 | Verified | 9 IFC channel types documented as future-nub |

## Automated Checks

```
file exists:          PASS
GAP-01 present:       PASS (4 occurrences)
GAP-02 present:       PASS (10 occurrences)
GAP-03 present:       PASS (2 occurrences)
GAP-04 present:       PASS (2 occurrences)
GAP-05 present:       PASS (2 occurrences)
GAP-06 present:       PASS (4 occurrences)
GAP-07 present:       PASS (3 occurrences)
GAP-09 present:       PASS (2 occurrences)
## GAP- headers:      8 (PASS, >= 8)
Category: markers:    10 (PASS, >= 10)
shell-only:           8 (PASS, >= 2)
superseded:           6 (PASS, >= 2)
future-nub:           8 (PASS, >= 3)
```

## Result

**PASSED** -- All 5 success criteria verified. All 8 GAP requirements documented with location, evidence, and recommendation categories.

---
plan: 25-01
phase: 25-spec-md-updates
status: complete
completed: 2026-03-31
self_check: PASSED
---

# Summary: 25-01 — SPEC.md Updates

## What Was Built

Updated `SPEC.md` to accurately reflect the v0.4.0 protocol implementation across three requirements.

## Tasks Completed

| Task | Description | Status |
|------|-------------|--------|
| 1 | SPEC-02: Verify/fix legacy naming, update draft date | ✓ |
| 2 | SPEC-01: Rewrite Section 11 (service discovery) | ✓ |
| 3 | SPEC-03 Part A: Add Section 15.6 (requires tags) | ✓ |
| 4 | SPEC-03 Part B: Add Sections 2.9 and 2.10 (CompatibilityReport, consent) | ✓ |
| 5 | Clean up Section 17.3 future work | ✓ |

## Key Changes

- **Section 11.1**: Removed stale "deferred" status box; replaced with normative paragraph noting v0.4.0 implementation
- **Section 11.2**: Fixed sentinel pubkey (`0000...0000`, 64 hex zeros) and sentinel sig (128 hex zeros) — previously used invalid `"__shell__"` and `""` placeholders; added `sig` row to field table
- **Section 11.4**: Added live subscription behavior (shell sends EVENT to active subscribers on new service registration); added empty registry behavior (immediate EOSE)
- **Section 2.9**: Added `CompatibilityReport` documentation — `available`, `missing`, `compatible` fields; strict vs permissive mode; `onCompatibilityIssue` callback
- **Section 2.10**: Added undeclared service consent — `ConsentRequest` type `'undeclared-service'`, session consent cache, silent drop behavior
- **Section 15.6**: Added requires tags — `["requires", "service-name"]` manifest tag format, vite-plugin generation, `<meta name="napplet-requires">` injection, cross-reference to Section 11.2
- **Section 17.3**: Removed "Service discovery implementation" and "Service dependency declaration" from future work (both shipped)
- **Draft date**: Updated to `2026-03-31`
- **`__shell__` subscription ID**: Replaced with generic `"sub-id"` placeholder in Section 1.8 example

## Verification Results

- `grep -c "PseudoRelay|createPseudoRelay|PSEUDO_RELAY_URI|pseudo-relay"` → 0 ✓
- `grep -c "__shell__"` → 0 ✓
- `grep -c "000...000"` (sentinel pubkey, 64 zeros) → 4 ✓
- `grep -c "### 2\.9|### 2\.10|### 15\.6"` → 3 ✓
- `grep -c "CompatibilityReport"` → 1 ✓
- `grep -c "undeclared-service"` → 1 ✓
- `grep -c "napplet-requires"` → 1 ✓
- Section 17.3 stale items → NONE ✓

## Deviations

None. All tasks completed as specified.

## key-files

### created
(none — documentation update only)

### modified
- SPEC.md

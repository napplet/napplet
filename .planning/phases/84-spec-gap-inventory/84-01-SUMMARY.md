---
phase: 84
plan: 1
status: complete
started: 2026-04-08
completed: 2026-04-08
---

# Summary: 84-01 Create SPEC-GAPS.md Inventory Document

## What was built

Created `.planning/SPEC-GAPS.md` -- a comprehensive spec gap inventory documenting every piece of code in the napplet SDK not covered by NIP-5D or any NUB spec.

## Key files

### Created
- `.planning/SPEC-GAPS.md` -- The spec gap inventory (563 lines)

## Results

### Gap entries documented
- **GAP-01** (`shell-only`): `Capability` type + `ALL_CAPABILITIES` -- ACL string union, shell runtime concern
- **GAP-02a** (`future-nub`): 5 TOPICS entries for cross-napplet coordination
- **GAP-02b** (`superseded`): 7 TOPICS entries replaced by storage.* NUB or AUTH removal
- **GAP-02c** (`unknown`): 16 TOPICS entries with no clear spec home
- **GAP-03** (`superseded`): `SHELL_BRIDGE_URI` -- references removed NIP-42 AUTH
- **GAP-04** (`shell-only`): `REPLAY_WINDOW_SECONDS` -- shell implementation detail
- **GAP-05** (`unknown`): `PROTOCOL_VERSION` -- NIP-5D is versionless by Nostr convention
- **GAP-06** (`future-nub`): `window.nostrdb` proxy -- parallel NIP-DB cache protocol
- **GAP-07** (`unknown`): `keyboard.forward` shim -- hotkey forwarding, ambiguous ownership
- **GAP-09** (`future-nub`): 9 IFC channel message types, defined but unimplemented

### Verification
- All 8 primary GAP requirements documented with sub-IDs for GAP-02
- 10 Category: markers across entries (including GAP-02 sub-IDs)
- 8 `## GAP-*` section headers
- Every entry includes: what, where (file:line), code snippet, evidence, category, reasoning
- Cross-references link related gaps (e.g., hotkey:forward capability <-> keyboard shim)
- Document is self-contained -- reader does not need source files to understand each gap

## Self-Check: PASSED

All acceptance criteria from the plan verified:
1. File exists at `.planning/SPEC-GAPS.md`
2. Summary table with ID, What, Where, Category, Description columns
3. All GAP-IDs present in summary table
4. Prose sections for each GAP with required fields
5. GAP-02 per-topic breakdown into future-nub/superseded/unknown
6. Correct category assignments per plan specification

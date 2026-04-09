---
plan: 86-01
phase: 86
one_liner: Captured drop/defer/amend decisions for all gap inventory items
status: complete
tasks_completed: 2
tasks_total: 2
files_modified:
  - .planning/SPEC-GAPS.md
req_ids:
  - DECIDE-01
---

# Plan 86-01 Summary: Decision Gate

## What was done

Presented the complete SPEC-GAPS.md inventory (10 items across 8 GAP IDs) to the spec author. Each item was reviewed with its evidence, and a verdict was captured: drop, defer, amend-spec, or removed-from-inventory.

## Results

| Verdict | Count | Items |
|---------|-------|-------|
| **drop** | 7 | GAP-01, GAP-02b, GAP-02c-config, GAP-02c-relay, GAP-03, GAP-04, GAP-05 |
| **defer** | 5 | GAP-02a, GAP-02c-keybinds, GAP-02c-wm, GAP-02c-audio, GAP-06 |
| **amend-spec** | 1 | GAP-07 (keyboard forwarding) |
| **removed** | 1 | GAP-09 (IFC channels — spec-backed by IFC NUB draft) |

## Key corrections

- GAP-06 (nostrdb proxy) reclassified from "future-nub" to "spec-backed with conformance audit needed" — NUB spec exists as napplet/nubs#4
- GAP-09 (IFC channel types) removed from inventory entirely — spec-backed by IFC NUB draft in napplet/nubs

## Files modified

- `.planning/SPEC-GAPS.md` — Decision Summary section added, per-entry Decision subsections added, GAP-09 struck through

## Requirements completed

- DECIDE-01: Present full documented gap inventory for drop-or-amend decisions on each GAP item

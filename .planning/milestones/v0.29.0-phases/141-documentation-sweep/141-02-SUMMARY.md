---
phase: 141-documentation-sweep
plan: 02
subsystem: docs
tags: [vite-plugin, readme, nub-connect, v0.29.0, documentation-sweep, strictcsp-deprecated]

requires:
  - phase: 138-vite-plugin-strict-csp
    provides: connect option, inline-script diagnostic, cleartext warning, dev-mode napplet-connect-requires meta, strictCsp deprecation
  - phase: 135-cross-repo-spec-work
    provides: NUB-CONNECT draft with canonical aggregateHash fold fixture
  - phase: 140-shell-policy-documents
    provides: SHELL-CONNECT-POLICY.md + SHELL-CLASS-POLICY.md for shell-deployer cross-references
provides:
  - packages/vite-plugin/README aligned with v0.29.0 shipped code surface — strictCsp as deprecated-with-migration-pointer, connect option documented with full accept/reject rules, Build-Time Diagnostics section covering inline-script fail-loud + cleartext warning + dev-mode connect-requires meta
affects:
  - 142 (verification phase — DOC-03 now closed; VER-01/VER-02 can cross-check against README claims)

tech-stack:
  added: []
  patterns:
    - Doc-sweep pattern — strictCsp section fully replaced (not truncated), connect option + Build-Time Diagnostics section added, all unrelated sections byte-identical
    - Cross-reference pattern — README points to sibling spec drafts (NUB-CONNECT / NUB-CLASS / NUB-CLASS-1 / NUB-CLASS-2) and shell-policy checklists (SHELL-CONNECT-POLICY / SHELL-CLASS-POLICY) rather than duplicating their content

key-files:
  created: []
  modified:
    - packages/vite-plugin/README.md

key-decisions:
  - strictCsp section FULLY replaced with a short deprecation note (not an inline @deprecated banner atop the old content) — cleanest signal to new authors that the feature is gone, old v0.28.0 content preserved only via git history
  - connect option documented as standalone '#### connect (optional, v0.29.0+)' sibling to configSchema, not as a property of a hypothetical network-options block
  - Build-Time Diagnostics is a new top-level '##' section between Service Dependencies and How It Works (not nested under Plugin Options) because it spans configResolved + closeBundle + transformIndexHtml; consolidates all v0.29.0 guardrails in one discoverable place
  - Module-load conformance fixture digest cited verbatim (cc7c1b19...) so doc-readers can verify their plugin build matches the spec without running code
  - Nip5aManifestOptions interface retains strictCsp?: unknown (not removed) matching the actual code; @deprecated JSDoc steers authors toward removal before v0.30.0

patterns-established:
  - When a previously-documented option is deprecated, replace the section with a migration-pointer stub rather than truncating silently or keeping the old content with a banner — authors reading the README should get one canonical path forward
  - When a new config option has multiple fail-modes across config lifecycle phases (configResolved validation, closeBundle emission, transformIndexHtml injection), split the reference into an option section (what the author configures) + a Build-Time Diagnostics section (what the plugin emits and when)

requirements-completed:
  - DOC-03
  - DOC-07

duration: 12min
completed: 2026-04-21
---

# Phase 141 Plan 02: vite-plugin README Rewrite Summary

**vite-plugin README rewritten for the v0.29.0 surgery — strictCsp section replaced by deprecated-with-migration-pointer stub, new connect option documented with full origin accept/reject rules + normative conformance fixture digest, and a consolidated Build-Time Diagnostics section covering inline-script fail-loud, cleartext warning, and dev-mode connect-requires meta.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-21
- **Completed:** 2026-04-21
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Former `#### strictCsp (optional, v0.28.0+)` section (~55 lines with 10-directive CSP table + 4 pitfall callouts) completely replaced by a `#### strictCsp (deprecated in v0.29.0)` stub that shows the exact console.warn text and cross-links to the new `connect` section + Build-Time Diagnostics + SHELL-CONNECT-POLICY checklist
- New `#### connect (optional, v0.29.0+)` section documents the origin format rules (8-row accept/reject table), manifest tag emission (author-declared order, placed between manifestXTags and configTags), aggregateHash fold (canonical procedure + SHA-256 digest + auto-invalidation rationale), and the module-load conformance guardrail (normative fixture cc7c1b19...)
- New `## Build-Time Diagnostics` top-level section documents inline-script fail-loud (full allow-list + reject list + why it's a hard error), cleartext origin warning (exact warning text + operator-policy rationale), and dev-mode-only `napplet-connect-requires` meta (explicit distinction from shell-authoritative `napplet-connect-granted`)
- `Nip5aManifestOptions` interface in API Reference reflects v0.29.0 shape: `connect?: string[]` added with JSDoc; `strictCsp?: unknown` retained with `@deprecated` JSDoc for back-compat
- Protocol Reference bullet list gains NUB-CONNECT + NUB-CLASS + NUB-CLASS-1 + NUB-CLASS-2 + SHELL-CONNECT-POLICY + SHELL-CLASS-POLICY pointers; NUB-RESOURCE "(PR pending)" → "(drafts)" reflecting current state
- All unrelated sections (Getting Started, Installation, Quick Start, configSchema, requires, Build-Time Guards, Environment Variables, Service Dependencies, How It Works Dev Mode / Build Mode) byte-identical per DOC-07

## Task Commits

1. **Task 1: Rewrite strictCsp section + add connect option + add Build-Time Diagnostics + update Nip5aManifestOptions interface** - `582bac3` (docs)

## Files Created/Modified
- `packages/vite-plugin/README.md` - strictCsp section replaced by deprecated-stub; connect option added; Build-Time Diagnostics section added; Nip5aManifestOptions interface updated; Protocol Reference extended with NUB-CONNECT / NUB-CLASS / shell-policy pointers

## Decisions Made
- None - plan executed exactly as written. All positive literal-string greps pass (V1-V10). All negative-terminology greps pass (no strictCsp: true, no 10-directive baseline, no perm:strict-csp, no StrictCspOptions / buildBaselineCsp / validateStrictCspOptions / assertMetaIsFirstHeadChild / 'nonce-<random>' / Pitfall 1/2/18/19 / first child of <head>).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Positive and negative greps both passed on first post-edit check. Type-check exits 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DOC-03 and DOC-07 are now complete. Combined with Plan 141-01, all 7 DOC REQ-IDs (DOC-01..07) are closed.
- v0.29.0 is ready for verification Phase 142 — all user-facing documentation now reflects the shipped code surface.

## Self-Check: PASSED

packages/vite-plugin/README.md exists; task commit 582bac3 present in git log.

---
*Phase: 141-documentation-sweep*
*Completed: 2026-04-21*

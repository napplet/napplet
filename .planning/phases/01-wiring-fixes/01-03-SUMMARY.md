---
phase: 01-wiring-fixes
plan: 03
subsystem: infra
tags: [namespace, branding, protocol-uri, meta-tags, localStorage]

requires:
  - phase: none
    provides: n/a
provides:
  - All protocol identifiers use napplet namespace (URI, meta tags, localStorage keys, CustomEvents)
affects: [01-04, 02-test-infrastructure, 05-demo-playground, 06-specification-and-publish]

tech-stack:
  added: []
  patterns: [napplet://shell URI, napplet-* meta tags, napplet: localStorage prefix, napplet: CustomEvent prefix]

key-files:
  created: []
  modified:
    - packages/shell/src/types.ts
    - packages/shim/src/types.ts
    - packages/shell/src/pseudo-relay.ts
    - packages/shell/src/acl-store.ts
    - packages/shell/src/manifest-cache.ts
    - packages/shell/src/audio-manager.ts
    - packages/shell/src/napp-key-registry.ts
    - packages/shim/src/index.ts
    - packages/vite-plugin/src/index.ts
    - packages/vite-plugin/README.md
    - SPEC.md

key-decisions:
  - "Hard cut with no backward compatibility -- no migration layer for hyprgate references"
  - "Project name references to hyprgate in SPEC.md preserved (only protocol identifiers renamed)"

patterns-established:
  - "Namespace pattern: napplet://shell for URI, napplet-* for meta tags, napplet: for localStorage and CustomEvents"

requirements-completed: [FIX-04]

duration: 3min
completed: 2026-03-30
---

# Plan 01-03: Hyprgate-to-Napplet Rename Summary

**Renamed all hyprgate protocol identifiers to napplet across all packages, spec, and plugin docs -- zero hyprgate references remain in TypeScript source**

## Performance

- **Duration:** 3 min
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- PSEUDO_RELAY_URI changed from hyprgate://shell to napplet://shell in both shell and shim types
- Meta tag selectors changed from hyprgate-napp-type/hyprgate-aggregate-hash to napplet-napp-type/napplet-aggregate-hash
- localStorage keys changed from hyprgate:acl/hyprgate:manifest-cache to napplet:acl/napplet:manifest-cache
- CustomEvent names changed from hyprgate:audio-changed/hyprgate:pending-update to napplet: prefix
- SPEC.md protocol identifiers updated while preserving project name references

## Task Commits

1. **Task 1-3: Rename all protocol identifiers** - `d918eee` (refactor)

## Files Created/Modified
- `packages/shell/src/types.ts` - PSEUDO_RELAY_URI = 'napplet://shell'
- `packages/shim/src/types.ts` - PSEUDO_RELAY_URI = 'napplet://shell'
- `packages/shell/src/pseudo-relay.ts` - Error message updated
- `packages/shell/src/acl-store.ts` - STORAGE_KEY = 'napplet:acl'
- `packages/shell/src/manifest-cache.ts` - STORAGE_KEY = 'napplet:manifest-cache'
- `packages/shell/src/audio-manager.ts` - CustomEvent 'napplet:audio-changed'
- `packages/shell/src/napp-key-registry.ts` - CustomEvent 'napplet:pending-update'
- `packages/shim/src/index.ts` - Meta tag selectors napplet-napp-type, napplet-aggregate-hash
- `packages/vite-plugin/src/index.ts` - Meta tag injection napplet-aggregate-hash
- `packages/vite-plugin/README.md` - Documentation updated
- `SPEC.md` - Protocol URI and meta tag references updated

## Decisions Made
- Hard cut with no backward compatibility per CONTEXT.md D-03 and D-04
- Preserved hyprgate project name references in SPEC.md (only protocol identifiers renamed)

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Namespace is consistent across all packages
- Plan 01-04 can now use the updated error messages

---
*Phase: 01-wiring-fixes*
*Completed: 2026-03-30*

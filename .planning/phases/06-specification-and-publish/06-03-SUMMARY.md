---
phase: 06-specification-and-publish
plan: 03
status: complete
started: 2026-03-30
completed: 2026-03-30
commits: 1
---

# Plan 06-03: Package READMEs — Summary

## What Was Built

Comprehensive READMEs for all three packages with getting-started guides, API reference with parameter/return types, and usage examples.

## Key Outputs

### @napplet/shim README
- Getting Started section explaining what a napplet is and how the shim works
- Installation with peer dependency note
- Quick Start showing subscribe, publish, on, and nappStorage usage
- Full API Reference for all 6 public exports: subscribe, publish, query, emit, on, nappStorage
- Each API entry includes parameter table, return type, and code example
- nappStorage documented with all 5 methods and their signatures
- Types section listing all exported types
- Links to SPEC.md, NIP-5A, NIP-01

### @napplet/shell README
- Getting Started explaining the shell's role as pseudo-relay
- Quick Start with full createPseudoRelay + hooks example
- API Reference for PseudoRelay interface (5 methods)
- ShellHooks interface documented with all 9 sub-interfaces
- Standalone utilities (originRegistry, aclStore, etc.) documented
- Protocol constants table
- Full types export list
- Links to SPEC.md, NIP-5A, NIP-42

### @napplet/vite-plugin README
- Clear "development tool" framing at the top
- "When to Use" and "When NOT to Use" sections
- Explains both dev mode (meta tag injection) and build mode (manifest generation)
- VITE_DEV_PRIVKEY_HEX documented with security warning
- API Reference for nip5aManifest and Nip5aManifestOptions
- Links to SPEC.md, NIP-5A, and aggregate hash PR#2287

## Self-Check: PASSED

- [x] All READMEs have Getting Started, Installation, Quick Start, API Reference sections
- [x] @napplet/shim documents all 6 public API exports with signatures
- [x] @napplet/shell documents ShellHooks interface thoroughly
- [x] @napplet/vite-plugin clearly framed as dev-only tool with "When NOT to Use"
- [x] All READMEs link to SPEC.md
- [x] Function signatures match actual TypeScript source code

## Key Files

### Modified
- `packages/shim/README.md` — Complete rewrite (+198 lines)
- `packages/shell/README.md` — Complete rewrite (+221 lines)
- `packages/vite-plugin/README.md` — Complete rewrite (+118 lines)

### Commits
- `38926a3` — docs(packages): write comprehensive READMEs

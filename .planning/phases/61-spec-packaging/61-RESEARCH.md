# Phase 61: Spec Packaging - Research

**Researched:** 2026-04-05
**Phase:** 61-spec-packaging
**Objective:** What do I need to know to PLAN this phase well?

## RESEARCH COMPLETE

This is mechanical packaging work. Research identifies all files to modify, exact references to update, and NIP format conventions to follow.

## 1. Files That Reference SPEC.md

### Package READMEs (8 files, identical pattern)

Every package README has a "Related" or "References" section with this exact line:

```markdown
- [Napplet Shell Protocol Specification](../../SPEC.md)
```

Files:
- `packages/acl/README.md` (line ~285)
- `packages/core/README.md` (line ~202)
- `packages/runtime/README.md` (line ~300)
- `packages/sdk/README.md` (line ~166)
- `packages/services/README.md` (line ~273)
- `packages/shell/README.md` (line ~276)
- `packages/shim/README.md` (line ~169)
- `packages/vite-plugin/README.md` (line ~208)

### PROJECT.md References

`.planning/PROJECT.md` references SPEC.md in multiple places:
- Line ~21: "SPEC.md sections 2, 5, 14 updated"
- Line ~59: "SPEC.md Section 11"
- Line ~72-103: Multiple milestone completion references
- Line ~129: "Rename existing SPEC.md to internal/runtime reference"
- Line ~160: "SPEC.md (41KB+) covers full protocol"
- Line ~161: "SPEC.md SEC-01 says..."

**Decision needed:** PROJECT.md references are historical -- they document what was done in past milestones. These should NOT be changed (they're accurate history). Only the live reference in line ~160 should be updated.

### CLAUDE.md

The root `CLAUDE.md` does NOT directly reference SPEC.md. The `## Project Overview` section describes the packages but does not link to the spec file.

### Skills Directory

`skills/` contains `add-service`, `build-napplet`, `integrate-shell`. These may reference SPEC.md internally -- needs checking during execution.

### Planning Artifacts

Multiple `.planning/` files reference SPEC.md but these are historical artifacts from completed phases. They should NOT be updated -- they document what was done at the time.

## 2. Current SPEC.md Format

The existing SPEC.md already uses NIP-format setext headings:

```markdown
NIP-XXXX
========

Napplet Shell Protocol: Iframe-to-Shell Communication via postMessage
---------------------------------------------------------------------

`draft` `optional`
```

It has a `## Status` section, `## Referenced NIPs`, and full protocol content. It is approximately 1520 lines / 41KB.

## 3. NIP Format Conventions (from NIP-5A and STACK.md research)

### Header Format (Verified from NIP-5A)

```markdown
NIP-5D
======

Title Here
----------

`draft` `optional`
```

- Setext headings (underline style) for the two top-level headers only
- Status badges: `draft` `optional` (backtick-wrapped, space-separated)
- No YAML frontmatter, no author fields, no date fields
- Body uses ATX headings (### Section Name)

### Section Conventions

From NIP-5A structure:
- Subsections use `###` ATX headings
- Code blocks use triple backticks with `jsonc` language hint for JSON with comments
- RFC 2119 keywords (MUST, SHOULD, MAY) in uppercase
- References to other NIPs: `[NIP-01](01.md)` (relative links within the nips repo)
- No explicit "References" section in NIP-5A -- references are inline
- No "Implementations" section in NIP-5A itself

### Implementations Section

The CONTEXT.md specifies listing implementations. While NIP-5A doesn't have this, some NIPs do include implementation references. This should go at the end of the NIP.

## 4. NIP-5D Content Source

The NIP-5D content is being written in Phases 58 (core protocol) and 59 (pipe protocol). Phase 61 does NOT write the NIP content -- it only:

1. Ensures the NIP file uses correct formatting conventions
2. Adds the Implementations section
3. Renames SPEC.md -> RUNTIME-SPEC.md
4. Updates all cross-references

The NIP file likely already exists by the time Phase 61 executes (created in Phase 58, extended in Phase 59). Phase 61 polishes its format and adds packaging sections.

## 5. RUNTIME-SPEC.md Header

Per CONTEXT.md D-01, the renamed file needs a header noting it is the internal reference. Suggested format:

```markdown
# Napplet Shell Protocol - Runtime Reference

> **Internal documentation.** This is the detailed runtime implementation reference for the napplet protocol.
> For the protocol standard, see [NIP-5D](https://github.com/nostr-protocol/nips/blob/master/5D.md).

---

[rest of existing SPEC.md content, minus the NIP-style setext header]
```

The existing NIP-style setext header (`NIP-XXXX` / `======`) should be replaced with an ATX heading since it's no longer a NIP file.

## 6. Validation Architecture

### What to verify

| Aspect | Verification Method |
|--------|-------------------|
| SPEC.md renamed | `test -f RUNTIME-SPEC.md && ! test -f SPEC.md` |
| RUNTIME-SPEC.md has header | `grep "Internal documentation" RUNTIME-SPEC.md` |
| NIP-5D exists | `test -f NIP-5D.md` or wherever the NIP file lives |
| NIP-5D has setext headers | `grep -A1 "NIP-5D" <nip-file> \| grep "======"` |
| NIP-5D has draft badge | `grep "draft.*optional" <nip-file>` |
| NIP-5D has Implementations | `grep "Implementations" <nip-file>` |
| Package READMEs updated | `grep "RUNTIME-SPEC.md" packages/*/README.md` (8 matches) |
| No stale SPEC.md refs | `grep -r "SPEC\.md" packages/ --include="*.md"` (0 matches) |

## 7. Risk Assessment

**Low risk phase.** All work is document renaming and cross-reference updates. No code changes. No behavioral changes. The main risk is missing a SPEC.md reference somewhere, which is caught by grep verification.

## Sources

- NIP-5A format (read via MCP): setext headers, draft badge, inline references
- `.planning/research/STACK.md`: NIP format conventions, PR process
- `packages/*/README.md`: All 8 package READMEs with SPEC.md links
- `.planning/PROJECT.md`: Historical SPEC.md references
- `SPEC.md` header: Current NIP-style format

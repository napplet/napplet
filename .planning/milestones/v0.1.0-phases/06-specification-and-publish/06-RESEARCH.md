# Phase 6: Specification and Publish - Research

**Researched:** 2026-03-30
**Phase Goal:** The NIP-5A specification is refined from implementation learnings and all three packages are published to npm at v0.1.0 with validated ESM compatibility

## Research Scope

What do we need to know to PLAN this phase well? Two distinct workstreams: (1) spec refinement, (2) package validation + publish. Plus READMEs for all three packages.

---

## 1. SPEC.md Refinement Analysis

### Current State

SPEC.md is 999 lines, already NIP-formatted, lives at repo root. It covers:
- Transport layer (postMessage, sandbox policy, message format)
- Authentication handshake (NIP-42 based, kind 22242)
- NIP-01 message routing (subscriptions, events, filters)
- Security model (ACL, consent, storage isolation)
- Manifest format (NIP-5A references)

### Implementation Changes Requiring Spec Updates

From prior phase context documents (01-CONTEXT through 04-CONTEXT), these concrete changes were made during implementation that the spec must reflect:

| Change | Source | Spec Impact |
|--------|--------|-------------|
| Relay URI `shell://` (was `hyprgate://shell`) | Phase 1 D-01 | Update Section 2.2 AUTH relay tag |
| Meta tag prefix `napplet-*` (was `hyprgate-*`) | Phase 1 D-02 | Update Sections 2.3, 2.4 |
| Storage keys() uses repeated `['key', name]` tags | Phase 1 D-05 | Update storage response format |
| AUTH failure sends OK false + NOTICE about dropped msgs | Phase 1 D-06 | Update Section 2.5 (OK response) |
| Missing type/aggregateHash tags cause AUTH failure | Phase 3 D-02 | Update Section 2.2 (was permissive) |
| Pre-AUTH queue capped at 50 (configurable) | Phase 3 D-08 | Update Section 2.7 |
| Blocked napp gets `CLOSED` with `blocked:` prefix | Phase 3 D-09 | Update Section 3.x (routing) |
| ACL persistence format documented and locked | Phase 4 D-04 | New subsection in ACL section |
| Storage quota uses UTF-8 byte count | Phase 4 D-02 | Update storage section |
| Sender exclusion only for kind 29003 | Phase 3 D-07 | Update inter-pane section |
| NIP-01 error prefix convention | Phase 3 D-01 | Add error format documentation |

### Spec Sections Needing Attention

1. **Section 2 (AUTH)**: Relay tag value, missing tag behavior, OK+NOTICE on failure, queue cap
2. **Section 3 (Routing)**: Blocked napp CLOSED prefix, sender exclusion scope
3. **Storage section**: keys() format, quota computation, UTF-8 byte count
4. **Security/ACL section**: Persistence format, error prefixes
5. **Manifest section**: Clear distinction between NIP-5A event `x` tag (source of truth) and HTML meta tag (convenience)

### What NOT to Change

- The overall NIP structure and numbering
- The protocol version (2.0.0)
- The AUTH handshake sequence (already correct conceptually, just needs value updates)
- NIP-5A algorithm details (those live in the NIP-5A spec itself)

---

## 2. Package Validation (publint + arethetypeswrong)

### Tools

- **publint**: Validates package.json exports, files, types, and ESM correctness. Install: `npx publint`
- **@arethetypeswrong/cli**: Validates TypeScript type exports resolve correctly across all module resolution modes. Install: `npx @arethetypeswrong/cli`

### Current Package Configuration

All three packages share the same pattern:
```json
{
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

### Potential Issues

1. **`main` field**: With `"type": "module"`, the `main` field points to ESM. This is fine but `publint` may flag it — `main` traditionally signals CJS. May need to remove `main` or keep it (publint advice varies).
2. **`module` field**: Non-standard field, bundler-only. `publint` may warn about it. Safe to remove if only targeting modern ESM consumers.
3. **Missing `"sideEffects": false`**: Tree-shaking hint. Not a publint error but good practice.
4. **No CJS export**: Intentional (ESM-only). publint should be fine with this if exports map is correct.
5. **TypeScript `moduleResolution`**: arethetypeswrong checks node10, node16, bundler modes. The exports map with `types` condition should satisfy all.

### Validation Approach

1. Build all packages first: `pnpm build`
2. Run `npx publint ./packages/shim`, `npx publint ./packages/shell`, `npx publint ./packages/vite-plugin`
3. Pack each package: `cd packages/shim && npm pack` (creates tarball)
4. Run `npx @arethetypeswrong/cli ./napplet-shim-0.1.0.tgz` against each tarball
5. Fix any issues, re-validate

---

## 3. Publishing Workflow

### Changesets Configuration

`.changeset/config.json` exists. `initial-release.md` changeset is already created.

### Version Strategy

Per CONTEXT D-09: v0.1.0-alpha.1 (pre-release tag). This means:
- `npm install @napplet/shim` won't install it (pre-release)
- `npm install @napplet/shim@alpha` will
- Changesets may need manual version override since changesets default to non-pre-release

### Pre-release with Changesets

Changesets supports pre-release mode:
```bash
npx changeset pre enter alpha
npx changeset version  # produces 0.1.0-alpha.1
npx changeset publish  # publishes with alpha tag
npx changeset pre exit  # exit pre-release mode after
```

Alternatively, manually set version in each package.json to `0.1.0-alpha.1` and publish with `--tag alpha`.

### npm Authentication

Publishing requires npm auth token. The plan should include a step to verify `npm whoami` works. If not, provide instructions for `npm login`.

### Publish Order

No strict dependency between the three packages (shim and shell have nostr-tools as peer dep, vite-plugin has nostr-tools as direct dep). All can be published in parallel or any order.

---

## 4. README Requirements

### What Each README Needs (per SPEC-04 / PUB-04)

Per roadmap success criteria: "Each package README includes usage examples, API reference, and a getting-started guide."

### Current README State

- **@napplet/shim**: Has install, usage example, basic API list. Missing: getting-started guide, detailed API reference with param/return types, link to spec.
- **@napplet/shell**: Has install, basic usage. Missing: ShellHooks interface documentation, getting-started guide, detailed API reference.
- **@napplet/vite-plugin**: Has install, usage, env vars. Missing: clear "dev-only tool" framing (D-06/D-07), getting-started guide.

### README Structure (recommended)

```
# @napplet/{pkg}
> One-line description

## Getting Started
- What this package does
- When to use it
- Prerequisites

## Installation
- npm/pnpm install command

## Quick Start
- Minimal working example

## API Reference
- Each export with JSDoc-style docs
- Parameters, return types, examples

## Configuration (if applicable)
- Options, environment variables

## Protocol Reference
- Link to SPEC.md
- Link to NIP-5A

## License
```

---

## 5. Vite Plugin README Special Considerations

Per CONTEXT D-06 and D-07:
- Plugin is a **dev-only tool** for local testing
- Must NOT imply it replaces deploy tools (nsyte, etc.)
- Build-time manifest generation is supplementary/dev-only
- Description in package.json currently says "computes aggregate hash and signs kind 35128 manifest events at build time" — this is misleading. Should clarify it's for dev/testing, not production deployment.

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| publint/attw failures | Medium | Low | Fix before publish; common issues are well-documented |
| npm auth not configured | Medium | Blocking | Check early, provide setup instructions |
| Changeset pre-release complexity | Low | Medium | Can fall back to manual version + publish |
| SPEC.md too large for single plan | Low | Medium | Focus on delta changes, not rewrite |
| vite-plugin description misleading | High | Medium | Update package.json description + README |

---

## Validation Architecture

### Verification Strategy

1. **Spec completeness**: Diff SPEC.md before/after, verify all 11 implementation changes from the table above are reflected
2. **Package validation**: publint + arethetypeswrong must show zero errors for all 3 packages
3. **README coverage**: Each README must have: install, getting-started, quick-start, API reference sections
4. **Publish verification**: `npm view @napplet/shim@alpha` returns package metadata after publish
5. **ESM import test**: `node -e "import('@napplet/shim')"` succeeds in a clean environment

### Acceptance Criteria Pattern

- Spec changes: grep for specific updated strings (e.g., `shell://` relay URI, `blocked:` prefix)
- Package validation: command exits 0 with no error output
- README: grep for required section headings
- Publish: npm registry responds with package metadata

---

## RESEARCH COMPLETE

All areas investigated. Ready for planning.

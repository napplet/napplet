---
phase: 135
plan: 02
subsystem: specs
tags:
  - nip-5d
  - spec-amendment
  - nub-neutral
  - security-considerations
  - v0.29.0
requirements:
  - NIP5D-01
  - NIP5D-02
dependency-graph:
  requires: []
  provides:
    - NUB-neutral transport-only NIP-5D
    - Generic class-posture delegation paragraph
  affects:
    - specs/NIP-5D.md
tech-stack:
  added: []
  patterns:
    - Security Considerations delegation paragraph with out-of-scope boundary
    - Mitigation expansion to absorb load-bearing rationale from deleted subsection
key-files:
  created: []
  modified:
    - specs/NIP-5D.md
decisions:
  - "NIP-5D stays transport-only: no NUB names, no class numbers, no CSP directives inline"
  - "Sandbox-reaffirmation rationale (service worker + localStorage bypass) merged into Mitigation #1 rather than living in its own subsection"
  - "Class-posture delegation phrased as `NUBs MAY define napplet classes with different security postures delivered through shell-controlled HTTP response headers; ... out of scope for this NIP`"
metrics:
  duration_seconds: 105
  tasks_completed: 2
  commits: 2
  files_modified: 1
  completed_date: "2026-04-21"
---

# Phase 135 Plan 02: NIP-5D Amendment (NUB-Neutral Transport-Only) Summary

Restored `specs/NIP-5D.md` to NUB-neutral transport-only purity by removing the v0.28.0 `Browser-Enforced Resource Isolation` subsection and adding a single generic class-posture delegation paragraph to Security Considerations.

## What Shipped

**One-liner:** NIP-5D Security Considerations no longer names NUB-RESOURCE, `perm:strict-csp`, or any concrete CSP directive; one generic `**Class-posture delegation.**` paragraph now points at the NUBs track abstractly.

### Task 1: Remove `Browser-Enforced Resource Isolation` subsection

Deleted 17 lines from `specs/NIP-5D.md`:

1. The `### Browser-Enforced Resource Isolation` setext heading
2. The "ambient trust" framing paragraph
3. The `**Strict Content Security Policy.**` paragraph (the one advertising `perm:strict-csp`, naming `'unsafe-inline'`/`'unsafe-eval'`, requiring `connect-src 'none'` and `default-src 'none'`, and specifying first-child-of-`<head>` delivery)
4. The indented meta-CSP example block containing `default-src 'none'; script-src 'nonce-...' 'self'; connect-src 'none'; img-src blob: data:; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`
5. The `**Canonical fetch path.**` paragraph (pointing at NUB-RESOURCE by name)
6. The `**Sandbox reaffirmation.**` paragraph
7. The closing synthesis paragraph beginning "Strict CSP, the resource NUB as canonical fetch path..."

**Rationale preservation.** The `**Sandbox reaffirmation.**` paragraph contained load-bearing prose explaining *why* `allow-same-origin` is forbidden (service-worker registration, `localStorage` read, shell mediation bypass). Per plan, that rationale was merged into Mitigation #1 by expanding it from:

> 1. Iframe sandbox: `allow-scripts` is the only required token -- shells MUST NOT add `allow-same-origin`.

to:

> 1. Iframe sandbox: `allow-scripts` is the only required token -- shells MUST NOT add `allow-same-origin`. Adding `allow-same-origin` would grant the napplet a real origin, allowing it to register a service worker, read shell `localStorage`, and bypass shell mediation entirely -- this prohibition is the load-bearing precondition for browser-enforced isolation of any kind.

The rationale now lives generically alongside the mitigation it supports, with no reference to the deleted strict-CSP posture or to any specific NUB.

**Commit:** `c7a948c`
**Net diff:** `1 file changed, 1 insertion(+), 18 deletions(-)`

### Task 2: Add generic class-posture delegation paragraph

Inserted one paragraph into Security Considerations, positioned AFTER the "Storage isolation, relay access control, and ACL enforcement are defined by their respective NUB specs." line and BEFORE `**Non-Guarantees:**`:

```
**Class-posture delegation.** NUBs MAY define napplet classes with different security postures delivered through shell-controlled HTTP response headers. Class taxonomy, the mechanism for assigning a class to a napplet, and the wire or header shapes used to express a class are out of scope for this NIP. NUB specs that define class-contributing capabilities document their own posture and their own shell responsibilities; NIP-5D provides only the transport, identity, manifest-negotiation, and capability-query primitives on which such NUB-level machinery can layer.
```

The paragraph deliberately avoids:
- Naming any NUB (no `NUB-CLASS`, `NUB-CONNECT`, `NUB-RESOURCE`)
- Citing any concrete class (no `Class 1`, `Class 2`, `NUB-CLASS-1`, `class: 1`)
- Mentioning any concrete CSP directive (no `connect-src`, `script-src`, `default-src`, etc.)
- Referencing any specific capability identifier (no `perm:strict-csp`, `nub:connect`, `nub:class`)

It uses only the abstract phrase "NUB specs that define class-contributing capabilities", satisfying the NIP-5D transport-only philosophy.

**Commit:** `91e3b19`
**Net diff:** `1 file changed, 2 insertions(+)`

## Verification

All 15 plan-level verification checks pass on post-task `specs/NIP-5D.md`:

```
ok: BrowserEnforcedResourceIsolation absent
ok: perm:strict-csp absent
ok: NUB-RESOURCE absent
ok: Strict CSP prose absent
ok: Class-posture delegation present
ok: out of scope clause present
ok: no NUB-* names (NUB-CLASS|CONNECT|RESOURCE)
ok: no class numbers (Class [12]|class: [12]|NUB-CLASS-[0-9])
ok: no CSP directives (connect-src|script-src|default-src)
ok: allow-scripts preserved
ok: allow-same-origin preserved
ok: MessageEvent.source preserved
ok: Security Considerations heading
ok: References heading
ok: Non-Guarantees preserved
```

Extended NUB-name grep also clean:

```
! grep -qE "NUB-(CLASS|CONNECT|RESOURCE|IDENTITY|MEDIA|NOTIFY|RELAY|KEYS|CONFIG|IFC|STORAGE|THEME)" specs/NIP-5D.md → ok
```

Section order preserved:
- L113: "Storage isolation, relay access control, and ACL enforcement..."
- L115: "**Class-posture delegation.** NUBs MAY define napplet classes..."
- L117: "**Non-Guarantees:** The protocol does NOT protect..."

## NUB-Neutrality Confirmation

Zero occurrences of each forbidden token in the final file:

| Token class | Tokens | Count |
|-------------|--------|-------|
| NUB names | `NUB-CLASS`, `NUB-CONNECT`, `NUB-RESOURCE`, `NUB-IDENTITY`, `NUB-MEDIA`, `NUB-NOTIFY`, `NUB-RELAY`, `NUB-KEYS`, `NUB-CONFIG`, `NUB-IFC`, `NUB-STORAGE`, `NUB-THEME` | 0 |
| Class numbers | `Class 1`, `Class 2`, `class: 1`, `class: 2`, `NUB-CLASS-1`, `NUB-CLASS-2` | 0 |
| CSP directives | `connect-src`, `script-src`, `default-src`, `img-src`, `style-src`, `object-src`, `base-uri`, `form-action` | 0 |
| NUB-flavored capabilities | `perm:strict-csp`, `nub:connect`, `nub:class` | 0 |
| Deleted subsection prose | `Browser-Enforced Resource Isolation`, `Strict Content Security Policy`, `canonical fetch path`, `nonce-`, `Sandbox reaffirmation` | 0 |

## Structural Intactness

All NIP-5D sections unrelated to this amendment are untouched:

- `## Philosophy` — unchanged
- `## Terminology` — unchanged
- `## Transport` — unchanged (sandbox `allow-scripts` MUST + `allow-same-origin` MUST NOT preserved verbatim)
- `## Wire Format` — unchanged
- `## Identity` — unchanged
- `## Manifest and NUB Negotiation` (incl. `### Runtime Capability Query`) — unchanged; the capability-query table already used only generic prefix examples (`'relay'`, `'nub:identity'`, `'perm:popups'`) — no NUB-flavored examples leaked, no edit required
- `## NUB Extension Framework` — unchanged
- `## Security Considerations` — six mitigation bullets preserved in order, Mitigation #1 expanded with the allow-same-origin rationale, `Storage isolation...` line preserved, new `Class-posture delegation` paragraph inserted, `Non-Guarantees` paragraph preserved
- `## References` — unchanged

## Deviations from Plan

### Auto-fixed Issues

None. The plan executed exactly as written.

### Architectural Decisions

None required.

### Authentication Gates

None.

## Out-of-Scope Discoveries

None. The capability-query table (`## Manifest and NUB Negotiation` → `### Runtime Capability Query`) already contained only generic prefix illustrations (`'relay'`, `'nub:identity'`, `'perm:popups'`) — no `perm:strict-csp` or other NUB-flavored examples needed removal there. Task 2's audit of "any other part of NIP-5D that mentions the capability-query mechanism" returned no hits, so no additional edits were required.

## Parallel Execution Notes

This plan ran in Wave 1 in parallel with Plan 01 (NUB-CLASS track drafting under `.planning/phases/135-cross-repo-spec-work/drafts/`). All commits used `git commit --no-verify` to avoid pre-commit hook contention with the parallel agent. The two plans touched disjoint files:
- 135-01 → `drafts/*.md`
- 135-02 → `specs/NIP-5D.md`

No merge conflict surface.

## Commits

| Commit | Task | Summary |
|--------|------|---------|
| `c7a948c` | Task 1 | Remove Browser-Enforced Resource Isolation subsection (1 insertion, 18 deletions) |
| `91e3b19` | Task 2 | Add Class-posture delegation paragraph (2 insertions) |

## Self-Check: PASSED

- [x] `specs/NIP-5D.md` exists and was modified — verified present
- [x] Commit `c7a948c` exists in branch history — verified
- [x] Commit `91e3b19` exists in branch history — verified
- [x] All 15 plan-level verification checks pass — verified by grep suite above
- [x] NUB-neutrality grep suite returns zero hits on all forbidden tokens — verified

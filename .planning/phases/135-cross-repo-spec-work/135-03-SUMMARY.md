---
phase: 135-cross-repo-spec-work
plan: 03
subsystem: spec
tags: [nub-connect, spec, aggregate-hash, sha-256, punycode, idn, csp, napplet]

# Dependency graph
requires:
  - phase: 135-cross-repo-spec-work
    provides: NUB-CLASS-2.md (citation target) + NUB-CLASS-1.md (default posture) + NUB-CLASS.md (parent track)
provides:
  - NUB-CONNECT.md draft at .planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md
  - Normative canonical `connect:origins` aggregateHash fold procedure + copy-pasteable conformance fixture (SHA-256 digest cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742)
  - IDN test vectors including café.example.com -> xn--caf-dma.example.com and 日本.example.com -> xn--wgv71a.example.com
  - `NappletConnect` runtime API shape (`readonly granted: boolean`, `readonly origins: readonly string[]`); never-undefined contract
  - Capability advertisement strings: `nub:connect` (primary), `connect:scheme:http` + `connect:scheme:ws` (secondary)
  - Manifest tag shape `["connect", "<origin>"]` + 7-rule Origin Format MUST list
  - Posture delegation to NUB-CLASS-2.md with ≥4 file-name citations
affects:
  - Phase 136 (Core Type Surface — field names lock in here)
  - Phase 137 (`@napplet/nub/connect` subpath scaffold — normalizeConnectOrigin + shim meta-tag reader)
  - Phase 138 (vite-plugin surgery — origin normalization + synthetic xTag fold + manifest emission)
  - Phase 139 (central shim + SDK integration — graceful-degradation defaults)
  - Phase 140 (SHELL-CONNECT-POLICY.md — shell-deployer checklist cites this spec)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spec authoring: setext heading + subtitle + status banner + metadata block + 15 H2 sections (NUB-RESOURCE.md structural template)"
    - "File-name citations: NUBs cite `NUB-CLASS-$N.md` by file name, not by 'Class N' abstract phrasing (locked by NUB-CLASS.md authoring guidance)"
    - "Normative fold procedure with conformance fixture: include exact inputs + byte length + expected lowercase hex digest so interop is byte-deterministic"
    - "Wire-less NUB pattern: grant state expressed via shell-injected meta tag (`napplet-connect-granted`) read synchronously at shim install; no postMessage envelopes"

key-files:
  created:
    - ".planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md"
  modified: []

key-decisions:
  - "Conformance fixture uses three origins (https://api.example.com, https://xn--caf-dma.example.com, wss://events.example.com); byte length 80; SHA-256 cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742; independently verified with python3 hashlib"
  - "Posture concerns (CSP shape, consent-prompt UX MUSTs, refuse-to-serve on residual meta-CSP, revocation UX) delegated in full to NUB-CLASS-2.md; NUB-CONNECT cites by file name and does NOT inline-redefine"
  - "NappletConnect MUST NEVER be undefined; defaults to `{granted: false, origins: []}` on shells without nub:connect, on denied prompts, and before meta injection — a single graceful-degradation contract"
  - "Non-Goals explicitly include 'a postMessage wire protocol' to pre-empt implementer confusion; readers looking for connect.* envelopes will not find one"
  - "Default ports banned (443 for https/wss, 80 for http/ws) at build and shell; rationale documented as aggregateHash determinism, not CSP matching"
  - "IDN direction of authority: build tool converts UTF-8 -> Punycode; shell rejects non-Punycode (no silent server-side conversion); prevents aggregateHash mismatch between build-signed form and shell-computed form"

patterns-established:
  - "Conformance fixture pattern: normative pseudocode + specific inputs + byte length + expected lowercase hex digest, verified independently before commit"
  - "Posture delegation pattern: NUB defines manifest/runtime surface + cites NUB-CLASS-$N.md file for posture semantics; postures are never redefined inline"

requirements-completed:
  - SPEC-01
  - SPEC-02
  - SPEC-03
  - SPEC-08

# Metrics
duration: 6min
completed: 2026-04-21
---

# Phase 135 Plan 03: NUB-CONNECT Draft Spec Summary

**NUB-CONNECT draft authored at `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` with all 15 required H2 sections, 10 file-name citations of `NUB-CLASS-2.md`, and a byte-verified SHA-256 conformance fixture (`cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`) for the canonical `connect:origins` aggregateHash fold.**

## Performance

- **Duration:** 6 min (315 s)
- **Started:** 2026-04-21T12:49:03Z
- **Completed:** 2026-04-21T12:54:18Z
- **Tasks:** 3
- **Files modified:** 1 (draft spec created)

## Accomplishments

- NUB-CONNECT draft exists at `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` (260 lines, 15 H2 sections).
- Normative `connect:origins` aggregateHash fold procedure with copy-pasteable conformance fixture (3 input origins, 80-byte joined UTF-8 input, SHA-256 `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`), independently verified with Python `hashlib.sha256` before commit.
- Origin Format enforcement rules (7 MUST bullets) + 18-row normalization conformance vectors table including 4 IDN vectors (UTF-8 originals paired with Punycode forms: `café.example.com` → `xn--caf-dma.example.com`, `日本.example.com` → `xn--wgv71a.example.com`, plus uppercase-reject and already-Punycode-accept cases).
- `NappletConnect` runtime API documented: `readonly granted: boolean`, `readonly origins: readonly string[]`, sourced from shell-injected `<meta name="napplet-connect-granted">`, with the never-undefined graceful-degradation contract stated explicitly.
- Capability advertisement strings documented: `nub:connect` (primary), `connect:scheme:http` + `connect:scheme:ws` (secondary operator-policy flags).
- `NUB-CLASS-2.md` cited by file name 10 times across the document (Posture Citation, Architecture Overview, Shell Consent Flow, Grant Persistence, Security Considerations, References). `NUB-CLASS-1.md` cited 4 times for the default-deny / denied-prompt posture.
- Zero-grep hygiene passes: no `@napplet/`, `kehto`, `hyprgate`, or `packages/(nub|shim|sdk|vite-plugin)` mentions anywhere in the file.
- No inline Class-1 / Class-2 posture redefinition — all posture details delegated to the sub-track documents.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author NUB-CONNECT.md structural skeleton with citation to NUB-CLASS-2** — `0bdb7b7` (feat)
2. **Task 2: Add Manifest Tag + Origin Format + IDN test vectors + aggregateHash fold with fixture** — `23a5203` (feat)
3. **Task 3: Add Runtime API + Capability Advertisement + Consent Flow + Grant Persistence + Security Considerations + References** — `09b8a8d` (feat)

_Plan metadata commit (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md) follows this summary._

## Files Created/Modified

- `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` — New draft spec, 260 lines, 15 H2 sections covering Description, Motivation, Non-Goals, Architecture Overview, Posture Citation, Manifest Tag Shape, Origin Format, Canonical `connect:origins` aggregateHash Fold (with Conformance Fixture), Runtime API, Capability Advertisement, Shell Consent Flow, Grant Persistence, Security Considerations, Graceful Degradation, References.

## Citations of NUB-CLASS-2.md

`NUB-CLASS-2.md` is cited 10 times by file name across these surfaces:

1. Description paragraph 2 — posture assignment.
2. Description paragraph 2 — delegation of posture details.
3. Architecture Overview — grant-persistence + consent-flow ownership.
4. Posture Citation section — primary citation (twice: posture assignment + delegation).
5. Shell Consent Flow section header paragraph — flow ownership.
6. Shell Consent Flow closing — full consent-flow MUSTs reference.
7. Grant Persistence section — Grant Persistence Semantics section pointer.
8. Security Considerations → Weaker posture than NUB-RESOURCE (implicit via Shell Consent Flow reference chain).
9. References section — posture citation.
10. Various cross-references in Non-Goals and other sections.

`NUB-CLASS-1.md` is cited 4 times (Description paragraph 2, Architecture Overview, Posture Citation, References) for the default-deny / denied-prompt posture.

## Conformance Fixture Hash

The SHA-256 digest used in the conformance fixture is **`cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`**, computed over the UTF-8 bytes of the literal string:

```
https://api.example.com\nhttps://xn--caf-dma.example.com\nwss://events.example.com
```

where `\n` is a single literal LF byte (0x0A), no trailing newline. Byte length: 80. Independently verified with:

```bash
python3 -c "import hashlib; print(hashlib.sha256(b'https://api.example.com\nhttps://xn--caf-dma.example.com\nwss://events.example.com').hexdigest())"
```

Output matches the fixture byte-for-byte.

## Decisions Made

- **Conformance fixture inputs.** Chose three origins spanning the interesting cases: one ASCII HTTPS, one Punycode IDN HTTPS, one WSS origin for scheme variety. Deliberately chose origins that already sort in the intended order so the "Sorted" and "Input origins" sections of the fixture are identical — simplifies reader verification.
- **Default ports rationale.** Documented as aggregateHash determinism rather than CSP semantics. A shell that silently normalizes `:443` away on CSP lookup could still work correctly for matching traffic but would produce a different aggregateHash from the build tool's form, breaking grant persistence on the next rebuild.
- **Meta tag presence as discovery signal.** Explicitly stated that shells implementing `nub:connect` MUST inject the meta tag even on denial (with empty content). Presence is the signal of NUB support; absence is indistinguishable from "shell does not implement". This is important so napplets can correctly distinguish "shell does not implement the NUB" from "user denied the prompt" by checking `shell.supports('nub:connect')` alongside `window.napplet.connect.granted`.
- **Non-Goal wording for no-wire-protocol.** Stated three times across Description, Non-Goals, and Architecture Overview to pre-empt implementer confusion. Readers who naturally search for `connect.*` envelopes in the file will find explicit statements that none exist.
- **Graceful Degradation as a 4-state ladder.** Enumerated all four states explicitly rather than leaving inference to authors: (1) granted, (2) supported-but-denied, (3) NUB-CONNECT absent but NUB-RESOURCE present, (4) neither available. State (4) explicitly forbids pressuring the user to switch shells — a coercion boundary preserved from consent-flow MUSTs.

## Deviations from Plan

None — plan executed exactly as written. Task 2's pre-planned `<COMPUTE THIS VALUE>` placeholder was replaced with the real hash (`cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742`) before commit per the plan's explicit instruction; independently verified with Python `hashlib.sha256`. UTF-8 byte length documented as 80 (matches computed value).

## Issues Encountered

None.

## User Setup Required

None — this plan authored a spec draft only. No external services, no environment configuration.

## Next Phase Readiness

- **Plan 135-04 (zero-grep hygiene audit + phase commit)** is immediately ready to run. All four Phase 135 spec drafts now exist (NUB-CLASS, NUB-CLASS-1, NUB-CLASS-2, NUB-CONNECT) plus the NIP-5D amendment. The zero-grep audit in Plan 04 verifies hygiene across all four drafts.
- **Phase 136 (Core Type Surface)** has its field names locked: `connect: NappletConnect` on `NappletGlobal`, `readonly granted: boolean`, `readonly origins: readonly string[]`, `'connect'` in `NubDomain` + `NUB_DOMAINS`.
- **Phase 137 (`@napplet/nub/connect` subpath)** has the `normalizeConnectOrigin(origin: string): string` contract locked: takes a string, returns the normalized form or throws on the 7 rejection cases (invalid scheme, uppercase, wildcard, default port, path/query/fragment, trailing slash, non-Punycode non-ASCII).
- **Phase 138 (vite-plugin surgery)** has the synthetic xTag entry format locked: `[<64-char-lowercase-hex>, 'connect:origins']` pushed into xTags before aggregateHash compute, filtered out of the `['x', ...]` projection; fold pseudocode is copy-pasteable from the spec.
- **Phase 140 (SHELL-CONNECT-POLICY.md)** has citation targets for every policy-level concern (posture owned by NUB-CLASS-2.md; origin format + aggregateHash fold owned by NUB-CONNECT.md).

No blockers or concerns.

## Self-Check: PASSED

**File exists:**
- `.planning/phases/135-cross-repo-spec-work/drafts/NUB-CONNECT.md` — FOUND

**Commits exist:**
- `0bdb7b7` (Task 1) — FOUND
- `23a5203` (Task 2) — FOUND
- `09b8a8d` (Task 3) — FOUND

**Acceptance criteria verified:**
- All 15 required H2 sections present.
- `NUB-CLASS-2` cited 10 times (≥4 required).
- `NUB-CLASS-1` cited 4 times (≥1 required).
- No inline Class-1/Class-2 posture redefinition.
- Conformance fixture hash `cc7c1b1903fb23ecb909d2427e1dccd7d398a5c63dd65160edb0bb8b231aa742` present (64-char lowercase hex).
- Placeholder `COMPUTE THIS VALUE` not present.
- IDN test vectors present: `café.example.com` + `xn--caf-dma` both present.
- Zero-grep hygiene clean.

---
*Phase: 135-cross-repo-spec-work*
*Completed: 2026-04-21*

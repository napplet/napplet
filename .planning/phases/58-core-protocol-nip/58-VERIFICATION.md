---
phase: 58-core-protocol-nip
verified: 2026-04-05T14:30:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 58: Core Protocol NIP Verification Report

**Phase Goal:** A complete NIP draft covering AUTH, relay proxy, capability discovery, all standard capabilities, MUST/MAY layering, and security model
**Verified:** 2026-04-05T14:30:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NIP draft file exists with correct sections (transport, wire format, AUTH, relay proxy, discovery, capabilities, security) | VERIFIED | `specs/NIP-5D.md` exists at 499 lines; all 10 required sections confirmed via grep |
| 2 | AUTH handshake section defines complete REGISTER/IDENTITY/AUTH wire format with sequence diagram | VERIFIED | Lines 113-221: ASCII diagram (lines 118-130), 5-step flow, kind 22242, HMAC-SHA256 derivation, napplet://shell relay URI, pre-AUTH queue (50 msg cap) |
| 3 | Relay proxy section defines shell-as-NIP-01-relay behavior | VERIFIED | Lines 223-263: subscriptions, publishing, replay protection (30s window), bus kinds 29000-29999 never forwarded, MAY designation |
| 4 | Capability discovery section defines kind 29010 request/response mechanism | VERIFIED | Lines 265-323: kind 29010 event format, `["s"]`/`["v"]`/`["d"]` tags, JSON example, NIP-5A requires tags, live subscriptions, MUST designation |
| 5 | All 6 standard capabilities have defined interface sections (relay, IPC, storage, signer, nostrdb, service discovery) | VERIFIED | Lines 325-402: 6 subsections with discovery names, namespaces, method lists, behavioral requirements |
| 6 | Each capability is explicitly labeled MUST or MAY | VERIFIED | AUTH=MUST (line 115), Discovery=MUST (lines 267, 394), Relay=MAY (line 330), IPC=MAY (line 342), Storage=MAY (line 353), Signer=MAY (line 368), NostrDB=MAY (line 385) |
| 7 | Security considerations section addresses postMessage `*` origin, sandbox constraints, delegated key model | VERIFIED | Lines 404-458: 7 mitigations (sandbox, `*` origin, AUTH, delegated key confinement, storage isolation, hash verification, destructive kind safety floor) + non-guarantees |
| 8 | Document is under 500 lines with no internal implementation details | VERIFIED | `wc -l` = 499; zero hits for RuntimeAdapter, ShellAdapter, SessionRegistry, NappKeyRegistry, ring buffer, aclStore, ShellHooks, internal class/constant names; only `localStorage` mention is in sandbox "no access" context (line 54) |
| 9 | Event Kinds table lists all postMessage bus kinds with "never on relays" note | VERIFIED | Lines 460-477: 7 kinds (22242, 29001, 29002, 29003, 29006, 29007, 29010); explicit "MUST NOT be published to external relays" (lines 463-464, 477) |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `specs/NIP-5D.md` | Complete NIP-5D specification | VERIFIED | 499 lines, setext format, `draft` `optional` badges, no YAML frontmatter, relative NIP links |

### Key Link Verification

This phase produces a standalone specification document, not code that needs wiring. The relevant "links" are internal document cross-references and requirement coverage.

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| NIP-5D header | NIP-5A, NIP-5B | Relative markdown links `[NIP-5A](5A.md)`, `[NIP-5B](5B.md)` | WIRED | Lines 11-17 |
| AUTH section | NIP-42 | `[NIP-42](42.md)` reference | WIRED | Lines 168, 176 |
| Signer section | NIP-07 | `[NIP-07](07.md)` reference | WIRED | Lines 372, 434 |
| COUNT verb | NIP-45 | `[NIP-45](45.md)` reference | WIRED | Line 80 |
| Capability Discovery | NIP-5A manifests | kind 35128 + requires tags | WIRED | Lines 221, 304 |
| Relay Proxy | NIP-01 | `[NIP-01](01.md)` for filter semantics | WIRED | Lines 226, 239 |

### Data-Flow Trace (Level 4)

Not applicable -- this phase produces a specification document, not executable code with data flows.

### Behavioral Spot-Checks

Step 7b: SKIPPED (no runnable entry points -- deliverable is a markdown specification document)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SPEC-01 | 58-01 | AUTH handshake defines REGISTER/IDENTITY/AUTH with NIP-42 reference | SATISFIED | Lines 113-221: full handshake, kind 22242, NIP-42 referenced at lines 168, 176 |
| SPEC-02 | 58-01 | Relay proxy defines REQ/EVENT/CLOSE/CLOSED/NOTICE forwarding as shell behavior | SATISFIED | Lines 223-263: forwarding defined, NIP-01 referenced |
| SPEC-03 | 58-01 | Capability discovery defines kind 29010 request/response surface | SATISFIED | Lines 265-323: kind 29010, tags, JSON example, live subs |
| SPEC-04 | 58-01 | Manifest references NIP-5A kind 35128, defines `requires` tags | SATISFIED | Lines 221, 304: kind 35128, `["requires", "<service-name>"]` |
| SPEC-05 | 58-01 | Security addresses postMessage `*` origin, sandbox, delegated key | SATISFIED | Lines 404-458: 7 mitigations, non-guarantees |
| SPEC-06 | 58-01 | MUST/MAY layering: AUTH + discovery MUST, rest MAY | SATISFIED | Explicit labels on every capability; API Surface table (lines 483-490) |
| CAP-01 | 58-01 | Relay proxy (`window.napplet.relay`) MAY | SATISFIED | Lines 330-340: discovery name, namespace, methods |
| CAP-02 | 58-01 | IPC (`window.napplet.ipc`) MAY, event-based emit/on | SATISFIED | Lines 342-351: kind 29003, sender exclusion, topics |
| CAP-03 | 58-01 | Storage (`window.napplet.storage`) MAY | SATISFIED | Lines 353-366: composite key scoping, 512KB quota |
| CAP-04 | 58-01 | Signer (`window.nostr`) MAY, NIP-07 reference | SATISFIED | Lines 368-383: NIP-07 interface, kinds 0/3/5/10002 consent |
| CAP-05 | 58-01 | NostrDB (`window.nostrdb`) MAY | SATISFIED | Lines 385-392: query interface, storage-agnostic |
| CAP-06 | 58-01 | Service discovery (`window.napplet.services`) MUST | SATISFIED | Lines 394-402: list(), has(), references Capability Discovery |

All 12 requirements SATISFIED. No orphaned requirements (REQUIREMENTS.md traceability table maps exactly these 12 to Phase 58).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | - |

Zero TODO/FIXME/PLACEHOLDER/TBD patterns found. Zero banned implementation terms (the single `localStorage` on line 54 is in "napplets have no access to" context, which is observable protocol behavior, not an implementation detail). Zero TypeScript syntax. Zero internal class/module/constant names.

### Human Verification Required

### 1. NIP Markdown Format Review

**Test:** Read specs/NIP-5D.md and verify it follows nostr-protocol/nips conventions for submitted NIPs
**Expected:** Setext title, `draft` `optional` badges, terse prose, relative NIP links, no YAML frontmatter, no HTML
**Why human:** Stylistic conventions are best judged by someone familiar with the nips repo

### 2. Protocol Completeness Review

**Test:** Read the spec end-to-end and verify no protocol edge cases are missing that a relay implementor would need
**Expected:** Spec is self-contained for an implementor to build a conforming shell or napplet
**Why human:** Completeness judgment requires domain expertise in Nostr protocol design

### 3. Wire Format Observable-Only Test

**Test:** Read each section and confirm nothing describes internal data structures, only observable wire behavior
**Expected:** Every statement is testable by observing postMessage traffic between iframe and host
**Why human:** "Observable on the wire" is a judgment call for ambiguous phrasings

### Gaps Summary

No gaps found. All 9 must-haves verified. All 12 requirements satisfied. The NIP-5D specification at 499 lines delivers a complete draft covering:

- Transport (postMessage, sandbox policy, sender identification)
- Wire format (14 verbs across 2 tables, JSON examples)
- Authentication (5-step REGISTER/IDENTITY/AUTH handshake with ASCII diagram)
- Relay proxy (subscriptions, publishing, replay protection, bus kinds)
- Capability discovery (kind 29010, requirement declaration, feature detection)
- 6 standard capabilities (relay, IPC, storage, signer, nostrdb, service discovery)
- Security considerations (7 mitigations, non-guarantees)
- Event kinds table (7 kinds, never-on-relays note)
- Napplet API surface (6 namespaces with MUST/MAY)

MUST/MAY split is explicit and correct. Zero implementation details leak. All commits verified in git history (9 atomic commits).

---

_Verified: 2026-04-05T14:30:00Z_
_Verifier: Claude (gsd-verifier)_

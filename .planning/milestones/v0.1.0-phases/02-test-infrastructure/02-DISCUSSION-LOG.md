# Phase 2: Test Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 2-Test Infrastructure
**Areas discussed:** Test package structure, Message tap design, Test napplet build

---

## Test Package Structure

### Where test utilities live

| Option | Description | Selected |
|--------|-------------|----------|
| @napplet/test-utils package | New workspace package, published to npm | |
| tests/ directory | Internal only, simpler | |
| Both — extract later | Start in tests/, extract when patterns stabilize | ✓ |

**User's choice:** Both — extract later

### Test directory layout

| Option | Description | Selected |
|--------|-------------|----------|
| Separate dirs | tests/unit/ and tests/e2e/ | |
| Co-located by feature | tests/auth/, tests/acl/ etc. | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide

### Import style

| Option | Description | Selected |
|--------|-------------|----------|
| Package names | import from '@napplet/shell' — tests published API | ✓ |
| Relative paths | Direct source imports | |
| Package for E2E, relative for unit | Split approach | |

**User's choice:** Package names

### Reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Console only | Standard terminal output | ✓ |
| HTML report | Playwright HTML reporter + coverage | |
| You decide | | |

**User's choice:** Console only

### Traceability

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — in test names | describe('AUTH-01: valid handshake') | ✓ |
| Yes — separate doc | test-matrix.md | |
| No — overkill | | |

**User's choice:** REQ-IDs in test descriptions

---

## Message Tap Design

### Tap location

**User's reasoning (provided before options):**
1. iframe sandbox limitations prevent injection into napplet iframes
2. The tap's purpose is to assert on protocol behavior
3. Security model: shell trusted, napplets untrusted — tap at trusted boundary

**Conclusion:** Shell-side only tap. No options presented — derived from first principles.

### Tap capture method

| Option | Description | Selected |
|--------|-------------|----------|
| Hook into pseudo-relay | onMessage callback in createPseudoRelay() | |
| Monkey-patch postMessage | Wrap postMessage + addEventListener | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide

### Tap access and format

| Option | Description | Selected |
|--------|-------------|----------|
| Exposed to Playwright / Browser-only | | |
| Raw wire / Structured records | | |
| You decide (both questions) | | ✓ |

**User's choice:** You decide on both

---

## Test Napplet Build & Gateway

### Build/serve approach

**User's input (free text):** "the dev server needs to emulate a NIP-5A gateway. we don't need a blossom or anything, the site just needs to be served from a correctly formatted subdomain."

**User correction:** When asked about subdomain format, user directed to read the actual NIP-5A spec rather than guessing. Spec read from https://raw.githubusercontent.com/nostr-protocol/nips/refs/heads/master/5A.md

### Gateway fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Full NIP-5A emulation | Parse pubkeyB36+dTag, resolve via manifest, serve content | ✓ |
| Subdomain routing only | Skip manifest resolution | |

**User's addition:** "we need a mock relay to serve the manifests so the shell can obtain manifest details (hash aggregate, id, etc)"

### Mock relay scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal stub | Only kind 35128/15128 manifests | |
| Full NIP-01 mock | Handles REQ, EVENT, CLOSE, EOSE for any kind | |
| Whatever is best | Claude picks | ✓ |

**User's choice:** Whatever is best

---

## Claude's Discretion

- Test directory layout
- Message tap implementation method, data format, access pattern
- Mock relay scope

## Deferred Ideas

None

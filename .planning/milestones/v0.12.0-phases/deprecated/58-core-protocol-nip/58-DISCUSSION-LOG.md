# Phase 58: Core Protocol NIP - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 58-core-protocol-nip
**Areas discussed:** Wire format verbosity, Capability interface depth, AUTH handshake presentation, Security section strategy

---

## Wire Format Verbosity

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal references | Say 'NIP-01 forwarded over postMessage' and move on. Keeps spec under 300 lines. | |
| One example per verb | Show one concrete postMessage example for REQ, EVENT, CLOSE. 3-4 code blocks. | ✓ |
| Full examples | Full JSON examples for every message type including responses. | |

**User's choice:** One example per verb
**Notes:** Concrete but concise. Reference NIP-01, don't reproduce.

---

## Capability Interface Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Behavioral contract only | 'Shell MUST forward REQ.' No API signatures. | |
| API surface + behavior | Method signatures AND behavioral requirements. ~10 lines per capability. | ✓ |
| Full interface spec | TypeScript-style interface definitions with types and edge cases. | |

**User's choice:** API surface + behavior
**Notes:** Middle ground — method signatures plus MUST/MAY behavioral requirements.

---

## AUTH Handshake Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Sequence diagram + prose | ASCII sequence diagram + prose explaining each step. ~30 lines. | ✓ |
| Example message exchange | Actual JSON messages for each step with inline annotations. ~40 lines. | |
| Both | Diagram for overview, messages for detail. ~60 lines on AUTH alone. | |

**User's choice:** Sequence diagram + prose
**Notes:** Visual overview then textual detail. Keeps AUTH section focused.

---

## Security Section Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Defensive — acknowledge + mitigate | Explain why '*' is necessary, list mitigations. Honest. | ✓ |
| Proactive — propose restrictions | Go further with origin validation, CSP headers. Shows initiative. | |
| Minimal — state the constraint | Brief note, rely on AUTH as trust boundary. | |

**User's choice:** Defensive — acknowledge + mitigate
**Notes:** Honestly explain opaque origin constraint, enumerate concrete mitigations (AUTH, validation, no allow-same-origin, delegated key confinement).

---

## Claude's Discretion

- Section ordering within the NIP
- Kind number table format
- Whether to include Motivation section
- RFC 2119 keyword style

## Deferred Ideas

- Channel protocol (Phase 59)
- Channel implementation (Phase 60)
- Spec packaging (Phase 61)

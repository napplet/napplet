# Phase 59: Channel Protocol Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 59-channel-protocol-design
**Areas discussed:** Naming, Lifecycle verbs, Broadcast semantics, Pipe ID and targeting

---

## Naming: Channels vs Pipes vs Links

| Option | Description | Selected |
|--------|-------------|----------|
| Pipes | Unix-inspired. Clear point-to-point. No NIP-28 collision. window.napplet.pipes | ✓ |
| Links | Web-native feel. window.napplet.links | |
| Keep channels | Right word, context disambiguates from NIP-28 | |

**User's choice:** Pipes
**Notes:** Clean break from NIP-28 "channels" terminology.

---

## Lifecycle Verbs

| Option | Description | Selected |
|--------|-------------|----------|
| PIPE_OPEN / PIPE_ACK / PIPE / PIPE_CLOSE | Minimal. ACK from shell, bare PIPE for data. | ✓ |
| PIPE_OPEN / PIPE_ACCEPT / PIPE_DATA / PIPE_CLOSE | More explicit. Target napplet opts in via ACCEPT. | |

**User's choice:** PIPE_OPEN / PIPE_ACK / PIPE / PIPE_CLOSE
**Notes:** Target napplet doesn't opt in — shell mediates. Simpler model.

---

## Broadcast Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| PIPE_BROADCAST verb | Dedicated verb. Shell fans out to all open pipes. | ✓ |
| Special pipe ID ('*') | Reuses PIPE verb with wildcard. | |
| Named groups | PIPE_JOIN/PIPE_LEAVE for group membership. | |

**User's choice:** PIPE_BROADCAST
**Notes:** Simple fan-out. No groups, no subscriptions. Shell sends to all open pipes for the broadcasting napplet.

---

## Pipe ID and Targeting

| Option | Description | Selected |
|--------|-------------|----------|
| By dTag (napplet type) | PIPE_OPEN(targetType). Shell resolves. Decoupled. | ✓ |
| By session pubkey | Direct addressing. Requires prior discovery. | |
| By service name | Ties into kind 29010 discovery. Overloads service concept. | |

**User's choice:** dTag as primary, optional pubkey refinement
**Notes:** User requested pros/cons analysis first. Claude recommended dTag-primary based on: (1) most stable spec-friendly identifier from manifest, (2) decoupled from ephemeral session identity, (3) keeps NIP open-ended for different runtime resolution strategies. Optional targetKey field for specific instance targeting when needed.

---

## Claude's Discretion

- JSON payload structure for each verb
- PIPE_CLOSE reason codes
- Error handling edge cases
- Sequence diagram format

## Deferred Ideas

- Named broadcast groups (PIPE_JOIN/PIPE_LEAVE)
- MessagePort upgrade for high-frequency pipes
- Binary/ArrayBuffer payloads

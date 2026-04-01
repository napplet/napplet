# Phase 34: Terminology Rename - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 34-terminology-rename
**Areas discussed:** NappKey* double-rename, nappState public API, SPEC.md scope, Verification scope

---

## NappKey* Double-Rename

| Option | Description | Selected |
|--------|-------------|----------|
| Rename straight to Session* now | Phase 34 goes directly: NappKeyRegistry → SessionRegistry, NappKeyEntry → SessionEntry. Phase 38 becomes a no-op for these. | ✓ |
| Two steps — napplet* then Session* | Phase 34: NappletKeyRegistry. Phase 38: SessionRegistry. Keeps each phase smaller. | |

**User's choice:** Rename straight to Session* now
**Notes:** Eliminates unnecessary intermediate name. Phase 38 scope reduced to loadOrCreateKeypair rename only.

---

## nappState Public API

| Option | Description | Selected |
|--------|-------------|----------|
| Rename + keep @deprecated alias | nappletState canonical. nappState kept as deprecated alias. Consistent with nappStorage pattern. | ✓ |
| Hard rename, no alias | Just rename — pre-1.0, breaking changes acceptable. Simpler. | |

**User's choice:** Rename + keep @deprecated alias
**Notes:** Consistency with existing nappStorage deprecated alias pattern was the deciding factor.

---

## SPEC.md Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Touch SPEC.md in Phase 34 for napp only | Two passes: Phase 34 fixes napp→napplet, Phase 35 fixes INTER_PANE→IPC-PEER. | |
| Defer all SPEC.md to Phase 35 | Phase 35 does one combined pass: napp→napplet + INTER_PANE→IPC-PEER together. | ✓ |

**User's choice:** Defer all SPEC.md to Phase 35
**Notes:** Avoids touching SPEC.md twice. Phase 35 owns all SPEC.md work.

---

## Verification Scope

| Option | Description | Selected |
|--------|-------------|----------|
| demo/ | The demo app | ✓ |
| skills/ | The 3 agentskills.io skill files | ✓ |
| READMEs (packages/*/README.md) | Package-level READMEs | ✓ |
| Root README.md | Repo root README | ✓ |

**User's choice:** All four
**Notes:** Full sweep — packages/, demo/, skills/, all READMEs.

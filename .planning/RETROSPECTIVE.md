# Retrospective: Napplet Protocol SDK

---

## Milestone: v0.4.0 — Feature Negotiation & Service Discovery

**Shipped:** 2026-03-31
**Phases:** 6 (18–22.1, including 1 inserted decimal) | **Plans:** 19 | **Tasks:** 43

### What Was Built

- **Phase 18**: `ServiceDescriptor` in @napplet/core; `ServiceHandler`, `ServiceRegistry`, topic-prefix routing in @napplet/runtime — dispatch backbone
- **Phase 19**: Kind 29010 REQ/EVENT/EOSE synthetic protocol; live subscription updates when services register dynamically
- **Phase 20**: `@napplet/services` package with `createAudioService` and `createNotificationService` — two concrete ServiceHandler proofs
- **Phase 21**: `window.napplet` global with `discoverServices()`, `hasService()`, `hasServiceVersion()` and session-scoped cache
- **Phase 22**: Vite plugin `requires` injection; runtime compatibility check at AUTH; `CompatibilityReport` via `onCompatibilityIssue`; strict/permissive mode; undeclared service consent at INTER_PANE dispatch
- **Phase 22.1** (inserted): Signer, relay pool, cache extracted as `ServiceHandler`s; `RuntimeHooks.relayPool`/`.cache` now optional; dual-path dispatch with hook fallback

### What Worked

- **Decimal phase insertion** (22.1) handled the scope expansion cleanly — SVC-04 moved from Phase 20 to dedicated phase without disrupting the existing plan
- **Reusing ConsentRequest for undeclared service consent** — zero new API surface, shell hosts get one integration point for all consent scenarios
- **Dual-path dispatch** for core infra migration — backwards-compatible, no breaking changes while completing the unified service model
- **handleMessage(windowId, message, send) interface** proved simple enough that all 5 concrete services (audio, notifications, signer, relay, cache) fit the pattern without adaptation
- **Session-scoped cache** in discovery shim prevented redundant REQ round-trips and simplified napplet-side code

### What Was Inefficient

- **Stale REQUIREMENTS.md checkboxes** required a retroactive fix pass before archival — 15 of 27 checkboxes were unchecked despite implementations being complete. Root cause: the traceability table was seeded with "Pending" and not updated during execution. Fix: update checkboxes as part of each phase's UAT or SUMMARY step.
- **Missing VERIFICATION.md for phases 18 and 22.1** — doc gaps noted in audit. Phase 18 was the first phase executed and skipped the VERIFICATION step; 22.1 was added urgently and also skipped it. Low severity but pattern worth correcting.
- **Nyquist VALIDATION.md not applied** to any v0.4.0 phase — the workflow existed but was not part of the execution pattern this milestone.

### Patterns Established

- `ServiceHandler` as the universal extension point — audio, notifications, signer, relay, cache all fit the same `handleMessage` interface
- Reuse of existing consent machinery (ConsentRequest) for new consent scenarios rather than new hooks
- Decimal phase insertion as a first-class mechanism for urgent scope additions mid-milestone

### Key Lessons

- **Update requirement checkboxes during execution, not retroactively** — the traceability table is cheapest to maintain per-plan
- **VERIFICATION.md for every phase** — even simple phases. The audit found missing artifacts for phases 18 and 22.1 specifically because they were either the first or urgently inserted
- **Dual-path migration pattern** (service → hook fallback) is effective for backwards-compatible API evolution — worth applying to future migrations

### Cost Observations

- Sessions: concentrated single-day effort (all phases 2026-03-31)
- Decimal phase (22.1) added ~4 plans but closed a critical gap (SVC-04) that would have left core infra non-discoverable
- No significant rework required — plan quality was high, execution was clean

---

## Milestone: v0.5.0 — Documentation & Developer Skills

**Shipped:** 2026-04-01
**Phases:** 4 (23-26) | **Plans:** 12

### What Was Built

- **Phase 23**: READMEs for 4 new packages (@napplet/acl, @napplet/core, @napplet/runtime, @napplet/services) — complete API documentation from source
- **Phase 24**: Root README rewrite and 3 existing package README updates (shim, shell, vite-plugin) for 7-package v0.4.0 SDK
- **Phase 25**: SPEC.md rewrite — Section 11 (kind 29010 service discovery), ShellBridge rename completion, Sections 2.9/2.10/15.6 (requires/compat/consent)
- **Phase 26**: 3 agentskills.io-format skill files: build-napplet, integrate-shell, add-service

### What Worked

- **Source-first README writing** — all READMEs written by reading actual source, not paraphrasing the spec. Caught real API discrepancies early.
- **Skill files as portable knowledge** — agentskills.io format proved well-suited for agent consumption. Skills reference exact imports and types.
- **Background agent parallelism** — Phase 26 plan + execute ran as background agents while manager dashboard stayed interactive. Clean async coordination.

### What Was Inefficient

- **Phase 24 has no execution record** — no SUMMARY.md or VERIFICATION.md. Work was done but the GSD execution tracking was bypassed. Deliverables confirmed on disk but no formal verification.
- **REQUIREMENTS.md traceability stale again** — all 14 requirements still showed "Pending" checkboxes despite being complete. Same pattern as v0.4.0.
- **SKILL-01/02/03 never added to traceability table** — requirements were defined but the traceability section wasn't updated to include the Skills row.
- **originRegistry.register() argument order bug in shell README** — caught by integration checker during milestone audit, not during phase execution.

### Patterns Established

- **Documentation milestones follow code milestones** — separating docs from code work produces focused, higher-quality output
- **Integration checker as quality gate** — cross-phase wiring checks caught real bugs (argument order inversion) that per-phase verification missed
- **Skills as a first-class deliverable** — portable, agent-consumable documentation alongside traditional READMEs

### Key Lessons

- **VERIFICATION.md for EVERY phase, including docs-only phases** — Phase 24's missing record was the biggest audit gap
- **Update traceability table during execution** — same lesson from v0.4.0; still not automated
- **Cross-reference documentation** — per-phase verification doesn't catch cross-document inconsistencies (nappState vs nappStorage). Integration checker fills this gap.

### Cost Observations

- Sessions: concentrated 2-day effort (2026-03-29 → 2026-04-01)
- 44 files changed, 6,819 lines added — almost entirely documentation
- Milestone audit found 3 fixable bugs (HIGH: register() order, MEDIUM: missing runtime property, MEDIUM: Section 3.8 table gap)

---

## Milestone: v0.9.0 — Identity & Trust

**Shipped:** 2026-04-03
**Phases:** 3 (46-48) | **Plans:** 7 | **Tasks:** 15

### What Was Built

- **Phase 46**: REGISTER/IDENTITY/AUTH handshake with deterministic key derivation via HMAC-SHA256. Storage rekeyed to `dTag:aggregateHash` (pubkey removed). Shell-side aggregate hash verification with in-memory caching. Per-iframe persistent GUID. SEC-01 guard blocks delegated keys from relay publishing.
- **Phase 47**: Permanent removal of RuntimeHooks/ShellHooks deprecated type aliases — importing old names now fails at compile time.
- **Phase 48**: SPEC.md Sections 2, 5, and 14 updated for new handshake, storage scoping, and delegated key security models. Stale references cleaned in Sections 13, 15, 16.

### What Worked

- **Phase 46 wave structure** — splitting 5 plans into 2 waves (types+storage+GUID → handshake+verification) allowed clean dependency ordering. Wave 1 established types consumed by wave 2.
- **Programmatic UAT** — Phases 47 and 48 used automated verification (grep scans, type-check, build) rather than interactive testing, completing 9 checks efficiently.
- **Integration checker depth** — found 8 non-critical findings including dead code, hidden demo TS errors, and SPEC/code divergences that per-phase verification missed.
- **HMAC-SHA256 derivation** — deterministic keypairs solved the core storage persistence problem elegantly. Same napplet always gets same keypair across sessions.

### What Was Inefficient

- **SUMMARY frontmatter gaps** — only Phase 47's SUMMARY included `requirements_completed` in frontmatter. Phase 46's 5 summaries and Phase 48's summary omitted it, weakening the 3-source cross-reference.
- **Nyquist validation incomplete** — Phase 46's VALIDATION.md stayed at `nyquist_compliant: false` (tasks never updated to green). Phase 48 has no VALIDATION.md at all. Pattern of skipping validation sign-off continues.
- **Demo type-check gap** — demo app has no `type-check` script, so excess properties on ShellAdapter (shellSecretPersistence, guidPersistence) were silently ignored. Found by integration checker, not by CI.
- **message-tap.ts not updated** — REGISTER/IDENTITY verbs not added to KNOWN_VERBS, so e2e tests can't assert on the new handshake step.

### Patterns Established

- **Shell-delegated identity** — napplets no longer create their own keypairs. The shell derives deterministic keys from a persistent secret, establishing a clear trust hierarchy.
- **Triple-read storage migration** — reading 3 historical key formats (new → legacy with pubkey → old napp-state: prefix) provides seamless backward compat without user intervention.
- **Explicit allowlist over range check** — SEC-01 uses a named BusKind allowlist rather than "any 29xxx kind." Safer but requires manual updates for future kinds.

### Key Lessons

- **Update SUMMARY frontmatter `requirements_completed`** — the 3-source cross-reference is only as strong as its weakest source. Phase 46's 13 requirements were verified but not listed in frontmatter.
- **Add demo to CI type-check** — hidden TypeScript errors accumulate when the demo is exempt from `pnpm type-check`.
- **Update test helpers alongside protocol changes** — message-tap.ts and mock-hooks.ts should be updated in the same plan that adds new protocol verbs.
- **Nyquist validation needs enforcement** — 3 milestones have now had incomplete or missing VALIDATION.md files. Consider making it a gating check.

### Cost Observations

- Sessions: concentrated 2-day effort (2026-04-02 → 2026-04-03)
- 80 files changed, +6,226/-362 lines
- Phase 46 was the heavy lift (5 plans, ~90% of the code changes)
- Phases 47 and 48 were cleanup/docs — shipped in single plans each

---

## Milestone: v0.11.0 — Clean up Side Panel

**Shipped:** 2026-04-05
**Phases:** 3 (54-56) | **Plans:** 4 | **Tasks:** 8

### What Was Built

- **Phase 54**: `relevantRoles` field on all 26 ConstantDef entries; `getEditableDefs()`, `getReadOnlyDefs()`, `getByRole()` query methods on DemoConfig
- **Phase 55**: Kinds panel (kinds-panel.ts) with 9+1 read-only reference cards; Constants panel constrained to editable-only; 3-tab inspector with persistence and polling guard
- **Phase 56**: Role-based contextual filtering on Constants tab; show-all toggle with per-session state; resetShowAll() cross-module contract; role-aware empty state

### What Worked

- **Clean phase dependency chain** — 54 built the data layer, 55 consumed it for UI split, 56 consumed both for filtering. Zero rework between phases.
- **Polling guard approach** — guarding the 1500ms timer with `_activeTab === 'node'` was the simplest correct fix. No complex timer management needed.
- **Tab persistence via deletion** — removing the `_activeTab = 'node'` reset line (rather than adding save/restore logic) was elegantly minimal.
- **UAT coverage** — Phase 55 UAT (5/5 pass) confirmed all user-facing behaviors work as designed.

### What Was Inefficient

- **Phase 56 UAT only 1/8 completed** — session was created with 8 tests but only 1 was finished before milestone completion was initiated. Some tests overlapped with Phase 55 UAT.
- **No milestone audit** — proceeded directly to completion without running `/gsd:audit-milestone`. Low risk given small scope (3 phases, 8 requirements all checked).

### Patterns Established

- **Data-first phase ordering** — building query methods before UI phases prevents UI code from encoding filtering logic inline
- **Cross-module contract for state reset** — `resetShowAll()` exported from constants-panel and called from node-inspector on selection change
- **Tab-aware polling** — inspector polling only fires for data-display tabs, not interactive tabs

### Key Lessons

- **Small milestones ship cleanly** — 3 phases with clear dependencies executed without any rework or inserted phases
- **UAT tests across phases may overlap** — Phase 56 UAT included Phase 55 tests (tabs). Consider scoping UAT strictly to phase-specific deliverables.
- **Milestone audits can be skipped for small, well-scoped milestones** — 8 requirements, 3 phases, all checked off. The overhead of a formal audit exceeds the risk.

### Cost Observations

- Timeline: single day (2026-04-04 execution, 2026-04-05 verification + archive)
- 21 files changed, +1,937/-52 lines
- All 3 phases executed sequentially with no parallelism needed (linear dependency chain)

---

## Milestone: v0.29.0 — NUB-CONNECT + Shell as CSP Authority

**Shipped:** 2026-04-21
**Phases:** 8 (135-142) | **Plans:** 19 | **Tasks:** 47

### What Was Built

- **Phase 135**: 4 cross-repo spec drafts in `napplet/nubs` (NUB-CONNECT + NUB-CLASS + NUB-CLASS-1 + NUB-CLASS-2); NIP-5D amended to NUB-neutral transport-only
- **Phase 136**: `'connect'` + `'class'` added to `NubDomain`/`NUB_DOMAINS`; `NappletGlobal` gains `connect: NappletConnect` + optional `class?: number`; `perm:strict-csp` `@deprecated`
- **Phase 137**: `@napplet/nub/connect` + `@napplet/nub/class` subpath scaffolds with shared `normalizeConnectOrigin()` + `ClassAssignedMessage` wire type; 8 new entry points; tree-shake contract
- **Phase 138**: `@napplet/vite-plugin` strictCsp production path removed; `connect?: string[]` option with aggregateHash fold + fail-loud inline-script diagnostic + module-load conformance self-check
- **Phase 139**: Central shim + SDK integration — `window.napplet.connect` + `window.napplet.class` with graceful-degradation defaults; `class.assigned` dispatcher routing
- **Phase 140**: `specs/SHELL-CONNECT-POLICY.md` + `specs/SHELL-CLASS-POLICY.md` — non-normative shell-deployer checklists
- **Phase 141**: Root README + 4 package READMEs + SKILL.md updated for two-class posture + NUB-RESOURCE-first guidance
- **Phase 142**: 13 VER gates green across 14 packages; 54 new vitest tests; 3 documented Playwright fixtures exportable to downstream shell repo

### What Worked

- **Module-load conformance-fixture self-check** — binding the plugin's `connect:origins` fold to the NUB-CONNECT spec digest at ESM-init catches drift instantly; perturbation experiment confirmed the guardrail fires. Best guarantee against silent grant-invalidation in the industry.
- **Shared `normalizeConnectOrigin()` as single source of truth** — importing from `@napplet/nub/connect/types` means build-side and shell-side validators cannot drift. Eliminates an entire class of "grants look right but silently auto-invalidate" bugs.
- **NUB-CLASS sub-track (NUB-CLASS-$N)** — keeping class definitions as composable sub-track documents preserves NUB independence. NUB-CONNECT cites NUB-CLASS-2 by name without redefining class semantics internally.
- **NUB-CONNECT with no postMessage wire** — grants flow through HTTP response CSP + `<meta name="napplet-connect-granted">`. Trivially implementable, removes round-trips from the hot path.
- **Phase 142 Wave-1/Wave-2 terminal-plan parallelization** — Plans 01 + 02 disjoint-file parallel, Plan 03 Wave-2 converges + authors close-out docs. Evolved from v0.28.0's single-plan terminal to 3 plans for better parallelism.
- **Table-driven policy scenario testing** via `describe.each` for SHELL-CLASS-POLICY's 7-row cross-NUB invariant scenario table — keeps policy prose and test surface synchronized.
- **Anti-tests for documented non-conformant states** (class:2 ∧ granted:false; class:1 ∧ granted:true) make the policy intent explicit at the test-file level.

### What Was Inefficient

- **v0.28.0 `strictCsp` machinery was built and shipped only to be ripped out in v0.29.0** — the authority-location decision (build-time vs shell-time) should have surfaced at v0.28.0 design. Net outcome is fine (strictCsp still deprecation-shimmed for one release, downstream shells inherit clean semantics), but 376 LOC of plugin code was churn.
- **Integration-checker found a blocker during milestone audit** — VER-02 type-check failure in `@napplet/nub` because `@types/node` was in root-level devDependencies but not the package-local ones. Resolved during audit via commit `a93c2ef`, but should have been caught at Phase 142's `pnpm -r type-check` gate. The gate ran green in that session because `pnpm install` had root-level types visible.
- **MILESTONES.md auto-extraction picked up markdown header fragments** ("Created files exist on disk:", "One-liner:", "Found during:") as accomplishments — the summary-extract tool grabs raw prose after certain headings without filtering stubs. Minor noise, hand-corrected post-archive.

### Patterns Established

- **Module-load conformance-fixture self-checks** for any fold procedure that MUST produce byte-identical output across consumers (build-time plugin + shell-time validator). Catches drift at import, not at runtime silent mismatch.
- **Sub-track document pattern** (NUB-$NAME-$N) for protocol surfaces that define multiple coordinated postures without collapsing NUB independence.
- **Documented fixture pattern for cross-repo test delegation** — SDK repo owns the fixture shape + preconditions + assertion vocabulary; downstream shell repo owns the test runner + real shell under test. Fixtures self-contained enough that a downstream engineer translates with minimal cross-referencing.
- **VER-gate in-repo test files named by semantic, not VER-NN** (`shim.test.ts`, `aggregate-hash.test.ts`, `cross-nub-invariant.test.ts`) — tests read as permanent protection rather than one-shot milestone work.

### Key Lessons

- **Shell authority decisions belong at milestone design, not milestone-after-next.** The "who owns CSP" question was knowable at v0.28.0 — shipping strictCsp in vite-plugin then ripping it out in v0.29.0 was churn that a 30-minute design conversation earlier would have prevented.
- **Package-local devDependencies matter even when root has them.** Monorepo root-level `@types/node` was sufficient for local builds but hid the package-boundary error until milestone audit. Lesson: `pnpm -r type-check` catches transitive-visibility bugs; run it after every dep change.
- **Conformance fixtures bind implementations to specs at the byte level.** NUB-CONNECT's canonical fold would have been vulnerable to silent drift without the `cc7c1b19…1aa742` digest acting as a tripwire. Spec + fixture + module-load check is a composable pattern worth replicating for future fold procedures.

### Cost Observations

- Timeline: single day (2026-04-21, all 8 phases + audit + close)
- 156 files changed, +22,131 / -14,950 lines (large swing due to spec drafts + vite-plugin LOC churn + 54 new vitest tests)
- 2,018 insertions / 435 deletions in `packages/**/*.ts` (signal-to-noise after excluding planning/spec churn)
- 89 commits between v0.28.0 and v0.29.0 tag
- 8 phases sequenced with parallel-safe markers where dependency graph allowed (Phases 136/137/138 parallel-safe; 139 blocked on 137; 140 parallel-safe with 136-139)

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests | LOC (TS) | Duration |
|-----------|--------|-------|-------|----------|----------|
| v0.1.0 Alpha | 6 | 30 | 66 | ~5,000 | 1 day |
| v0.2.0 Shell Cleanup | 5 | 11 | 122 | ~6,500 | 1 day |
| v0.3.0 Runtime & Core | 6 | 18 | 193 | ~8,000 | 1 day |
| v0.4.0 Service Discovery | 6 | 19 | 220+ | ~10,122 | 1 day |
| v0.5.0 Docs & Skills | 4 | 12 | 220+ | ~16,941 | 2 days |
| v0.6.0 Demo Upgrade | 7 | 28 | 220+ | — | 1 day |
| v0.7.0 Ontology Audit | 7 | 16 | 220+ | — | 2 days |
| v0.8.0 Shim/SDK Split | 4 | 10 | 220+ | — | 1 day |
| v0.9.0 Identity & Trust | 3 | 7 | 220+ | +6,226 | 2 days |
| v0.11.0 Clean up Side Panel | 3 | 4 | 220+ | +1,937 | 1 day |
| v0.29.0 NUB-CONNECT | 8 | 19 | 220+ vitest (+54 new) | +22,131/-14,950 | 1 day |

### Observations

- **Consistent short milestones** — each milestone ships in 1-2 focused sessions. v0.11.0 was the smallest yet (3 phases, 4 plans).
- **Test count stable** — no new automated tests since v0.4.0. 220+ tests remain the baseline.
- **Integration checker is essential** — found real issues in every milestone it has run: argument order bugs (v0.5.0), SPEC divergences (v0.9.0), hidden demo TS errors (v0.9.0).
- **Nyquist validation consistently incomplete** — v0.4.0, v0.5.0, and v0.9.0 all had missing or incomplete VALIDATION.md files. This is the most persistent process gap.
- **SUMMARY frontmatter quality varies** — `requirements_completed` field is populated inconsistently. The 3-source cross-reference degrades when summaries omit it.
- **Small milestones can skip formal audit** — v0.11.0 shipped cleanly without a milestone audit, suggesting the overhead isn't justified for 3-phase milestones with complete requirements.

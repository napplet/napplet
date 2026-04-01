# Phase 26: Skills Directory - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Create three agentskills.io-format SKILL.md files in a new `skills/` directory at the repo root:
- `skills/build-napplet/SKILL.md` — how to write a napplet using @napplet/shim
- `skills/integrate-shell/SKILL.md` — how to host napplets using @napplet/shell
- `skills/add-service/SKILL.md` — how to implement a ServiceHandler and register it

No package code changes. Documentation/skill creation only.

</domain>

<decisions>
## Implementation Decisions

### Primary Audience

- **D-01:** Skills are written **for AI agents primarily** — prescriptive step-by-step instructions with exact code patterns that agents can execute literally. Same format and tone as the superpowers skills (process steps + concrete code blocks). Human developers can read them, but the structure optimizes for agent execution.

### Skill Self-Containment

- **D-02:** Skills are **self-contained** — each SKILL.md includes all the code and context an agent needs inline, without requiring the agent to read package READMEs first. Relevant types, function signatures, and usage patterns are embedded directly in the skill.

### integrate-shell Depth (SKILL-02)

- **D-03:** Cover **required hooks only** — show the minimum viable `RuntimeHooks` implementation an agent needs to get a working shell: relay pool, signer, crypto, window manager. Explicitly note that optional hooks exist (hotkeys, DM, relay config, persistence) and point to `packages/shell/src/types.ts` for the full interface.
- **D-04:** The skill should produce a working `createShellBridge(hooks)` call. The minimum viable implementation is the goal, not comprehensive API coverage.

### Format (all three skills)

- **D-05:** Follow the agentskills.io format: YAML frontmatter with `name` and `description` fields, then markdown body.
- **D-06:** Structure each skill as: Overview → Prerequisites → Step-by-step process with code blocks → Common pitfalls (if applicable).
- **D-07:** Code blocks use TypeScript with realistic (not abstract) examples — matching the style in the existing superpowers SKILL.md files.

### Scope per skill

**SKILL-01 (build-napplet):** Cover `subscribe`, `publish`, `query`, `nappState`, `emit`/`on` (inter-pane), `window.nostr` NIP-07 proxy, and service discovery (`discoverServices`, `hasService`, `hasServiceVersion`). Include the vite-plugin setup (`nip5aManifest({ nappType })`) since that's required for a buildable napplet.

**SKILL-02 (integrate-shell):** Cover `createShellBridge(hooks)` with minimum viable hooks, `window.addEventListener('message', ...)` wiring, `originRegistry.register()`, `relay.sendChallenge()`, `onConsentNeeded()` handler, and one `registerService()` example. Skip optional hooks.

**SKILL-03 (add-service):** Cover `ServiceDescriptor` definition, `ServiceHandler` interface (`handleMessage(windowId, message, send)`, `onWindowDestroyed`), parsing INTER_PANE topic events, sending responses via `send()`, and wiring into `RuntimeHooks.services` / `registerService()`.

### Claude's Discretion

- Exact wording of skill descriptions and step labels.
- Whether to include a "What this skill produces" section at the top.
- How much to explain the protocol (AUTH, NIP-01) vs. just showing the API calls.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Format reference
- `/home/sandwich/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.6/skills/using-git-worktrees/SKILL.md` — agentskills.io format example (frontmatter + markdown structure)

### API source for each skill

**SKILL-01 (build-napplet):**
- `packages/shim/src/index.ts` — all shim exports
- `packages/shim/README.md` (post-Phase-24) — canonical API reference
- `packages/vite-plugin/src/index.ts` — `nip5aManifest({ nappType, requires? })`

**SKILL-02 (integrate-shell):**
- `packages/shell/src/index.ts` — `createShellBridge`, `adaptHooks`, `originRegistry`
- `packages/shell/src/types.ts` — `ShellHooks` and all sub-interfaces
- `packages/shell/README.md` (post-Phase-24) — Quick Start example to base the skill on

**SKILL-03 (add-service):**
- `packages/runtime/src/types.ts` — `ServiceHandler`, `ServiceRegistry`, `ServiceDescriptor`
- `packages/services/src/audio-service.ts` — reference implementation of ServiceHandler
- `packages/runtime/src/service-dispatch.ts` — how `routeServiceMessage` dispatches

### Requirements
- `.planning/REQUIREMENTS.md` §SKILL-01, SKILL-02, SKILL-03 — acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/services/src/audio-service.ts` is a complete reference implementation of `ServiceHandler` — the SKILL-03 planner should base the service example on this pattern.
- `packages/shell/README.md` Quick Start (post-Phase-24) will contain a realistic `createShellBridge` wiring example that SKILL-02 can echo in condensed form.
- The vite-plugin Quick Start shows `nip5aManifest({ nappType })` usage — SKILL-01 should include this as the "bootstrap" step.

### Established Patterns
- Skills are placed at `skills/{skill-name}/SKILL.md` — one directory per skill.
- Each skill is independent and portable (can be copied to another project).

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 26-skills-directory*
*Context gathered: 2026-03-31*

# Phase 136: Empirical CSP Injection-Block Verification - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** Auto-generated (empirical verification phase — pattern-locked by v0.28.0 Phase 134 VER-02; smart discuss skipped)

<domain>
## Phase Boundary

Empirically prove on Chromium that a test napplet served under the NUB-CLASS-1 CSP posture (`connect-src 'none'`; `script-src 'nonce-XXX'`; `report-to` directive) blocks a simulated legacy `<script>`-tag content-script injection AND fires a `securitypolicyviolation` event the shell can observe. Document the shape of the violation report the shell would receive via `report-to`. Document the `world: 'MAIN'` extension-API residual honestly (no page-side CSP mechanism can block extensions using `chrome.scripting.executeScript({world:'MAIN'})`). The empirical result backs DETECT-01..04's spec language in Phase 137's amendment — the PR cites behavior we've actually observed, not assumed.

Phase boundary excludes:
- Any changes to `@napplet/` source code (types, shim, SDK) — all first-party surface was shipped in Phase 135
- Any spec amendment text authoring (Phase 137 territory)
- Any NIP-5D in-repo amendment (Phase 138 territory)
- Any shell-side implementation of CSP violation-report processing (downstream shell repo)
- Any modifications to existing v0.28.0 `perm:strict-csp` vite-plugin code

This phase produces EVIDENCE FILES + a concise PHASE-NOTES.md that Phase 137 reads during amendment authoring. Zero repo source code changes.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — empirical verification phase with pattern locked by v0.28.0 Phase 134 VER-02. Guide decisions using:

1. **v0.28.0 Phase 134 VER-02 pattern (locked, directly applicable):**
   - Playwright system install at `/usr/lib/node_modules/playwright` is CJS-only (no ESM bundle) — USE `.cjs` + `require('/usr/lib/node_modules/playwright')`, NOT `.mjs`
   - Launch `chromium` in headless mode with `args: ['--ozone-platform=wayland']` per Wayland system notes in `/home/sandwich/AGENTS.md`
   - Test page served as `data:text/html;...` OR from a tiny local HTTP server if `data:` + CSP meta combination proves insufficient for nonce-based `script-src` (some CSP directives only fire via HTTP header, not meta)
   - Evidence format: `/tmp/napplet-136-<gate>.log` containing structured JSON + numeric exit-code gate (`VER04_EXIT=0`)

2. **CSP target to test** (from v0.29.0 REQUIREMENTS.md DETECT-01):
   ```
   default-src 'none';
   connect-src 'none';
   script-src 'nonce-XXX' 'self';
   report-to napplet-policy;
   ```
   Paired with `Report-To: {"group":"napplet-policy","max_age":3600,"endpoints":[{"url":"https://<test-endpoint>/napplet-csp"}]}` response header (or `reporting-endpoints: napplet-policy="<url>"` per newer spec — pick what Chromium supports cleanly in the target version).

3. **Simulated legacy extension injection** (the actual test):
   - Inject a `<script>` tag via `document.createElement('script'); s.textContent='window.nostr = {}'; head.appendChild(s)` from page-world JS (nonce absent on the injected element)
   - This mimics what NIP-07 extensions (Alby, nos2x, Flamingo) do from their content scripts
   - Observable outcome: browser blocks script execution (window.nostr stays undefined) AND fires `securitypolicyviolation` event whose `violatedDirective` is `script-src`

4. **`world: 'MAIN'` residual documentation** (grep-verifiable in Phase 137's amendment):
   - Cannot be blocked from page side — content-script injection via `chrome.scripting.executeScript({world:'MAIN'})` bypasses page CSP per WebExtension spec
   - Structural mitigation is NUB-CLASS-1's `connect-src 'none'` which traps plaintext inside the frame regardless of how it was obtained
   - Phase 136 artifact MUST name this residual honestly; Phase 137 amendment MUST NOT claim a fix

5. **Shell policy latitude documentation** (from DETECT-03):
   - Shell MAY (not MUST) refuse-to-serve future loads of an offending napplet
   - Shell MAY reject subsequent `identity.decrypt` envelopes from offenders
   - Shell MAY surface the event to the user
   - Spec defines the mechanism, not the response — shell UX is shell concern

### Deliberately non-decisions (defer to planner / executor)

- Exact Playwright fixture filename scheme under `/tmp/` — executor picks; just don't pollute `/home/sandwich/` or repo
- Whether to use `data:text/html` URL OR a `python3 -m http.server` style local static server — empirical: if nonce-based `script-src` works with `data:` URL CSP meta tag in Chromium, use that (simplest); if the nonce system requires HTTP header delivery, spin up a tiny local server
- Exact shape of the violation-report capture — in-page `addEventListener('securitypolicyviolation', ...)` is the minimal observation; actual POST to a reporting endpoint is optional evidence (harder to capture cleanly in a test fixture)
- Number of gates / evidence logs — planner may collapse all empirical evidence into one gate, or split into per-concern gates (injection blocked / report fired / world:MAIN residual documented / shell-latitude named). Single VER-04 REQ-ID from REQUIREMENTS.md may be implemented via one log OR multiple sub-logs as long as the single REQ-ID resolves

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- v0.28.0 Phase 134 VER-02 precedent: `/tmp/napplet-ver-02-csp.cjs` pattern — Playwright loader, Chromium launch with Wayland flag, data:URL test page, `securitypolicyviolation` event observation. The pattern worked; reuse exactly.
- v0.28.0 vite-plugin strict-CSP implementation at `packages/vite-plugin/src/csp.ts` — shows the exact directive shape `@napplet/vite-plugin` emits when `strictCsp: true`. Phase 136 targets this posture (NUB-CLASS-1's baseline inherits it).
- `AGENTS.md` Playwright section lines ~130: "Headless mode works out of the box — no special flags needed" + "Wayland native: `args: ['--ozone-platform=wayland']`" + "do NOT run `npx playwright install` or `npm install playwright`" — follow verbatim.

### Established Patterns

- Evidence-log-in-/tmp methodology from v0.28.0 Phases 128–134: each gate writes a final summary JSON + numeric `VERnn_EXIT=0` marker that the verifier greps. `VERnn_EXIT=0` is the load-bearing signal; bundle sizes / byte counts are secondary.
- Rule 2 (Auto-fix) and Rule 3 (Blocking issue) deviation documentation pattern — if the plan's literal invocation syntax fails in execution (e.g., `.mjs` crashes on system Playwright), document as Rule 3 deviation in SUMMARY under "Issues Encountered" and resolve with a minimal source fix.
- Phase-notes delivery to downstream phase: write a small `136-PHASE-NOTES.md` or similar summarizing observed behavior for Phase 137's amendment author to cite verbatim.

### Integration Points

- **Reads:** `packages/vite-plugin/src/csp.ts` (target CSP directive shape), `AGENTS.md` (Playwright Wayland flags, no-home-pollution rule), `/tmp/napplet-ver-02-csp.cjs` if still extant or its git archive (pattern reference)
- **Writes:** `/tmp/napplet-136-*.log` evidence, `/tmp/napplet-136-*.cjs` fixture script, `.planning/phases/136-empirical-csp-injection-block-verification/136-PHASE-NOTES.md` (observed-behavior summary for Phase 137)
- **No source code changes** — this phase is empirical only

</code_context>

<specifics>
## Specific Ideas

Two locally testable gates derived from ROADMAP success criteria:

**Gate A — Empirical injection block:** Playwright fixture serves a test napplet page under the NUB-CLASS-1 CSP posture, simulates a legacy `<script>`-tag injection, observes Chromium blocking the execution AND firing `securitypolicyviolation`. Evidence: `/tmp/napplet-136-injection-block.log` with `{"cspViolation":true,"windowNostrDefined":false,"violatedDirective":"script-src","pass":true}` + `VER04_EXIT=0`.

**Gate B — Residual + latitude documentation:** `136-PHASE-NOTES.md` names the `world: 'MAIN'` residual + shell policy latitude per DETECT-03..04. Grep-verifiable: the file MUST contain the literal strings "world: 'MAIN'", "chrome.scripting.executeScript", "connect-src 'none'" (as structural mitigation), "MAY refuse-to-serve", "shell MAY reject".

## Reference v0.28.0 precedent

`134-VERIFICATION.md` at `.planning/milestones/v0.28.0-phases/134-verification-milestone-close/` contains the VER-02 pattern — read before writing the Playwright fixture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion skipped (empirical verification phase).

Phase boundary reminder for planner: if any task drifts into authoring spec amendment text, STOP — that is Phase 137 territory. Phase 136 produces EVIDENCE ONLY. The `136-PHASE-NOTES.md` is a record of observed behavior, NOT a draft of the amendment.

</deferred>

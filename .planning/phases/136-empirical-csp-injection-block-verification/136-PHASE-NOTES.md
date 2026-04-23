# Phase 136 Phase Notes — Empirical CSP Injection-Block Verification

**Observed:** 2026-04-23
**Phase:** 136 — Empirical CSP Injection-Block Verification
**Milestone:** v0.29.0 Class-Gated Decrypt Surface
**Status:** Observation complete — consumable by Phase 137 NUB-IDENTITY + NUB-CLASS-1 amendment author

## Summary

A Playwright CJS fixture running Chromium headless under Wayland loaded a test napplet page under the NUB-CLASS-1 CSP posture and simulated a legacy NIP-07-style `<script>`-tag content-script injection. Chromium blocked the injection — `window.nostr` stayed `undefined` — and fired a `securitypolicyviolation` event whose `violatedDirective` is `script-src-elem` (the element-level sub-directive of `script-src`; satisfies `startsWith('script-src')`). The 4-field violation-report shape was captured: `violatedDirective: "script-src-elem"`, `blockedURI: "inline"`, `documentURI: "data"` (Chromium truncation quirk — scheme-only for `data:` URL documents), `sourceFile: null` (Chromium quirk for same-document inline-script injections — no remote origin file to name). The residual `world: 'MAIN'` extension-API bypass is acknowledged honestly; no page-side mechanism blocks it — NUB-CLASS-1's `connect-src 'none'` is the structural mitigation that traps plaintext inside the frame regardless of how it was obtained.

## 1. Observed Behavior — CSP Legacy-Injection Block (DETECT-01 mechanism-observation, VER-04)

Evidence: `/tmp/napplet-136-injection-block.log` (stdout JSON + `VER04_EXIT=0`).

The fixture at `/tmp/napplet-136-injection-block.cjs`:
- `require('/usr/lib/node_modules/playwright')` (CJS — Playwright system install is CJS-only)
- `chromium.launch({ headless: true, args: ['--ozone-platform=wayland'] })`
- Built a `data:text/html;charset=utf-8,...` page with first-`<head>`-child CSP meta containing the NUB-CLASS-1 10-directive baseline: `default-src 'none'; script-src 'nonce-napplet136' 'self'; connect-src 'none'; img-src blob: data:; font-src blob: data:; style-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`
- Injected a legacy `<script>` via `document.createElement('script') + s.textContent = 'window.nostr = { __injected: true };' + document.head.appendChild(s)` (nonce absent on the injected element — simulating an extension content-script that cannot know the per-page nonce)

Observed outcome (verbatim JSON line from `/tmp/napplet-136-injection-block.log`):

```json
{"cspViolation":true,"windowNostrDefined":false,"violationCount":1,"violatedDirective":"script-src-elem","effectiveDirective":"script-src-elem","pass":true}
```

Interpretation:
- `cspViolation: true` — Chromium emitted a console error matching `/Content Security Policy/i`
- `windowNostrDefined: false` — the injected script's execution was blocked; `window.nostr` never became defined
- `violatedDirective: "script-src-elem"` — the block was attributed to `script-src-elem`, Chromium's element-level sub-directive of the `script-src` family. Older Chromium versions may emit bare `"script-src"`; both satisfy `startsWith('script-src')`, which is the directive-family match the Phase 137 amendment should use rather than pinning the exact sub-directive string
- `effectiveDirective: "script-src-elem"` — matches `violatedDirective` for this injection shape
- `pass: true` — the mechanism works as specified

## 2. Violation Report Shape (DETECT-02 — what the shell's `report-to` endpoint would receive)

Evidence: `/tmp/napplet-136-report-shape.log` (stderr JSON + `VER04_EXIT=0`).

The in-page `securitypolicyviolation` event observable from page-side JS is a rough proxy for the report shape an HTTP `report-to` endpoint would receive (the Reporting API adds a wrapper with `body`, `type`, `age`, `url`, and `user_agent` fields; the `body` sub-object carries the same violation-specific fields captured below). Meta-delivered CSP cannot carry `report-to` (W3C CSP3 §4.2 header-only directive); the in-page event listener is the empirical observable in this fixture.

Observed reportShape (verbatim JSON line from `/tmp/napplet-136-report-shape.log`):

```json
{"reportShape":{"violatedDirective":"script-src-elem","blockedURI":"inline","documentURI":"data","sourceFile":null}}
```

Four load-bearing fields for shell correlation:
- `violatedDirective` — which CSP directive fired the block (here: `"script-src-elem"`)
- `blockedURI` — the blocked resource URI (here: `"inline"` for inline-script injection with `textContent`)
- `documentURI` — the URL of the document that produced the violation. **Chromium quirk observed:** truncated to `"data"` (scheme-only) for `data:` URL documents — privacy/length optimization. Non-null and present, but not the full URL. For shell-served napplets on `https://`, the full document URL is expected to be delivered
- `sourceFile` — the URL of the script that initiated the violation. **Chromium quirk observed:** JSON `null` for same-document inline-script injections — no remote origin file exists to name. The field is present in the event object and serializes faithfully as `null`; the shell's `report-to` endpoint must tolerate `sourceFile === null` for this injection shape

**DETECT-02 gate (which the Phase 137 amendment's MUST row must honor):** Shell MUST process received `securitypolicyviolation` reports by correlating to napplet identity via `(dTag, aggregateHash)` through the napplet HTML URL path. The `documentURI` + `sourceFile` fields carry the URL; the shell's URL schema maps path to identity. On Chromium, `documentURI` may be truncated for `data:`-served fixtures but the path-bearing URL from a real `https://`-served napplet delivers the full route the shell uses for `(dTag, aggregateHash)` resolution.

## 3. Shell Policy Latitude (DETECT-03 — mechanism defined, response is shell UX concern)

Per DETECT-03 (REQUIREMENTS.md) and STATE.md PRINCIPLE "Security enforcement runs shell-side": the spec defines the MECHANISM, not the response. A shell that receives violation reports MAY choose any of the following policy responses (non-exhaustive):

- **Shell MAY refuse-to-serve** subsequent loads of the offending napplet — refusing to serve the napplet HTML on future iframe instantiation requests keyed on `(dTag, aggregateHash)`
- **shell MAY reject** subsequent `identity.decrypt` envelopes from the offender — returning `policy-denied` (or an equivalent code from the `IdentityDecryptErrorCode` vocabulary) in the `identity.decrypt.error` envelope
- **Shell MAY surface** the violation to the user (notification, settings UI entry, session log) at the shell's discretion

These are observable UX responses the Phase 137 amendment should describe as shell discretion; the amendment MUST NOT require a specific UX response (doing so would impose per-shell implementation burden without improving the security posture — the shell-side boundary is already authoritative per STATE.md PRINCIPLE lines).

## 4. `world: 'MAIN'` Extension-API Residual (DETECT-04 — honestly acknowledged, structurally mitigated by `connect-src 'none'`)

**Honest acknowledgment required by DETECT-04 — do NOT claim a fix.**

Chrome / Chromium extensions using `chrome.scripting.executeScript({world:'MAIN'})` (and related manifest-v3 injection paths that target the page's main world) inject JavaScript into the page at the extension level, bypassing page CSP entirely per the Extensions WebAPI specification. The browser does NOT enforce page CSP against extension content-scripts that run under `world: 'MAIN'`.

Operational consequences observed from the mechanism specification:
- No `securitypolicyviolation` event fires (page CSP was never consulted for this injection path)
- No report is POSTed to the shell's `report-to` endpoint
- The page-side JavaScript (the napplet) has no reliable mechanism to detect or refuse the injection from within the sandbox

**Structural mitigation — NUB-CLASS-1 `connect-src 'none'`:** Even if an extension successfully injects arbitrary JavaScript via `world: 'MAIN'`, the injected code cannot exfiltrate plaintext over the network from inside a NUB-CLASS-1 napplet because `connect-src 'none'` blocks ALL outbound fetch / XHR / WebSocket / EventSource / sendBeacon connections. Plaintext is trapped inside the frame regardless of how it was obtained. This is the ONLY cross-extension-bypass defense available at the page layer, and it is why NUB-CLASS-1 is the load-bearing gate for `identity.decrypt` eligibility — NUB-CLASS-2 napplets (which ship `connect-src <granted>` via NUB-CONNECT) would hand the injected code a network path to approved origins with zero shell visibility.

**Why this is documented (not fixed):** NIP-07 extension hardening is a browser/extension ecosystem concern (per REQUIREMENTS.md "Out of Scope"). The spec documents the residual so shell implementers + napplet authors + spec readers understand the true security boundary; it does not pretend the mechanism blocks what it does not block. The `chrome.scripting.executeScript` main-world injection path is architecturally unblockable from page-side; `connect-src 'none'` is the structural backstop.

## 5. Phase 137 Handoff

Phase 137 authors the NUB-IDENTITY + NUB-CLASS-1 amendment (bundled PR per CLASS1-03). This file provides the empirical substrate for that amendment:

- **For DETECT-01 / DETECT-02 amendment language:** cite Section 1 (observed block behavior — `violatedDirective: "script-src-elem"`, `window.nostr` undefined, `cspViolation: true`) + Section 2 (violation-report shape — the 4-field shape is what the CLASS1-02 MUST row specifies the shell processes). The amendment should say "shells SHOULD observe `violatedDirective` beginning with `script-src`" rather than pinning the exact sub-directive since older Chromium versions may emit `"script-src"` instead of `"script-src-elem"`. The amendment should also note that `sourceFile` may arrive as JSON `null` for inline-injection shapes and that `documentURI` may be scheme-only for `data:`-delivered pages — shells must tolerate both in their `report-to` endpoint parsing
- **For the shell's MAY rows / Security Considerations:** cite Section 3 (Shell Policy Latitude); the 3 MAY statements enumerate what shells can do without the amendment requiring any one choice
- **For NUB-IDENTITY-05 Security Considerations subsection (c):** cite Section 4 VERBATIM — the `world: 'MAIN'` residual acknowledgment text (including the `chrome.scripting.executeScript` API-call name and the `connect-src 'none'` structural-mitigation framing) is the honest framing the amendment MUST preserve. Do NOT draft an inline fix or claim one exists

Evidence files to reference (continue to live in `/tmp/` until reboot per AGENTS.md):
- `/tmp/napplet-136-injection-block.cjs` — Playwright fixture (reproducible; rerun anytime)
- `/tmp/napplet-136-injection-block.log` — stdout JSON + `VER04_EXIT=0`
- `/tmp/napplet-136-report-shape.log` — stderr JSON reportShape + `VER04_EXIT=0`

No repo source changes occurred during Phase 136 — the phase is empirical-only. All `@napplet/*` first-party surface for `identity.decrypt` was shipped in Phase 135. This notes file is a record of observed behavior + documentation gates; Phase 137 owns the amendment prose (MUST/SHOULD tables, conformance rows, Security Considerations subsections).

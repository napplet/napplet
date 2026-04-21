# Domain Pitfalls — v0.29.0 NUB-CONNECT + Shell-as-CSP-Authority

**Domain:** Napplet iframe isolation, shell-emitted runtime CSP, consented direct-network grants
**Researched:** 2026-04-21
**Overall confidence:** HIGH (design doc + v0.28.0 code + W3C CSP3 §4.2 + WHATWG Fetch mixed-content rules all corroborate)

Pitfalls scoped to the **breaking shift from build-baked strict CSP (v0.28.0) to shell-authoritative runtime CSP (v0.29.0) plus the new NUB-CONNECT grant path**. Generic "write good CSP" advice is omitted. Every prevention is actionable as a REQ-ID, validator, assert, or documentation section.

Categories:
- **Spec** — prose in `napplet/nubs` public repo + in-repo NIP-5D amendment + NUBs-track class advisory
- **Build** — `@napplet/vite-plugin` changes
- **Runtime** — shim + SDK + central integration
- **Shell-Deploy** — SHELL-CONNECT-POLICY.md in-repo checklist
- **Cross-Repo** — public-spec / private-SDK drift controls

Previous v0.28.0 pitfalls document covered CSP enforcement at the build boundary; this document supersedes that scope for v0.29.0 and focuses exclusively on the CSP-authority-shift and NUB-CONNECT surfaces.

---

## Pitfalls by Category

### Spec Pitfalls (NUB-CONNECT prose in `napplet/nubs` repo + NIP-5D amendment)

#### SPEC-P1 — aggregateHash canonical-hashing procedure underspecified at byte level

**Severity:** Critical (determinism correctness; affects grant persistence semantics)

**What goes wrong:** The design doc (line 90–94) says "hashes a canonical serialization of the origin set (e.g., sorted origins joined with `\n`)" but "e.g." is fatal. Build side (`@napplet/vite-plugin`) and shell side (grant-lookup validator) MUST produce byte-identical hashes from the same origin set, or grants auto-invalidate randomly or fail to invalidate when they should. The pattern v0.28.0 used for `config:schema` (see `packages/vite-plugin/src/index.ts` lines 568–570) is `sha256(JSON.stringify(schema))` — that specific choice survives canonicalization because `JSON.stringify` is deterministic for plain objects without `undefined` values. For an origin list, candidates include: (a) sorted `\n`-joined, (b) sorted space-joined (CSP form), (c) JSON.stringify of a sorted array, (d) sha256-of-sha256s (Merkle).

**Warning signs:**
- Integration test "origin list changed → grant auto-invalidated" passes in isolation but fails on a different platform (line-ending drift: `\n` vs `\r\n`).
- Shell in Deno/Bun hashes differently than shell in Node.
- A napplet rebuild with identical manifest origins but reordered `connect: [...]` plugin-option array changes aggregateHash (sort missing on one side).
- "Why does my grant keep re-prompting?" support tickets with no file changes reported.

**Prevention strategy (actionable):**
- NUB-CONNECT spec MUST include a normative pseudocode block: lowercase each origin → sort ASCII-ascending → join with single `\n` (no trailing newline) → UTF-8 encode → sha256 → lowercase hex → push `[hash, 'connect:origins']` into xTags before aggregate compute.
- Vite-plugin ships a unit test with hard-coded input → hard-coded expected hex that any shell implementer can copy/paste as a conformance fixture.
- Vite-plugin and shell-side validator SHOULD share the hash function via `@napplet/nub/connect/types` (or a pure-fn sibling module) — not two independent implementations.
- REQ candidate: **CONNECT-HASH-01** — normative canonical-hash procedure documented in NUB-CONNECT spec + conformance fixture.

**Phase ownership:** Spec authoring phase (NUB-CONNECT draft in `napplet/nubs`) + vite-plugin phase (implementation + conformance fixture test).

---

#### SPEC-P2 — IDN handling rule stated but no normative conversion direction

**Severity:** High

**What goes wrong:** Design says "IDN hosts MUST be in Punycode form (`xn--…`), lowercase" and "non-Punycode IDN → refuse to load." But nothing states *who* does the UTF-8→Punycode conversion or at what layer it's rejected. Two plausible authors write `café.example.com`:
- Author A writes it directly in `napplet.config.ts`: `connect: ['https://café.example.com']`. Does vite-plugin auto-convert to `xn--caf-dma.example.com`, or reject the build? Design is silent.
- Author B writes `'https://xn--caf-dma.example.com'` but uppercase (CSP `connect-src` matching is case-sensitive on the host). Does vite-plugin lowercase, or reject?

**Warning signs:**
- Napplet authors report "my build succeeds but shell refuses to load with 'non-Punycode IDN'."
- Napplet works in dev (where browser case-folds permissively) but fetches are CSP-blocked in production.
- Authors don't know what `xn--` is and hit a confusing build failure.

**Prevention strategy (actionable):**
- NUB-CONNECT spec MUST state: build-side tool (vite-plugin or equivalent) MUST convert UTF-8 IDN → Punycode AND lowercase before emitting the manifest tag; shell MUST reject any `connect` tag whose host is not already Punycode+lowercase (no auto-conversion on load — build side is responsible).
- Vite-plugin unit test: input `https://café.example.com` → manifest tag value `https://xn--caf-dma.example.com`.
- Vite-plugin unit test: input `https://XN--CAF-DMA.example.com` → normalized to lowercase OR rejected with clear diagnostic — pick one, document.
- REQ candidate: **CONNECT-IDN-01** (build-side converts UTF-8 → Punycode, lowercases), **CONNECT-IDN-02** (shell rejects non-Punycode).

**Phase ownership:** Spec authoring + vite-plugin phase.

---

#### SPEC-P3 — Default-port rule collides with browser CSP origin-match laxity

**Severity:** Medium

**What goes wrong:** Design forbids explicit default ports (`https://foo.com:443` illegal, must be `https://foo.com`). But **browser CSP origin-matching actually accepts both forms** — `https://foo.com` and `https://foo.com:443` both match a `fetch('https://foo.com/x')`. The spec's stricter rule is a *manifest hygiene* concern (determinism for aggregateHash), not a CSP correctness concern. If the spec doesn't explain *why* the rule exists, shell implementers may be tempted to "helpfully" normalize `:443` away at grant-lookup time — which breaks aggregateHash determinism in the other direction.

**Warning signs:**
- Shell implementer adds a "friendly" canonicalization on grant storage; two builds with identical origins but one including `:443` and one omitting it share a grant they shouldn't.
- A different shell implementer does not canonicalize; aggregateHash collision across differing manifests becomes a trust-boundary confusion.

**Prevention strategy (actionable):**
- NUB-CONNECT spec MUST state the default-port ban is **input validation at manifest-load time only** — shell rejects manifests with default ports, shell does NOT normalize.
- Vite-plugin MUST reject `https://foo.com:443` at build time with a diagnostic that includes the port rule rationale.
- Spec notes adjacent browser reality: CSP-level origin-match treats the forms equivalently; the ban is about hashing determinism, not runtime correctness.
- REQ candidate: **CONNECT-PORT-01** — vite-plugin rejects default-port origins; **CONNECT-PORT-02** — shell MUST NOT normalize on lookup.

**Phase ownership:** Spec + vite-plugin + SHELL-CONNECT-POLICY.md.

---

#### SPEC-P4 — Class-1/Class-2 distinction hosted in NUB-CONNECT vs. NIP-5D delegation boundary

**Severity:** Medium (cross-spec coupling)

**What goes wrong:** NIP-5D is transport-only per the v0.16.0 decision. The milestone delegates class distinctions to the NUBs track. If NIP-5D links to "see NUB-CONNECT for Class 1 / Class 2 definitions" but NUB-CONNECT evolves (e.g., adds Class 3 for future quota-enforced origins), NIP-5D goes stale silently. Worse: if Class-1/Class-2 is described *in* NIP-5D, NIP-5D stops being transport-only.

**Warning signs:**
- Downstream NIP-5D implementers grep for "Class 1" and find only a dangling pointer.
- NUB-CONNECT iterates to v2 with new class; NIP-5D prose is silently incorrect.
- Class definitions get copy-pasted across specs and drift.

**Prevention strategy (actionable):**
- NIP-5D amendment MUST define the **delegation mechanism** — "napplet classes are defined by NUB specs; see the NUBs-track class-definition advisory" — not enumerate concrete classes.
- NUBs-track advisory doc (per milestone goal: "NUBs-track advisory on how to define napplet classes on top of existing NUB specs") is the single home for Class 1/Class 2 definitions.
- REQ candidate: **SPEC-CLASS-01** — NIP-5D amendment is mechanism-only; **SPEC-CLASS-02** — NUBs-track advisory is authoritative.

**Phase ownership:** Spec authoring phase (NIP-5D amendment + NUBs-track advisory).

---

### Build Pitfalls (`@napplet/vite-plugin`)

#### BUILD-P1 — Regex-based inline-script detection false negatives/positives

**Severity:** High

**What goes wrong:** Design mandates "fail the build with a clear error" if production HTML contains `<script>` without `src`. Zero-dep matches the existing csp.ts ethos (comment at csp.ts:28–30 explicitly justifies not taking htmlparser2/parse5 deps for a 10-directive deterministic grammar). But inline-script detection has a richer input space with known regex edge cases:

- **False negative 1:** `<script\ntype="module"\nsrc="x.js">` — newlines in attributes; same-line `src=` regex misses.
- **False negative 2:** `<!-- <script>inline</script> -->` inside a comment — shouldn't flag, but plain regex doesn't know HTML comments.
- **False negative 3:** `<script src=""></script>` — empty src; browser treats as inline-equivalent under strict CSP.
- **False positive 1:** `<script type="application/json">...</script>` — NOT executable JS; a data block for embedded JSON; should NOT fail the build.
- **False positive 2:** `<script type="application/ld+json">`, `<script type="importmap">`, `<script type="speculationrules">` — all non-executing `type=` values the browser recognizes.
- **False negative 4:** `<script src="a.js">/* fallback */</script>` — `src` present, inline content ignored when load succeeds; browser behavior correct under `script-src 'self'` but diagnostic clarity suffers.
- **False positive 3:** `data-script` or `data-scripts` attributes that match naive `script` substring patterns.

v0.28.0 csp.ts already dealt with sibling edge cases (meta-charset stripping, `[^>]*` around head-open). Extending muscle memory is fine for the 10-directive deterministic grammar. Inline-script detection is a different parser problem.

**Warning signs:**
- Author writes `<script type="application/json" id="config">{"x":1}</script>` for runtime config; build fails with "inline script detected" — confusing.
- Framework build plugin emits `<script\n src="app.js"\n crossorigin></script>`; build logs confusing warnings.
- CDATA-wrapped legacy inline script sneaks through into production.

**Prevention strategy (actionable):**
- **Decision: HTML parser dep vs. zero-dep regex.** v0.28.0 csp.ts chose zero-dep (file comment lines 28–30). For inline-script detection, recommend `parse5` or `htmlparser2` scoped to `vite-plugin` **dev-dependency** only — zero impact on napplet runtime bundle. Plugin-internal weight is acceptable.
- If zero-dep is non-negotiable: (1) strip HTML comments before scanning; (2) use multiline-aware regex; (3) require `src="..."` with non-empty value; (4) exempt the four known non-executing `type=` values; (5) write an exhaustive fixture test with all seven cases above.
- Diagnostic message MUST include the offending line/column and a "here's how to fix it" pointer to NUB-CONNECT author guidance.
- REQ candidate: **BUILD-INLINE-01** — inline-script detection must handle newlines, comments, non-executing `type=` values, and empty `src=""` with fixture tests for each.

**Phase ownership:** vite-plugin phase.

---

#### BUILD-P2 — Origin normalization drift between build-time and shell-side

**Severity:** Critical

**What goes wrong:** If vite-plugin normalizes `Https://API.Example.com:443` → `https://api.example.com` but shell validator expects lowercase already (and rejects uppercase input) or vice versa, two problems: (1) DX — build succeeds with author input, shell rejects at load; (2) aggregateHash divergence if both sides "normalize" with slightly different rules.

**Warning signs:**
- Napplet built on macOS and deployed to Linux shell produces mismatched hash on one edge case that the other platform tolerated.
- Author writes `HTTPS://...` expecting browser-style scheme-lowercase; build passes through unchanged; shell rejects with "scheme must be lowercase."
- Trailing slash `https://foo.com/` vs `https://foo.com` — build lets one through, shell rejects the other.

**Prevention strategy (actionable):**
- **Single source of truth:** define a pure function `normalizeConnectOrigin(input: string): {ok: string} | {err: string}` in `@napplet/nub/connect/types` (shared between vite-plugin and shell-side validator written in TS/JS). Normalization and validation are one function.
- Canonical steps in order: (1) parse via WHATWG URL; (2) reject path/query/fragment; (3) lowercase scheme; (4) lowercase host; (5) convert UTF-8 IDN → Punycode; (6) reject default port; (7) serialize as `scheme://host[:port]` with NO trailing slash.
- Table-driven unit tests covering: uppercase scheme, uppercase host, trailing slash, default port (all four schemes), UTF-8 IDN, wildcard (reject), path/query/fragment (reject), IPv6 literal (accept `https://[::1]` — but spec is silent on bare IPs; decide explicitly), IPv4 literal, invalid scheme.
- REQ candidate: **BUILD-NORM-01** — single shared normalizer; **BUILD-NORM-02** — table-driven tests for all branches.

**Phase ownership:** vite-plugin + @napplet/nub/connect package phase.

---

#### BUILD-P3 — `connect:origins` synthetic xTag interaction with existing `config:schema`

**Severity:** Medium

**What goes wrong:** `packages/vite-plugin/src/index.ts` line 568–570 already folds `config:schema` into xTags before aggregate compute. Adding `connect:origins` means the xTag array has potentially TWO synthetic entries. Order matters for deterministic hashing, AND the existing filter on line 585 (`.filter(([, p]) => p !== 'config:schema')`) now needs to filter both.

**Warning signs:**
- Manifest's `['x', ...]` projection leaks a synthetic entry because the filter wasn't updated.
- Reordering synthetic pushes changes aggregateHash; test passes in isolation but fails when both schema + connect are present.
- Future NUB additions (say NUB-FOO also wants a synthetic entry) require touching the same filter again.

**Prevention strategy (actionable):**
- Introduce a `SYNTHETIC_XTAG_PATHS` const set in vite-plugin (`new Set(['config:schema', 'connect:origins'])`) — filter checks set membership instead of string equality.
- Document the "colon-in-synthetic-path" convention explicitly: any NUB folding into aggregateHash uses `<nub>:<kind>` format; colons are invalid in real dist paths on all platforms.
- Test: napplet with BOTH `configSchema` and `connect` declared → aggregateHash deterministic across rebuilds, neither synthetic leaks as `['x', ...]` tag.
- REQ candidate: **BUILD-SYNTH-01** — synthetic-path registry, not hardcoded filter strings.

**Phase ownership:** vite-plugin phase.

---

#### BUILD-P4 — Removing strict-CSP emission is itself a breaking change; dev-mode decision is load-bearing

**Severity:** High

**What goes wrong:** Design open question (line 322–323) asks whether dev-mode `vite serve` retains a meta CSP. "Lean 'retain for shell-less local preview only,' but with a clearly deprecated path." If this decision flips mid-milestone, authors testing locally see different results than in-shell, AND the four validators (`buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage`) can't just be deleted — they'd orphan tests and break existing vite-plugin consumers' build configs.

Also: v0.28.0 shipped `strictCsp` as a plugin option. Removing the option is a plugin-config breaking change that triggers "option not recognized" build failures for anyone who set `strictCsp: true`.

**Warning signs:**
- Changeset entry omits the breaking nature of dropping `strictCsp` option.
- Authors upgrade, dev-serve works, prod builds succeed (no meta CSP), deploy to a non-v0.29 shell — silent breakage.
- Downstream shell repo (demo napplets per v0.28.0 Option B) breaks on upgrade.

**Prevention strategy (actionable):**
- **Explicit decision:** dev-mode meta CSP is RETAINED but the emission code path is flagged `@deprecated` with "use a real shell or accept minimal local preview." Production path is removed.
- `strictCsp` plugin option stays accepted for one release cycle — emits a build-time warning "ignored in v0.29.0; shell is now CSP authority. Remove this option from your plugin config." (Parallel to v0.26.0's `[DEPRECATED]` deprecated-packages model.)
- Changeset entry flags breaking nature loudly.
- Test: `strictCsp: true` in plugin options still builds, warning emitted, no error.
- REQ candidate: **BUILD-DEPRECATE-01** — `strictCsp` option accepted-but-warned; **BUILD-DEV-01** — dev-mode meta CSP retained with deprecation comment.

**Phase ownership:** vite-plugin phase + changesets / release notes phase.

---

### Runtime Pitfalls (`@napplet/nub/connect` shim + SDK + central integration)

#### RUNTIME-P1 — Graceful degradation on pre-v0.29 shells (capability advertisement regression)

**Severity:** High

**What goes wrong:** Design: `perm:strict-csp` is superseded but kept returning `true` for back-compat (line 266–272). A pre-v0.29 shell advertises `perm:strict-csp: true` and `nub:connect: false`. A v0.29-built napplet with `connect` tags loads: shell doesn't know what `connect` manifest tags mean, emits its v0.28.0 CSP (which previously relied on napplet-side meta CSP, but the v0.29 napplet HAS NO meta CSP). Effective CSP becomes whatever the pre-v0.29 shell defaults to.

Worse: `window.napplet.connect` is installed shim-side at shell bootstrap (design line 109–110). If the shell's shim bootstrap doesn't know about connect, `window.napplet.connect` is `undefined`. Napplet code `window.napplet.connect?.granted` is safe; `window.napplet.connect.granted` (no optional chaining) crashes.

**Warning signs:**
- Napplet throws "Cannot read property 'granted' of undefined" on pre-v0.29 shells.
- Migration napplet with `connect` tags loads silently with no network in pre-v0.29 shell because old shell's baseline has `connect-src 'none'` from v0.28.0 and doesn't know to relax.
- `shell.supports('nub:connect')` returns `false` AND `shell.supports('perm:strict-csp')` returns `true` — napplet has no clear signal for the combo.

**Prevention strategy (actionable):**
- Shim's `window.napplet.connect` installer MUST check `shell.supports('nub:connect')` during bootstrap and provide a default `{granted: false, origins: []}` object when the shell doesn't advertise the NUB. **Never `undefined`.** (This mirrors v0.26.0's shim-side graceful-degradation pattern for deprecated packages.)
- SDK convenience `connect.granted` is a getter that resolves the default on pre-v0.29 shells.
- NUB-CONNECT spec MUST document "pre-v0.29 shell" degradation: napplet code should check `shell.supports('nub:connect')` first, NOT just `window.napplet.connect.granted`.
- Test: shim-side graceful degradation — mock shell with `shell.supports('nub:connect') === false` + `shell.supports('perm:strict-csp') === true`, assert `window.napplet.connect.granted === false` and `origins === []` without throws.
- REQ candidate: **RUNTIME-DEGRADE-01** — shim provides default on pre-v0.29 shells; **RUNTIME-DEGRADE-02** — SDK guidance in JSDoc + README.

**Phase ownership:** shim central-integration phase + SDK phase + spec.

---

#### RUNTIME-P2 — Mixed-content silent failure from `http:` grant under `https:` shell

**Severity:** High (DX pitfall)

**What goes wrong:** Design Edge Case 6 (line 220–222) documents: browser blocks `http:` fetches from an `https:` shell regardless of CSP. So a napplet author declares `http://public-host.com`, build succeeds, shell prompts user, user approves, CSP header contains `connect-src http://public-host.com`, AND zero working fetches. No error visible except devtools mixed-content warning.

Localhost exception (`http://localhost`, `http://127.0.0.1`) works under `https:` shell (browser secure-context exception per WHATWG Fetch). LAN IPs don't.

**Warning signs:**
- Author opens issue: "I approved it, CSP says it's allowed, but fetch still returns network error."
- `connect:scheme:http` capability passes in shell (shell is on http://localhost for dev), author tests locally, deploys to production shell on https://, ships a broken napplet.
- No warning in build output about the deployment mismatch.

**Prevention strategy (actionable):**
- vite-plugin emits a BUILD-TIME warning (not error) when any `connect` origin is `http:` or `ws:` scheme: "⚠ cleartext origin declared: `http://foo.com`. This will be silently blocked by browsers when your napplet runs in an https:-served shell (most production shells). Exception: `http://localhost` and `http://127.0.0.1` work as secure-context-eligible. Consider using https:/wss: or NUB-RESOURCE."
- SHELL-CONNECT-POLICY.md MUST have a "Mixed-Content Reality Check" section with concrete example.
- Shell consent prompt for a cleartext origin MUST include language: "this napplet wants unencrypted access to X; even if you approve, your browser may refuse the connection when this shell is served over HTTPS."
- REQ candidate: **BUILD-MIXED-01** — vite-plugin warns on cleartext origins; **SHELL-MIXED-01** — SHELL-CONNECT-POLICY.md section; **SPEC-MIXED-01** — NUB-CONNECT prompt-wording requirement.

**Phase ownership:** vite-plugin + SHELL-CONNECT-POLICY authoring + spec.

---

#### RUNTIME-P3 — Blob revocation lifetime vs. grant revocation

**Severity:** Low (normal browser semantics; posture question, not bug)

**What goes wrong:** User revokes `https://foo.com` grant. Next page load: `connect-src 'none'`, no new fetches possible. But Blob URLs minted BEFORE revocation (via `resource.bytes` sidecar or direct `fetch().then(r => r.blob()).then(URL.createObjectURL)`) remain valid for the napplet's document lifetime — until the napplet closes or manually revokes them. `blob:` URLs bypass CSP `connect-src` (they're in `img-src blob:` per the emitted CSP).

Not unique to NUB-CONNECT and not a bug — it's how blob URLs work. But if a user's threat model is "I revoked this grant, no more data flows," they may expect in-memory blobs to also vanish. They don't.

**Warning signs:**
- Support ticket: "I revoked the grant but the napplet is still showing the image."
- Security review flags as a gap.

**Prevention strategy (actionable):**
- Document as **posture**, not bug, in SHELL-CONNECT-POLICY.md: "Revocation prevents FUTURE network access. Data already fetched and cached in the napplet's document lifetime (Blobs, in-memory state) persists until page reload. Users concerned about this should reload the napplet after revoking."
- Shell revocation UI SHOULD offer a "revoke + reload napplet" combined action.
- REQ candidate: **SHELL-REVOKE-01** — document revocation-timing semantics; **SHELL-REVOKE-02** — revocation UI offers reload option.

**Phase ownership:** SHELL-CONNECT-POLICY authoring.

---

#### RUNTIME-P4 — Consent UI wording doesn't match full-POST threat model

**Severity:** High (trust posture)

**What goes wrong:** Once `https://foo.com` is granted, napplet can `fetch('https://foo.com/', { method: 'POST', body: sensitive_data })`. Design acknowledges (line 255–257). If the consent prompt says "Allow this napplet to fetch data from foo.com?" users read it as read-only. It isn't.

Design's recommended wording (line 135): *"This napplet will be able to send and receive any data with the listed servers. The shell cannot see or filter that traffic."* Good, but "language that reflects the actual trust posture" is a SHOULD, not MUST, in the prose, AND shells implement their own UI.

**Warning signs:**
- Shell implementers write shorter/friendlier prompts that lose the "send" half.
- User testing reveals users thought it was read-only.
- Napplet exfiltrates data; reasonable response is "you approved it."

**Prevention strategy (actionable):**
- Make prompt-wording requirement MUST-level in NUB-CONNECT spec; give normative example text (or semantically equivalent) shells must use without losing the bidirectional-traffic implication.
- SHELL-CONNECT-POLICY.md includes a "Consent Prompt Language Checklist": (1) names the napplet; (2) lists origins; (3) says "send AND receive"; (4) says "shell cannot see the traffic"; (5) distinguishes cleartext; (6) avoids diminutive language ("just," "only").
- Automated test (shell-side, unit-level): prompt component renders all five required clauses; assertion on rendered text.
- REQ candidate: **SPEC-PROMPT-01** — prompt-wording MUST include bidirectional/shell-blind language; **SHELL-PROMPT-01** — SHELL-CONNECT-POLICY.md checklist.

**Phase ownership:** spec + SHELL-CONNECT-POLICY.

---

#### RUNTIME-P5 — Consent fatigue (all-or-nothing prompts; v1 design-acknowledged)

**Severity:** Low (acknowledged design decision, but worth flagging)

**What goes wrong:** v1 is all-or-nothing (explicitly non-goal of per-origin grants, line 18–19). Users click-through-approve reflexively if they see many prompts across many napplets. v1 has no bundle-grant so every new Class-2 napplet is a fresh prompt. Cleartext-warning distinction helps but doesn't fully mitigate fatigue.

**Warning signs:**
- Shells with many napplets report users saying "too many prompts, I just click approve."
- User studies (if any) show high approve-rate on cleartext origins despite the warning.

**Prevention strategy (actionable):**
- Spec SHOULD document the tradeoff explicitly under Security Considerations.
- Defer to v2: per-origin partial grants (already deferred, design line 292).
- SHELL-CONNECT-POLICY.md includes an "Anti-fatigue UX Guidance" advisory section: recommend default-Deny on repeated identical prompts, a cooldown, or a "last decision: denied X times" nudge.
- REQ candidate: **SHELL-FATIGUE-01** — advisory section in SHELL-CONNECT-POLICY.md (non-normative).

**Phase ownership:** SHELL-CONNECT-POLICY authoring.

---

### Shell-Deploy Pitfalls (SHELL-CONNECT-POLICY.md — the new in-repo checklist)

#### SHELL-P1 — Missing or buggy residual-meta-CSP scan (Edge Case 1 — project-killer)

**Severity:** Critical

**What goes wrong:** Class-2 napplet built with v0.28.0's meta CSP emitter; authors haven't rebuilt with v0.29.0 vite-plugin. Meta says `connect-src 'none'`. Shell header says `connect-src https://foo.com` (approved). Browser takes **intersection** → `connect-src 'none'`. Napplet fails silently to fetch anything.

Design mitigation (line 187–192): shell MUST scan served HTML for `<meta http-equiv="Content-Security-Policy">` and refuse to serve with diagnostic. But:
- If scan is missing → silent grant suppression → user thinks napplet is broken, napplet author thinks shell is broken, support blame-triangle.
- If scan is present but regex-based and misses edge cases (CDATA, multiline attributes, `http-equiv` value with different quote styles), offending napplet passes → same silent suppression.
- If scan over-fires on false positives (meta inside `<template>` or comment), refuses legitimate napplet.
- If scan runs only on Class-2 napplets (per design) but classification depends on manifest parsing, which has its own bug path → Class-2 napplet mis-classified as Class-1, scan skipped.

**Warning signs:**
- Class-2 napplet loads, grant shows approved, `window.napplet.connect.granted === true`, fetches fail with CSP violations.
- Deployer logs show no "refused to serve" diagnostic despite shipped napplet having residual meta CSP.
- `pnpm -r build` in napplet's own repo produces HTML with residual meta CSP (means vite-plugin wasn't upgraded; v0.28.0 behavior persists in author tree).

**Prevention strategy (actionable):**
- SHELL-CONNECT-POLICY.md MUST include a dedicated section "Residual Meta CSP Scan" with (1) parser-based scan example (not regex), (2) exact diagnostic wording (paralleling v0.28.0 csp.ts `[nip5a-manifest]` prefix style), (3) tricky-case list (comments, templates, CDATA, case-insensitive attribute match), (4) statement that scan runs on BOTH classes (Class-1 residual meta is harmless BUT deployer should still log/warn to drive napplet-author migration).
- Audit checklist line: "Residual meta CSP scan tested against at least 5 known-bad fixtures."
- Ship a shell-testing-fixture bundle: 5 napplet HTML files with residual meta CSP in various positions; shell implementer runs scanner against all 5 and asserts all rejected.
- REQ candidate: **SHELL-SCAN-01** — residual-meta-CSP scan documented; **SHELL-SCAN-02** — conformance fixture bundle.

**Phase ownership:** SHELL-CONNECT-POLICY authoring phase.

---

#### SHELL-P2 — Mixed-content cleartext policy advertisement (`connect:scheme:http`)

**Severity:** Medium (policy clarity)

**What goes wrong:** Shells refusing cleartext advertise `shell.supports('connect:scheme:http') === false`. But when does a napplet check this? At load time it's too late (manifest declares origin, shell already refused). At build time there's no way to check a specific shell. Authors fly blind.

**Warning signs:**
- Napplet declares `http:` origin, builds fine, loads into cleartext-refusing shell, shell refuses-to-load with opaque error.
- Authors don't know what `connect:scheme:http` means from the error text.

**Prevention strategy (actionable):**
- SHELL-CONNECT-POLICY.md MUST document: if shell refuses cleartext, the shell's "refuse to load" diagnostic for a Class-2 napplet with a cleartext origin MUST state which origin is problematic and why ("this shell does not permit http: origins per operator policy").
- NUB-CONNECT spec's graceful-degradation section MUST mention cleartext-scheme capability flags explicitly so author guidance points here.
- vite-plugin's cleartext warning (RUNTIME-P2 mitigation) SHOULD say "some shells refuse cleartext entirely; check `shell.supports('connect:scheme:http')`."
- REQ candidate: **SHELL-HTTP-01** — SHELL-CONNECT-POLICY.md documents cleartext-refusal diagnostic.

**Phase ownership:** SHELL-CONNECT-POLICY + spec + vite-plugin.

---

#### SHELL-P3 — CSP emission must own the HTTP response path (serving-mode gotchas)

**Severity:** Critical (load-bearing precondition for runtime CSP)

**What goes wrong:** Design line 56 says shell MUST be the HTTP responder for the napplet's HTML. Acceptable paths: direct serving, HTTP proxy, `blob:` URL with HTML transform, `srcdoc` on iframe. Each has gotchas:
- **`blob:` URL:** no HTTP header — CSP has to go in `<meta http-equiv>`, which reintroduces the first-head-child pitfall (v0.28.0 csp.ts:232–276 is the cautionary tale). If shell uses blob: for iframe src, it MUST inject CSP meta as first head child OR transform HTML before minting the blob. Plus: `blob:` has its own origin model; `'self'` resolves differently → can break `script-src 'self'`.
- **`srcdoc`:** origin is "about:srcdoc" — `'self'` resolves differently. Subject to first-head-child issue.
- **HTTP proxy:** ensure proxy doesn't strip or merge the CSP header; ensure proxy doesn't cache CSP headers across different grant states for the same URL.
- **Direct serve:** easiest; shell must not have upstream cache stripping headers.

**Warning signs:**
- Shell implementer uses `blob:` without injecting meta CSP first; CSP enforcement silently absent.
- CDN in front of direct-serve shell strips/caches CSP.
- `'self'` resolves to `blob:` origin instead of shell origin; scripts fail to load.

**Prevention strategy (actionable):**
- SHELL-CONNECT-POLICY.md dedicates a section per serving mode: "If you use `blob:` URLs, then... If you use `srcdoc`, then... If you HTTP-proxy, then..."
- For `blob:` and `srcdoc` modes, SHELL-CONNECT-POLICY.md MUST require the shell to inject CSP via meta-first-head-child AND document the `'self'` resolution gotcha.
- Shell MAY advertise serving mode (`shell.supports('connect:serve:direct' | 'connect:serve:blob' | 'connect:serve:srcdoc' | 'connect:serve:proxy')`) for debuggability — optional but recommended.
- REQ candidate: **SHELL-SERVE-01** — SHELL-CONNECT-POLICY.md per-mode checklist; **SHELL-SERVE-02** — shell MUST NOT use a serving mode that can't honor header CSP without documenting meta-CSP fallback.

**Phase ownership:** SHELL-CONNECT-POLICY authoring.

---

#### SHELL-P4 — Grant persistence key collision across napplet versions

**Severity:** Medium

**What goes wrong:** Grants keyed on `(dTag, aggregateHash)` — correct in the design. But:
- Shell implementer persists grants keyed on `dTag` alone (skipping aggregateHash in composite key) — v2 inherits v1's grant silently. Security bug.
- Shell persists full composite but doesn't show diff UI — user can't tell origin list changed.
- If `dTag` is attacker-controllable (per NIP-5A), collision is trivial.

**Warning signs:**
- Grant approvals "persist" across versions when they shouldn't.
- No diff shown; users don't notice newly-added origins.

**Prevention strategy (actionable):**
- SHELL-CONNECT-POLICY.md audit checklist line: "Grants keyed on composite `(dTag, aggregateHash)` — storage key is concatenation or tuple, never `dTag` alone."
- Conformance test: approve v1, load v2 (same dTag, different aggregateHash) → prompt fires AND diff is shown.
- REQ candidate: **SHELL-KEY-01** — composite-key requirement with fixture test.

**Phase ownership:** SHELL-CONNECT-POLICY + spec (normative in NUB-CONNECT).

---

### Cross-Repo Pitfalls (NUB-CONNECT spec in public repo vs. in-repo SDK)

#### CROSS-P1 — Spec prose lives in public repo, SDK behavior lives in this repo — drift is silent

**Severity:** High (known class; v0.28.0 precedent)

**What goes wrong:** NUB-CONNECT spec in `napplet/nubs` evolves; SDK in this repo evolves independently (bug-fix tightens validation without updating the spec, or a spec clarification narrows a MUST the SDK's permissive behavior still honors loosely). Consumers of the spec (third-party shells) and consumers of this SDK (napplet authors) see different reality.

v0.28.0 precedent:
- NUB-RESOURCE spec in public repo (draft PR).
- `specs/SHELL-RESOURCE-POLICY.md` in THIS repo is the normative-adjacent shell-deployer guide (non-normative; prose above NUB-RESOURCE MUSTs).
- Cross-repo zero-grep audit on milestone completion — no `@napplet/*` private-package names in public specs (per `feedback_no_private_refs_commits` memory rule).

**Warning signs:**
- Spec updated in public repo; SDK not touched; `pnpm build` still green → no signal.
- SDK behavior tightens (new validation); spec stays loose → third-party shells permissive, SDK-backed napplets fail in those shells.
- README/JSDoc in SDK references spec behavior that's been amended.

**Prevention strategy (actionable):**
- Follow v0.28.0 pattern: `specs/SHELL-CONNECT-POLICY.md` in THIS repo, explicitly labeled "non-normative, see NUB-CONNECT in `napplet/nubs` for normative prose" — parallel to SHELL-RESOURCE-POLICY.md.
- Cross-repo audit task in milestone completion: grep `napplet/nubs` NUB-CONNECT PR for references to `@napplet/*`, `window.napplet.connect` internals, or implementation details that belong in this repo — reject them in review. (Matches `feedback_no_implementations` memory rule.)
- Cross-repo audit task: grep in-repo for references to NUB-CONNECT spec wording that should be a link, not a copy.
- Ship a conformance-fixture bundle (canonical hash inputs, canonical CSP output) in `napplet/nubs` or linked from the spec — both sides use the same fixtures.
- REQ candidate: **CROSS-DRIFT-01** — SHELL-CONNECT-POLICY.md in this repo as shell-deployer guide; **CROSS-DRIFT-02** — cross-repo clean audit on milestone completion; **CROSS-DRIFT-03** — shared conformance fixtures.

**Phase ownership:** Spec phase (public repo PR + in-repo SHELL-CONNECT-POLICY.md) + verification phase.

---

#### CROSS-P2 — `perm:strict-csp` deprecation vs. removal timing is cross-repo

**Severity:** Medium

**What goes wrong:** `perm:strict-csp` is superseded but stays `true` for back-compat. In `napplet/nubs` NUB-CONNECT spec, we mark it deprecated. In this repo's shim, we still honor it. If deprecation removal cycle isn't synchronized (spec says removed in v2, SDK keeps it forever), ambiguity compounds:
- Napplets relying on `shell.supports('perm:strict-csp')` work against old shells forever because SDK never removes it.
- Spec v2 says it's removed; new shells return `false`; napplets break when authors thought they had back-compat.

**Warning signs:**
- Deprecation comments lack a removal version.
- Changelog doesn't cross-reference spec deprecation.

**Prevention strategy (actionable):**
- Both NUB-CONNECT spec and `@napplet/nub/connect` JSDoc mark `perm:strict-csp` deprecated with explicit "targeted for removal in vX.Y.Z" OR explicit "removal deferred to future milestone, tracked as REMOVE-N" (paralleling the v0.26.0 `REMOVE-01..03` pattern already in `.planning/PROJECT.md` for deprecated `@napplet/nub-<domain>` packages).
- Track in `.planning/PROJECT.md` Future Requirements section.
- REQ candidate: **CROSS-DEPREC-01** — synchronized deprecation targeting between spec and SDK.

**Phase ownership:** Spec phase + shim phase + docs phase.

---

#### CROSS-P3 — Demo napplets live in downstream shell repo (Option B inheritance)

**Severity:** Medium (process, not technical)

**What goes wrong:** v0.28.0 "Demo napplets explicitly delegated to downstream shell repo." v0.29.0 inherits this. NUB-CONNECT is meaningfully harder to demo than NUB-RESOURCE — it needs a real origin to fetch from, user-consent UI, revocation UI. If downstream repo doesn't get a timely update, demo stays on v0.28.0 patterns and new adopters have no reference implementation of a Class-2 napplet.

**Warning signs:**
- Milestone ships; downstream demo stays on v0.28.0 posture.
- No public example of a Class-2 napplet.
- Third-party shell implementers lack reference napplet to test against.

**Prevention strategy (actionable):**
- Milestone completion checklist: confirm downstream shell repo has a tracking issue for NUB-CONNECT demo napplet(s).
- At minimum, ship an in-repo fixture (testing-only, not a public demo) that's a Class-2 napplet shim-integration test — SDK consumers have a reference even if public demo lags.
- REQ candidate: **CROSS-DEMO-01** — tracking-issue confirmation at milestone completion; **CROSS-DEMO-02** — in-repo Class-2 fixture in tests.

**Phase ownership:** Verification/milestone-close phase.

---

## Phase-Specific Warnings Table

| Phase Topic | Pitfall IDs | Mitigation |
|-------------|-------------|------------|
| NUB-CONNECT spec draft (`napplet/nubs`) | SPEC-P1, SPEC-P2, SPEC-P3, SPEC-P4, CROSS-P1, CROSS-P2, RUNTIME-P4, SHELL-P4 | Normative canonical-hash pseudocode; IDN conversion ownership; default-port rationale; Class delegation to NUBs-track; prompt wording MUST-level; composite-key requirement |
| NIP-5D amendment | SPEC-P4, CROSS-P1 | Delegation mechanism only, not class enumeration |
| NUBs-track class advisory | SPEC-P4 | Single home for Class 1 / Class 2 definitions |
| `@napplet/nub/connect` package | SPEC-P1, BUILD-P2, RUNTIME-P1 | Shared normalizer + hash fn lives here; shim default stub |
| `@napplet/vite-plugin` changes | BUILD-P1, BUILD-P2, BUILD-P3, BUILD-P4, RUNTIME-P2 | Parser-based inline-script detection; shared normalizer; synthetic-xTag registry; `strictCsp` option deprecation warning; cleartext-origin build warning |
| `@napplet/shim` + `@napplet/sdk` central integration | RUNTIME-P1 | Default `{granted: false, origins: []}` on pre-v0.29 shells |
| `SHELL-CONNECT-POLICY.md` | SHELL-P1, SHELL-P2, SHELL-P3, SHELL-P4, RUNTIME-P2, RUNTIME-P3, RUNTIME-P4, RUNTIME-P5 | Scan section + per-serving-mode sections + composite-key requirement + mixed-content reality + revocation semantics + consent prompt checklist + fatigue advisory |
| Doc sweep (root + package READMEs + SKILL.md) | RUNTIME-P1, RUNTIME-P4, CROSS-P1 | "Default to NUB-RESOURCE; reach for NUB-CONNECT only when needed" guidance; spec-reference links (not copies) |
| Verification / milestone close | CROSS-P1, CROSS-P3 | Cross-repo zero-grep audit; downstream demo tracking confirmation |

---

## Priority Ranking (for REQUIREMENTS.md authoring)

**Critical (build-time, silent-failure, or project-killer):**
- SPEC-P1 (hash determinism) — CONNECT-HASH-01
- BUILD-P2 (normalization drift) — BUILD-NORM-01/02
- BUILD-P4 (strictCsp option deprecation) — BUILD-DEPRECATE-01/BUILD-DEV-01
- SHELL-P1 (residual-meta-CSP scan) — SHELL-SCAN-01/02
- SHELL-P3 (serving-mode CSP ownership) — SHELL-SERVE-01/02

**High (DX pitfalls, security-adjacent, or migration-critical):**
- SPEC-P2 (IDN conversion ownership) — CONNECT-IDN-01/02
- BUILD-P1 (inline-script detection) — BUILD-INLINE-01
- RUNTIME-P1 (pre-v0.29 shell degradation) — RUNTIME-DEGRADE-01/02
- RUNTIME-P2 (mixed-content silent fail) — BUILD-MIXED-01/SHELL-MIXED-01/SPEC-MIXED-01
- RUNTIME-P4 (consent UI wording) — SPEC-PROMPT-01/SHELL-PROMPT-01
- CROSS-P1 (spec/SDK drift) — CROSS-DRIFT-01/02/03

**Medium (policy/process):**
- SPEC-P3 (default-port rationale) — CONNECT-PORT-01/02
- SPEC-P4 (class delegation boundary) — SPEC-CLASS-01/02
- BUILD-P3 (synthetic-xTag collision) — BUILD-SYNTH-01
- SHELL-P2 (cleartext refusal diagnostic) — SHELL-HTTP-01
- SHELL-P4 (grant key composite) — SHELL-KEY-01
- CROSS-P2 (deprecation sync) — CROSS-DEPREC-01
- CROSS-P3 (downstream demo tracking) — CROSS-DEMO-01/02

**Low (acknowledged posture; advisory only):**
- RUNTIME-P3 (blob revocation lifetime) — SHELL-REVOKE-01/02
- RUNTIME-P5 (consent fatigue) — SHELL-FATIGUE-01

---

## Confidence Assessment

| Pitfall Cluster | Confidence | Reasoning |
|-----------------|-----------|-----------|
| Spec (SPEC-P1..P4) | HIGH | Design doc direct + v0.28.0 `config:schema` precedent + W3C CSP3 §4.2 + WHATWG URL |
| Build (BUILD-P1..P4) | HIGH | v0.28.0 csp.ts code shows the exact regex-edge-case muscle memory; synthetic-path pattern is in-repo proven |
| Runtime (RUNTIME-P1..P5) | HIGH | Capability-advertisement regression is a known class from v0.26.0 deprecation cycle; mixed-content is WHATWG Fetch documented behavior |
| Shell-Deploy (SHELL-P1..P4) | HIGH for P1/P3/P4 (CSP intersection + serving modes are browser-spec facts); MEDIUM for P2 (policy-advertisement guidance — no direct precedent) |
| Cross-Repo (CROSS-P1..P3) | HIGH | Directly parallels v0.28.0's successful handling with NUB-RESOURCE + SHELL-RESOURCE-POLICY.md |

---

## Sources

- `.planning/PROJECT.md` — current milestone context (Active line 287), deferred items pattern (REMOVE-01..03)
- `docs/superpowers/specs/2026-04-21-napplet-network-permission-design.md` — full NUB-CONNECT design (325 lines, all sections reviewed)
- `specs/SHELL-RESOURCE-POLICY.md` — reference structure for shell-deployer pitfall doc style (the parallel SHELL-CONNECT-POLICY.md should follow)
- `packages/vite-plugin/src/csp.ts` — v0.28.0 CSP validators, regex patterns, zero-dep design justification (lines 28–30), `HEADER_ONLY_DIRECTIVES`, `assertMetaIsFirstHeadChild` — muscle memory informing BUILD-P1 and SHELL-P1
- `packages/vite-plugin/src/index.ts` lines 540–600 — existing `config:schema` synthetic-xTag fold pattern that `connect:origins` must parallel (BUILD-P3)
- W3C CSP Level 3 §4.2 — header-only directives cited in v0.28.0 csp.ts comments
- WHATWG Fetch — mixed-content blocking under secure contexts (RUNTIME-P2)
- WHATWG URL — canonical URL parsing, IDN → Punycode conversion (SPEC-P2, BUILD-P2)
- Memory rules: `feedback_no_implementations`, `feedback_no_private_refs_commits`, `feedback_nub_scope_boundary` — inform cross-repo audit constraints

Confidence is HIGH overall because every pitfall either (a) has direct precedent in v0.28.0's shipped code/specs, (b) follows from documented browser behavior, or (c) mirrors a known class of cross-repo / deprecation drift the project has navigated successfully before.

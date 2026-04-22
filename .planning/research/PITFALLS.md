# Domain Pitfalls: Browser-Enforced Resource Isolation for Sandboxed Napplet Iframes

**Domain:** Strict CSP enforcement on sandboxed iframes + shell-as-resource-broker for `https:`/`blossom:`/`nostr:`/`data:` URLs over postMessage
**Researched:** 2026-04-20
**Overall confidence:** HIGH (grounded in W3C CSP3, MDN, Chromium/Firefox bug trackers, recent CVE disclosures, Simon Willison's April 2026 sandbox-escape research, JSON envelope wire format already shipped in v0.16.0+, and existing NUB modular architecture per `feedback_nub_scope_boundary` / `feedback_no_implementations` / `feedback_no_private_refs_commits`)

---

## Orientation: What v0.28.0 Adds — and the Scope Discipline It Requires

This milestone introduces **two new things** layered on top of the existing JSON-envelope postMessage protocol:

1. **Browser-enforced isolation.** A strict CSP (`connect-src 'none'` minimum, plus shell-controlled additions) makes "the napplet cannot fetch directly" a fact, not a convention.
2. **A scheme-pluggable resource primitive.** `resource.bytes(url) → blob` is the single napplet-side API; URL handlers (`https:`, `blossom:`, `nostr:`, `data:`) are pluggable on the shell side. Hashes stay shell-internal; napplets address by URL.

A new NUB (`resource`) defines the wire surface. NIP-5D gets a Security Considerations amendment for strict-CSP. NUB-RELAY gets an optional sidecar field on `relay.event`. NUB-IDENTITY + NUB-MEDIA get clarifications. The vite-plugin emits CSP-aware HTML in dev. Audio/video are explicitly out of scope.

Per `feedback_nub_scope_boundary`: **every pitfall is classified as either**
- **SPEC concern** — must be addressed in the NUB-RESOURCE wire contract or the NIP-5D §Security amendment as MUST/SHOULD/MAY, OR
- **IMPL concern** — belongs in the private `@napplet/*` reference implementation (shim, sdk, vite-plugin) and MUST NOT inflate the public spec's MUST-level surface, OR
- **DOCS concern** — belongs in shell-author guidance (READMEs, skills/) and MUST NOT appear in the public spec at all.

Per `feedback_no_implementations` and `feedback_no_private_refs_commits`: the public NUB spec MUST NOT mention `@napplet/*`. Any cross-repo coordination pitfall is called out explicitly.

Per the project's "no backwards compatibility" stance: pitfalls that ASSUME backcompat (deprecation banners, fallback API paths) are explicitly flagged.

---

## Severity Legend

- **PROJECT-KILLER** — would break the security model entirely (browser doesn't actually enforce what we claim), produce silent data exfil, or make the spec unimplementable. Must be addressed before v0.28.0 ships.
- **SERIOUS** — produces inconsistent behavior across shells, exposes attackable surface, or causes subtle protocol drift. Should be addressed in the appropriate phase.
- **ANNOYANCE** — costs developer time, generates support questions, or causes minor UX regressions. Should be documented; can be deferred.

## Phase Legend (maps to target milestone roadmap)

- **SPEC** — NIP-5D §Security amendment + new NUB-RESOURCE spec + NUB-RELAY/IDENTITY/MEDIA amendments (all in PUBLIC `napplet/nubs` repo)
- **IMPL** — `@napplet/nub/resource` + shim/sdk plumbing + `@napplet/vite-plugin` CSP emission (PRIVATE `napplet` repo)
- **VERIFY** — Playwright/Vitest tests proving CSP actually blocks, sidecar correctness, scheme dispatch
- **DOCS** — package READMEs, skills updates, shell-author resource-policy guidance

---

## Critical Pitfalls (PROJECT-KILLER severity)

### Pitfall 1: Meta CSP Placed After a `<script>` Tag → Policy Doesn't Apply

**What goes wrong:** Vite's HTML transform pipeline injects scripts (HMR client, module preload polyfill, dev-mode `import.meta` shims) into `<head>`. If the CSP `<meta http-equiv>` ends up AFTER any of those scripts, the browser parses-and-executes the early scripts WITHOUT the policy in force. Worse, modules loaded before the meta tag may already have called `fetch()` to network endpoints. The shell believes isolation is enforced; the browser disagrees.

**Why it happens:** `<meta http-equiv="Content-Security-Policy">` only applies to elements parsed AFTER it ([csplite test240](https://csplite.com/csp/test240/)). Vite injects content via `transformIndexHtml` hooks; plugin order matters. Default plugin behavior pushes the CSP meta wherever the developer placed it in `index.html`, but Vite's own injections (HMR client) typically land at the top of `<head>` regardless.

**Severity:** PROJECT-KILLER. The whole point of this milestone is browser-enforced isolation; if the policy doesn't bind, nothing else matters.

**Prevention (concrete, actionable):**
- Vite-plugin MUST inject the CSP `<meta>` as the **first child of `<head>`** with hook ordering `enforce: 'pre'` and a custom `transformIndexHtml` order that runs before Vite's HMR client injection.
- Vite-plugin MUST include a build-time assertion: parse the emitted HTML, walk `<head>`, fail if any `<script>`, `<style>`, or `<link>` element appears before the CSP meta.
- Reference shim MUST treat the policy as advisory in dev (since dev needs HMR exceptions) but MUST emit a console warning when `script-src` includes `'unsafe-inline'` or `'unsafe-eval'` so devs notice if dev-mode laxity leaks to prod.
- The NIP-5D §Security amendment SHOULD note: "When CSP is delivered via `<meta>`, the meta element MUST be the first parsed element in `<head>` to ensure policy applies to all subsequent resource loads."

**Phase:** SPEC (note in §Security), IMPL (vite-plugin head ordering + assertion), VERIFY (Playwright test that loads a napplet, walks DOM, asserts meta-first)

**Confidence:** HIGH — directly documented behavior across MDN and CSP test suites.

---

### Pitfall 2: Header-Only CSP Directives Used in Meta Tag → Silently Ignored

**What goes wrong:** A spec author or reference implementer writes `<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self'; sandbox allow-scripts; report-uri /csp-report">`. The browser silently ignores `frame-ancestors`, `sandbox`, and `report-uri` because the [W3C CSP3 spec](https://www.w3.org/TR/CSP3/) restricts those directives to HTTP headers only. The `connect-src 'none'` part still works; the protection the author thought they had on `frame-ancestors` doesn't exist. Tests pass (because `connect-src` is enforced); production has a clickjacking gap.

**Why it happens:** The directive list looks uniform from a CSP author's perspective. The header-vs-meta restriction is a CSP3 detail buried in the spec.

**Severity:** PROJECT-KILLER for any directive that's meant to provide isolation. SERIOUS for `report-uri` (you just lose telemetry).

**Prevention:**
- Vite-plugin MUST validate the configured directive set at build time: reject `frame-ancestors`, `sandbox`, `report-uri`, `report-to` if delivery is meta-only with a clear error pointing the developer at header-based delivery.
- NIP-5D §Security amendment MUST enumerate which directives are header-only and recommend a delivery mechanism (HTTP header preferred when shell hosts napplet HTML; meta acceptable when napplet is served from blob/srcdoc).
- Reference shim's resource-broker SHOULD set the iframe's `csp` attribute (the Embedded Enforcement spec) AND set the iframe's `sandbox` attribute (HTML-level, not CSP-level) — these are the runtime enforcement surfaces, NOT the meta CSP.
- Skill docs MUST document the meta-vs-header table clearly so shell authors don't trip on it.

**Phase:** SPEC (enumerate header-only directives), IMPL (vite-plugin validator), DOCS (clear table in SKILL)

**Confidence:** HIGH — W3C CSP3 §4.2 + MDN.

---

### Pitfall 3: srcdoc Iframe Inherits Parent CSP — Restriction Cannot Be Loosened

**What goes wrong:** A shell author serves napplet HTML via `<iframe srcdoc="...">` (a tempting alternative to spinning up blob URLs). Per the [W3C webappsec issue #700](https://github.com/w3c/webappsec-csp/issues/700) "wontfix" resolution, the srcdoc iframe **inherits the parent page's CSP**, and there is no way for the napplet to override it. If the shell page has `script-src 'self'`, the napplet can't load its bundled scripts. If the shell page has lax CSP, the napplet inherits the laxity (security regression). Conversely, [Mozilla bug 1073952 (CVE-2017-7788)](https://bugzilla.mozilla.org/show_bug.cgi?id=1073952) is a historical precedent for srcdoc + sandbox CSP bypass.

**Why it happens:** srcdoc iframes share the parent's browsing context for some policy decisions, and the WHATWG considers loosening this an anti-feature.

**Severity:** PROJECT-KILLER for shells that adopt srcdoc as the default delivery mechanism. SERIOUS for shells that serve napplets from blob URLs or http(s) endpoints (those are unaffected).

**Prevention:**
- NIP-5D §Security amendment SHOULD note: "Shells delivering napplet HTML via `srcdoc` inherit the parent document's CSP and cannot impose a stricter policy on the napplet via meta CSP. Shells SHOULD deliver napplet HTML via a separate origin (blob URL, http(s) URL, or data: URL with appropriate sandboxing) when CSP isolation is required."
- NUB-RESOURCE spec MUST NOT mandate a delivery mechanism — that's a shell concern.
- Reference shim MUST use blob URLs (or whatever the shell registry chooses) for napplet HTML, never srcdoc; document the rationale.
- Reference shim MUST NOT assume the parent shell page has any particular CSP — derive the napplet's effective policy from the iframe-level controls only.

**Phase:** SPEC (non-normative note), IMPL (shim chooses non-srcdoc delivery), DOCS (rationale in skill)

**Confidence:** HIGH — multiple W3C bug threads + WHATWG wontfix.

---

### Pitfall 4: blob: URL Worker Bootstrap Inherits Creator's CSP — Sandbox Escape Path

**What goes wrong:** Per [MDN CSP docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy), if a worker's URL scheme is `data:` or `blob:`, the worker **inherits the CSP of the document or worker that created it**. Iframes from blob URLs typically don't inherit, but workers do. A napplet creates a Worker from a blob URL the napplet generated from inline JS; the worker inherits the napplet's CSP (which is `connect-src 'none'`); fine so far. But if a napplet can be tricked into creating a worker from a blob the napplet didn't generate (or the vite-plugin emits a worker bootstrap that the napplet doesn't expect), the worker inherits a CSP that may be lax in dev mode and ship the laxity to prod.

A second variant: napplets can create blob URLs to load images or audio (legitimate). The CSP needs `img-src blob:` and `media-src blob:` for those to work. Forgetting this means napplet-generated blob images break with no diagnostic except a console error.

**Severity:** PROJECT-KILLER if the worker-CSP-inheritance interacts with shell-mediated sidecar resources delivered as blob URLs. SERIOUS otherwise.

**Prevention:**
- NUB-RESOURCE spec MUST clarify: `resource.bytes(url)` returns a Blob. The shell creates the Blob; the napplet receives it via structured-clone over postMessage. The napplet calls `URL.createObjectURL(blob)` to get a blob: URL it can use locally.
- NIP-5D §Security amendment MUST enumerate the minimum CSP additions required for blob:-resource delivery: `img-src blob: data:`, `media-src blob:` (deferred to v.next per audio/video out-of-scope), `font-src blob: data:`. `worker-src` SHOULD be `'none'` unless the napplet declares a need.
- Reference shim's vite-plugin MUST emit the right defaults; expose a configuration knob for napplets that need worker-src.
- Reference shim MUST forbid the napplet from creating workers in the default policy (sets `worker-src 'none'`). Napplets requiring workers must opt in via manifest, and the shell decides whether to grant.
- Tests MUST include a CSP-blocked-worker assertion.

**Phase:** SPEC (NUB-RESOURCE blob delivery contract + NIP-5D CSP minimums), IMPL (vite-plugin defaults), VERIFY (Playwright worker-creation-blocked test)

**Confidence:** HIGH — directly documented in MDN.

---

### Pitfall 5: Service Worker Bypasses Iframe Sandbox / CSP — but Only When `allow-same-origin`

**What goes wrong:** Per [Chromium issue 486308](https://bugs.chromium.org/p/chromium/issues/detail?id=486308) and [w3c/ServiceWorker issue 1390](https://github.com/w3c/ServiceWorker/issues/1390), if a sandboxed iframe has `allow-same-origin`, a service worker registered by the parent origin can intercept the iframe's requests, **bypassing what the developer thought was sandbox isolation**. Without `allow-same-origin` (which napplets DON'T have per NIP-5D), the service worker cannot intercept — but a future shell author who accidentally adds `allow-same-origin` (e.g. "to make storage work") opens the bypass.

A second variant: the shell page itself runs a service worker (e.g. for offline support of the shell UI). If the napplet is served from the same origin as the shell, the service worker sees the napplet's resource fetches and could rewrite them — meaning shell-controlled CSP is no longer the source of truth for what the napplet actually loads.

**Severity:** PROJECT-KILLER if the shell ever adds `allow-same-origin` or serves napplets from the shell's own origin and runs a service worker.

**Prevention:**
- NIP-5D §Transport ALREADY mandates `sandbox="allow-scripts"` only — this milestone MUST reaffirm and ADD: "Shells MUST NOT add `allow-same-origin` to napplet iframe sandbox attributes. The combination of `allow-scripts` + `allow-same-origin` is a documented browser-level escape path because it allows service workers registered by the shell origin to intercept napplet resource loads."
- NIP-5D §Security amendment MUST add: "Shells SHOULD serve napplet HTML from an origin distinct from the shell origin (e.g. blob URL, separate subdomain) to ensure shell-side service workers cannot intercept napplet fetches."
- Reference shim MUST assert at iframe-creation time that `allow-same-origin` is not present in the sandbox attribute (defensive throw).
- Test suite MUST include a positive assertion: create a service worker on the shell origin that intercepts `*`, load a napplet, verify the napplet's `resource.bytes()` call goes to the shell broker (postMessage path) and NOT through the service worker.

**Phase:** SPEC (reaffirm + add origin-separation guidance), IMPL (defensive throw), VERIFY (service-worker non-interception test)

**Confidence:** HIGH — Chromium and WHATWG bugs both confirm the asymmetry.

---

### Pitfall 6: SSRF via Cloud Metadata / Private IPs / Loopback — Shell as Confused Deputy

**What goes wrong:** A napplet calls `resource.bytes("https://169.254.169.254/latest/meta-data/iam/security-credentials/")`. The shell's default policy (Node.js `fetch`, browser `fetch` from a privileged context, or Tauri/Electron environment) follows the URL and returns AWS IAM credentials to the napplet. Or `resource.bytes("http://localhost:8080/admin")` returns the shell user's local admin panel content. Or `resource.bytes("http://127.0.0.1:11434/api/tags")` returns the user's local Ollama models. Or `resource.bytes("file:///etc/passwd")` if the shell environment supports `file://`.

A second variant: **DNS rebinding** ([Yunus Aydın 2026 SSRF blog](https://aydinnyunus.github.io/2026/03/14/ssrf-dns-rebinding-vulnerability/), [Behrad Taher's writeup](https://behradtaher.dev/DNS-Rebinding-Attacks-Against-SSRF-Protections/)). Napplet asks for `https://attacker.example/payload`. Shell resolves DNS — gets a public IP — passes the URL to fetch. By the time the actual HTTP request is made (or a redirect is followed), the DNS TTL has expired and the next resolution returns 169.254.169.254. The shell's "we already validated this URL" guard is bypassed.

A third variant: **redirect amplification**. Napplet asks for a "harmless" URL; shell follows redirects (default behavior of `fetch`); final URL ends up at `http://localhost:6379/` and the shell returns the Redis introspection bytes.

**Severity:** PROJECT-KILLER. This is the #1 attack surface for the shell-as-broker model. The project explicitly accepts shell-as-fetch-proxy as irreducible, but the *bounded by policy defaults* requirement means the defaults MUST be safe.

**Prevention:**
- NUB-RESOURCE spec MUST require: "Shells implementing the `https:` scheme handler MUST, by default, reject URLs whose resolved IP is in any of the following ranges: RFC1918 private ranges (10/8, 172.16/12, 192.168/16), loopback (127/8, ::1/128), link-local (169.254/16, fe80::/10), broadcast (255.255.255.255), unspecified (0.0.0.0, ::), CGNAT (100.64/10), site-local (fec0::/10). Shells MAY allow additional addresses behind explicit shell-administrator policy (e.g. enterprise on-prem services), but the default for community-deployed shells MUST be restrictive."
- NUB-RESOURCE spec MUST require: "Shells MUST resolve DNS and bind the connection to the resolved IP before issuing the HTTP request (DNS pinning), preventing TOCTOU/rebinding bypass. Each redirect MUST be re-validated against the IP block list before being followed."
- NUB-RESOURCE spec MUST require: "Shells MUST NOT support `file://`, `gopher://`, `dict://`, or other smuggling-prone schemes in the default `https:` handler. The scheme dispatcher MUST whitelist schemes, not blacklist."
- NUB-RESOURCE spec MUST require: "Shells MUST cap the redirect chain (recommend: 5) and MUST treat each redirect as a fresh policy check."
- NUB-RESOURCE spec MUST require: "Shells SHOULD enforce a per-napplet rate limit on `resource.bytes` calls (recommend: 60/minute default) and a global concurrency cap."
- The reference shim MUST ship with these defaults and MUST surface a `denied: 'private-ip' | 'rate-limited' | 'scheme-not-supported' | 'redirect-loop' | 'mime-blocked'` error envelope.
- Skill docs MUST include a "shell deployer's resource policy checklist" enumerating these defaults and the rationale for each.

**Phase:** SPEC (NUB-RESOURCE Security MUST list), IMPL (reference shim defaults), VERIFY (Playwright tests for each blocked range), DOCS (shell deployer checklist)

**Confidence:** HIGH — well-documented attack class with clear mitigations.

---

### Pitfall 7: SVG with `<foreignObject>` or External References → HTML/Script Injection

**What goes wrong:** A napplet calls `resource.bytes("https://example/malicious.svg")`. The shell fetches it, returns the bytes, the napplet creates a blob URL, drops it into an `<img src="blob:...">`. SVG in `<img>` is mostly script-safe, but per [Fortinet SVG attack surface analysis](https://www.fortinet.com/blog/threat-research/scalable-vector-graphics-attack-surface-anatomy) and [Mozilla CVE-2022-28284](https://bugzilla.mozilla.org/show_bug.cgi?id=1754522), `<foreignObject>` enables XHTML embedding inside SVG. Some browsers historically have parsed scripts inside foreignObject when the SVG is loaded via `<object>`, `<iframe>`, or directly as a top-level document.

The "shell-side SVG rasterization" feature in this milestone is exactly the right mitigation, but the rasterizer itself has attack surface:
- An SVG can `<image href="https://attacker.example/track">` — the rasterizer fetches the URL, leaking the user's IP and timing to the attacker.
- An SVG can reference fonts (`@font-face` with src URL) — same leak.
- An SVG can recursively `<use>` itself ([SVG `<use>` recursion DoS, common attack pattern](https://www.fortinet.com/blog/threat-research/scalable-vector-graphics-attack-surface-anatomy)).
- An SVG can embed XML entities in DOCTYPE → [billion laughs (CVE-2026-29074 in svgo)](https://github.com/advisories/GHSA-xpqw-6gx7-v673), 811 bytes → multi-GB heap.

**Severity:** PROJECT-KILLER for shells that rasterize untrusted SVG without filtering. SERIOUS for shells that pass SVG bytes through unmodified (the napplet's CSP partially mitigates by blocking `connect-src`, but SVG-internal references can still be made by the browser's image loader).

**Prevention:**
- NUB-RESOURCE spec MUST specify: "When the shell's MIME classifier identifies a fetched resource as `image/svg+xml`, the shell MUST either (a) rasterize it to a bitmap format (PNG/WebP) before delivering, OR (b) sanitize the SVG to remove `<foreignObject>`, `<script>`, `<style>` tags, external references in `xlink:href` / `href` / `style` URL functions, XML DOCTYPE entities, and `<use>` recursion, OR (c) refuse to deliver the resource. The default for community-deployed shells SHOULD be (a) rasterization."
- NUB-RESOURCE spec MUST specify: "Rasterizers MUST run in an isolated context (Worker or sandboxed iframe with no network) so that any SVG-internal external reference attempt is blocked at the rasterizer level. The rasterizer MUST NOT make any network request."
- NUB-RESOURCE spec MUST specify: "Rasterizers MUST cap output dimensions (recommend: 4096×4096 pixels), input bytes (recommend: 5MB), and rasterization wall-clock time (recommend: 2s). Exceeding any cap MUST result in a `denied: 'svg-bomb' | 'svg-too-large' | 'svg-timeout'` error envelope."
- Reference shim MUST use a sanitizing library (e.g. DOMPurify with SVG profile) AND rasterize via canvas in a Worker; document the choice.
- Test suite MUST include the billion-laughs SVG, a `<foreignObject>` SVG, a recursive `<use>` SVG, and verify all are blocked or sanitized.

**Phase:** SPEC (NUB-RESOURCE SVG handling MUST), IMPL (sanitizer + rasterizer), VERIFY (SVG bomb/foreignObject/recursive-use tests), DOCS (shell deployer guidance)

**Confidence:** HIGH — multiple CVEs and documented attack patterns.

---

### Pitfall 8: Spec Drift Between PUBLIC `napplet/nubs` and PRIVATE `napplet` Repos

**What goes wrong:** This milestone amends NIP-5D (PUBLIC nips repo if/when submitted; currently in PRIVATE napplet repo) AND introduces NUB-RESOURCE (PUBLIC napplet/nubs repo) AND amends NUB-RELAY/IDENTITY/MEDIA (PUBLIC napplet/nubs repo) AND lands implementation in `@napplet/*` packages (PRIVATE napplet repo). The amendments MUST land in sync. If NUB-RESOURCE ships in nubs#NN before NUB-RELAY's `sidecar` field is documented, shells implementing only what's documented will see `relay.event` envelopes with mystery `sidecar` fields and silently drop them per "unrecognized fields are ignored" — losing the optimization.

A worse variant: the public NUB-RESOURCE spec refers to `@napplet/nub/resource` as the "reference implementation" — violates `feedback_no_implementations`. The fix is permanent in git history.

A subtler variant: the implementation in PRIVATE `@napplet/*` repo evolves the wire shape during the milestone (e.g. adds a `mime` hint field), but the public spec PR isn't updated. Anyone consuming the public spec to build their own shell sees a wire shape that doesn't match the reference implementation's actual behavior. The protocol is no longer the spec.

**Severity:** PROJECT-KILLER if it ships unflagged (the protocol literally drifts). SERIOUS during development (rapid amendment is fine if both sides land before the milestone closes).

**Prevention:**
- A milestone-level checklist MUST gate "milestone complete" on: (a) all public spec PRs in `napplet/nubs` are merged or have draft PR URLs, (b) NIP-5D in PRIVATE repo matches the version that will be (or has been) submitted to nostr-protocol/nips, (c) every wire envelope shape in `@napplet/nub/resource` has a corresponding type in the public spec.
- The `napplet/nubs` PRs MUST include a "Coexistence with NUB-RELAY/IDENTITY/MEDIA" section in NUB-RESOURCE describing the sidecar field, the resource-URL flow on identity profile pictures, and the artwork URL flow on media metadata.
- NUB-RELAY amendment for sidecar MUST specify: "The `sidecar` field is OPTIONAL. Shells MAY include it on `relay.event`. Napplets MUST treat its absence as 'shell did not pre-resolve' and call `resource.bytes()` themselves. Napplets MUST treat its presence as authoritative pre-resolution — DO NOT redundantly call `resource.bytes()` for URLs in the sidecar."
- The reference implementation in `@napplet/*` MUST gate-check against the public spec at type-check time: spec types are imported from the public NUB spec (or duplicated with an explicit "must match" comment + a CI grep that fails on drift).
- Per `feedback_no_implementations`: NUB-RESOURCE spec body MUST NOT mention `@napplet/*`, "the reference shim", or "the napplet package". Implementations section MUST be `(none yet)`.
- Per `feedback_no_private_refs_commits`: Commits in PUBLIC `napplet/nubs` repo MUST describe the protocol change only. PR bodies MUST NOT link back to PRIVATE napplet repo.

**Phase:** SPEC (cross-repo coordination + memory compliance), IMPL (CI drift check)

**Confidence:** HIGH — explicit memory entries.

---

### Pitfall 9: Backwards-Compatibility Patterns Sneaking Into a Hard-Break Milestone

**What goes wrong:** The project's stance is explicit: no backwards compatibility, single user, break freely. But the brain reaches for backcompat patterns reflexively:
- "Add `resource.bytes()` and ALSO leave `fetch` allowed in CSP via `connect-src https:` for napplets that haven't migrated" — DEFEATS THE MILESTONE.
- "Ship a `@deprecated` wrapper around the old way" — there is no old way; this milestone introduces the primitive.
- "Provide a fallback if the shell doesn't support the resource NUB" — napplets that need the NUB declare `requires: ["resource"]` per NIP-5D §Manifest; shells that don't support it reject the napplet. No fallback path exists at the protocol level.
- "Keep the legacy URL field on identity profile picture AND add a resource-URL field" — same field, different semantics; pick one, document the migration as "shells implementing v0.28.0 NUB-IDENTITY MUST treat the URL field as a resource-URL"; no parallel fields.

A subtler variant: "Add a manifest opt-out for napplets that don't want CSP enforced." This is ostensibly for "developer convenience" but undermines the entire isolation claim.

**Severity:** PROJECT-KILLER. The whole milestone is browser-enforced isolation; any opt-out path means the property doesn't hold and the marketing is dishonest.

**Prevention:**
- The milestone's REQUIREMENTS.md MUST include an explicit "NO BACKCOMPAT" section listing the backcompat patterns this milestone explicitly rejects.
- Code review for this milestone MUST flag any `@deprecated` annotation introduction, any `if (oldShape) ... else ...` defensive branching for new wire types, any "legacy fallback" comment.
- The NIP-5D §Security amendment MUST state: "Shells implementing this version MUST NOT provide a CSP opt-out for individual napplets. The CSP is part of the shell's enforcement contract; napplets that need different policy must be loaded by a different shell."
- The vite-plugin MUST NOT expose a "disable CSP" flag in production builds; dev mode MAY have a relaxed mode but MUST emit a console warning AND a build-time warning if dev-relaxation makes it into a production manifest.
- Roadmap phases MUST explicitly schedule "delete the old code" steps at the start of the milestone, not at the end (where they get cut for time).

**Phase:** SPEC (no-opt-out MUST), IMPL (no-fallback discipline + vite-plugin guard), DOCS (REQUIREMENTS.md no-backcompat list)

**Confidence:** HIGH — explicit project stance per PROJECT.md.

---

### Pitfall 10: Pre-Resolution Sidecar Privacy Leak — Shell Fetches URLs the User Hasn't Engaged With

**What goes wrong:** The sidecar feature is "shell pre-resolves URLs in `relay.event` envelopes so napplets get bytes immediately when they render the event." Sounds great. But: the shell pre-fetches BEFORE the napplet decides to render. Side effects:
- Avatar URL on every event in a 1000-event timeline → shell makes 1000 HTTP requests to identify each profile picture host. The user is now "online and looking at events" from the perspective of every avatar host — a fingerprint visible to the operator of `image.example.com`.
- Encrypted DM event arrives with an embedded image URL; shell pre-fetches before user opens the DM, signaling "user is online and got the message" even if the user never reads it.
- Pre-fetch fails (host down) → shell's pre-resolution miss. Napplet falls back to `resource.bytes()`. Resource policy might rate-limit. Napplet retries. User waits twice.
- Pre-fetch succeeds → bytes occupy memory in the shell's content cache for events the napplet may never render. 1000 pre-resolved 50KB images = 50MB of "just-in-case" RAM.

**Severity:** SERIOUS (privacy regression + memory pressure). Not project-killer because the sidecar is documented as OPTIONAL — but if it's the default, it's silently degrading the privacy story napplets had before this milestone.

**Prevention:**
- NUB-RELAY amendment MUST specify: "Sidecar pre-resolution is OPT-IN at the shell level. Shells SHOULD provide the user with control over which event kinds, which URL hosts, or which napplets receive sidecars. The default policy SHOULD be: do not pre-fetch resources from arbitrary URLs in events."
- NUB-RELAY amendment MUST specify: "Shells implementing sidecar SHOULD only pre-fetch URLs that match the napplet's manifest-declared resource policy (e.g. profile picture URLs from `nostr:` references that the napplet asked to resolve, blossom hashes, but NOT arbitrary `https:` URLs from event content)."
- NUB-RESOURCE spec MUST specify: "The shell's resource cache MUST be scoped per (napplet `dTag`, URL canonical form). Napplets MUST NOT see another napplet's cached resources." (Cross-cache poisoning prevention.)
- Reference shim MUST default sidecar to OFF; provide a configuration knob with a privacy-warning JSDoc.
- Skill docs MUST cover the privacy tradeoff explicitly.

**Phase:** SPEC (NUB-RELAY sidecar opt-in MUST), IMPL (default off + scoped cache), DOCS (privacy guidance)

**Confidence:** HIGH — directly follows from threat modeling.

---

## Serious Pitfalls (SERIOUS severity)

### Pitfall 11: Blob Lifetime — Who Owns Revoke?

**What goes wrong:** Per [MDN URL.createObjectURL docs](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static), every `URL.createObjectURL(blob)` keeps the underlying Blob alive until `URL.revokeObjectURL` is called or the document unloads. A napplet that calls `resource.bytes(url)` 1000 times in a session and creates an object URL each time, never revoking, keeps 1000 Blobs in memory. Per [Bugzilla 939510](https://bugzilla.mozilla.org/show_bug.cgi?id=939510), revocation can fail in some download paths (less relevant here but flag).

Worse: the SHELL also holds the Blob (it created it). If the shell retains a reference for caching, AND the napplet retains via createObjectURL, AND neither side revokes, both pay the memory cost for the same bytes.

**Severity:** SERIOUS (slow memory leak; doesn't crash on first use but degrades long sessions).

**Prevention:**
- NUB-RESOURCE spec MUST specify: "The Blob delivered to the napplet via `resource.bytes()` is owned by the napplet for its lifetime. The shell MAY drop its own reference at any time after delivery; napplets MUST NOT assume the shell will retain it. Napplets MUST call `URL.revokeObjectURL` when finished with object URLs they create."
- NUB-RESOURCE spec MUST specify: "Shells MAY enforce a per-napplet quota on outstanding `resource.bytes()` Blob bytes (recommend: 50MB default). Exceeding the quota MUST result in a `denied: 'quota-exceeded'` error envelope; existing Blobs are not affected."
- SDK helper MUST provide a `useResource(url)` pattern that auto-revokes on cleanup (React-hook-style), even though napplets are framework-agnostic.
- Reference shim's resource cache MUST use a content-addressed (hash) keyed cache with weak references where possible, with explicit eviction policy (LRU + TTL).

**Phase:** SPEC (lifetime contract), IMPL (SDK helper + shell cache), DOCS (napplet-author guidance)

**Confidence:** HIGH.

---

### Pitfall 12: postMessage Structured Clone Copies Megabyte Blobs Twice → Performance Cliff

**What goes wrong:** Per [MDN Transferable docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) and [Surma's "Is postMessage slow?"](https://surma.dev/things/is-postmessage-slow/), structured-clone of a 32MB ArrayBuffer takes ~302ms; transferring it (zero-copy) takes 6.6ms. Blobs are **not** transferable but ARE structured-cloneable (and the spec says they SHOULD be cloned by reference, not copy). In practice browser behavior varies; you cannot rely on cloned Blob being reference-shared.

If `resource.bytes()` returns a Blob via postMessage and the shell internally holds an ArrayBuffer for the bytes, the obvious choice is "send the ArrayBuffer as a Transferable" — fast. But then the shell loses its copy. If the shell wants to cache, it needs to clone first. Now the shell has the bytes AND the napplet has the bytes. Caching defeats transfer.

**Severity:** SERIOUS for large resources (avatars are small; podcast images are not; future video would be a disaster but is out of scope).

**Prevention:**
- NUB-RESOURCE spec MUST specify the wire delivery shape: "Resource bytes are delivered as a `Blob` in the envelope payload. Shells SHOULD use the most efficient transport available (Transferable ArrayBuffer when shell does not need to retain the bytes, structured-clone Blob when caching). The transport choice MUST be invisible to the napplet."
- NUB-RESOURCE spec SHOULD recommend a payload-size threshold (recommend: 256KB) below which structured-clone is acceptable, above which Transferable should be used.
- NUB-RESOURCE spec MUST set a hard maximum payload size (recommend: 10MB per resource for v0.28.0; revisit when audio/video lands). Larger resources MUST be denied with `denied: 'resource-too-large'`.
- Reference shim MUST measure delivery time in dev mode and warn if > 100ms (developer feedback).

**Phase:** SPEC (delivery shape + size cap), IMPL (efficient transport choice), VERIFY (perf test for 5MB delivery < 50ms)

**Confidence:** HIGH.

---

### Pitfall 13: Cache Stampede — N Napplets Request Same Avatar Simultaneously

**What goes wrong:** A timeline napplet renders 50 events from the same author. Each render triggers `resource.bytes(profile_picture_url)`. The shell's cache is empty. Without coalescing, the shell issues 50 concurrent HTTP requests to the same upstream URL — wasting bandwidth, possibly tripping the upstream's rate limit, and potentially leaking 50 distinct request IDs in the upstream's logs. Per [singleflight pattern](https://1xapi.com/blog/nodejs-cache-stampede-single-flight-pattern-2026), the standard fix is to keep a Map<URL, Promise<Bytes>> and dedupe in-flight requests.

**Severity:** SERIOUS (degrades performance and privacy; doesn't break correctness).

**Prevention:**
- NUB-RESOURCE spec MUST specify: "When multiple `resource.bytes()` requests for the same canonicalized URL are in flight from the same napplet, the shell MUST coalesce them and deliver the same Blob to all callers. Shells SHOULD coalesce across napplets with the same `(dTag, aggregateHash)` scope; shells MAY coalesce across all napplets if the resource is not security-scoped."
- NUB-RESOURCE spec MUST specify URL canonicalization rules: lowercase scheme/host, decode percent-encoding for unreserved chars, sort query params, drop fragment, normalize path slashes. Without canonicalization, `https://Example.com/x` and `https://example.com/x` cause two cache entries.
- Reference shim MUST implement single-flight with a Map<canonicalURL, Promise<Blob>>.
- Test suite MUST include "100 concurrent same-URL requests result in 1 upstream fetch."

**Phase:** SPEC (single-flight contract + canonicalization), IMPL (single-flight Map), VERIFY (concurrent-request dedup test)

**Confidence:** HIGH.

---

### Pitfall 14: Content-Addressed Cache Invalidation — Avatar Update Goes Stale

**What goes wrong:** Shell caches `https://x/avatar.jpg` content-addressed by `sha256(bytes)`. User updates their avatar; URL stays the same; bytes change. Shell sees URL match, returns stale bytes. URL → hash mapping needs invalidation policy.

A second variant: the shell exposes the URL → hash mapping to napplets (it shouldn't, per "hashes stay shell-internal" decision, but the temptation arises for "let napplets pre-check if a resource is cached"). Now any napplet can probe the cache for arbitrary URLs and infer what other napplets / users have viewed.

**Severity:** SERIOUS (stale UX; not a security issue if hashes stay internal).

**Prevention:**
- NUB-RESOURCE spec MUST specify: "The shell's resource cache uses URL as the lookup key. Content-addressed storage of the bytes is an internal optimization; the URL → bytes mapping MUST be invalidated according to standard HTTP cache semantics (Cache-Control headers, ETag revalidation, max-age expiry). Shells MAY apply additional invalidation policy (e.g. shorter TTL for profile pictures)."
- NUB-RESOURCE spec MUST specify: "Shells MUST NOT expose hash values, cache keys, or cached/uncached status to napplets via the wire protocol. `resource.bytes()` returns Blob or error; nothing else."
- NUB-RESOURCE spec MUST specify: "When a hash collision is theoretically possible (it isn't for SHA-256, but flag for any future hash choice), shells MUST use SHA-256 or stronger. Shells MUST NOT use MD5 or SHA-1 for content addressing. Shells MUST NOT use truncated hashes."
- Reference shim MUST honor `Cache-Control: no-cache` and re-fetch on each request for that URL.

**Phase:** SPEC (cache semantics + hash internals + algorithm requirements), IMPL (HTTP cache semantics)

**Confidence:** HIGH.

---

### Pitfall 15: Napplet Renders Before Sidecar Arrives — Race Condition

**What goes wrong:** Napplet receives `relay.event` envelope. Per the v0.28.0 design, the envelope MAY include a `sidecar` field with pre-resolved bytes. Napplet renders immediately. But: the wire format already shipped means the napplet's existing event handler may not look for `sidecar` (it's a new field). Old napplet code calls `resource.bytes(url)` even when sidecar is present — wasted work.

Worse: napplet decides based on a partial envelope (e.g. event metadata arrives, then sidecar arrives in a separate envelope) and rerenders multiple times. If the sidecar is delivered as a separate envelope (e.g. `resource.preresolved` follow-up message), the napplet has to know to wait for it — but waiting introduces latency and a "did we wait long enough" guess.

**Severity:** SERIOUS (degrades the optimization the milestone is investing in; confusing to napplet authors).

**Prevention:**
- NUB-RELAY amendment MUST specify: "Sidecar bytes MUST be delivered in the SAME envelope as the `relay.event`, not as a follow-up message. If the shell cannot pre-resolve in time, the envelope MUST be sent without sidecar — napplets fall back to `resource.bytes()`."
- NUB-RESOURCE spec MUST specify: "Napplets SHOULD check for sidecar presence before calling `resource.bytes()` for a URL referenced in an event. Shells MAY (but are not required to) detect duplicate `resource.bytes()` calls for sidecar URLs and respond with the cached bytes."
- SDK helper MUST provide a `resolveResource(event, urlField)` wrapper that prefers sidecar, falls back to `resource.bytes()`.
- Per the "no backcompat" stance: napplet authors MUST adopt the new pattern; vite-plugin MUST NOT emit a "compatibility shim" that mocks sidecar absence.

**Phase:** SPEC (single-envelope sidecar guarantee), IMPL (SDK wrapper), DOCS (napplet-author migration note)

**Confidence:** HIGH.

---

### Pitfall 16: Shell Sets `Content-Disposition` from URL Path — Header Injection

**What goes wrong:** Per [Axios CRLF advisory](https://github.com/axios/axios/security/advisories/GHSA-fvcv-3m26-pcqx) and [Node undici CRLF fix](https://github.com/nodejs/undici/commit/e43e898603dd5e0c14a75b08b83257598d664a39), HTTP libraries that don't strictly validate header values for CRLF allow request smuggling. If the shell builds the outbound HTTP request from the napplet-supplied URL (e.g. setting `Referer: <shell-page-url>` based on something the napplet influences, OR appending the napplet `dTag` as a custom `X-Napplet-Source` header), and the napplet manages to inject `\r\n` into the value, it can split the request.

A second variant on the response side: shell forwards upstream `Content-Type`, `Content-Disposition`, etc. to the napplet via the envelope. If the napplet's renderer trusts these naively (e.g. uses `Content-Disposition`'s `filename=` to drive a download UI), the shell has just relayed an attacker-controlled value to a sandboxed iframe. Mostly harmless because the iframe is sandboxed, but the shell-side response-splitting (where the upstream's `Content-Type: image/jpeg\r\nSet-Cookie: ...` ends up in the shell's own response handling) is a real risk if the shell parses bytes for cache headers.

**Severity:** SERIOUS (depends on the shell's HTTP library; modern Node and browser fetch are strict, but the shell-as-broker model accepts custom header construction).

**Prevention:**
- NUB-RESOURCE spec MUST specify: "Shells MUST validate the napplet-supplied URL against a strict URL parser (e.g. WHATWG URL) and MUST reject URLs containing CR, LF, NUL, or other control characters in any component. Shells MUST NOT include any napplet-controllable string in outbound HTTP headers without escaping."
- NUB-RESOURCE spec MUST specify: "The MIME type delivered to the napplet via `resource.bytes()` is the shell's classified MIME (based on byte sniffing + URL extension + upstream Content-Type), NOT a verbatim copy of the upstream Content-Type header. Shells MUST NOT pass through Set-Cookie, Content-Disposition, Authorization, or any header other than a normalized MIME type and content length."
- Reference shim MUST use WHATWG URL parsing and explicitly reject control chars.
- The shell's outbound fetch MUST use a library that validates header values (modern Node fetch / undici, browser fetch).

**Phase:** SPEC (URL validation + header passthrough rules), IMPL (WHATWG URL + strict library)

**Confidence:** HIGH.

---

### Pitfall 17: Shell-Mediated Open Redirect — Napplet Asks for URL A, Gets Bytes from URL B

**What goes wrong:** Napplet calls `resource.bytes("https://benign.example/img")`. Shell follows redirects (default `fetch` behavior). The benign endpoint redirects to `https://evil.example/img` which serves an SVG bomb. Shell delivered "benign" bytes to the napplet from the napplet's perspective, but they came from evil. Napplet has no idea.

A second variant: redirect to a private IP (covered in Pitfall 6, but worth re-noting here as the redirect chain is the trigger).

A third variant: napplet asks for URL A, attacker controls A → A 302→ B 302→ A 302→ B (loop). Shell exhausts redirect budget, returns error. Resource bandwidth wasted.

**Severity:** SERIOUS (privacy/security; the napplet's URL ≠ the actual fetch target).

**Prevention:**
- NUB-RESOURCE spec MUST specify: "Each redirect followed by the shell's URL handler MUST be re-validated against the shell's resource policy (private IP block, scheme whitelist, rate limit). Shells MUST cap the redirect chain at 5 (default). Shells MUST NOT follow cross-origin redirects without re-validation."
- NUB-RESOURCE spec MAY specify: "Shells MAY return the final resolved URL to the napplet as a `finalUrl` field on the `resource.bytes.result` envelope. If included, napplets can detect cross-origin redirects."
- Reference shim MUST log all redirects in dev mode for developer awareness.

**Phase:** SPEC (redirect chain cap + re-validation MUST), IMPL (custom fetch that validates each hop), VERIFY (redirect-loop and redirect-to-private-IP tests)

**Confidence:** HIGH.

---

### Pitfall 18: Vite Dev HMR Requires `connect-src ws://` — CSP Conflict

**What goes wrong:** The [vite #11862 issue](https://github.com/vitejs/vite/issues/11862) and [#15404](https://github.com/vitejs/vite/issues/15404) confirm: Vite's HMR client uses a WebSocket to the dev server, requires `connect-src` to include `ws://localhost:*`, AND injects inline scripts requiring `script-src 'unsafe-inline'` or nonce-based scripts. The whole point of v0.28.0's strict CSP is `connect-src 'none'` — directly conflicts with HMR.

A naive solution: "in dev mode, allow `ws://localhost:5173`." But the napplet runs INSIDE an iframe served from a different URL than the dev server; the iframe's CSP needs to allow connecting to the dev server, which means the napplet has a `connect-src` that DOES allow some connections — defeating the strict-isolation premise during development.

**Severity:** SERIOUS (developer experience; if dev mode requires laxity, devs build with laxer policies and the prod policy diverges → bugs).

**Prevention:**
- Vite-plugin MUST emit two distinct CSPs: a dev CSP that allows HMR (with explicit dev-mode ws:// connect-src), and a build CSP that is strict (`connect-src 'none'`).
- Vite-plugin MUST include a build-time assertion: dev-mode CSP additions MUST NOT appear in the build manifest. If they do, fail the build.
- Vite-plugin SHOULD emit a console warning at dev startup: "DEV MODE CSP ALLOWS ws:// FOR HMR — production build will be strict."
- NIP-5D §Security amendment SHOULD note: "Development tooling (e.g. HMR) may require relaxed CSP. Tooling MUST emit production builds with the strict policy and MUST surface dev-mode relaxations to the developer."
- Skill docs MUST include a "verify your build CSP" checklist.

**Phase:** SPEC (note dev/prod separation), IMPL (vite-plugin two-mode CSP + assertion), DOCS (skill verification)

**Confidence:** HIGH.

---

### Pitfall 19: Vite Inline Scripts and `<script type="module">` Need Nonces

**What goes wrong:** Per [vite #9719](https://github.com/vitejs/vite/issues/9719) and [#15404](https://github.com/vitejs/vite/issues/15404), Vite's `__vitePreload` injects inline scripts. Without `'unsafe-inline'` in `script-src`, these are blocked. Modern guidance is to use nonces, but Vite's nonce support requires opt-in via a `meta[property=csp-nonce]` element AND a compatible HTML plugin.

If the napplet's CSP has `script-src 'self'` only, Vite's preload script is blocked, the napplet fails to load any chunked module, and the napplet appears broken with a console error nobody reads.

**Severity:** SERIOUS (napplets ship broken if CSP is too strict for Vite's runtime).

**Prevention:**
- Vite-plugin MUST set up nonce-based CSP by default: generate a nonce per build, inject `<meta property="csp-nonce" content="...">` in `<head>` AS THE FIRST CHILD (per Pitfall 1), set `script-src 'nonce-...' 'self'` (NOT `'unsafe-inline'`).
- Vite-plugin MUST NOT use `'unsafe-eval'` ever. Vite's production builds don't need it; if a dev mode requires it, document and warn.
- Reference shim MUST avoid `eval`, `new Function()`, and template strings that compile to eval.
- Test suite MUST include a CSP-violation-zero assertion: load a built napplet, capture console, fail if any CSP violation appears.

**Phase:** IMPL (vite-plugin nonce setup), VERIFY (zero-CSP-violation test)

**Confidence:** HIGH.

---

### Pitfall 20: Source Map and Dynamic Import Fetches Need Explicit CSP Allowance

**What goes wrong:** Vite emits source maps in dev (and optionally in prod). Browser fetches them via the URL in `//# sourceMappingURL=...`. If `connect-src` blocks the source map fetch, dev tools show "no source map" — degraded debugging but not broken.

Dynamic import (`import('./module.js')`) loads a chunk via the browser's module loader. Per CSP, this needs `script-src` to allow the URL. If the napplet bundles all chunks under the napplet's origin and `script-src 'self'` is set, this works. If chunks come from a CDN or different origin, the CSP needs explicit allowance.

`import.meta.url` is a string, not a fetch — no CSP impact directly. But if napplet code uses `new URL(asset, import.meta.url)` and then `fetch(url)`, the fetch IS subject to `connect-src` — and `resource.bytes()` is the only sanctioned fetch path in v0.28.0.

**Severity:** SERIOUS for non-trivial napplets; ANNOYANCE for hello-world.

**Prevention:**
- Vite-plugin MUST configure default CSP with `script-src 'self' 'nonce-...'` to allow chunked module loading.
- Vite-plugin MUST emit source maps with same-origin URLs in dev; configure prod source maps to be `external` (separate file) or `inline`.
- Skill docs MUST cover the migration: "any code using `fetch(...)` MUST migrate to `window.napplet.resource.bytes(url)`. Dynamic `import()` of static modules continues to work."
- Lint rule (in vite-plugin or a separate package) SHOULD detect `fetch(`, `new XMLHttpRequest()`, `new WebSocket(`, `new EventSource(` in napplet source and emit an error/warning pointing to `resource.bytes()`.

**Phase:** IMPL (vite-plugin CSP + lint), DOCS (migration guide)

**Confidence:** HIGH.

---

### Pitfall 21: Playwright Auto-Wait Doesn't Catch CSP Violations Silently

**What goes wrong:** Playwright tests like `await page.goto(url); await expect(page.locator('img')).toBeVisible()` will pass if the `<img>` element is in the DOM with width/height — even if the image's `src` attribute points to a CSP-blocked URL and no actual bytes loaded. CSP violations report to console (and to `report-uri` if set, but per Pitfall 2 that's header-only). They do NOT throw; the page does NOT fail.

A test that's meant to verify "this napplet's CSP blocks `https://evil.example/track`" needs to:
1. Load the napplet and trigger the offending fetch.
2. Listen on `page.on('console')` for the CSP violation message.
3. Listen on `page.on('requestfailed')` for the network event.
4. Correlate: the CSP violation message AND the request failure must reference the same URL.
5. Assert the URL never reached the server (if testing against a real upstream).

A weaker (but acceptable) test is to assert `page.on('request')` DID NOT fire for the URL — but in modern browsers, CSP-blocked requests still fire `requestfailed`, not absence.

**Severity:** SERIOUS for the verification phase. If the tests don't actually verify blocking, the milestone ships with the warm fuzzy feeling of CSP without proof.

**Prevention:**
- Verification phase MUST include a CSP-blocked-request helper that returns the exact set of URLs blocked by CSP during a test.
- Helper MUST use `page.on('console')` filtered to CSP violation reports AND `page.on('requestfailed')` correlated by URL.
- Helper MUST also use [Playwright's `page.cspErrorsAsync()`](https://playwright.dev/docs/api/class-page) (where available) for direct CSP violation enumeration.
- Tests MUST assert positive blocking: "after attempting to fetch X, exactly one CSP violation for X appears in the console."
- A negative-control test MUST verify: "tests using CSP bypass (`bypassCSP: true` browser context) confirm the URL would otherwise succeed." This proves the test infrastructure can distinguish "CSP blocked" from "URL is unreachable."

**Phase:** VERIFY (helper + test patterns)

**Confidence:** HIGH.

---

## Annoyance Pitfalls (ANNOYANCE severity)

### Pitfall 22: SharedArrayBuffer Requires Cross-Origin Isolation — Conflicts with Sandbox

**What goes wrong:** Per [MDN COOP/COEP](https://web.dev/articles/coop-coep) and [Stackblitz cross-browser COOP/COEP post](https://blog.stackblitz.com/posts/cross-browser-with-coop-coep/), SharedArrayBuffer requires the document to be cross-origin isolated (COOP same-origin + COEP require-corp). For a sandboxed iframe (`allow-scripts` only, no `allow-same-origin`), the iframe's origin is opaque/unique, and combining COOP/COEP with sandbox requires `allow="cross-origin-isolated"` on the iframe + matching COEP from the napplet's served HTML. This is achievable but brittle.

Audio/video are explicitly out of scope for v0.28.0, so SharedArrayBuffer (typically wanted for ffmpeg-wasm, audio worklets, etc.) is not blocking. But if a napplet author tries to use it, it'll silently degrade — no SharedArrayBuffer, just regular ArrayBuffer.

**Severity:** ANNOYANCE for v0.28.0; will become SERIOUS when audio/video lands.

**Prevention:**
- NIP-5D §Security amendment MAY note: "SharedArrayBuffer requires cross-origin isolation. Shells delivering napplet HTML in sandboxed iframes typically cannot satisfy COOP/COEP requirements; napplets requiring SharedArrayBuffer are not supported in v0.28.0. A future revision will address this when audio/video shipping requires WASM workers."
- Vite-plugin SHOULD detect SharedArrayBuffer references in napplet source and warn.

**Phase:** SPEC (note as out-of-scope), IMPL (lint warning)

**Confidence:** MEDIUM — depends on browser implementation evolution.

---

### Pitfall 23: Default CSP Misses `font-src` / `img-src blob:` → Fonts Don't Load

**What goes wrong:** Default `default-src 'none'` blocks everything. Adding only `script-src` and `connect-src` rules misses `font-src` (web fonts), `img-src` (images, including data: and blob:), `style-src` (CSS), `media-src` (audio/video — out of scope for v0.28.0). Napplet loads, scripts run, fetches succeed via resource broker, but `<img>` tags are blank because `img-src 'none'` blocks even blob: URLs the napplet creates.

**Severity:** ANNOYANCE (devs see broken images, file bugs, eventually figure it out).

**Prevention:**
- Vite-plugin's default CSP MUST be a complete, opinionated baseline:
  - `default-src 'none'`
  - `script-src 'self' 'nonce-...'`
  - `style-src 'self' 'unsafe-inline'` (or nonce-based; UnoCSS / inline `<style>` may need this)
  - `img-src 'self' blob: data:` (blob and data for resource-broker-delivered images)
  - `font-src 'self' blob: data:`
  - `connect-src 'none'`
  - `worker-src 'none'` (per Pitfall 4)
  - `frame-src 'none'`
  - `object-src 'none'`
  - `base-uri 'self'`
  - `form-action 'none'`
- Vite-plugin MUST allow napplets to extend (not relax) via opt-in additions, e.g. add a font CDN to `font-src`. MUST refuse to relax `connect-src` from `'none'`.
- Skill docs MUST include the baseline CSP and explain each directive.

**Phase:** IMPL (vite-plugin baseline), DOCS (CSP explanation skill)

**Confidence:** HIGH.

---

### Pitfall 24: MIME Sniffing Disagreement — Shell Says PNG, Browser Says HTML

**What goes wrong:** Shell fetches a "PNG" from a URL. Upstream sets `Content-Type: image/png` but the bytes are actually HTML (`<script>...`). Shell trusts the header and delivers as PNG MIME. Napplet creates `<img src="blob:url">`; browser sniffs the bytes, decides "this is HTML," and per `X-Content-Type-Options: nosniff` semantics may render as HTML in some contexts (if the napplet uses `<iframe srcdoc>` or similar).

Within the napplet's sandboxed iframe with strict CSP, the damage from a content-type confusion is limited (no scripts execute outside the napplet's nonce-allowlist), but the user gets a broken image AND the napplet may make decisions based on the wrong MIME.

**Severity:** ANNOYANCE for v0.28.0 (sandbox limits the damage); SERIOUS in environments where shell delivers bytes outside the iframe sandbox (e.g. download path).

**Prevention:**
- NUB-RESOURCE spec MUST specify: "Shells MUST byte-sniff resource content to determine MIME type; the upstream Content-Type header is a HINT, not authoritative. Shells MUST set `X-Content-Type-Options: nosniff` semantics on delivery (i.e. the delivered MIME is the shell's classified MIME, which the napplet MUST treat as authoritative)."
- NUB-RESOURCE spec MUST specify a MIME classification table: e.g. PNG/JPEG/WebP/AVIF/SVG → `image/*`; OGG/MP3/M4A → `audio/*` (out of scope, classify but reject); MP4/WebM → `video/*` (out of scope); HTML/JS/CSS → REJECT (untrusted active content); PDF → reject by default; everything else → `application/octet-stream` with napplet opt-in.
- Reference shim MUST use a battle-tested sniffer (e.g. file-type library) with explicit allowlist.

**Phase:** SPEC (sniffing rules), IMPL (sniffer)

**Confidence:** HIGH.

---

### Pitfall 25: Headless Chromium CSP Behavior Diverges from Headed in Edge Cases

**What goes wrong:** Per general Chromium issue patterns and various SO threads, headless Chromium has historically had subtle differences in how some CSP edge cases (especially mixed-content and frame embedding) report. Modern headless (Chromium 110+ "new headless") matches headed more closely, but rare divergences exist.

**Severity:** ANNOYANCE (occasional false-positive or false-negative in CI tests).

**Prevention:**
- Verification phase MUST run CSP-related tests in headed mode at least once per release (manual or scheduled CI job).
- Per [`AGENTS.md` headless requirements](#), Playwright tests run headless by default; the CSP test suite MUST be tagged `@csp` so it can be selectively run headed for verification.

**Phase:** VERIFY (test tagging + scheduled headed run)

**Confidence:** MEDIUM — historically a problem; mostly resolved.

---

### Pitfall 26: Data URL Scheme Has Subtle Quirks — Length Limits, MIME Encoding

**What goes wrong:** Napplet calls `resource.bytes("data:image/png;base64,iVBOR...")`. The `data:` scheme handler should return the decoded bytes synchronously. But:
- Some browsers cap data URL length (Chrome ~2MB, Safari historically lower). Shell-mediated decoding is unbounded if the shell does the decode.
- The MIME/charset of the data URL is napplet-supplied; if the shell trusts it, see Pitfall 24.
- Base64-vs-percent-encoded data URLs both exist; parser must handle both.
- Empty data URLs (`data:,`) are valid per RFC 2397 — shell must not crash.

**Severity:** ANNOYANCE.

**Prevention:**
- NUB-RESOURCE spec MUST specify: "The `data:` scheme handler decodes per RFC 2397, classifies the MIME via the same byte-sniffing rules as `https:` (Pitfall 24), and applies the same size cap (Pitfall 12)."
- Reference shim MUST use a tested data-URL parser, not regex.

**Phase:** SPEC (data: handler contract), IMPL (parser)

**Confidence:** HIGH.

---

### Pitfall 27: nostr: and blossom: Scheme Conventions Need Disambiguation

**What goes wrong:** "nostr: scheme" could mean: NIP-19 entity (`nostr:npub1...`, `nostr:nevent1...`), NIP-21 URI scheme, custom napplet-protocol URI, or something else. "blossom:" could be a hash, a hash + server hint, or a server-prefixed URL. The spec MUST define exactly what URL shape is accepted by each scheme handler.

If left ambiguous, two shells will implement different parsing → napplets break when moving between shells.

**Severity:** ANNOYANCE → SERIOUS if shells diverge.

**Prevention:**
- NUB-RESOURCE spec MUST define the exact accepted form for each scheme:
  - `nostr:` — accepts NIP-19 bech32 entities (npub, nprofile, nevent, naddr, note); resolves by querying relays via NUB-RELAY internally; returns the resolved bytes (e.g. profile picture URL → fetched bytes; event content → JSON bytes; etc.)
  - `blossom:` — accepts `blossom:<sha256-hash>` or `blossom:<server-hint>/<sha256-hash>` per the Blossom spec; shell resolves via known Blossom servers; returns bytes
  - `https:`/`http:` — standard URL; `http:` MAY be rejected by default, MUST be opt-in by shell policy
  - `data:` — standard RFC 2397; bounded per Pitfall 26
- NUB-RESOURCE spec MUST specify error envelope for unsupported scheme: `{ denied: 'scheme-not-supported', scheme: 'gopher' }`.
- NUB-RESOURCE spec MUST specify that shell.supports('resource:nostr'), shell.supports('resource:blossom'), etc. are the capability strings napplets check at runtime.

**Phase:** SPEC (scheme handler contracts), IMPL (per-scheme handler), VERIFY (scheme-dispatch tests)

**Confidence:** HIGH.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Allow `connect-src https:` "until napplets migrate" | Fast rollout, no breakage | Defeats the entire milestone — browser-enforced isolation is no longer enforced | NEVER — this is the core property being shipped |
| Skip MIME sniffing, trust upstream Content-Type | Less code | Content-type confusion attacks; broken image rendering | NEVER — sniff or reject |
| Allow `<foreignObject>` in SVG without rasterization "because most SVG is benign" | Fewer rejected SVGs | XHTML/script injection via SVG | NEVER — rasterize or sanitize, no exceptions |
| Cache resource bytes content-addressed by SHA-1 or MD5 "for performance" | Marginally smaller hashes | Theoretical collision; failed audits; future-proof failure | NEVER — SHA-256 minimum |
| Pre-fetch all URLs in events as default sidecar policy | Snappy timeline UX | Privacy fingerprinting via avatar host requests | NEVER as default; document opt-in clearly |
| Inline `'unsafe-inline'` for styles in CSP | Zero CSS migration cost | All `<style>` tags allowed including injected ones | Acceptable if `style-src` is the ONLY laxity; combined with strict `script-src` and `connect-src 'none'` the practical attack surface is small |
| Allow `'unsafe-eval'` because Vite needed it once | Build works | Defeats CSP almost entirely; future eval-based payloads land | NEVER — switch tooling if needed |
| Skip per-redirect re-validation "because the first hop was clean" | Simpler fetch code | Open-redirect → SSRF chain | NEVER — every hop is a fresh policy decision |
| Don't dedupe concurrent `resource.bytes()` calls "because the cache will catch it" | Less infrastructure | First-request thundering herd; rate-limit trips at upstream | NEVER — single-flight is cheap |
| Backwards-compat fallback: napplet can call `fetch()` if `resource.bytes` returns undefined | Smooth migration | The ONE thing this milestone exists to prevent | NEVER — hard break per project policy |
| Hide CSP violation warnings in dev "to reduce noise" | Cleaner console | Devs ship napplets with CSP violations and discover in production | NEVER — make them louder, not quieter |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| Vite-plugin → emitted HTML | Place CSP meta wherever the `index.html` author put it | Force as first child of `<head>` via plugin order + post-emit assertion (Pitfall 1) |
| Vite-plugin → directive set | Include `frame-ancestors`, `report-uri` in meta CSP | Reject those directives at build time with a header-required error (Pitfall 2) |
| Reference shim → iframe creation | Use srcdoc for napplet HTML | Use blob URL or separate origin to avoid parent CSP inheritance (Pitfall 3) |
| Reference shim → iframe sandbox | Add `allow-same-origin` "to make storage work" | Storage is shell-mediated per NIP-5D; sandbox MUST be `allow-scripts` only (Pitfall 5) |
| Reference shim → fetch library | Use default Node `fetch`/axios/got with no IP filter | DNS-pin + IP block + redirect re-validation; libraries default-accept private IPs (Pitfall 6) |
| Reference shim → SVG handler | Pass SVG bytes through as `image/svg+xml` Blob | Rasterize to PNG/WebP in sandboxed worker; reject billion-laughs / `<foreignObject>` (Pitfall 7) |
| Public NUB-RESOURCE PR → Implementations section | List `@napplet/nub/resource` | Leave `(none yet)` per `feedback_no_implementations` |
| Cross-repo coordination | Land NUB-RESOURCE in nubs repo first; implement later | Land both in lock-step; gate milestone close on both being ready (Pitfall 8) |
| Sidecar field on `relay.event` | Always include sidecar by default | Opt-in per shell policy; default off (Pitfall 10) |
| Resource cache | Share across all napplets | Scope per `(dTag, aggregateHash)`; cross-scope poisoning is a privacy leak (Pitfalls 10, 14) |
| Blob delivery | Always use Transferable | Choose Transferable above 256KB threshold; structured-clone smaller payloads to keep cache (Pitfall 12) |
| MIME classification | Trust upstream `Content-Type` | Byte-sniff with explicit allowlist; reject HTML/JS bytes (Pitfall 24) |
| `nostr:` scheme | Each shell parses the URL its own way | Lock parsing to NIP-19 bech32 entities in spec (Pitfall 27) |
| Playwright CSP test | `await expect(img).toBeVisible()` | Listen on console + requestfailed; assert specific CSP violation appeared (Pitfall 21) |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Cache stampede on viral avatar | 100s of duplicate upstream requests | Single-flight Map<canonicalURL, Promise<Blob>> | Any timeline-style napplet with shared authors |
| Blob lifetime leak | Memory grows over session, never frees | Napplet revokeObjectURL discipline + shell quota + LRU eviction | Long-session napplets with many resource calls |
| Structured clone of multi-MB Blobs | UI jank on every resource delivery | Transferable above 256KB; size cap at 10MB | Anything larger than thumbnails; will become acute when audio/video lands |
| Sidecar pre-fetch flood | Shell makes hundreds of upstream requests on relay event arrival | Default sidecar OFF; opt-in per shell + per kind allowlist | Any active relay subscription |
| SVG rasterizer DoS (billion laughs) | Worker pegs CPU, OOMs page | Input size cap (5MB) + rasterizer time budget (2s) + entity expansion guard | Any user-supplied SVG; profile pictures from arbitrary npubs |
| Redirect chain abuse | Shell follows long redirect chains, fetch budget exhausted | Cap redirects at 5; per-hop policy re-validation | Adversarial upstreams |
| `fetch` library default DNS resolver | Hits internal DNS, can be rebound | Explicit external resolver + DNS pinning to first resolved IP | Any cloud-deployed shell with internal DNS access |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Allow `connect-src` to anything in production CSP | Defeats browser-enforced isolation | Hard-coded `connect-src 'none'` in default; vite-plugin assertion (Pitfall 9) |
| `allow-same-origin` on iframe sandbox | Service worker bypass + same-origin escape | Defensive throw in shim; spec MUST in NIP-5D (Pitfall 5) |
| Default `fetch` for `resource.bytes` upstream | SSRF to cloud metadata, internal services, loopback | DNS-pin + IP block + scheme allowlist + redirect re-validation (Pitfall 6) |
| Trust napplet-supplied `nostr:` parsing | Malformed bech32 → parser crash; injection via path | Use canonical NIP-19 parser with strict validation (Pitfall 27) |
| Pass-through upstream `Content-Type` | MIME confusion → wrong renderer path | Byte-sniff + classify (Pitfall 24) |
| Pass-through upstream Set-Cookie / Authorization | Shell leaks credentials to napplet or vice versa | Strip all upstream headers except classified MIME + content length (Pitfall 16) |
| Allow CRLF in URL components | Header injection / request smuggling | WHATWG URL parser; reject control chars in URL components (Pitfall 16) |
| Render SVG via `<img src=blob:svg>` without sanitization | `<foreignObject>` XHTML injection (browser-dependent) | Rasterize to bitmap or strip `<foreignObject>` (Pitfall 7) |
| Use SHA-1 / MD5 / truncated hash for content addressing | Theoretical collision, audit failure | SHA-256 minimum (Pitfall 14) |
| Expose cache hit/miss to napplet | Side-channel: napplet can probe what other users / napplets viewed | Cache is shell-internal; napplet sees only Blob or error (Pitfall 14) |
| Sidecar on by default | Privacy leak: shell pre-fetches reveal user activity | Opt-in per shell + per event kind (Pitfall 10) |
| Allow `worker-src` by default | Workers from blob URLs inherit creator CSP; subtle bypass | `worker-src 'none'` default; opt-in via manifest (Pitfall 4) |
| Allow `eval`, `unsafe-eval`, `unsafe-inline` for scripts | CSP becomes decorative | Nonce-based `script-src`; never `'unsafe-eval'` (Pitfall 19) |
| Header-only directives in meta CSP | Silently ignored — false sense of security | Build-time validator rejects header-only in meta (Pitfall 2) |

---

## UX Pitfalls (flagged as IMPL/DOCS concern; MUST NOT inflate spec)

| Pitfall | User Impact | Shell-Side Mitigation (non-normative) |
|---|---|---|
| Image flickers as sidecar arrives mid-render | Layout jank | Reserve image space; prefer sidecar; show low-res placeholder |
| First-render delay because resource not yet fetched | Empty avatars on cold load | Persistent shell-side cache survives reload |
| User edits profile avatar; old version cached | Stale UX | Honor `Cache-Control` headers; provide shell "clear cache" |
| Napplet rate-limited mid-session | Suddenly broken images | Surface rate-limit state to napplet via error envelope; SDK shows retry-after info |
| SVG rasterization slow on first use | Settings page hangs briefly | Pre-warm common rasterizations; surface progress |
| Shell-policy denies a URL napplet author thinks is fine | Confused dev experience | Clear `denied` reason in error envelope; vite-plugin lints common offenders at build |

These are documented to guide shell authors but MUST NOT appear as MUST-level requirements in NUB-RESOURCE.

---

## "Looks Done But Isn't" Checklist

- [ ] **Meta CSP placement:** First child of `<head>`? Verify with HTML walker assertion in vite-plugin and a Playwright DOM-walk test (Pitfall 1)
- [ ] **Header-only directives:** Vite-plugin rejects `frame-ancestors`, `report-uri`, etc. in meta CSP at build time? (Pitfall 2)
- [ ] **srcdoc avoidance:** Reference shim uses blob URL or separate origin for napplet HTML? Spec note in NIP-5D? (Pitfall 3)
- [ ] **`worker-src 'none'` default:** Vite-plugin emits this; opt-in for napplets that need workers? (Pitfall 4)
- [ ] **Sandbox `allow-scripts` only:** Reference shim defensively throws on `allow-same-origin`? (Pitfall 5)
- [ ] **SSRF defaults:** Private IP block + DNS pinning + scheme allowlist + redirect cap implemented in reference shim, documented in NUB-RESOURCE Security Considerations? (Pitfall 6)
- [ ] **SVG handling:** Rasterizer in sandboxed Worker; entity-expansion / `<foreignObject>` / recursive `<use>` all rejected; size + time caps? (Pitfall 7)
- [ ] **Cross-repo sync:** NUB-RESOURCE PR + NUB-RELAY/IDENTITY/MEDIA amendments + NIP-5D §Security all landed in lock-step; CI drift check? (Pitfall 8)
- [ ] **No backcompat:** No `@deprecated` annotations; no fallback `fetch` path; no CSP opt-out? (Pitfall 9)
- [ ] **Sidecar default off:** Reference shim defaults to no sidecar pre-fetch; explicit opt-in flag? (Pitfall 10)
- [ ] **Blob lifetime:** SDK helper provides cleanup pattern; shell quota documented? (Pitfall 11)
- [ ] **Transferable thresholds:** Size-based delivery choice; 10MB hard cap; perf test? (Pitfall 12)
- [ ] **Single-flight cache:** 100-concurrent-same-URL test confirms 1 upstream request? (Pitfall 13)
- [ ] **Hash internals:** Hash values never appear in wire envelopes; SHA-256 minimum; documented? (Pitfall 14)
- [ ] **Sidecar in same envelope:** No follow-up `resource.preresolved` message; sidecar always in original `relay.event`? (Pitfall 15)
- [ ] **URL validation:** WHATWG parser; CRLF/NUL rejection; per-hop redirect re-validation? (Pitfalls 16, 17)
- [ ] **Two-mode CSP:** Vite-plugin emits dev CSP (HMR-permissive) and prod CSP (strict); build-time assertion that prod doesn't inherit dev laxity? (Pitfall 18)
- [ ] **Nonce-based scripts:** No `'unsafe-eval'` ever; no `'unsafe-inline'` for scripts; nonce wired through Vite? (Pitfall 19)
- [ ] **fetch lint:** Lint rule detects `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource` in napplet source? (Pitfall 20)
- [ ] **CSP violation tests:** Tests assert positive blocking via console + requestfailed correlation, not just "image isn't visible"? (Pitfall 21)
- [ ] **Default CSP completeness:** All directives covered in baseline (img-src, font-src, style-src, etc.)? (Pitfall 23)
- [ ] **MIME byte-sniffing:** Sniffer rejects HTML/JS bytes; allowlist of acceptable MIME types? (Pitfall 24)
- [ ] **Headed-mode CSP test run:** At least one CI job runs CSP tests headed for verification? (Pitfall 25)
- [ ] **data: handler:** RFC 2397 conformant; bounded by size cap? (Pitfall 26)
- [ ] **Scheme handler contracts:** `nostr:`, `blossom:`, `https:`, `data:` handler URL forms locked in spec; capability strings defined? (Pitfall 27)
- [ ] **`Implementations: (none yet)`:** Public NUB-RESOURCE spec body has zero `@napplet/*` references; PR body has zero PRIVATE-repo links? (Pitfall 8 + memory compliance)
- [ ] **No `frame-ancestors` in meta:** Build-time assertion or grep over emitted CSP? (Pitfall 2)
- [ ] **Headless ≠ headed verification:** CSP tests pass in BOTH modes? (Pitfall 25)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Meta CSP placed wrong, shipped napplets unenforced | HIGH | Rebuild napplets via vite-plugin update; bump aggregateHash; warn shell users; run audit on existing napplets |
| `frame-ancestors` in meta, didn't apply | MEDIUM | Switch to header-based delivery for that directive; if not possible, remove directive and document the gap |
| srcdoc CSP inheritance broke isolation | HIGH | Switch to blob URL delivery; rebuild all napplets; bump milestone version |
| `allow-same-origin` slipped into iframe sandbox | HIGH | Remove immediately; security advisory; audit deployed shells |
| SSRF via missing IP filter | HIGH | Emergency shell update; revoke any cloud creds that may have leaked; audit logs for `169.254.169.254` access |
| SVG bomb shipped without rasterization | HIGH | Disable SVG MIME in scheme dispatcher until rasterizer ships; emergency vite-plugin lint |
| Cross-repo drift discovered late | MEDIUM | Amend public spec PR; re-run drift CI; coordinate merge order |
| Backcompat fallback shipped | HIGH | Hard remove; document protocol break; ship vite-plugin update that fails build on legacy patterns |
| Sidecar default-on revealed user activity to upstream hosts | MEDIUM | Default-off in next release; ship migration warning; consider it a privacy incident if data was correlatable |
| Blob lifetime leak in long sessions | MEDIUM | Ship shell quota enforcement; SDK helpers for revoke discipline; profile + fix worst napplets |
| Cache stampede observed in production | LOW | Ship single-flight in shell; no protocol change required |
| Hash collision (theoretical, but if MD5/SHA-1 ever shipped) | HIGH | Re-cache with SHA-256; invalidate all entries; bump format version |
| `unsafe-eval` shipped in default CSP | HIGH | Remove from default; switch tooling if needed; rebuild affected napplets |
| Playwright tests passed without verifying CSP blocking | MEDIUM | Rewrite tests with positive blocking assertions; re-run; address any new failures (these are real bugs) |
| `@napplet/*` mention shipped in public spec | MEDIUM | Cannot remove from git history cleanly; amend future commits; note as errata in PR; ensure CI grep prevents recurrence |

---

## Pitfall-to-Phase Mapping

| Pitfall | Severity | Phase | Verification |
|---|---|---|---|
| P1 — Meta CSP placement | PROJECT-KILLER | IMPL (vite-plugin) + VERIFY | Playwright DOM-walk asserts meta is first `<head>` child + zero CSP violations on hello-world napplet |
| P2 — Header-only directives in meta | PROJECT-KILLER | SPEC + IMPL | Vite-plugin rejects offending directives at build; integration test |
| P3 — srcdoc CSP inheritance | PROJECT-KILLER | SPEC (NIP-5D §Security note) + IMPL (shim uses blob URL) | Shim integration test; spec text reviewed |
| P4 — Worker blob CSP inheritance + minimum CSP allowances | PROJECT-KILLER | SPEC (NUB-RESOURCE blob delivery + minimum CSP) + IMPL (vite-plugin defaults) + VERIFY | Worker-creation-blocked test |
| P5 — `allow-same-origin` + service worker bypass | PROJECT-KILLER | SPEC (NIP-5D MUST NOT) + IMPL (defensive throw) + VERIFY | SW non-interception test |
| P6 — SSRF / cloud metadata / DNS rebind | PROJECT-KILLER | SPEC (NUB-RESOURCE Security MUST list) + IMPL (defaults) + VERIFY | Test each blocked range; DNS-pin test |
| P7 — SVG `<foreignObject>` + bombs | PROJECT-KILLER | SPEC (rasterize/sanitize MUST) + IMPL (sandboxed rasterizer) + VERIFY | Billion-laughs test, foreignObject test, recursive `<use>` test |
| P8 — Cross-repo spec drift | PROJECT-KILLER | SPEC (cross-repo coordination) + IMPL (CI drift check) | CI grep + lock-step PR merge gate |
| P9 — Backcompat patterns sneaking in | PROJECT-KILLER | SPEC + IMPL + DOCS | Code review checklist; vite-plugin no-CSP-relaxation guard; REQUIREMENTS.md no-backcompat section |
| P10 — Sidecar privacy leak | PROJECT-KILLER (if default-on) / SERIOUS (if opt-in) | SPEC (NUB-RELAY opt-in MUST) + IMPL (default off) | Default behavior test; opt-in flag test |
| P11 — Blob lifetime | SERIOUS | SPEC (lifetime contract) + IMPL (SDK helper + shell quota) | Long-session memory test |
| P12 — postMessage clone perf | SERIOUS | SPEC (size cap + transport guidance) + IMPL (size-based transport) + VERIFY | Perf test for 5MB delivery <50ms |
| P13 — Cache stampede | SERIOUS | SPEC (single-flight contract) + IMPL (Map dedup) + VERIFY | 100-concurrent-same-URL test |
| P14 — Cache invalidation + hash internals | SERIOUS | SPEC (cache semantics + algorithm requirements) + IMPL (HTTP cache + SHA-256) | HTTP cache header test; hash exposure grep |
| P15 — Sidecar race | SERIOUS | SPEC (single-envelope MUST) + IMPL (SDK wrapper) | Race-condition test |
| P16 — CRLF / header injection | SERIOUS | SPEC (URL validation MUST) + IMPL (WHATWG URL) | Control-char-in-URL test |
| P17 — Open redirect | SERIOUS | SPEC (per-hop revalidation MUST) + IMPL (custom fetch) + VERIFY | Redirect-to-private-IP and redirect-loop tests |
| P18 — Vite HMR vs CSP | SERIOUS | IMPL (two-mode CSP) + DOCS | Build asserts dev CSP doesn't leak to prod |
| P19 — Vite inline scripts need nonces | SERIOUS | IMPL (vite-plugin nonce setup) + VERIFY | Zero-CSP-violation test on built napplet |
| P20 — Source maps + dynamic import + lint | SERIOUS | IMPL (vite-plugin defaults + lint) + DOCS | Lint detects fetch usage |
| P21 — Playwright auto-wait masks CSP block | SERIOUS | VERIFY (test patterns) | Helper enforced via lint or pattern review |
| P22 — SharedArrayBuffer / COOP-COEP | ANNOYANCE (until A/V lands) | SPEC (out-of-scope note) + IMPL (lint warning) | Lint warning test |
| P23 — Default CSP misses directives | ANNOYANCE | IMPL (complete baseline) + DOCS | Hello-world image-rendering test |
| P24 — MIME sniffing disagreement | ANNOYANCE → SERIOUS | SPEC (sniffing rules) + IMPL (battle-tested sniffer) | HTML-bytes-as-PNG test |
| P25 — Headless ≠ headed | ANNOYANCE | VERIFY (tagged tests, headed CI run) | Both-mode CI green |
| P26 — Data URL quirks | ANNOYANCE | SPEC (data: handler contract) + IMPL (RFC 2397 parser) | Edge-case data URL tests |
| P27 — Scheme conventions | ANNOYANCE → SERIOUS | SPEC (per-scheme contracts + capability strings) + IMPL (handlers) + VERIFY | Per-scheme dispatch test |

---

## Sources

### CSP Delivery and Inheritance
- [W3C Content Security Policy Level 3](https://www.w3.org/TR/CSP3/) — header-only directive list (`frame-ancestors`, `sandbox`, `report-uri`, `report-to`)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) — meta vs header behavior; worker blob CSP inheritance
- [csplite test240 — meta CSP placement requirements](https://csplite.com/csp/test240/) — confirms meta CSP only applies to elements parsed after it
- [Simon Willison — Can JavaScript Escape a CSP Meta Tag Inside an Iframe? (April 2026)](https://simonwillison.net/2026/Apr/3/test-csp-iframe-escape/) — recent confirmation that sandboxed-iframe CSP cannot be removed by inline JS
- [W3C webappsec-csp issue #700 — srcdoc inherits parent CSP, wontfix](https://github.com/w3c/webappsec-csp/issues/700) — confirms srcdoc-iframe CSP inheritance limitation
- [Mozilla bug 1073952 / CVE-2017-7788 — srcdoc + sandbox CSP bypass](https://bugzilla.mozilla.org/show_bug.cgi?id=1073952) — historical precedent for srcdoc bypass
- [Chromium issue 486308 — Service Worker bypasses iframe sandbox](https://bugs.chromium.org/p/chromium/issues/detail?id=486308) — service worker can intercept sandboxed-iframe with `allow-same-origin`
- [w3c/ServiceWorker issue 1390 — sandbox + SW compatibility](https://github.com/w3c/ServiceWorker/issues/1390) — confirms incompatibility unless `allow-same-origin`

### Blob and Resource Lifecycle
- [MDN: URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) — lifecycle, revoke discipline, memory leak conditions
- [MDN: URL.revokeObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static) — proper cleanup pattern
- [Bugzilla 939510 — revokeObjectURL doesn't free download blobs](https://bugzilla.mozilla.org/show_bug.cgi?id=939510) — edge case
- [MDN: Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) — Transferable list, Blob is structured-cloneable but not Transferable
- [Surma — Is postMessage slow?](https://surma.dev/things/is-postmessage-slow/) — empirical perf characteristics

### Cross-Origin Isolation
- [web.dev — COOP and COEP](https://web.dev/articles/coop-coep) — SharedArrayBuffer requirements
- [Stackblitz — Cross-Browser support with COOP/COEP](https://blog.stackblitz.com/posts/cross-browser-with-coop-coep/) — sandbox + COEP brittleness

### SSRF and Network
- [Yunus Aydın — SSRF DNS Rebinding (March 2026)](https://aydinnyunus.github.io/2026/03/14/ssrf-dns-rebinding-vulnerability/) — recent rebinding attack patterns
- [Behrad Taher — DNS Rebinding Attacks Against SSRF Protections](https://behradtaher.dev/DNS-Rebinding-Attacks-Against-SSRF-Protections/) — DNS-pinning mitigation
- [Wiz — Server-Side Request Forgery overview](https://www.wiz.io/academy/application-security/server-side-request-forgery) — cloud metadata, IMDSv2 token flow
- [Stytch — Securing Identity APIs Against SSRF](https://stytch.com/blog/securing-identity-apis-against-ssrf/) — DNS pinning via IP-substitution
- [Axios CRLF / cloud metadata header injection advisory (GHSA-fvcv-3m26-pcqx)](https://github.com/axios/axios/security/advisories/GHSA-fvcv-3m26-pcqx) — CRLF in URL fetch
- [Node undici CRLF fix commit](https://github.com/nodejs/undici/commit/e43e898603dd5e0c14a75b08b83257598d664a39) — upgrade-header CRLF validation
- [HackerOne report 2001873 — Node.js HTTP Request Smuggling](https://hackerone.com/reports/2001873) — Node-level smuggling

### SVG Attack Surface
- [Fortinet — Anatomy of SVG Attack Surface on the Web](https://www.fortinet.com/blog/threat-research/scalable-vector-graphics-attack-surface-anatomy) — `<foreignObject>`, `<use>` recursion, attack patterns
- [SVGO billion laughs CVE-2026-29074](https://github.com/advisories/GHSA-xpqw-6gx7-v673) — entity expansion DoS in svgo
- [Mozilla CVE-2022-28284 — SVG `<foreignObject>` XSS](https://bugzilla.mozilla.org/show_bug.cgi?id=1754522) — historical SVG XSS via foreignObject
- [PacketWanderer — Stored XSS Through Malicious SVG Uploads](https://packetwanderer.com/posts/svg-xss/) — sanitization guidance
- [MDN: Canvas using images — drawImage SVG behavior](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images) — SVG rendering boundary; canvas tainting

### Vite + CSP
- [vite issue #11862 — strict CSP in dev](https://github.com/vitejs/vite/issues/11862) — HMR connect-src conflict
- [vite issue #15404 — script-src unsafe-inline requirement](https://github.com/vitejs/vite/issues/15404) — inline script issue
- [vite issue #9719 — nonce in __vitePreload](https://github.com/vitejs/vite/issues/9719) — nonce wiring
- [vite issue #16749 — strict CSP in production](https://github.com/vitejs/vite/issues/16749) — prod-mode tighter policies
- [vite-csp guard SPA guide](https://vite-csp.tsotne.co.uk/guides/spa) — community CSP integration patterns

### ReDoS and Validation (referenced from prior research; relevant for resource policy regex matchers)
- [CVE-2025-69873 — ajv ReDoS via pattern keyword](https://security.snyk.io/vuln/SNYK-JS-AJV-15274295) — risk if shell uses regex on URL allowlists
- [Ajv security considerations](https://ajv.js.org/security.html) — linear-time engine recommendation

### Cache Coalescing
- [Cache stampede prevention with single-flight](https://1xapi.com/blog/nodejs-cache-stampede-single-flight-pattern-2026) — Promise-Map dedup pattern
- [Wikipedia: Cache stampede](https://en.wikipedia.org/wiki/Cache_stampede) — definition + standard mitigations
- [GroupCache singleflight](https://deepwiki.com/golang/groupcache/4.1-thundering-herd-protection) — reference implementation

### Playwright + CSP
- [Playwright Network](https://playwright.dev/docs/network) — request/requestfailed events
- [Playwright ConsoleMessage](https://playwright.dev/docs/api/class-consolemessage) — console capture for CSP violations
- [LambdaTest — Playwright AssertCSPError example](https://www.lambdatest.com/automation-testing-advisor/csharp/methods/Microsoft.Playwright.Tests.TestUtils.AssertCSPError) — pattern reference

### Internal NIP-5D / Napplet Context (PRIVATE — NOT cited in any public NUB spec)
- `.planning/PROJECT.md` — v0.28.0 milestone scope; explicit no-backcompat stance; sidecar/SVG/policy goals
- `specs/NIP-5D.md` v3 — current §Transport (`allow-scripts` only), §Identity (MessageEvent.source binding), §Security Considerations
- `.planning/research/PITFALLS.md` (prior, NUB-CONFIG) — patterns reused for: scope classification, public-repo discipline, error envelope catalog, openSettings/focus-stealing analogue (sidecar-as-request)

### Internal Memory (constraint set)
- `feedback_nub_scope_boundary` — drives every SPEC-vs-IMPL-vs-DOCS classification above
- `feedback_no_implementations` — drives Pitfall 8 + Implementations: (none yet) requirement
- `feedback_no_private_refs_commits` — drives Pitfall 8 commit/PR discipline
- `feedback_nub_modular` — confirms NUB-RESOURCE package owns ALL logic; shim/sdk are plugin hosts

---

*Pitfalls research for: v0.28.0 Browser-Enforced Resource Isolation*
*Researched: 2026-04-20*

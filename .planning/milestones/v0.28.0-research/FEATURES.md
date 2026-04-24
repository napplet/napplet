# Feature Research — v0.29.0 NUB-CONNECT + Shell as CSP Authority

**Domain:** Napplet protocol SDK — sandboxed Nostr mini-app iframes delegating network capabilities to a host shell via NIP-5D JSON envelopes + NIP-5A manifests. This milestone adds a new NUB (`connect`) for user-gated direct `fetch`/`WebSocket`/`SSE` access to pre-declared origins, and shifts CSP emission from build-time (strict-CSP meta-tag) to runtime (shell-emitted HTTP header) for every napplet.
**Researched:** 2026-04-21
**Confidence:** HIGH — design doc is authoritative and committed (`9f77c29`); every feature below is traceable to a specific passage in `docs/superpowers/specs/2026-04-21-napplet-network-permission-design.md`.

## Scope Summary

v0.29.0 is a **subtractive + additive** milestone across seven categories:

1. **NUB-CONNECT spec** (in `napplet/nubs` public repo, new file)
2. **NIP-5D amendment** (delegate class taxonomy to NUBs track)
3. **`@napplet/nub/connect` subpath** (new subpath inside the consolidated `@napplet/nub`)
4. **`@napplet/vite-plugin` changes** (subtractive: drop strict-CSP production path; additive: `connect?: string[]` option + origin normalization + aggregateHash fold + manifest tag emission + discovery meta + fail-loud inline-script diagnostic)
5. **Central `@napplet/shim` + `@napplet/sdk` integration** (mount `window.napplet.connect`, wire `shell.supports('nub:connect')`)
6. **`specs/SHELL-CONNECT-POLICY.md`** (shell-deployer checklist parallel to `SHELL-RESOURCE-POLICY.md`)
7. **Documentation sweep** (4 package READMEs + root README + `skills/build-napplet/SKILL.md`)

No demo work (deferred to downstream shell repo, Option B pattern inherited from v0.28.0).

---

## 1. NUB-CONNECT Spec (`napplet/nubs` public repo)

### Table Stakes (MUST ship in spec)

| Feature | Why Expected | Complexity | Notes / Source passage |
|---------|--------------|------------|------------------------|
| Motivation section (gap between NUB-RESOURCE and nothing) | Readers need to understand why a second fetch NUB exists | S | Design doc "Motivation" §1 |
| Non-Goals section (6 explicit exclusions) | Prevent scope creep in v2 discussions | S | Design doc "Non-Goals" §2 |
| Architecture Overview (3 moving parts: manifest / shell CSP / runtime discovery) | Readers need the mental model up front | S | Design doc "Architecture Overview" §3 |
| Class 1 / Class 2 taxonomy | Foundational concept threaded through every other section | S | Design doc "Napplet Classes" §4; class is determined solely by presence of `connect` tags — no opt-in flag |
| Responsibility Split table (author / shell / vite-plugin) | Implementers need to know who owns what | S | Design doc "Responsibility Split" §5 |
| `["connect", "<origin>"]` manifest tag shape (one tag per origin) | Wire-level contract | S | Design doc "Manifest Tag Shape" §6 |
| Origin-format rules: scheme whitelist (https/wss/http/ws), no wildcards, Punycode IDN, lowercase host, no default ports, no path/query/fragment | Unambiguous author guidance + shell validation contract | M | Design doc "Origin Format (strict)" §6; CSP origin-match is scheme+host+port only |
| Shell-side validation at manifest-load time | Refuse malformed manifests with a diagnostic | S | Design doc "Validation" §6 |
| Cleartext (http/ws) marked "permitted but warned" + operator-policy escape hatch | Many local-dev scenarios; must be honest about confidentiality loss | S | Design doc "Validation" §6 + "Security Considerations → Cleartext confidentiality" §10 |
| `connect` tags MUST participate in aggregateHash via synthetic entry | Load-bearing: prevents silent origin additions post-approval | M | Design doc "Content-Addressing Consequences" §6; matches `config:schema` precedent at vite-plugin/src/index.ts:568 |
| Runtime Discovery API: `window.napplet.connect.{granted: boolean, origins: readonly string[]}` | Napplet-side API surface | S | Design doc "Runtime Discovery API" §7 |
| **No wire protocol** — explicitly stated | NUB-CONNECT has zero postMessage types; readers need to hear this loudly or they'll look for one | S | Design doc "Architecture Overview" §3 + "Non-Goals" §2 last bullet |
| Shell consent flow 6-step sequence | Normative shell behavior on every iframe load | M | Design doc "Shell Consent Flow" §8 |
| Prompt requirements (napplet name + dTag + origin list + cleartext warning + trust language + Approve/Deny buttons) | UX floor for any conformant shell | M | Design doc "Prompt Requirements" §8 |
| Grant persistence keyed on `(dTag, aggregateHash)` | Rebuild → new hash → re-prompt; content-addressed identity | S | Design doc "Prompt Requirements" §8 persistence clause |
| Re-prompt on origin change with diff UI ("previously approved X; now requesting Y") | Transparent version migration | M | Design doc "Re-prompt on Origin Change" §8 |
| Revocation UI (MUST expose) + DENIED state retention (not deletion) so re-approve is offerable | Users need a way out of a grant they regret | M | Design doc "Revocation" §8 |
| Shell-emitted 10-directive baseline CSP with `connect-src` as sole variable | Authoritative wire-level CSP contract | M | Design doc "Shell-Emitted CSP (Authoritative)" §9; identical baseline to v0.28.0 minus nonce |
| Edge Case 1: residual meta CSP on legacy napplets → shell MUST scan Class-2 napplet HTML and refuse with diagnostic | CSP intersection would silently suppress granted origins | M | Design doc "Edge Case 1" §10.1 |
| Edge Case 2: port/IDN normalization contract | Prevents origin-string mismatches that look equivalent but aren't CSP-equal | S | Design doc "Edge Case 2" §10.2 |
| Edge Case 3: no subdomain implicit match | Users must hear that `example.com` does NOT cover `api.example.com` | S | Design doc "Edge Case 3" §10.3 |
| Edge Case 4: `fetch()` against non-granted URL → browser CSP violation, shell has no visibility | Author guidance for degradation | S | Design doc "Edge Case 4" §10.4 |
| Edge Case 5: NUB-CONNECT vs NUB-RELAY distinction (relay URL in `connect` tag is direct socket, bypasses NUB-RELAY event-level ACL) | Subtle; MUST be explicit | S | Design doc "Edge Case 5" §10.5 |
| Edge Case 6: mixed-content rule (https shell cannot fetch http) + localhost/loopback secure-context exception | Operator sanity | S | Design doc "Edge Case 6" §10.6 |
| Security Considerations: posture-vs-NUB-RESOURCE comparison table (8 rows) | Readers must see how much weaker NUB-CONNECT is vs the shell-proxied path | M | Design doc "Posture vs. NUB-RESOURCE" §11.1; 8 rows: Model / Methods / Streaming / Shell-visibility / Origin-scope / Private-IP-block / User-grant / Attack-surface |
| "Default to NUB-RESOURCE; reach for NUB-CONNECT only when you need POST/WS/SSE/custom-headers/streaming" prose | Architectural north-star for napplet authors | S | Design doc "Posture vs. NUB-RESOURCE" §11.1 closing paragraph |
| Grant-bypass attempt analysis (meta CSP cannot loosen header CSP; browser intersection is authoritative) | Explain why the design is safe even if napplets try to cheat | S | Design doc "Grant-bypass attempts" §11.3 |
| Sandbox preservation note (opaque-origin invariant unaffected by connect grants) | Prevents confusion that grants might relax sandbox | S | Design doc "Sandbox preservation" §11.4 |
| Post-grant opacity statement ("shell has zero visibility once approved") | Fundamental tradeoff; must not be hidden | S | Design doc "Post-grant opacity (the fundamental tradeoff)" §11.5 |
| Capability advertisement: `shell.supports('nub:connect')` primary + `shell.supports('connect:scheme:http')` + `shell.supports('connect:scheme:ws')` secondary | Runtime discovery contract | S | Design doc "Capability Advertisement" §12 |
| `perm:strict-csp` superseded-not-removed note | Back-compat clause — napplets checking it still work | S | Design doc "Superseded: perm:strict-csp" §12.1 |
| Graceful Degradation 4-state priority ladder (granted / denied-but-RESOURCE / denied-and-no-RESOURCE / no-NUB-CONNECT) | Author guidance for runtime branching | S | Design doc "Graceful Degradation (Napplet Author Guidance)" §13 |
| Test vectors for origin normalization (accept, reject, normalize cases) | Unambiguous interop | M | Design doc "Testing Posture" §15 — unit tests for tag parsing / origin normalization / cleartext / IDN / default ports |
| Test vectors for integration flows (granted / denied / aggregateHash-change / origin-list-change-but-dist-unchanged / Class-2-meta-CSP-scan / Class-1-meta-CSP-harmless / cleartext-UX / diff-UX) | Reference test matrix | M | Design doc "Testing Posture" §15 |
| Deferred-to-v2 section (partial grants, wildcards, quota, per-request audit) | Manage expectations | S | Design doc "Deferred to v2" §16 |

### Differentiators (SHOULD ship)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Explicit statement that shell MUST be the HTTP responder for napplet HTML | Load-bearing precondition — deployers who can't control response headers cannot implement NUB-CONNECT | S | Design doc "Shell (runtime)" §5; acceptable delivery mechanisms listed (direct serve / HTTP proxy / `blob:` URL / `srcdoc` on iframe). Open question §17 leans "NUB-CONNECT prose, not NIP-5D amendment" — research confirms this placement |
| Inline-script build diagnostic guidance as hard-error (not warning) | Fail-loud aligns with "shell CSP will reject it anyway at runtime" | S | Design doc "Open Questions" §17 bullet 2 leans hard-error |
| Dev-mode `vite serve` minimal meta CSP retention with deprecated label | Convenience for shell-less local preview without encouraging the pattern | S | Design doc "Open Questions" §17 bullet 3 leans retain-deprecated |

### Anti-Features (Explicit Exclusions)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Per-origin partial grants | "Let users approve 2 of 4 origins" | Requires multi-toggle prompt + origins-subset state model; multiplies UX and edge cases | Deferred to v2 explicitly (design doc §16) |
| Wildcard subdomains (`https://*.example.com`) | "Writing every subdomain is tedious" | Defeats the informed-consent point of the prompt | Deferred to v2 pending threat-model re-exam (design doc §16) |
| Shell visibility into post-grant traffic (proxy / logging / filtering) | "Security teams want audit logs" | Browser enforces CSP transparently to shell; no hook exists without a service worker, which `sandbox="allow-scripts"` forbids | Documented fundamental tradeoff (design doc §11.5) |
| Quota / rate-limiting on granted traffic | "Prevent runaway napplets" | Same reason — no browser hook | Deferred to v2 (design doc §16) |
| Audit logging of individual network calls | "Compliance" | Same reason | Deferred to v2 (design doc §16) |
| A new postMessage wire protocol | "All other NUBs have one" | Grants are expressed via CSP, not messages; a wire protocol would be ceremonial and confusing | Explicit Non-Goal (design doc §2); NUB-CONNECT is wholly expressed through manifest tags + CSP + state-query API |

---

## 2. NIP-5D Amendment (class delegation)

### Table Stakes (MUST)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Remove "Browser-Enforced Resource Isolation" strict-CSP prescription from NIP-5D §Security Considerations | Currently NIP-5D dictates the `perm:strict-csp` mechanism and a specific meta-CSP posture (line 115-130 of current spec); under v0.29.0 this shifts to shell-emitted header CSP and moves to NUB tracks | S | Current NIP-5D §"Browser-Enforced Resource Isolation" must soften to a forward pointer |
| Add prose that class distinctions (Class 1 / Class 2 and any future classes) are NOT a NIP-5D concern — they are defined by NUB specs layered on the existing manifest tag + `requires` + `shell.supports()` mechanisms | NIP-5D is transport + identity + manifest + NUB-negotiation only; keeping class definitions in NIP-5D would pollute the envelope spec | S | Aligns with existing NIP-5D philosophy (line 9: "Protocol messages are defined by NUB extension specs") |
| Keep `sandbox="allow-scripts"` reaffirmation intact (load-bearing for opaque-origin invariant) | Already correct and not changed by v0.29.0 | S | Current NIP-5D line 128-130 |
| Keep capability-query documentation (`shell.supports('foo')` + `perm:popups` example) unchanged | Runtime capability query is still NIP-5D's job | S | Current NIP-5D §"Runtime Capability Query" |
| Update `perm:strict-csp` status to "deprecated — still returns true for back-compat" (if mentioned at all in NIP-5D) | Spec churn transparency | S | Design doc §12.1 |

### Differentiators (SHOULD)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| NUBs-track advisory document: "How to define napplet classes on top of existing NUB specs" | Sets the pattern for future class taxonomies (e.g., content-type classes, API-shape classes) without polluting NIP-5D with a classification framework | M | Called out in PROJECT.md target features bullet 3: "NUBs-track advisory on how to define napplet classes on top of existing NUB specs" — lives in `napplet/nubs` repo alongside the NUB-CONNECT spec |
| Cross-link from NIP-5D Security Considerations to NUB-CONNECT spec URL | Readers following the strict-CSP breadcrumb under v0.28.0 should land on the current-posture document | S | Short edit — link to `https://github.com/napplet/nubs` NUB-CONNECT entry |

### Anti-Features (Explicit Exclusions)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Embedding Class 1 / Class 2 taxonomy text directly into NIP-5D | "Readers are here anyway" | NIP-5D must stay transport-only; adding classifications invites future class proliferation inside the envelope spec | Advisory lives in NUBs track (design doc §3 + open question §17 bullet 4 confirms NUB-CONNECT-prose placement) |
| Normative language in NIP-5D prescribing HTTP-responder behavior | "Class 2 napplets need the shell to serve the HTML" | NIP-5D doesn't currently specify how HTML is served, only how it's addressed (NIP-5A) and sandboxed | Design doc §17 bullet 4: "lean NUB-CONNECT prose — NIP-5D doesn't currently specify how HTML is served, only how it's addressed and sandboxed" |

---

## 3. `@napplet/nub/connect` Subpath

### Table Stakes (MUST)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| New subpath `packages/nub/src/connect/` with canonical 4-file layout (`index.ts`, `types.ts`, `shim.ts`, `sdk.ts`) | Follows established NUB-per-subpath pattern from v0.26.0 (resource, identity, ifc, keys, media, notify, storage, theme all follow this shape) | S | See existing `packages/nub/src/resource/` as a template |
| `types.ts`: `NappletConnect` interface with `granted: boolean` + `origins: readonly string[]` (both `readonly`) | Matches design doc §7 TypeScript block verbatim | S | Design doc §7 |
| `types.ts`: `DOMAIN = 'connect' as const` export for dispatch registration symmetry | Even though NUB-CONNECT has no wire messages, the domain identifier is still needed for `shell.supports('nub:connect')` bare-form and for cap-namespace consistency | S | Matches `DOMAIN` export pattern in all other NUB subpaths |
| `types.ts`: `ConnectManifestTag` type (tuple `['connect', string]`) | Type-level contract for authors constructing manifest tags manually | S | New public type; simple literal tuple |
| `types.ts`: re-export `['connect', string]` shape for vite-plugin consumption | vite-plugin synthesizes these tags from the `connect?: string[]` option | S | Shared source of truth |
| `shim.ts`: `installConnectShim(win: Window)` — mounts `window.napplet.connect` with values read from a shell-injected meta tag (`<meta name="napplet-connect" content="...">`) | Since there's no wire protocol, the shim must get its state from DOM injection at iframe-HTML-serve time (parallels how `configSchema` is surfaced via `<meta name="napplet-config-schema">` under NUB-CONFIG v0.25.0) | M | New pattern — design doc §7 says "Surfaced as `window.napplet.connect` by the shim. Shim is installed into the iframe document by the shell at bootstrap (existing pattern)." — but the **source** of `granted`/`origins` is the shell-emitted meta tag since no postMessage handshake exists |
| `shim.ts`: parse meta-tag content into `{granted, origins}` with defensive defaults (missing meta → `granted=false, origins=[]`; malformed → same fallback + console warning) | Shell-absence graceful degradation per design doc §13 states 3-4 | S | Mirrors NUB-CONFIG meta-tag read pattern |
| `shim.ts`: `Object.freeze` on the `origins` array and the `window.napplet.connect` object | `readonly` in types is compile-time only; runtime-freeze prevents napplet tampering | S | Defense-in-depth (napplets are untrusted code) |
| `sdk.ts`: named-export helpers matching shim state (`getConnectGranted()`, `getConnectOrigins()`) | Bundler-consumer ergonomics parallel to all other NUB SDK layers | S | Pattern: every NUB has `shim.ts` installers + `sdk.ts` convenience wrappers |
| `index.ts`: barrel re-exports of types + shim + sdk; `registerNub(DOMAIN, noop)` for dispatch singleton presence | Matches every existing NUB's `index.ts` shape | S | Even no-wire NUBs register — dispatch listing must include `'connect'` |

### Differentiators (SHOULD)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `sdk.ts`: `requireConnect()` helper that throws if `granted === false` | Common napplet pattern: "fail fast if network was denied; let the calling code catch and downgrade to NUB-RESOURCE" | S | Matches the `requireIfc` pattern from v0.27.0 |
| `shim.ts`: second meta-tag source — `<meta name="napplet-aggregate-hash">` read (if not already injected elsewhere) | Per design doc, the shell knows the aggregateHash; napplets can read it for their own introspection/analytics | S | Optional — no other NUB needs this so it could wait for v0.30.0 |

### Anti-Features (Explicit Exclusions)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| A `connect.request(origin)` runtime method | "Let napplets dynamically request origins after load" | Breaks the content-addressed identity model: every origin set change must change aggregateHash; dynamic requests would split the grant state off the hash | All origins declared at build time via manifest; rebuild to add origins |
| Post-grant origin list mutation | "What if user approves additional origins later?" | Same reason; grants are keyed on `(dTag, aggregateHash)` and v1 is all-or-nothing | Rebuild with new origins → new hash → re-prompt |
| A `ConnectGranted` interface (originally named in question) | Question phrased "ConnectGranted interface" — but the design doc uses `NappletConnect` | Naming consistency with the design doc | Use `NappletConnect` as the interface name |

---

## 4. `@napplet/vite-plugin` Changes

### Table Stakes: Subtractive (MUST remove/move)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drop production `strictCsp` meta-CSP emission entirely | Shell is now the sole runtime CSP authority; build tool baking a meta CSP is redundant-and-harmful under the new posture | M | Design doc §5 "@napplet/vite-plugin"; removes `buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage` from the production code path |
| Move (or remove) `buildBaselineCsp` + nonce generator | Either delete outright or gate behind a dev-only flag; design leans dev-only retention | S | Design doc §5 + §17 bullet 3; `packages/vite-plugin/src/csp.ts` (276 lines) substantially shrinks or becomes dev-only |
| Remove `connect-src` dev/prod split for production — dev-only retention is fine | The entire CSP emission moves out of production builds | S | Consequence of first bullet |
| Remove the 4 CSP assertions from production path (header-only directive rejection, meta-first-head-child, no-dev-leakage, baseline conformance) | Same — they were guards against build-time mistakes; no build-time CSP emission means no build-time assertions | S | Design doc §5 third bullet: "All of `buildBaselineCsp`, `validateStrictCspOptions`, `assertMetaIsFirstHeadChild`, `assertNoDevLeakage` move into a dev-only code path or are removed." |
| Remove `strictCsp` option from `Nip5aManifestOptions` (or mark deprecated no-op for one release) | API surface cleanup | S | Breaking-change vs deprecation-cycle is a plan-time decision; design doc implies removal from production code path but is not specific on the TS surface |

### Table Stakes: Additive (MUST add)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| New `connect?: string[]` option on `Nip5aManifestOptions` | Author-facing declaration of required origins | S | Design doc §18 "v0.29.0 (breaking)" third bullet sub-a |
| Origin normalization + validation at plugin-build time (Punycode IDN, lowercase host, no wildcard, no path/query/fragment, no default ports, scheme whitelist) | Fail-loud build errors before napplets ship a broken manifest | M | Design doc §6 "Origin Format (strict)" — normalization logic mirrors the shell-side validation but runs at build time |
| Emit `['connect', origin]` manifest tags (one per normalized origin) | Wire-level contract | S | Design doc §6 "Manifest Tag Shape" |
| Fold origin set into aggregateHash via synthetic `connect:origins` xTag entry (sorted origins, newline-joined, SHA-256) | Content-addressed identity must reflect origin changes | M | Design doc §6 "Content-Addressing Consequences" — follows the exact `config:schema` pattern at `packages/vite-plugin/src/index.ts:568-571` |
| Filter `connect:origins` synthetic entry out of `['x', ...]` tag projection | Matches `config:schema` precedent — synthetic entries participate in hash but don't surface as pseudo-file x-tags | S | Precedent at `packages/vite-plugin/src/index.ts:585-587` |
| Emit `<meta name="napplet-connect" content="<json-serialized-origins>">` in index.html for shim discovery | Shim needs a reliable source to read `origins` from; follows NUB-CONFIG `<meta name="napplet-config-schema">` precedent | S | Parallels NUB-CONFIG meta-tag pattern; shell can overwrite with grant-state meta at serve time, OR (preferable) shell appends its own `<meta name="napplet-connect-granted" content="true|false">` since origins are build-time-fixed and grant is runtime |
| Fail-loud inline-script diagnostic: HTML containing any `<script>` without `src=` → build fails with actionable error | Prevent runtime CSP violations that would block the napplet silently | S | Design doc §5 second bullet: "Production builds: new fail-loud diagnostic — if the napplet's HTML contains any `<script>` element without a `src` attribute, fail the build with a clear error. This is a developer-experience guard, not a security control (the shell CSP also blocks it)." |
| Build fails if `connect` option contains duplicate origins after normalization | Unambiguous author intent | S | Standard manifest-tag hygiene |

### Differentiators (SHOULD)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `connect` option accepts either `string[]` or a sidecar file path (`./connect.txt` line-per-origin) | Large origin lists become unwieldy in `vite.config.ts` | S | Pattern parallel to `configSchema` 3-path discovery; nice-to-have |
| Origin-list canonicalization helper exported from the plugin for testing | Third-party tooling (lint rules, CI guards) benefits | S | Exported helper function `normalizeConnectOrigin(raw: string): string \| { error: string }` |
| Dev-mode `vite serve` minimal meta CSP retained with deprecated comment | Shell-less local preview convenience without encouraging the pattern | S | Design doc §17 bullet 3 leans "retain for shell-less local preview only" |

### Anti-Features (Explicit Exclusions)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Keep `strictCsp` emitting meta CSP as a supported production path | "Back-compat for v0.28.0 napplets" | Under shell-emitted CSP, meta and header intersection can silently suppress granted origins (Edge Case 1); supporting both is architecturally incoherent | Shell refuses Class-2 napplets that ship meta CSP; Class-1 napplets with residual meta CSP are harmless (both say `connect-src 'none'`) |
| Wildcard origin acceptance in `connect` option | "Writing every subdomain is tedious" | Shell rejects at manifest-load; build tool must reject too | Hard build error on wildcards |
| Nonce generation for any purpose | "Future inline-script support" | Inline scripts are forbidden under the shell-emitted CSP (`script-src 'self'`, no nonce); nonce generation is dead code under the new posture | Dropped entirely |

---

## 5. Central `@napplet/shim` + `@napplet/sdk` Integration

### Table Stakes (MUST)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `@napplet/shim` imports `@napplet/nub/connect` and calls `installConnectShim(window)` at bootstrap | Every other NUB follows this pattern | S | Parallel to resource NUB wiring from v0.28.0 (Phase 128) |
| `window.napplet.connect` surface is present after shim load (even if granted=false) | Napplets can always read the API; its values tell the story | S | Design doc §7 |
| `NappletGlobal` in `@napplet/core` gains `connect: NappletConnect` property | Type-safe window surface | S | Mirrors every prior NUB addition (media, notify, identity, config, resource) |
| `'connect'` added to the `NubDomain` string-literal union in `@napplet/core` | Runtime dispatch / `shell.supports('nub:connect')` consistency | S | Required even though no wire messages — keeps the domain enumeration correct for tooling |
| `@napplet/sdk` re-exports the connect SDK (`getConnectGranted`, `getConnectOrigins`, `requireConnect`) | Bundler-consumer surface | S | Mirrors every prior NUB (`identity`, `media`, `notify`, `config`, `resource`) |
| `shell.supports('nub:connect')` returns `true` when shim is installed and (preferably) a handshake/meta confirms shell is NUB-CONNECT-aware | Runtime capability query contract | S | For design consistency — the shim's presence is necessary-but-not-sufficient; the shell injects a confirmation |

### Differentiators (SHOULD)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `shell.supports('connect:scheme:http')` + `shell.supports('connect:scheme:ws')` secondary flags plumbed through | Operator-policy-aware napplets can degrade cleartext-dependent flows | S | Design doc §12; SDK + type-union update |
| `perm:strict-csp` kept-but-marked-deprecated in `NamespacedCapability` string-union | Explicit back-compat gesture | S | Type-level deprecation JSDoc tag |

### Anti-Features (Explicit Exclusions)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| A runtime `connect.request(origin)` method on the shim | "Dynamic origin requests" | Breaks content-addressing | Only build-time origin declarations (see §3 anti-features) |
| A `connect.onGrantChange(callback)` subscription | "React to revocation mid-session" | Revocation invalidates the iframe — next load emits new CSP; reactive updates inside a still-open iframe would require reload-in-place, which is out of scope | Napplet reload is the correct response; shells SHOULD reload the iframe on revocation |

---

## 6. `specs/SHELL-CONNECT-POLICY.md` (Shell-Deployer Checklist)

### Table Stakes (MUST — structure parallels SHELL-RESOURCE-POLICY.md)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Status + "Why this exists" preamble | Orient shell deployers; name the NUB-CONNECT shell-as-CSP-authority posture | S | Exact structural parallel to `SHELL-RESOURCE-POLICY.md` §Status + §"Why this exists" |
| **Explicit N/A note on private-IP block** | NUB-RESOURCE's flagship policy does NOT apply — browser enforces origin-match on URL string, not resolved IP. Deployers coming from NUB-RESOURCE will expect this policy and need to hear it's absent | S | Design doc §11.1 "Posture vs NUB-RESOURCE" table row "Private-IP block at DNS resolution: Yes / No" |
| **HTTP-responder precondition checklist** | The load-bearing requirement: shell MUST own the HTTP response for napplet HTML. Enumerate acceptable delivery mechanisms | M | Design doc §5: "Acceptable delivery mechanisms: direct serving from the shell's origin, HTTP proxy, `blob:` URL with HTML transform, or `srcdoc` on the iframe." |
| **10-directive baseline CSP contract with `connect-src` as the only variable** | Deployers need the exact string to emit | M | Design doc §9 — emit verbatim as a copy-paste-able template |
| **Residual meta-CSP scan for Class-2 napplets (Edge Case 1)** | Shells MUST scan served HTML for `<meta http-equiv="Content-Security-Policy">` and refuse with diagnostic if the napplet is Class 2 | M | Design doc §10.1; illustrative diagnostic wording provided |
| **Class-1 passthrough note** (meta-CSP in Class-1 napplet is harmless) | Deployers need to know the scan is Class-2-only | S | Design doc §10.1 last paragraph |
| **Cleartext (http/ws) policy decision checklist**: enable? warn only? refuse entirely? | Operator choice; each has consent-UI consequences | S | Design doc §6 validation + §11.2 |
| **Mixed-content reality check**: https shell cannot fetch http origins regardless of CSP grant; localhost/loopback secure-context exception | Deployers serving over https will get confusing failures without this | S | Design doc §10.6 |
| **Consent UI requirements checklist**: napplet name + dTag + origin list + cleartext warning + trust-language ("shell cannot see or filter this traffic") + Approve/Deny buttons | Normative floor | M | Design doc §8 "Prompt Requirements" |
| **Grant persistence semantics checklist**: keyed on `(dTag, aggregateHash)`; rebuild → new hash → auto-invalidate; origin list change → new hash → auto-invalidate | Content-addressed identity must be preserved | M | Design doc §8 + §6 "Content-Addressing Consequences" |
| **Re-prompt diff UX checklist**: show "previously approved X; now requesting Y" when a new `aggregateHash` of the same `dTag` appears | UX floor for informed re-consent | S | Design doc §8 "Re-prompt on Origin Change" |
| **Revocation UI checklist**: MUST expose; revocation → DENIED state (not deletion); re-approve affordance; iframe reload behavior | User control over their own grants | M | Design doc §8 "Revocation" |
| **Capability advertisement wiring checklist**: `shell.supports('nub:connect')`, `connect:scheme:http`, `connect:scheme:ws`, deprecated `perm:strict-csp` return value | Runtime discovery honesty | S | Design doc §12 |
| **"Shell sees zero post-grant traffic" deployment notice language** | Deployers SHOULD document this in their user-facing privacy notice | S | Design doc §11.5 + parallel to SHELL-RESOURCE-POLICY.md bottom of sidecar section ("Operators document any deviation from default-OFF in the shell's user-facing privacy notice") |
| **Audit checklist (one-page summary)** | Deployment sign-off — same format as SHELL-RESOURCE-POLICY.md's audit checklist | M | All MUST bullets above condensed into a one-page sign-off list |
| **References section** | Link to NUB-CONNECT spec URL + NIP-5D + (optionally) WHATWG mixed-content spec | S | Exact parallel to SHELL-RESOURCE-POLICY.md References section |

### Differentiators (SHOULD)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Decision matrix**: "When does my shell need NUB-CONNECT?" (shell serves blobs of napplet HTML → yes; shell iframes third-party URLs → no) | Not every shell needs this NUB; help deployers self-select | S | Unique to this spec — SHELL-RESOURCE-POLICY doesn't have this because NUB-RESOURCE is close to universally needed |
| **Grant-storage recommendations** (`localStorage`? shell-side DB? encrypted at rest?) | Grants are long-lived privacy-relevant state | S | Not normative but implementer-valuable |
| **Revocation-triggers-iframe-reload recommendation** | Napplets don't get a runtime grant-change signal; reload is the intended path | S | Design consistency with §5 anti-features (no `onGrantChange`) |
| **Deployment policy examples** (community-default / enterprise / cleartext-permitting local-dev) | Give deployers starting points | M | Non-normative; three concrete profiles |

### Anti-Features (Explicit Exclusions)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Private-IP block list | "NUB-RESOURCE has it; should NUB-CONNECT?" | Browser enforces CSP on URL string, not resolved IP; a block list on the URL string is trivially bypassed by DNS rebinding and is not a real control | Documented N/A (design doc §11.1 table row) |
| Post-grant request proxying / logging | "Audit what napplets actually send" | Impossible without a service worker (forbidden by sandbox); documented post-grant opacity tradeoff | Shell-deployer user notice; no technical mitigation |
| MIME sniffing / SVG rasterization caps | "SHELL-RESOURCE-POLICY has these" | Those apply to shell-proxied bytes; under NUB-CONNECT the shell sees no bytes | Not applicable; do not include |
| Redirect chain limits | Same rationale | Same reason | Not applicable |
| Scheme whitelist for the *payload* fetch | "NUB-RESOURCE whitelists schemes" | CSP `connect-src` already constrains schemes to the 4-scheme whitelist at origin-declaration time; no runtime scheme-dispatch | Not applicable — scheme enforcement happens at manifest-validation time, not per-request |

---

## 7. Documentation Sweep

### Table Stakes (MUST)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Root `README.md` updated: package inventory (add `nub/connect` subpath), API surface (add `window.napplet.connect`), class taxonomy blurb | Root README is the entry point for every reader | M | Same sweep pattern as v0.28.0 Phase 129 / v0.27.0 Phase 123 |
| `packages/core/README.md`: `NubDomain` gains `'connect'`; `NamespacedCapability` gains `'nub:connect'`, `'connect:scheme:http'`, `'connect:scheme:ws'`; `perm:strict-csp` marked deprecated | Core is the type-authoritative surface | S | Standard NUB-addition doc edit |
| `packages/shim/README.md`: `window.napplet.connect.{granted, origins}` surface documented; dependency row gains `@napplet/nub/connect` subpath | Shim doc is the runtime surface reference | S | Standard NUB-addition doc edit |
| `packages/sdk/README.md`: named exports section adds `getConnectGranted`, `getConnectOrigins`, `requireConnect` | SDK doc is the bundler-consumer reference | S | Standard NUB-addition doc edit |
| `packages/vite-plugin/README.md`: new `connect?: string[]` option documented; **strictCsp option removed/deprecated section**; new inline-script diagnostic documented; new `<meta name="napplet-connect">` injection noted | Breaking-change surface — vite-plugin README is especially load-bearing | L | Subtractive + additive — larger edit than other READMEs |
| `skills/build-napplet/SKILL.md`: frontmatter + body update for Class 1 / Class 2 posture; new "default to NUB-RESOURCE, reach for NUB-CONNECT only when necessary" prose; code sample showing `connect` option in `vite.config.ts` + `window.napplet.connect.granted` runtime branching | SKILL.md is the agentskills.io surface that other agents load to write napplets — wrong guidance here cascades | L | Design doc §13 Graceful Degradation is the exact 4-state ladder to document |

### Differentiators (SHOULD)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Changelog entries (changesets) across all 4 affected packages with clear breaking-change markers | Consumers parsing changelogs need to see "strictCsp production emission dropped" loud and clear | M | `changesets` workflow already in place |
| `packages/nub/README.md` (if exists) updated to list the new `/connect` subpath | Nub barrel-package doc | S | Follows v0.26.0 subpath-pattern docs |
| Cross-link between `SHELL-RESOURCE-POLICY.md` and `SHELL-CONNECT-POLICY.md` in both directions (in References sections) | Deployers implementing one often want the other | S | Two-line edit in each file |
| A short "NUB-RESOURCE vs NUB-CONNECT decision guide" in the root README (one paragraph + decision table) | Users will ask; answer prominently | S | Based on design doc §11.1 table — 8 rows compressed to 3-4 decision criteria |

### Anti-Features (Explicit Exclusions)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| README mentions of downstream shell repo's demo napplets | "Show users an example" | Design doc Option B: demo napplets are downstream-shell-repo's concern (PROJECT.md v0.28.0 archive + v0.29.0 target-features bullet 4) | Defer examples to the shell repo's docs; link out if needed |
| Rewriting historical changelog bullets for IFC/NUB-CONFIG/etc. to mention NUB-CONNECT | "Context sweep" | v0.27.0 precedent: "historical changelog bullets preserved as records" — do not rewrite history | Preserve historical bullets byte-identical |

---

## Cross-Category Dependencies

```
[1. NUB-CONNECT spec (napplet/nubs)]
    │
    ├──blocks──> [3. @napplet/nub/connect subpath]
    │               └──reason: types must match spec field names + shim behavior follows consent-flow contract
    │
    ├──blocks──> [4. @napplet/vite-plugin additive]
    │               └──reason: origin normalization rules + aggregateHash fold + manifest tag shape all come from spec
    │
    ├──blocks──> [6. SHELL-CONNECT-POLICY.md]
    │               └──reason: policy checklist maps normative MUSTs from spec to deployer actions
    │
    └──enhances──> [7. Documentation sweep]
                   └──reason: README prose cites spec; link targets needed before doc writes land

[2. NIP-5D amendment]
    │
    └──independent──> (can ship in parallel with 1)
       └──reason: NIP-5D amendment is subtractive (remove strict-CSP prose) + add forward pointer;
                  doesn't depend on NUB-CONNECT spec language

[3. @napplet/nub/connect subpath]
    │
    └──blocks──> [5. @napplet/shim + @napplet/sdk integration]
                  └──reason: shim imports installConnectShim from the subpath; sdk re-exports from it

[4. @napplet/vite-plugin subtractive]
    │
    └──independent──> (can ship before or in parallel with the additive half)
       └──reason: removing strictCsp emission is an isolated change; additive `connect` option is additive

[4. @napplet/vite-plugin additive]
    │
    ├──depends on──> [1. NUB-CONNECT spec] (for normalization rules)
    │
    └──enhances──> [5. @napplet/shim integration]
                   └──reason: shim reads <meta name="napplet-connect"> injected by vite-plugin

[5. @napplet/shim + @napplet/sdk integration]
    │
    └──blocks──> [7. Documentation sweep (packages/shim/README, packages/sdk/README, root README)]
                  └──reason: doc sweep cites the exact named exports + window surface

[6. SHELL-CONNECT-POLICY.md]
    │
    └──independent of 3/4/5──> (can ship in parallel — it's a shell-side doc)
       └──reason: SHELL-CONNECT-POLICY describes what shells must do; SDK work is napplet-side

[7. Documentation sweep]
    │
    └──depends on──> [3, 4, 5] (final shapes must be known)
       └──reason: README prose cites exact API names, option names, meta-tag names
```

### Dependency Summary for Roadmap Phase Ordering

- **Spec-first chain:** `1. NUB-CONNECT spec` and `2. NIP-5D amendment` are both foundational and can ship in parallel. NIP-5D amendment is lighter (subtractive + forward pointer) and can land early.
- **Two independent lanes after spec:** (a) `3. @napplet/nub/connect subpath` → `5. shim/sdk integration`, and (b) `4. @napplet/vite-plugin` (subtractive half independent; additive half depends on spec).
- **Convergence lane:** `6. SHELL-CONNECT-POLICY.md` can ship any time after spec lands (it's a shell-side doc, not code).
- **Terminal lane:** `7. Documentation sweep` is last — needs all code/API shapes stable before doc edits.

**Natural phase ordering suggestion (for roadmapper, not prescriptive):**

1. NIP-5D amendment (independent, small, unblocks cross-repo messaging)
2. NUB-CONNECT spec in napplet/nubs (draft PR, blocking for everything else code-wise)
3. `@napplet/nub/connect` subpath (types + shim + sdk scaffolding)
4. `@napplet/vite-plugin` subtractive (drop strictCsp production emission)
5. `@napplet/vite-plugin` additive (`connect` option + origin validation + aggregateHash fold + meta injection + inline-script diagnostic)
6. `@napplet/shim` + `@napplet/sdk` central integration
7. `SHELL-CONNECT-POLICY.md`
8. Documentation sweep (root + 4 package READMEs + SKILL.md)
9. Verification gate + milestone close

(Exact phase granularity is a roadmapper decision; steps 4-5 may merge, steps 3-6 may interleave.)

---

## MVP Definition

### Launch With (v0.29.0)

All entries marked "Table Stakes (MUST)" across the 7 categories above. Specifically:

- [ ] NUB-CONNECT spec drafted in napplet/nubs (all 27 table-stakes spec items from §1)
- [ ] NIP-5D amendment (5 subtractive + cross-reference items from §2)
- [ ] `@napplet/nub/connect` subpath with 4 canonical files + `NappletConnect` interface + meta-tag-read shim + SDK helpers (10 items from §3)
- [ ] `@napplet/vite-plugin`: strictCsp production emission dropped (5 subtractive items from §4) + `connect` option + origin validation + aggregateHash fold + manifest tag emission + meta injection + inline-script diagnostic (8 additive items from §4)
- [ ] `@napplet/shim` + `@napplet/sdk` central integration (6 items from §5)
- [ ] `specs/SHELL-CONNECT-POLICY.md` (15 items from §6)
- [ ] Documentation sweep: root + 4 package READMEs + SKILL.md (6 items from §7)
- [ ] `pnpm -r build` + `pnpm -r type-check` green across all 14 packages
- [ ] Changesets landed with clear breaking-change notation

### Add Shortly After (v0.29.x patch)

Differentiators that don't block release but add polish:

- [ ] `requireConnect()` SDK helper
- [ ] `connect` option accepting sidecar file path for large origin lists
- [ ] "NUB-RESOURCE vs NUB-CONNECT decision guide" section in root README
- [ ] Deployment-profile examples in SHELL-CONNECT-POLICY.md

### Future Consideration (v0.30.0+)

Explicit v2 deferrals from design doc §16:

- [ ] Per-origin partial grants
- [ ] Wildcard subdomains
- [ ] Quota / rate-limiting on granted traffic (requires browser platform change or service worker, blocked)
- [ ] Audit logging of individual network calls (same blocker)
- [ ] Removal of deprecated `perm:strict-csp` capability (separate deprecation-removal milestone)

---

## Feature Prioritization Matrix

| Feature category | User/Consumer Value | Implementation Cost | Priority |
|------------------|---------------------|---------------------|----------|
| NUB-CONNECT spec in napplet/nubs | HIGH (cross-repo reference for every implementer) | MEDIUM | P1 |
| NIP-5D class-delegation amendment | MEDIUM (taxonomy hygiene, not user-facing) | LOW | P1 |
| `@napplet/nub/connect` subpath | HIGH (napplet authors need the API) | MEDIUM | P1 |
| vite-plugin subtractive (drop strictCsp) | HIGH (removes broken posture under new model) | LOW-MEDIUM | P1 |
| vite-plugin additive (`connect` option + fold + diagnostic) | HIGH (author-facing primary interface) | MEDIUM-HIGH | P1 |
| shim/sdk central integration | HIGH (runtime API surface) | LOW | P1 |
| SHELL-CONNECT-POLICY.md | HIGH (shell deployers cannot ship without it) | MEDIUM-HIGH | P1 |
| Documentation sweep | HIGH (adoption friction without it) | MEDIUM | P1 |
| `requireConnect()` helper | MEDIUM | LOW | P2 |
| Sidecar-file `connect` option | MEDIUM | LOW | P2 |
| Decision-guide README paragraph | MEDIUM | LOW | P2 |
| Deployment profile examples | MEDIUM | MEDIUM | P2 |

**Priority key:**
- P1: Must have for v0.29.0 launch
- P2: Should have, land during v0.29.x patch window
- P3: Deferred to v0.30.0+

---

## Complexity Legend & Rationale

**S (Small, ~hours):** Single-file edit, well-established pattern in the codebase, no new concepts. Examples: add `'connect'` to `NubDomain` union, re-export SDK helpers, short README edit.

**M (Medium, ~half-day to day):** Multi-file coordination, new logic, follows a pattern from prior milestones. Examples: origin normalization + validation + aggregateHash fold in vite-plugin (parallel to NUB-CONFIG's `configSchema` at v0.25.0), meta-tag-read shim installer, spec prose sections.

**L (Large, ~1-2 days):** Coordinated multi-package changes, subtractive work removing live code with back-compat considerations, or substantial new spec/doc authoring. Examples: vite-plugin README rewrite covering both subtractive and additive changes, SKILL.md sweep including the new class taxonomy prose and code samples, full SHELL-CONNECT-POLICY.md authoring.

Total estimated effort split across categories:

- §1 Spec: mostly S items, ~15 S + ~10 M + 0 L → cross-repo human-driven, authored-and-reviewed
- §2 NIP-5D: all S → single-session edit
- §3 nub/connect: 8 S + 2 M → one phase, likely S-day scale
- §4 vite-plugin: 4 S + 4 M subtractive; 4 S + 4 M additive → two phases or one large phase
- §5 shim/sdk: all S/M → one phase
- §6 SHELL-CONNECT-POLICY: 6 S + 7 M + 2 L → one phase, L-day scale
- §7 docs: 3 S + 2 M + 2 L → one phase, L-day scale
- Verification gate: 0-day, just exit-code checks

---

## Sources

- **Primary design doc** (authoritative, committed `9f77c29`):
  `docs/superpowers/specs/2026-04-21-napplet-network-permission-design.md` — full NUB-CONNECT design including manifest shape, origin-format rules, shell consent flow, CSP contract, edge cases, security considerations, migration path, testing posture, deferred v2 features, and open implementation-plan questions.
- **Current NIP-5D** (to amend): `specs/NIP-5D.md` — current "Browser-Enforced Resource Isolation" subsection at lines 115-130 describes the v0.28.0 strict-CSP posture that v0.29.0 replaces.
- **SHELL-RESOURCE-POLICY.md template**: `specs/SHELL-RESOURCE-POLICY.md` — structural parallel for SHELL-CONNECT-POLICY.md authoring (Status → Why-this-exists → per-policy-checklists → Audit-checklist → References pattern).
- **NUB-CONFIG precedent** (synthetic aggregateHash entry pattern): `packages/vite-plugin/src/index.ts:559-587` — `config:schema` synthetic xTag entry with filter-from-x-tags projection; NUB-CONNECT `connect:origins` entry follows this exactly.
- **Resource NUB subpath template**: `packages/nub/src/resource/{index,types,shim,sdk}.ts` — canonical 4-file NUB subpath layout that `packages/nub/src/connect/` will mirror.
- **PROJECT.md active section**: `.planning/PROJECT.md` lines 3-22 — target-features bullet list serves as the milestone scope north-star.
- **v0.28.0 archive** (resource NUB precedent): PROJECT.md line 25 — "central integration of the connect NUB (parallel to resource NUB wiring in v0.28.0)" establishes that the shim/sdk integration phase structure already has a proven template.

---
*Feature research for: v0.29.0 NUB-CONNECT + Shell as CSP Authority*
*Researched: 2026-04-21*

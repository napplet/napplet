# Domain Pitfalls: Writing and Submitting NIP-5C

**Domain:** NIP specification authorship for Nostr Web Applets (iframe sandbox + postMessage protocol)
**Researched:** 2026-04-05
**Overall confidence:** HIGH (findings grounded in actual NIP repository review history, PR comment threads, and maintainer feedback patterns)

---

## Critical Pitfalls

Mistakes that cause NIP rejection, extended review cycles, or community opposition.

### Pitfall 1: Overspecification -- Specifying Runtime Internals in the NIP

**What goes wrong:** The NIP defines internal implementation details (ACL engine, service registry, session management, storage proxy internals) instead of the observable wire protocol between napplet and shell. The NIP becomes a 40+ page implementation manual rather than a terse protocol specification.

**Why it happens:** The SPEC.md in this repo is 41KB+ and covers everything from ACL bitfields to audit event routing. The temptation is to submit something close to it. But NIPs document what may be implemented, not how.

**Consequences:** fiatjaf has explicitly stated (PR #220, #880, #883) that NIPs should be "terse" and readable. A NIP that is "too long and complex" where "it's hard to read and come away with a coherent sense of the whole" will stall in review. NIP-5A itself took ~5 months to merge (#1538) and only succeeded by stripping prescriptive requirements.

**Prevention:**
- NIP-5C scope: only the observable napplet<->shell postMessage wire format and `window.*` API contracts
- ACL, service registry, session management, storage engine = implementation concerns, NOT in the NIP
- Use fiatjaf's suggested framing from NIP-5B review: "This NIP describes a method for [thing]. These are purely client-side apps made of web assets (HTML, CSS, JS) that can be loaded dynamically from inside higher-order apps."
- Target: under 500 lines of markdown, ideally under 300

**Detection:** If the NIP references internal data structures, class names, or module organization, it is overspecified. If a different shell implementation would need to change the spec to work, it is overspecified.

**Confidence:** HIGH -- directly observed in NIP-5A review history and fiatjaf's inline comments on NIP-5B (#2282).

### Pitfall 2: Defining What a "Nostr App" Is

**What goes wrong:** The NIP attempts to draw a definitional line between "static website" and "nostr app" based on NIP-07 support, creating a prescriptive classification that the community rejects.

**Why it happens:** It feels natural to say "if an nsite supports NIP-07, it is a nostr web app." But as dskvr argued in the NIP-5B thread (#2282): "There is no way to enforce this behavior. There are many reasons why an nsite would have NIP-07 and not want to be a napp." And from the NIP-C4 discussion: "A blog can have a comments section driven by nostr, doesn't make it an app."

**Consequences:** dskvr filed CHANGES_REQUESTED on NIP-5B specifically for this. fiatjaf's own suggestion was to reframe as "embeddable web apps" that are "loaded dynamically from inside higher-order apps" -- focusing on the embedding relationship rather than a definitional taxonomy. Any NIP that says "if X then Y is a napp" will be challenged.

**Prevention:**
- Do NOT define what makes something a "nostr app" or "napplet"
- Instead: define the shell-napplet communication protocol. A napplet is any iframe that speaks this protocol to a shell. Period.
- The NIP describes the wire format and capability discovery, not a classification system
- Use the NIP-5B lesson: the embedding relationship (loaded inside a higher-order app) is the defining characteristic, not NIP-07 support or any other feature

**Detection:** If the NIP has a sentence like "A napplet is defined as..." followed by capability requirements beyond "speaks the postMessage protocol defined herein," it is drawing dangerous definitional lines.

**Confidence:** HIGH -- directly observed in NIP-5B (#2282) and NIP-C4 (#2274) review threads.

### Pitfall 3: Competing with NIP-5B and NIP-C4 Without Differentiation

**What goes wrong:** NIP-5C is submitted and reviewers immediately ask "how is this different from NIP-5B (#2282) or NIP-C4 (#2274)?" and the discussion devolves into territorial NIPs-vs-NIPs debate rather than technical review.

**Why it happens:** There are already three related proposals in the ecosystem:
- **NIP-C4** (#2274, arthurfranca, closed): "Nostr Apps (aka napps or nsites v3)" -- app bundle format + app store listing
- **NIP-CF** (#2277, dskvr, closed): "Combine Forces" -- napps as metadata layer on top of NIP-5A
- **NIP-5B** (#2282, arthurfranca, open): "Embeddable Nostr Web Apps" -- lightweight app listing for NIP-5A nsites
- **Smart Widgets** (#2025, YakiHonne): interactive components embedded in events

The NIP-5B thread already descended into multi-front discussion across three PRs simultaneously.

**Consequences:** Review energy is spent on jurisdictional questions rather than protocol review. The NIP stalls while competing proposals negotiate territory.

**Prevention:**
- NIP-5C must clearly differentiate: it defines the *communication protocol* between shell and embedded app, NOT the app listing/discovery format (that is NIP-5B/NIP-89's domain)
- Explicitly reference NIP-5B for "how apps are advertised" and NIP-5A for "how app files are stored"
- NIP-5C fills the gap neither NIP-5A nor NIP-5B covers: what happens *after* the iframe is loaded? How does the embedded app talk to the host?
- Frame it as complementary: NIP-5A = file storage, NIP-5B = discovery/listing, NIP-5C = runtime communication protocol
- Proactively engage arthurfranca and hzrd149 before submitting

**Detection:** If anyone asks "why can't NIP-5B just add a section for this?" and there is no clear answer, the differentiation has failed.

**Confidence:** HIGH -- the NIP-C4/NIP-CF/NIP-5B territorial conflict is documented in real PR threads from March 2026.

### Pitfall 4: Using Ephemeral Kind Numbers for Persistent Semantics

**What goes wrong:** The NIP uses kind numbers 29001-29010 (in the 20000-29999 ephemeral range per NIP-01) for events that carry persistent semantic weight -- signer requests/responses, service discovery, IPC messages.

**Why it happens:** The kind numbers were chosen during implementation without considering NIP-01's range semantics. Kinds 20000-29999 are explicitly "ephemeral events" that are "not expected to be stored by relays." This is fine for the actual use case (postMessage events never touch relays), but reviewers familiar with NIP-01 will flag the apparent mismatch.

**Consequences:** A reviewer says "why are you using ephemeral kinds for what look like protocol commands?" and the discussion gets sidetracked into kind range philosophy. Or worse: a relay implementation that sees these events on the wire (unlikely but possible) would discard them.

**Prevention:**
- These events never touch relay WebSockets -- they exist only in the postMessage channel between iframe and host. The NIP must make this crystal clear upfront.
- Consider whether the NIP even needs to specify kind numbers at all. The postMessage wire format could use string-based verbs (it already uses NIP-01 verb format: EVENT, REQ, CLOSE, AUTH). The kind numbers are an internal implementation detail of the event payloads.
- If kind numbers are specified, explicitly note they are transport-layer identifiers for the postMessage channel, not relay-destined events.
- Alternative: use regular kind range (1000-9999) or addressable range (30000-39999) if events might ever need relay persistence. Or define a custom "napplet protocol kind" concept that is explicitly not a relay kind.

**Detection:** If a reviewer says "ephemeral events are not stored by relays, so why do you use this range?" and the answer requires a paragraph of explanation, the NIP is not clear enough.

**Confidence:** HIGH -- NIP-01 kind range semantics are well-established and will be reviewed against.

---

## Moderate Pitfalls

### Pitfall 5: postMessage Origin Wildcard (`*`) Without Adequate Security Analysis

**What goes wrong:** The NIP specifies `window.parent.postMessage(message, '*')` for all communication, and security-focused reviewers flag this as a vulnerability without understanding the full threat model.

**Why it happens:** The `'*'` target origin is required because sandboxed iframes without `allow-same-origin` have opaque ("null") origins. You cannot target a specific origin -- `'*'` is the only option. But security reviewers will see `'*'` and immediately think "wildcard origin = insecure."

**Consequences:** Extended review cycle while the security model is explained and debated. Real-world postMessage vulnerabilities (CVE-2024-49038 in Copilot Studio, CVSS 9.3; Azure XSS via embedded iframes) make reviewers justifiably cautious.

**Prevention:**
- The NIP MUST include a Security Considerations section that addresses this head-on
- Explain that `allow-same-origin` is deliberately excluded, creating an opaque origin
- Document that sender authentication uses `MessageEvent.source` (the window object reference), NOT `event.origin`
- Document that `MessageEvent.source` verification is necessary but not sufficient -- the AUTH handshake with cryptographic challenge-response provides the actual identity verification
- Reference the iframe sandbox policy explicitly: `allow-scripts allow-forms allow-popups allow-modals allow-downloads` (no `allow-same-origin`)
- Document the threat model: what can a malicious iframe do? What can a malicious parent do? What mitigations exist?
- Note that `allow-scripts` + `allow-same-origin` together allow sandbox escape (the iframe can remove its own sandbox attribute) -- this is why `allow-same-origin` is excluded

**Detection:** If the Security Considerations section does not explicitly address `'*'` origin, `MessageEvent.source` validation, and why `allow-same-origin` is excluded, it is incomplete.

**Confidence:** HIGH -- postMessage security is a well-documented attack surface with multiple recent CVEs.

### Pitfall 6: Mandating Too Many Capabilities

**What goes wrong:** The NIP requires shells to implement relay proxy, IPC, channels, storage, NIP-07 signer, AND nostrdb support. This makes shell implementation so complex that no one besides this project will implement it.

**Why it happens:** The project has built all of these capabilities and wants them standardized. But the NIP review criteria state: "NIPs should be optional and backwards-compatible. Care must be taken such that clients and relays that choose to not implement them do not stop working."

**Consequences:** fiatjaf's consistent feedback is that NIPs should not "introduce unnecessary complexity." A NIP that requires implementing 6+ subsystems to be conformant will be criticized as too complex. The "two implementations" requirement becomes impossible to meet if the bar is too high.

**Prevention:**
- Structure as MUST/MAY layers:
  - MUST: AUTH handshake, service/feature discovery (`window.napplet.services`)
  - MAY: relay proxy, IPC, channels, storage, NIP-07 signer, nostrdb
- Each MAY capability should be independently implementable and discoverable
- A minimal conformant shell implements only AUTH + discovery. Everything else is optional.
- This mirrors the project's own architecture: `window.napplet.services.has('relay')` lets napplets discover what is available
- The NIP already plans this (per PROJECT.md) -- ensure it is front and center, not buried

**Detection:** If a reader cannot identify the minimal conformant implementation within 2 minutes of reading, the MUST/MAY layering is not clear enough.

**Confidence:** HIGH -- NIP review criteria explicitly require optionality.

### Pitfall 7: No Working Implementations at Submission Time

**What goes wrong:** The NIP is submitted as a theoretical specification without pointing to working implementations. It languishes in review because no one can verify the protocol works.

**Why it happens:** The project has a full implementation (8 packages, 193 tests, interactive demo), but the NIP PR does not reference it. Reviewers treat it as theoretical.

**Consequences:** NIPs need "two blessings" and are expected to be "fully implemented in at least two clients and one relay when applicable." A NIP with zero referenced implementations gets lower priority.

**Prevention:**
- Reference the napplet SDK as Implementation A (link to repo, test suite, demo)
- Reference hyprgate as the shell host that uses these packages
- If possible, get arthurfranca's 44billion.net platform to be Implementation B (it already embeds nsites with NIP-07 proxy)
- Include an "Implementations" section at the bottom of the NIP listing known implementations
- The demo playground at the project root is a strong selling point -- link it

**Detection:** If the NIP does not have an "Implementations" section, add one.

**Confidence:** HIGH -- NIP merge criteria explicitly mention implementation requirements.

### Pitfall 8: Not Engaging Stakeholders Before Submission

**What goes wrong:** The NIP PR appears without prior discussion, and the key players (fiatjaf, hzrd149, arthurfranca) discover it for the first time in the PR. Their feedback triggers major rewrites.

**Why it happens:** The author wants to submit a polished spec. But the NIP ecosystem is social-consensus-driven, not formal-review-driven.

**Consequences:** NIP-5A took 5 months partly because design discussions happened in the PR rather than before it. NIP-C4 and NIP-CF fragmented discussion across three fronts.

**Prevention:**
- Before submitting the PR: share the draft spec with hzrd149 (NIP-5A author), arthurfranca (NIP-5B/NIP-C4 author), and fiatjaf (gatekeeper) via nostr DM or GitHub issue
- Frame it as: "NIP-5C defines the runtime communication protocol for embedded apps. NIP-5A handles file storage, NIP-5B handles discovery. This fills the gap for what happens after the iframe loads."
- Get at least one "this makes sense as a separate NIP" before submitting
- Consider publishing as a GitHub issue first (per Issue #545 NIP proposal process) before the full PR

**Detection:** If the PR description does not mention prior discussion or reference known stakeholders' input, pre-engagement did not happen.

**Confidence:** MEDIUM -- based on observed patterns in NIP-5A/5B/C4/CF threads, but pre-engagement practices vary.

---

## Minor Pitfalls

### Pitfall 9: Wrong NIP Format or Style

**What goes wrong:** The NIP uses a format or style inconsistent with other NIPs, causing friction.

**Prevention:**
- Use the exact format of NIP-5A as a template (it is the direct parent spec)
- Title format: `NIP-5C` with subtitle on next line
- Status tags: `` `draft` `optional` ``
- Use RFC 2119 keywords: MUST, SHOULD, MAY (not "must", "should", "may")
- Keep the markdown clean -- no complex HTML, no diagrams (use ASCII art if needed)
- Event structures shown as JSON code blocks with clear field descriptions
- Tags shown in array format: `["tag", "value1", "value2"]`
- Reference other NIPs as `[NIP-XX](XX.md)` (relative links)

**Confidence:** HIGH -- NIP format is consistent and observable.

### Pitfall 10: Conflating Channels with Existing NIP Patterns

**What goes wrong:** The new "channels" concept (authenticated persistent point-to-point connections between napplets) is confused with NIP-28 (Public Chat Channels) or NIP-29 (Relay-based Groups), which use the word "channel" differently.

**Prevention:**
- Use a distinct term if possible. "Pipes" or "links" or "connections" instead of "channels"
- If "channels" is used, the NIP must clearly state it refers to postMessage-based point-to-point connections between iframes, NOT relay channels
- Never use kind numbers that overlap with NIP-28/NIP-29 (40-42 for NIP-28, 9000-9022 for NIP-29, 39000-39003 for NIP-29 metadata)

**Confidence:** MEDIUM -- terminology collision is a common source of confusion in NIP reviews.

### Pitfall 11: Forgetting to Update the README Kind Table

**What goes wrong:** The NIP PR adds a new `.md` file but does not update the `README.md` kind table or NIP index. The PR sits in review waiting for this trivial fix.

**Prevention:**
- The NIP PR must include changes to `README.md` adding:
  - NIP-5C to the NIP index list
  - Any new kind numbers to the Event Kinds table
  - Any new message types to the relevant tables
- Look at PR #2286 ("Add NIP-5A and nsite kinds to README") as an example -- NIP-5A itself needed a separate follow-up PR just for the README

**Confidence:** HIGH -- PR #2286 was merged 2026-03-25 specifically to fix this for NIP-5A.

### Pitfall 12: Specifying window.nostr Proxy Behavior

**What goes wrong:** The NIP defines how shells should proxy `window.nostr` (NIP-07) into sandboxed iframes, potentially conflicting with or duplicating NIP-07 itself.

**Prevention:**
- NIP-5C should say: "Shells MAY provide a `window.nostr` object inside the napplet iframe that proxies signing requests to the shell's signer." Full stop.
- Do NOT redefine the NIP-07 interface. Reference NIP-07 and say shells provide a conformant implementation.
- The internal proxy mechanism (postMessage-based signer request/response) is an implementation detail, not protocol.
- The old kind 29001/29002 signer request/response flow is being replaced by standard `window.nostr` per PROJECT.md -- the NIP should reflect this final design.

**Confidence:** MEDIUM -- NIP-07 is well-established and reviewers will push back on anything that redefines it.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Channel protocol design | Overspecification of channel lifecycle | Define only open/close/send verbs. Internal state machine is implementation detail. |
| NIP-5C spec writing | Runtime internals leaking into spec | Hard rule: if it is not observable on the postMessage wire, it does not belong in the NIP. |
| NIP-5C spec writing | Defining "what is a napp" | Avoid. A napplet is anything that speaks this protocol. |
| NIP-5C spec writing | Too many MUST requirements | Minimize MUSTs to AUTH + discovery. Everything else is MAY. |
| NIP submission | Territorial conflict with NIP-5B | Pre-engage arthurfranca and hzrd149. Frame NIP-5C as complementary. |
| NIP submission | No referenced implementations | List napplet SDK + hyprgate in Implementations section. |
| NIP submission | Missing README.md updates | Include README changes in the same PR. |
| Kind number allocation | Ephemeral range semantics | Consider whether kinds need to be specified at all, or declare them as postMessage-channel-only identifiers. |
| Security review | postMessage `*` origin | Proactive Security Considerations section. Address wildcard origin, sandbox flags, AUTH cryptographic verification. |
| Community reception | "app platform on nostr" skepticism | Frame as minimal communication protocol, not an app platform. Let the protocol speak for itself. |

---

## NIP Rejection Pattern Summary

Based on analysis of the nostr-protocol/nips repository (PRs #1538, #2274, #2277, #2282, #2025, Issue #545):

| Pattern | Frequency | Example |
|---------|-----------|---------|
| Overspecification / too complex | Very common | fiatjaf on multiple PRs: "too long and complex" |
| Duplicates existing NIP | Common | NIP-CF vs NIP-C4 vs NIP-5A territory disputes |
| Prescriptive definitions | Common | NIP-5B: "if nsite has NIP-07, it is a napp" -- rejected by dskvr |
| No working implementation | Common | Smart Widgets (#2025) -- 8 months open with no merge |
| Mandatory complexity | Moderate | NIPs adding requirements that break optionality |
| Missing README updates | Minor but frequent | NIP-5A needed follow-up PR #2286 |
| Wrong format/style | Minor | Inconsistent with established NIP markdown conventions |

---

## Sources

- [NIP-5A PR #1538](https://github.com/nostr-protocol/nips/pull/1538) -- 5-month review history, format reference
- [NIP-C4 PR #2274](https://github.com/nostr-protocol/nips/pull/2274) -- "Nostr Apps" proposal and territorial discussion
- [NIP-CF PR #2277](https://github.com/nostr-protocol/nips/pull/2277) -- "Combine Forces" interoperability proposal
- [NIP-5B PR #2282](https://github.com/nostr-protocol/nips/pull/2282) -- "Embeddable Nostr Web Apps", fiatjaf review comments
- [Smart Widgets PR #2025](https://github.com/nostr-protocol/nips/pull/2025) -- interactive components proposal, stalled
- [NIP Proposal Process Issue #545](https://github.com/nostr-protocol/nips/issues/545) -- proposed submission workflow
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) -- kind number range semantics
- [NIP-89](https://nips.nostr.com/89) -- Recommended Application Handlers (existing app discovery)
- [NIP README](https://github.com/nostr-protocol/nips/blob/master/README.md) -- kind number registry (29001-29010 confirmed unclaimed)
- [PostMessage Vulnerabilities (Medium)](https://medium.com/@instatunnel/postmessage-vulnerabilities-when-cross-window-communication-goes-wrong-4c82a5e8da63) -- attack patterns
- [PostMessage + Sandbox Escape (InfoSec Write-ups)](https://infosecwriteups.com/postmessage-misconfiguration-ai-prompt-injection-sandbox-escape-xss-data-exfiltration-d1d29821a2de) -- CVE-2024-49038 analysis
- [iframe Sandbox Security (Mozilla Discourse)](https://discourse.mozilla.org/t/can-someone-explain-the-issue-behind-the-rule-sandboxed-iframes-with-attributes-allow-scripts-and-allow-same-origin-are-not-allowed-for-security-reasons/110651) -- allow-scripts + allow-same-origin escape
- [Microsoft PostMessage Security (MSRC Blog)](https://www.microsoft.com/en-us/msrc/blog/2025/08/postmessaged-and-compromised) -- postMessage vulnerability patterns
- [2026 iframe Security Risks (Qrvey)](https://qrvey.com/blog/iframe-security/) -- comprehensive iframe security guide

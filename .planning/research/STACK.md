# Technology Stack

**Project:** NIP-5C "Nostr Web Applets" Specification
**Researched:** 2026-04-05

## Critical Finding: NIP-5C Number Is Claimed

**NIP-5C is already claimed by fiatjaf's "Scrolls" (WASM programs) PR#2281**, opened 2026-03-22. If the project insists on using "5C", it will conflict with an existing open PR by the most influential Nostr developer. Available alternatives in the 5x range: **5D, 5E, 5F**.

However: whether this matters depends on whether the project wants to fight for the number or take the next one. PR#2281 is open, not merged. The milestone description says "NIP-5C" -- **the user should decide** whether to keep that number or switch. This research flags the conflict and proceeds with the assumption that the number choice is a decision for the roadmap, not a blocker for research.

**Confidence: HIGH** -- verified directly against nostr-protocol/nips repo open PRs.

## Recommended Stack

This milestone is primarily a specification writing exercise, not a code-heavy implementation. The "stack" here is the set of standards, formats, and tools used to write and submit the NIP.

### Specification Format

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Markdown | CommonMark | NIP document format | All NIPs in nostr-protocol/nips are plain markdown files |
| RFC 2119 keywords | BCP 14 | MUST/SHOULD/MAY semantics | NIP convention for requirement levels (used in NIP-42, NIP-46, etc.) |
| JSON | RFC 8259 | Wire format examples | NIP-01 events are JSON; all examples in JSON |

### NIP File Header Format (Verified)

Every NIP follows this exact setext-heading format:

```markdown
NIP-XX
======

Title of the NIP
-----------------

`draft` `optional`

[Body content...]
```

Status badge options: `draft`, `optional`, `mandatory`, `relay`. **No YAML frontmatter. No author fields. No date fields.**

### Referenced Standards

| Standard | Version/ID | Purpose | How Referenced |
|----------|-----------|---------|----------------|
| NIP-01 | Current (merged) | Event format, filter matching, relay verbs | "as defined in NIP-01" |
| NIP-5A | Current (merged 2026-03-25) | Manifest format, aggregate hash, requires tags | "as defined in NIP-5A" |
| NIP-07 | Current (merged) | window.nostr interface | "per NIP-07" |
| NIP-42 | Current (merged) | AUTH event kind 22242 | "per NIP-42 with additional tags" |
| NIP-44 | Current (merged) | Encryption methods | "per NIP-44" |

### Implementation Tools (for channel protocol phase)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | 5.9 | Channel protocol implementation in @napplet packages | Existing codebase language |
| Vitest | 4.x | Channel protocol tests | Existing test framework |
| Playwright | Current | E2E tests for channel behavior | Existing e2e framework |

### Submission Tools

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| gh CLI | Latest | Create PR to nostr-protocol/nips | Standard GitHub workflow |
| git | Latest | Version control | Fork + PR workflow |

## NIP-5A Content Summary (Source of Truth)

NIP-5A was **merged 2026-03-25** (PR#1538). Defines:

- **Kind 15128**: Root site manifest (replaceable, no d tag, one per pubkey)
- **Kind 35128**: Named site manifest (addressable, d tag = site identifier)
- **Kind 34128**: Legacy/deprecated individual file events
- `path` tags: `["path", "/absolute/path", "sha256hash"]`
- `server` tags: Blossom server hints
- `title`, `description`, `source` tags: Optional metadata
- Host server resolution: npub subdomain for root sites, pubkeyB36+dTag for named sites
- Path resolution via path tags, file resolution via Blossom/BUD-03

**PR#2287** (open, by hzrd149) extends NIP-5A with:
- `x` tag: `["x", "<sha256-hex>", "aggregate"]` for site aggregate hash
- **Kind 5128**: Manifest snapshot (regular event, captures version state)
- Aggregate hash computation algorithm (sort path lines, SHA-256)
- Copied sites with `a`/`A` lineage tags
- Snapshot addressing: `h<aggregateB36>.nsite-host.com`

## Kind Number Allocations

**The entire 29000-29999 range is unregistered in the official NIP kind number table.** Nearest registered kinds: 28934-28936 (NIP-43 Relay Access) and 30000+ (addressable events).

Current protocol usage:

| Kind | Name | Purpose |
|------|------|---------|
| 29000 | REGISTRATION | Napplet registration event |
| 29001 | SIGNER_REQUEST | NIP-07 proxy request |
| 29002 | SIGNER_RESPONSE | NIP-07 proxy response |
| 29003 | IPC_PEER | Inter-pane communication |
| 29004 | HOTKEY_FORWARD | Keyboard event forwarding |
| 29005 | METADATA | Napplet state metadata |
| 29006 | NIPDB_REQUEST | Event database request |
| 29007 | NIPDB_RESPONSE | Event database response |
| 29010 | SERVICE_DISCOVERY | Service capability query/response |

**These are postMessage bus kinds, never published to relays.** The NIP should make this explicit. They are not "nostr event kinds" in the relay sense -- they are message types on the iframe-to-shell postMessage channel that borrow NIP-01 wire format. This distinction matters for NIP acceptance and whether they belong in the README.md Event Kinds table (they probably should not).

## Related NIPs and Open PRs

| NIP | Status | Relevance |
|-----|--------|-----------|
| NIP-01 | Merged | Wire format we borrow (EVENT/REQ/CLOSE/AUTH/OK/EOSE/CLOSED/NOTICE/COUNT) |
| NIP-07 | Merged | `window.nostr` signer interface -- napplets get this proxied |
| NIP-42 | Merged | AUTH challenge-response -- our handshake adapts this pattern |
| NIP-44 | Merged | Encrypted payloads -- relevant for signer proxy NIP-44 operations |
| NIP-5A | Merged | Static websites / nsites -- our base layer for napplet hosting |
| NIP-5B (PR#2282) | Open draft | "Embeddable Nostr Web Apps" -- app listing kind 37348, app store discovery. Author: arthurfranca. |
| NIP-5C (PR#2281) | Open draft | "Scrolls" (WASM programs) -- kind 1227. Author: fiatjaf. **BLOCKS "5C" filename.** |
| NIP-89 | Merged | Application handlers -- "Open with" feature, related but different goal |
| PR#2287 | Open | NIP-5A aggregate hash extension -- we depend on this for version identity. Author: hzrd149. |
| NIP-CF (PR#2277) | Closed | "Combine Forces" convergence attempt by dskvr. Closed when NIP-5A merged. |
| NIP-C4 (PR#2274) | Closed | "Nostr Apps" by arthurfranca. Replaced by NIP-5B. |

### Political Landscape

The NIP-5A/5B/5C discussion has active participants with opinions:
- **hzrd149**: NIP-5A author, aggregate hash PR author. Focused on static website hosting.
- **arthurfranca**: NIP-5B author (app store listings). Views "nostr apps" as NIP-5A sites with NIP-07 support.
- **fiatjaf**: NIP-5C author (WASM scrolls). Most influential nostr developer.
- **dskvr**: NIP-CF author, napplet project author. Previously proposed convergence approach.

The napplet protocol is **orthogonal** to these existing proposals:
- NIP-5A = how files are hosted and served
- NIP-5B = how apps are discovered and listed
- NIP-5C (Scrolls) = how WASM programs run
- **Our NIP = how sandboxed web apps communicate with their host shell**

This orthogonality is actually advantageous for acceptance -- it doesn't compete with any existing proposal.

## PR Submission Process (Verified)

1. **Fork** `nostr-protocol/nips` on GitHub (default branch: `master`)
2. **Create branch** with new NIP file + README.md update
3. **Add NIP file**: `5C.md` (or chosen number)
4. **Update README.md**: Add to NIP list; optionally add kind numbers to Event Kinds table
5. **Open PR** with brief description
6. **Iterate on feedback** -- informal process, community + maintainer review

**Acceptance criteria** (from README.md):
1. Fully implemented in at least two clients and one relay -- when applicable
2. Should make sense
3. Optional and backwards-compatible
4. No more than one way of doing the same thing

**For our case**: "Two clients" = napplet SDK + hyprgate reference implementation. "One relay" = not applicable (postMessage, not WebSocket). Submit as `draft` `optional`.

**No PR template, CONTRIBUTING.md, or formal process** exists beyond README.md criteria.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Spec format | Markdown (plain) | reStructuredText, AsciiDoc | NIPs are all markdown -- no choice here |
| Requirement keywords | RFC 2119 (informal) | Formal IETF-style with BCP 14 header | Nostr NIPs use RFC 2119 words informally (NIP-07 says "must define" lowercase), but the more complex NIPs like NIP-42 capitalize them. Follow NIP-42 style |
| Examples | JSON in fenced code blocks | TypeScript type definitions | NIPs show wire format (JSON), not language-specific types |
| Diagrams | ASCII/text sequence diagrams | Mermaid, SVG | NIPs use text-only format; mermaid is not rendered in raw markdown on GitHub |
| Kind number registration | Document as postMessage-only bus kinds | Register 29xxx in NIP kind table | These never appear on relays -- registering them may misrepresent their scope |
| NIP number | 5C (match milestone name) or 5D (next available) | Arbitrary hex | 5x family groups "web content" NIPs together |

## No Installation Needed

This milestone requires no new dependencies. The specification is a markdown file. The channel protocol implementation uses the existing monorepo toolchain (TypeScript, tsup, turborepo, vitest, playwright).

## Sources

- nostr-protocol/nips repo: https://github.com/nostr-protocol/nips (verified 2026-04-05)
- NIP-5A merged spec: https://github.com/nostr-protocol/nips/blob/master/5A.md
- NIP-5A aggregate hash PR: https://github.com/nostr-protocol/nips/pull/2287
- NIP-5B (Embeddable Nostr Web Apps): https://github.com/nostr-protocol/nips/pull/2282
- NIP-5C (Scrolls, WASM): https://github.com/nostr-protocol/nips/pull/2281
- NIP-C4 (closed, replaced by 5B): https://github.com/nostr-protocol/nips/pull/2274
- NIP-CF (closed, convergence attempt): https://github.com/nostr-protocol/nips/pull/2277
- NIP-07: https://github.com/nostr-protocol/nips/blob/master/07.md
- NIP-42: https://github.com/nostr-protocol/nips/blob/master/42.md
- NIP kind table: README.md Event Kinds section in nostr-protocol/nips
- RFC 2119: https://datatracker.ietf.org/doc/html/rfc2119
- Existing SPEC.md (1520 lines) -- source material to distill

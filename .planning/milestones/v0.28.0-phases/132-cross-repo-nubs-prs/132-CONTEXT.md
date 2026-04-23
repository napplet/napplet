# Phase 132: Cross-Repo Nubs PRs - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning
**Mode:** Auto-generated (local spec drafting — cross-repo git ops deferred to manual)

<domain>
## Phase Boundary

Draft **4 NUB specs / amendments** as local artifacts in `.planning/phases/132/drafts/`:

1. **`NUB-RESOURCE.md` (NEW spec)** — complete draft: message catalog, scheme protocol surfaces (https/blossom/nostr/data), 8-code error vocabulary, MUST/SHOULD/MAY shell behavior contract, SSRF policy MUSTs, SVG rasterization MUSTs, default-OFF sidecar privacy rationale
2. **`NUB-RELAY-AMENDMENT.md`** — diff description amending existing NUB-RELAY spec at `~/Develop/nubs/` to add the optional `resources?` sidecar field with default-OFF privacy language
3. **`NUB-IDENTITY-AMENDMENT.md`** — diff description: `picture` / `banner` URLs flow through `resource.bytes()` (no wire change, doc clarification only)
4. **`NUB-MEDIA-AMENDMENT.md`** — diff description: `MediaArtwork.url` flows through `resource.bytes()` (no wire change, doc clarification only)

**IMPORTANT scope decision:** These files live in THIS repo (`/home/sandwich/Develop/napplet/.planning/phases/132-cross-repo-nubs-prs/drafts/`). No git operations on `~/Develop/nubs` (branch creation, commits, pushes, PR opening) happen in this phase — leaving actual PR creation to a manual step after review. This keeps the autonomous workflow constrained to this repo.

**Public-repo hygiene enforced:** Every draft MUST be `@napplet/*`-clean, `kehto`-clean, `hyprgate`-clean. Drafts MUST read as if they were landing directly in the public repo.

</domain>

<decisions>
## Implementation Decisions

### SSRF Policy MUSTs (LOCKED — from REQUIREMENTS POL-01..06 + PITFALLS Pitfall 6)

NUB-RESOURCE MUST specify:
- Private-IP block list at **DNS-resolution time** (not URL parse time) covering:
  - RFC1918: `10/8`, `172.16/12`, `192.168/16`
  - Loopback: `127/8`, `::1`
  - Link-local: `169.254/16`, `fe80::/10`
  - Unique-local: `fc00::/7`
  - Cloud metadata: `169.254.169.254`
- MIME byte-sniffing as **MUST** (no upstream `Content-Type` passthrough)
- Response size cap, fetch timeout, per-napplet rate limit, redirect chain cap as **SHOULD**

### SVG Handling MUSTs (LOCKED — from REQUIREMENTS SVG-01..03 + PITFALLS Pitfall 7)

NUB-RESOURCE MUST specify:
- Shell-side rasterization to PNG/WebP as **MUST**
- Prohibition on delivering `image/svg+xml` bytes to napplets as **MUST**
- Rasterization in sandboxed Worker with no network as **MUST**
- Caps as SHOULD: max input bytes (~5 MiB), max output dimensions (~4096×4096), wall-clock budget (~2s)

### Sidecar Privacy (LOCKED — from REQUIREMENTS SIDE-05 + PITFALLS Pitfall 10)

NUB-RELAY amendment MUST specify:
- Sidecar field as **OPTIONAL** with **default OFF**
- Opt-in is per-shell-policy with per-event-kind allowlist guidance
- Privacy rationale explicit (shell pre-fetching reveals user activity before user renders event)

### Scheme Protocol Surfaces (LOCKED — from REQUIREMENTS SCH-02..04)

NUB-RESOURCE MUST specify:
- `https:` scheme — shell-side network fetch with policy enforcement
- `blossom:` — Blossom hash → bytes resolution, canonical hash form (sha256:hex)
- `nostr:` — NIP-19 bech32 input, single-hop resolution semantics
- `data:` — RFC 2397 per normal

### Error Vocabulary (LOCKED — from REQUIREMENTS RES-03)

8 codes: `not-found`, `blocked-by-policy`, `timeout`, `too-large`, `unsupported-scheme`, `decode-failed`, `network-error`, `quota-exceeded`

### Claude's Discretion

- Exact spec prose (templates in ~/Develop/nubs/TEMPLATE-NN.md and existing NUB-CONFIG.md as reference)
- Exact heading hierarchy (match existing NUB spec style)
- Example envelopes (should include at minimum: successful bytes request, error response, sidecar hydration)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `~/Develop/nubs/TEMPLATE-NN.md` — NUB spec template
- `~/Develop/nubs/NUB-CONFIG.md` — most recent completed NUB spec; use as structural reference
- `~/Develop/nubs/README.md` — registry; would be amended if this phase did cross-repo git ops (it doesn't)
- Existing amendable specs (in ~/Develop/nubs/ branches):
  - `nub-relay` branch — NUB-RELAY spec
  - `nub-identity` branch — NUB-IDENTITY spec
  - `nub-media` branch — NUB-MEDIA spec

### Established Patterns

- NIP/NUB specs use plain markdown with atx headings
- Message envelope examples shown as JSON code blocks
- MUST/SHOULD/MAY tables for conformance
- Security Considerations section for every spec
- NUB specs must NOT reference `@napplet/*` private packages

### Integration Points

- The drafts serve as the authoring artifact for future PRs to napplet/nubs
- Phase 133 documentation sweep references NUB-RESOURCE by name
- Phase 134 verifies zero `@napplet/*`, `kehto`, `hyprgate` in all drafts

</code_context>

<specifics>
## Specific Ideas

Plan should fit in 1 plan with 4-5 tasks (one per spec + verification):
- Task 1: Draft NUB-RESOURCE.md (the largest deliverable, ~300-500 lines)
- Task 2: Draft NUB-RELAY-AMENDMENT.md (sidecar field, privacy, opt-in)
- Task 3: Draft NUB-IDENTITY-AMENDMENT.md (doc clarification, short)
- Task 4: Draft NUB-MEDIA-AMENDMENT.md (doc clarification, short)
- Task 5: Hygiene verification (zero @napplet/*, zero kehto, zero hyprgate across all 4 drafts) + write SUMMARY

OR 2 plans (types-first vs amendments):
- Plan 01: NUB-RESOURCE (the new spec)
- Plan 02: 3 amendments + hygiene

Single-plan model is probably simpler since the dependency between NUB-RESOURCE and the 3 amendments is purely conceptual (amendments reference NUB-RESOURCE by name).

Acceptance criteria:
- All 4 draft files exist at /home/sandwich/Develop/napplet/.planning/phases/132-cross-repo-nubs-prs/drafts/
- NUB-RESOURCE.md has message catalog + error vocabulary + scheme protocol surfaces + SSRF MUSTs + SVG MUSTs
- Each amendment draft has a clear "change description" section + updated passages
- Zero @napplet/*, zero kehto, zero hyprgate across all 4 drafts (enforced by grep)
- Each draft is self-contained and readable

</specifics>

<deferred>
## Deferred Ideas

- **Actual git operations on ~/Develop/nubs** — manual step (user creates branches, commits, pushes, opens PRs)
- **GitHub PR bodies and titles** — generated from draft content once user opens them
- **NUB registry table update in README.md** — manual step in the cross-repo action
- **Cross-repo CI / review automation** — not in this phase's scope

</deferred>

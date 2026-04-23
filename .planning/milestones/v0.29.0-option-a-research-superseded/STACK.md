# Stack Research — v0.29.0 Receive-Side Decrypt Surface (SEED-002)

**Domain:** `relay.subscribeEncrypted` on NUB-RELAY — types + SDK helper + spec amendment (napplet-side).
**Researched:** 2026-04-23
**Confidence:** HIGH — verified against in-repo source, nostr-tools 2.23.3 tarball (`/tmp/nt-inspect/package/lib/types/*.d.ts`), npm registry (`npm view`), and GitHub master (`nbd-wtf/nostr-tools`).

## Executive Answer

**No new dependencies, no version bumps, no new subpath exports.** This milestone is pure types + spec + SDK wrapper work. All crypto (NIP-44 v2 decrypt, NIP-17 / NIP-59 unwrap) stays shell-side, exactly as `relay.publishEncrypted` established in v0.24.0. The @napplet pin `nostr-tools ^2.23.3` is still `latest` on npm and ships everything a downstream shell needs (`nip44`, `nip17`, `nip59`, `nip04`, `signer`) as subpath exports. The `@napplet/nub/relay` barrel already covers every new message-type export; the existing `RelayOutboundMessage` / `RelayInboundMessage` / `RelayNubMessage` discriminated unions are the single place the new literals must be added for exhaustiveness to land cleanly.

The "stack change" here is ~5 new exported TypeScript interfaces + 2 union-member insertions + 1 SDK helper + 1 shim handler — **not a stack change**.

## Recommended Stack

### Core Technologies (unchanged — verification only)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.9.3 | Types + build | Strict mode already enforced (`strict: true` + `verbatimModuleSyntax: true`); new literal-union members gain exhaustiveness for free. No upgrade needed. |
| tsup | 8.5.0 | Build | Subpath exports for `./relay` / `./relay/types` / `./relay/shim` / `./relay/sdk` already correctly split by `packages/nub/tsup.config.ts`; new types land in the existing `./relay/types` entry with zero config change. |
| pnpm | 10.8.0 | Workspaces | No workspace graph change — no new package, no new cross-package dep. |
| turborepo | 2.5.0 | Orchestration | `pnpm -r build` + `pnpm -r type-check` already the milestone gate pattern (per v0.26.0–v0.28.0 VER-01 pattern). |

### Supporting Libraries — Napplet-side (unchanged; zero runtime crypto)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@napplet/core` | workspace:* | `NostrEvent`, `NostrFilter`, `EventTemplate`, `NappletMessage`, `NappletGlobal` | Everything the new `RelaySubscribeEncryptedMessage` + result types need — already in scope. No core change required *unless* the `NappletGlobal['relay']` surface is extended with a new `subscribeEncrypted()` method (see Integration Points below). |
| *(none)* | — | Runtime decrypt inside `@napplet/nub/relay` | **DO NOT add.** The entire security invariant of this milestone is that napplet-side packages never see a secret key. Decrypt is shell-side. |

### Supporting Libraries — Shell-side (reference only; downstream repo concern)

Listed for the spec's Security Considerations section and to make the type shapes match real shell consumers. **Not installed or imported anywhere in this monorepo.**

| Library | Version | Purpose | Why Relevant |
|---------|---------|---------|-------------|
| `nostr-tools` | ^2.23.3 (current `latest`, published 2026-03 per npm) | NIP-44 v2, NIP-17, NIP-59, NIP-04 | The canonical reference implementation a downstream shell will pair with `relay.subscribeEncrypted`. Our existing `nostr-tools ^2.23.3` dev-dep + `@napplet/vite-plugin` runtime dep already pins this range. |
| `nostr-tools/nip44` | subpath in 2.23.3 | `v2.encrypt` / `v2.decrypt` / `getConversationKey` | Matches `encryption: 'nip44'` default in the new message shape. v2 is the **only** version shipped; there is no `nip44.v1` export to worry about. |
| `nostr-tools/nip17` | subpath in 2.23.3 | `wrapEvent` / `wrapManyEvents` / `unwrapEvent` / `unwrapManyEvents` | Matches `unwrap: 'gift-wrap'` path. `unwrapEvent` + `unwrapManyEvents` are re-exports of the nip59 functions. |
| `nostr-tools/nip59` | subpath in 2.23.3 | `createRumor` / `createSeal` / `createWrap` / `wrapEvent` / `wrapManyEvents` / `unwrapEvent` / `unwrapManyEvents` + typed `Rumor = UnsignedEvent & { id: string }` | Shell's unwrap path for kind 1059 → kind 13 seal → inner rumor. The SEED's `rumor` field in the `relay.subscribeEncrypted.event` envelope is exactly this `Rumor` shape. |
| `nostr-tools/nip04` | subpath in 2.23.3 | Legacy `encrypt` / `decrypt` | Matches `encryption: 'nip04'` opt-in path. Still present, not deprecated from the library side. |
| `nostr-tools/signer` | subpath in 2.23.3 | `Signer` interface (`getPublicKey`, `signEvent`) | Reference shape for NIP-07 / NIP-46 proxying — shell-side only. |

### Development Tools (unchanged)

| Tool | Purpose | Notes |
|------|---------|-------|
| changesets 2.30.0 | Versioning | A `minor` changeset is appropriate for `@napplet/nub` (additive surface); `@napplet/core` gets a `minor` only if `NappletGlobal['relay'].subscribeEncrypted` is added to the window interface. |
| `@napplet/vite-plugin` 0.2.1 | NIP-5A manifest | Already depends on `nostr-tools ^2.23.3` as a build-time dep. No touch required by this milestone. |

## Installation

**No installs.** Milestone is types + spec + wrapper additions only.

```bash
# Verification gate (existing pattern from v0.26.0–v0.28.0 VER-01)
pnpm -r build
pnpm -r type-check
```

## Integration Points vs Existing `relay.publishEncrypted` Shape

Mirror the send-side precedent shipped in v0.24.0 byte-for-byte where it makes sense.

| Surface | Send-side (v0.24.0, shipped) | Receive-side (this milestone, proposed) | Notes |
|---------|------------------------------|-----------------------------------------|-------|
| Wire message | `RelayPublishEncryptedMessage` (line 136, `types.ts`) | `RelaySubscribeEncryptedMessage` | Add `subId: string` (mirrors `relay.subscribe`), `filters: NostrFilter[]`, `encryption?: 'nip44' \| 'nip04'` (default `'nip44'`), `unwrap?: 'gift-wrap' \| 'direct'`. |
| Result envelopes | 1 envelope (`relay.publishEncrypted.result`) | 4 envelopes (`relay.subscribeEncrypted.event`, `.eose`, `.closed`, `.error`) | Stream shape, not one-shot. `.event` carries `rumor: NostrEvent` (unsigned `UnsignedEvent & {id}` on the wire — choose between `NostrEvent` with nulled `sig`/`pubkey` or introducing a `Rumor` type alias; **recommend a new `Rumor` type in `@napplet/core`** to stay honest about the unsigned shape and keep consumers from accidentally treating it as a signed event). `.event` also carries `sender: string` per SEED §3. |
| SDK helper | `relayPublishEncrypted(template, recipient, encryption)` (sdk.ts:116) | `relaySubscribeEncrypted(filters, onRumor, onEose, opts?)` returning `Subscription` | Mirrors the existing `relaySubscribe(...)` ergonomics (sdk.ts:48). `opts?: { encryption?, unwrap?, relay? }`. |
| Shim API | `publishEncrypted()` in `shim.ts:183` | `subscribeEncrypted()` alongside `subscribe()` in `shim.ts:45` | Same correlation-ID + MessageEvent.source guard pattern. Subscription teardown via `{ close(): void }` identical to existing `subscribe()`. |
| Window surface | `window.napplet.relay.publishEncrypted` (core/types.ts:136) | `window.napplet.relay.subscribeEncrypted` | **Touches `@napplet/core`** — extends the `NappletGlobal['relay']` interface in `packages/core/src/types.ts`. `minor` version bump on `@napplet/core`. |
| Capability check | `shell.supports('nub:relay')` (no sub-feature probe) | `shell.supports('relay:encrypted-subscribe')` | **Recommend a new sub-feature probe** — not every shell will implement unwrap even if it implements `nub:relay`. The SEED notes the unwrap surface is separable; signal it via a `relay:*` capability key rather than forcing the whole NUB into "all or nothing". Precedent: `resource:scheme:*` probes in v0.28.0. |

### Discriminated Union Extension Points (Exhaustiveness)

`packages/nub/src/relay/types.ts` lines 262–279 — two member additions + one Rumor import from core:

```ts
// lines 262–267 — Napplet → Shell
export type RelayOutboundMessage =
  | RelaySubscribeMessage
  | RelayCloseMessage
  | RelayPublishMessage
  | RelayPublishEncryptedMessage
  | RelaySubscribeEncryptedMessage        // ← ADD
  | RelayQueryMessage;

// lines 270–276 — Shell → Napplet
export type RelayInboundMessage =
  | RelayEventMessage
  | RelayEoseMessage
  | RelayClosedMessage
  | RelayPublishResultMessage
  | RelayPublishEncryptedResultMessage
  | RelaySubscribeEncryptedEventMessage   // ← ADD
  | RelaySubscribeEncryptedEoseMessage    // ← ADD
  | RelaySubscribeEncryptedClosedMessage  // ← ADD
  | RelaySubscribeEncryptedErrorMessage   // ← ADD
  | RelayQueryResultMessage;
```

The `RelayNubMessage` top-level alias (line 279) picks up the new members for free. **No separate union needs to be created.** Downstream consumers narrowing on `msg.type` will get exhaustive `switch` checks if they use `never` assertion in the default branch.

### Barrel / Export Surface

`packages/nub/src/relay/index.ts` needs **no new subpath** — just additional `export type { ... }` lines alongside the existing 14 named exports (lines 21–36):

```ts
// Add to the existing `export type { ... }` block
  RelaySubscribeEncryptedMessage,
  RelaySubscribeEncryptedEventMessage,
  RelaySubscribeEncryptedEoseMessage,
  RelaySubscribeEncryptedClosedMessage,
  RelaySubscribeEncryptedErrorMessage,
```

…and add `subscribeEncrypted` to the shim re-export list (line 40) and `relaySubscribeEncrypted` to the SDK re-export list (line 44). The `@napplet/nub` `package.json` `exports` map already has `./relay` / `./relay/types` / `./relay/shim` / `./relay/sdk` — **no new subpath needed.**

### `Filter` type — use `@napplet/core`'s `NostrFilter`, not `nostr-tools`' `Filter`

Both the existing `RelaySubscribeMessage.filters` (types.ts:54) and `RelayQueryMessage.filters` (types.ts:116) use `NostrFilter[]` from `@napplet/core` — homegrown interface in `packages/core/src/types.ts:39–47`. **`RelaySubscribeEncryptedMessage.filters` MUST use the same `NostrFilter[]`.**

Shape comparison (verified from `/tmp/nt-inspect/package/lib/types/filter.d.ts`):

| Field | `@napplet/core` `NostrFilter` | `nostr-tools` `Filter` |
|-------|-------------------------------|------------------------|
| `ids?: string[]` | ✓ | ✓ |
| `authors?: string[]` | ✓ | ✓ |
| `kinds?: number[]` | ✓ | ✓ |
| `since?: number` | ✓ | ✓ |
| `until?: number` | ✓ | ✓ |
| `limit?: number` | ✓ | ✓ |
| `search?: string` | — | ✓ (NIP-50) |
| `[key: `#${string}`]` | ✓ | ✓ |

@napplet's `NostrFilter` is a strict subset. The shell's nostr-tools `Filter` is a superset. **No shape incompatibility** — a napplet's filter is always assignable to the shell's `Filter`. Re-filtering kind 14 / kind 1059 inside the envelope flow is trivially compatible: the shell sends the outer filter (typically `{ kinds: [1059], '#p': [userPubkey] }`) to the relay pool, unwraps each incoming 1059 to a 13 to an inner rumor (kind 14 for DMs per NIP-17), then delivers the rumor. The napplet's declared `filters` operate on the **outer** wrap — mirroring how NIP-17 consumers work today. Document this in the spec ("filters apply to outer wraps, not unwrapped rumors").

Alternative considered: accept nostr-tools' `Filter` directly for NIP-50 `search` support. **Rejected** — (a) introduces a runtime nostr-tools dep in `@napplet/nub`, violating the zero-nostr-tools invariant on napplet-side packages, and (b) `search` is relay-optional anyway. If ever needed, add `search?: string` to `@napplet/core`'s `NostrFilter` as a separate milestone.

### `Rumor` type — add to `@napplet/core`

The `.event` envelope payload is an **unsigned** event. Current `NostrEvent` requires `id`, `pubkey`, `sig`. Proposal: add to `packages/core/src/types.ts`:

```ts
/** An unwrapped NIP-17 / NIP-59 rumor — unsigned but ID-addressable. */
export interface Rumor {
  id: string;
  pubkey: string;       // the sender's pubkey extracted from the outer seal
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  // NOTE: no `sig` — rumors are unsigned by definition (NIP-59 §2)
}
```

This mirrors `nostr-tools`' `Rumor = UnsignedEvent & { id: string }` in `nip59.d.ts:2` without introducing the nostr-tools runtime dep.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Add `relay.subscribeEncrypted` to NUB-RELAY (Option A, chosen per SEED-002) | `identity.decrypt` per-event primitive on NUB-IDENTITY (Option B) | Low-level primitive for non-subscription flows (single-event decrypt after it arrives via another channel). SEED §3 notes this stays available as a future lower-level primitive but is explicitly not the primary surface for this milestone. |
| Reuse `@napplet/core` `NostrFilter` | Accept `nostr-tools` `Filter` directly | Only if NIP-50 `search` on encrypted subscriptions becomes a first-class requirement. Not the case for v0.29.0. |
| Introduce a typed `Rumor` interface in `@napplet/core` | Reuse `NostrEvent` with `sig: ''` convention | If downstream explicitly wants the type to match signed events for pass-through rendering. **Rejected** because it hides the unsigned-by-definition invariant and lets consumers forget that `sig` verification is meaningless for rumors. |
| New `shell.supports('relay:encrypted-subscribe')` capability probe | Lump into existing `nub:relay` | If the spec wanted all-or-nothing NUB support. **Rejected** — v0.28.0 already established the pattern of scheme-level / feature-level probes (`resource:scheme:*`, `perm:strict-csp`). Encrypted subscribe requires a signer proxy the plain `relay.subscribe` path does not; shells should be able to implement one without the other. |
| Default `encryption: 'nip44'` | Default `'nip04'` | Only if backward-compat with ancient clients. NIP-44 v2 is the current standard per the nostr-tools `v2` export and the existing send-side `relay.publishEncrypted` default. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `import { ... } from 'nostr-tools'` **anywhere in `@napplet/nub/*`** | Violates the invariant that napplet-side packages never touch a secret key. All crypto is shell-side. The SEED exists precisely because `window.nostr.nip44.decrypt` *works* inside a sandboxed iframe via `all_frames: true` — the fix is to *not have a decrypt surface in the iframe at all*. | Keep decrypt shell-side. Spec amendment references nostr-tools as reference material for shell implementors only. |
| Re-use `NostrEvent` for rumors with a fake `sig` | Type-level lie; downstream consumers may attempt signature verification against a bogus sig. | New `Rumor` interface in `@napplet/core` — explicitly unsigned. |
| `nip44.v1` / any `v1` export | Does not exist in `nostr-tools` 2.23.3 — only `v2` is exported (verified against `lib/types/nip44.d.ts`, lines 5–12). NIP-44 v1 was deprecated upstream before nostr-tools 2.x. | Always `nip44.v2.*` on the shell side. The on-wire `encryption: 'nip44'` literal implies v2 unambiguously. |
| Bump nostr-tools past `<3.0.0` | None published; `2.23.3` is still `latest` (confirmed 2026-04-23 via `npm view nostr-tools@latest`). No 3.x line exists. Pre-emptive major-bump adds risk for zero gain. | Keep the existing `^2.23.3` dev-dep + vite-plugin runtime-dep pin unchanged. |
| Add runtime dep on `nostr-tools` to `@napplet/core` or `@napplet/shim` | Would reintroduce a build-size tax and an unnecessary transitive surface for every napplet consumer. The crypto is done in the shell; the napplet's runtime has no reason to know nostr-tools exists. Also: napplet-side nostr-tools was **removed in v0.15.0 Phase 71** as a decision of record ("@napplet/shim stripped of all signing, keypair, AUTH code; nostr-tools dependency dropped"). Reintroducing it reverses a locked-in architectural decision. | Keep nostr-tools confined to `@napplet/vite-plugin` (build-time only, dynamic import, optional). |
| Rely on NIP-07 `window.nostr.nip44.decrypt` in napplets as a "temporary fallback" | This is the exact leak `relay.subscribeEncrypted` closes. Any temporary fallback keeps the iframe-escape path alive. | Spec-legal path is `relay.subscribeEncrypted` only. Document the extension leak in NIP-5D Security Considerations (SEED §3 scope bullet 3) and call it out in the NUB-RELAY amendment as a known non-mitigation. |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@napplet/nub@0.2.1` → `0.3.0` | `@napplet/core@0.x` (workspace) | Additive types; downstream consumers pinning `@napplet/nub@^0.2` may need `^0.3` if they narrow on the exhaustive `RelayNubMessage` union (new members). Document in changeset. |
| `@napplet/core@0.x` → `0.y` | `@napplet/shim`, `@napplet/sdk`, all of `@napplet/nub/*` | `minor` bump if `NappletGlobal['relay'].subscribeEncrypted` is added (recommended) + `Rumor` interface added. All in-tree consumers are `workspace:*`, so cross-package lock is automatic. |
| `nostr-tools@^2.23.3` | `@napplet/vite-plugin@0.2.1` (runtime dep) + root dev-dep | `2.23.3` is still `latest` as of 2026-04-23 (`npm view nostr-tools@latest`). No upgrade needed. `^2.23.3` is compatible with everything in the `2.x` line a downstream shell might install. |
| `@napplet/vite-plugin` | No change | Does not touch encrypted subscribe. Dynamic imports `nostr-tools/pure` + `nostr-tools/utils` only; never `nip17`/`nip44`/`nip59` at build time. |

## Stack Patterns by Variant

**If downstream shell wants minimal dep surface for encrypted subscribe:**
- Import only `nostr-tools/nip17` (the unwrap path)
- `nip17` re-exports `unwrapEvent` / `unwrapManyEvents` from `nip59`, so you get the whole gift-wrap unwrap for free without an explicit `nip59` import
- Pair with `nostr-tools/signer` + a NIP-07 or NIP-46 adapter the shell already has

**If downstream shell wants to support `encryption: 'nip04'` legacy path:**
- Additionally import `nostr-tools/nip04`
- Note: NIP-04 decrypt takes `(secretKey, pubkey, ciphertext)` — different signature from NIP-44 (which needs a conversation key precomputed via `nip44.v2.utils.getConversationKey(secretKey, pubkey)` then `nip44.v2.decrypt(ciphertext, conversationKey)`)

**If downstream shell wants `unwrap: 'direct'` (single-hop NIP-44, no gift-wrap):**
- Use `nip44.v2.decrypt` directly with no nip17/nip59 involvement
- Matches the existing `relay.publishEncrypted` → NIP-44 single-hop send path

## Sources

- **In-repo source (HIGH)** — `/home/sandwich/Develop/napplet/packages/nub/src/relay/{types,sdk,shim,index}.ts` — direct read, all line numbers cited above are current
- **In-repo source (HIGH)** — `/home/sandwich/Develop/napplet/packages/core/src/types.ts:22–90` — `NostrEvent` / `NostrFilter` / `EventTemplate` definitions; homegrown, not nostr-tools re-exports
- **In-repo source (HIGH)** — `/home/sandwich/Develop/napplet/packages/nub/package.json` — 38 subpath export map verified; no new subpath needed
- **In-repo source (HIGH)** — `/home/sandwich/Develop/napplet/packages/vite-plugin/src/index.ts:611–640` — confirmed nostr-tools is **build-time + dynamic-import only** in vite-plugin, no runtime or type-level coupling elsewhere
- **In-repo seed (HIGH)** — `.planning/seeds/SEED-002-receive-side-decrypt-surface.md` — scope, Option A lock-in, breadcrumbs, related decisions
- **npm registry (HIGH)** — `npm view nostr-tools@latest` → `2.23.3`, published ~2026-03 (1 month before research date); `dist-tags.latest = 2.23.3`; 7 direct deps (`@noble/*`, `@scure/*`, `nostr-wasm`)
- **npm tarball (HIGH)** — `nostr-tools-2.23.3.tgz` → `package/lib/types/nip{44,17,59,04,07,signer,filter}.d.ts` — direct read of published `.d.ts` surface; verified exactly the export signatures documented above
- **GitHub master (MEDIUM)** — `https://github.com/nbd-wtf/nostr-tools/blob/master/nip17.ts` — confirmed `wrapEvent` / `unwrapEvent` present on master, no deprecation annotations
- **GitHub releases (LOW)** — `https://github.com/nbd-wtf/nostr-tools/releases` — `WebFetch` returned only v2.0.0 notes; no 2.20–2.23 breaking changes surfaced in the releases feed. Cross-checked against tarball `.d.ts` (HIGH), which is the source of truth for the shipped surface. No breaking changes to `nip17` / `nip44` / `nip59` between 2.20 and 2.23.3 inferred from API stability.
- **In-repo decision of record (HIGH)** — PROJECT.md Key Decisions: "Remove crypto from napplet wire protocol" (v0.15.0), "window.nostr removed, nub-signer deleted" (v0.24.0), "relay.publishEncrypted added, NUB-RELAY updated" (v0.24.0) — direct precedent for the shell-mediated-crypto pattern this milestone extends.

---
*Stack research for: v0.29.0 Receive-Side Decrypt Surface — napplet-side types + SDK helper + NUB-RELAY spec amendment*
*Researched: 2026-04-23*

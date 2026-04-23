# Phase 135: First-Party Types + SDK Plumbing - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** Auto-generated (pure infrastructure — smart discuss skipped per workflow infrastructure-detection rule)

<domain>
## Phase Boundary

Ship the `@napplet/nub/identity` package's complete wire + SDK surface for `identity.decrypt` — type additions (`IdentityDecryptMessage` / `.result` / `.error` + `IdentityDecryptErrorCode` + `Rumor` + `NappletGlobal.identity.decrypt` method), shim handler + `decrypt()` binding, SDK `identityDecrypt()` helper + central re-exports — so Phase 137's public NUB-IDENTITY amendment can cite a shipped (not hypothetical) first-party surface. Workspace-wide `pnpm -r build` + `pnpm -r type-check` must exit 0 across all 14 packages. Identity-types-only tree-shake contract preserved (runtime symbols not pulled).

Phase boundary excludes: any shell-side decrypt implementation (downstream shell repo), class-gating enforcement logic (shell territory — Phase 137 spec amendment defines the MUST; this phase's SDK helper may MAY short-circuit locally per GATE-04 as observability only), empirical CSP-block verification (Phase 136), documentation sweeps (Phase 138), any spec amendment text (Phase 137 / 138).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — pure infrastructure phase. Guide decisions using:

1. **Established pattern:** `relay.publishEncrypted` in `packages/nub/src/relay/types.ts:137` and `packages/nub/src/relay/shim.ts` — direct send-side mirror. The receive-side surface follows the same one-shot request/result envelope shape.
2. **v0.28.0 Phase 128/129 4-surgical-edit pattern:** for central-shim (`packages/shim/src/index.ts`) and central-sdk (`packages/sdk/src/index.ts`) re-exports — precedent locked, replicate exactly.
3. **Existing identity shim surgical pattern:** `packages/nub/src/identity/shim.ts` already has generic `.error` routing at line 56–63 (any `identity.*.error` with `id` + `error` string rejects the pending promise) — the new `.error` surface can reuse this generic path OR the handler can add a typed `IdentityDecryptErrorCode` branch. Both are valid; pick the one that matches the existing identity .result routing style.
4. **v0.29.0 STATE.md locked decisions** (apply without further discussion):
   - Shell-enforcement invariant: shim-side class check is OBSERVABILITY-only; never the trust boundary
   - Rumor = `UnsignedEvent & { id: string }` (nostr-tools canonical); no fake `sig` field
   - Return shape: `{ rumor: Rumor, sender: string }`; `sender` is shell-authenticated, NOT napplet-derived
   - Wire shape mirrors `relay.publishEncrypted` (one-shot request/result)
   - No new `shell.supports('identity:decrypt')` capability string — `nub:identity` + class gating is the access control

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/nub/src/identity/types.ts` — complete existing identity message catalog (9 get* queries + 9 result messages + discriminated unions `IdentityRequestMessage` / `IdentityResultMessage` / `IdentityNubMessage`)
- `packages/nub/src/identity/shim.ts` — `pendingRequests` Map, `resolvePending`/`rejectPending`/`resolveOrReject` helpers, `sendRequest<T>()` wrapper with 30s timeout, public API functions, `installIdentityShim()` with double-install guard
- `packages/nub/src/identity/sdk.ts` — `requireIdentity()` guard + bare-name SDK helpers (`identityGetPublicKey`, etc.); add `identityDecrypt()` alongside
- `packages/nub/src/relay/types.ts:137` — `RelayPublishEncryptedMessage` direct send-side mirror; `RelayPublishEncryptedResultMessage` at :163 shows result envelope shape pattern
- `packages/shim/src/index.ts:104–105` — central shim already routes `identity.*` `.result` + `.error` types to `handleIdentityMessage`; new decrypt envelopes benefit from existing routing (SHIM-03 likely no-op — verify)
- `packages/sdk/src/index.ts:559–652` — central `identity` namespace object; :814–830 — central type re-exports block; add new surfaces alongside
- `packages/core/src/types.ts:22–30` — `NostrEvent` exists (for `identity.decrypt` input); :81–90 — `EventTemplate` exists (unsigned shape precedent — `Rumor` can follow); :430–470 — `NappletGlobal.identity` type block; add `decrypt` method here

### Established Patterns

- Correlation-ID tracking via `crypto.randomUUID()` keyed `pendingRequests` Map — cleanup on both resolve + reject paths
- Discriminated-union membership: add new message type to appropriate union (request or result); `never`-fallback in handler enforces exhaustiveness
- Central shim 4-surgical-edit pattern: import block → handleEnvelopeMessage routing branch → window.napplet mount property → install*Shim() call. Identity install already in place; decrypt benefits from existing routing — likely ZERO central-shim edits required
- Central SDK 4-surgical-edit pattern: namespace-object method → type re-exports → DOMAIN const (already `identity`) → bare-name helper re-export
- JSDoc with `@param` / `@returns` / `@example` on every public surface
- Zero nostr-tools runtime imports in any `@napplet/nub/*` package — decrypt crypto runs shell-side only, napplet-side package never imports nostr-tools

### Integration Points

- `packages/core/src/types.ts` `NappletGlobal.identity` — add `decrypt(event: NostrEvent): Promise<{ rumor: Rumor, sender: string }>` method type (and `Rumor` interface export)
- `packages/nub/src/identity/types.ts` — add 3 new interfaces + `IdentityDecryptErrorCode` + union membership
- `packages/nub/src/identity/shim.ts` — add `decrypt(event)` public function + `identity.decrypt.result` handler branch in `handleIdentityMessage`
- `packages/nub/src/identity/sdk.ts` — add `identityDecrypt(event)` bare-name helper
- `packages/shim/src/index.ts` — verify if adding `decrypt` to the `window.napplet.identity` mount at line 172 is a surgical edit required (decrypt function is already exported from `@napplet/nub/identity/shim`, and central-shim mounts the existing identity methods explicitly; yes — one surgical edit: import `decrypt` from `@napplet/nub/identity/shim` and add to the identity mount)
- `packages/sdk/src/index.ts` — identity namespace object (line 559) adds `decrypt(event)`; type re-exports (line 814+) add 3 new types + `IdentityDecryptErrorCode` + `Rumor`; bare-name helper re-export adds `identityDecrypt`

</code_context>

<specifics>
## Specific Ideas

No specific authoring choices — infrastructure phase. All patterns are locked from v0.24.0 (identity NUB origin), v0.24.0 `relay.publishEncrypted` (send-side mirror), and v0.28.0 Phase 128/129 (central shim/sdk 4-surgical-edit patterns).

Two locally testable gates derived from success criteria:
- Workspace `pnpm -r build` + `pnpm -r type-check` exit 0
- Tree-shake smoke test: import only `@napplet/nub/identity/types`; bundle SHOULD NOT contain `handleIdentityMessage`, `installIdentityShim`, or any shim runtime symbols (matches v0.28.0 VER-07 symbol-absence methodology)

</specifics>

<deferred>
## Deferred Ideas

None — discussion skipped (infrastructure phase).

Phase boundary enforcement (recorded for planner): all shell-side enforcement (class gating, signer consent, NIP-17 unwrap, outer-sig verify) lives OUTSIDE this repo. If planner finds itself tempted to stub or mock shell-side decrypt behavior in this phase, STOP — that's Phase 137 spec amendment territory.

</deferred>

# napplet

Monorepo for the **napplet** SDK -- libraries for building NIP-5D Nostr Web Applets - "napplets"

A **napplet** is a sandboxed web app that runs inside a **shell** (window manager). The shell and napplet communicate over `postMessage` using a JSON envelope format (`{ type, ...payload }`) defined by NIP-5D. The napplet never touches `localStorage`, relay connections, or signing keys directly -- the shell proxies everything through NUB interfaces.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [@napplet/core](packages/core) | `@napplet/core` | JSON envelope types (`NappletMessage`, `NubDomain`), NUB dispatch infrastructure (`registerNub`, `dispatch`), protocol constants and Nostr types. Imported by all other packages. |
| [@napplet/shim](packages/shim) | `@napplet/shim` | Side-effect-only window installer for napplet iframes. Importing `@napplet/shim` installs the `window.napplet` global and registers with the shell. Sends JSON envelope messages via postMessage. Zero named exports. |
| [@napplet/sdk](packages/sdk) | `@napplet/sdk` | Named TypeScript exports wrapping `window.napplet` for bundler consumers. Provides `relay`, `ifc`, `services`, `storage` objects plus NUB message type re-exports. |
| [@napplet/nub](packages/nub) | `@napplet/nub` | Consolidated NUB package. 10 domain subpaths (relay, storage, ifc, keys, theme, media, notify, identity, config, resource) with barrel + granular (types/shim/sdk) exports. Tree-shakable (`sideEffects: false`). Includes the v0.28.0 `resource` NUB for sandboxed byte fetching and the v0.29.0 `connect` + `class` NUBs for user-gated direct network access and shell-assigned security class. See [packages/nub/README.md](packages/nub/README.md) for the full subpath reference. |
| [@napplet/vite-plugin](packages/vite-plugin) | `@napplet/vite-plugin` | Vite plugin for NIP-5D manifest generation. Computes per-file SHA-256 hashes, signs a kind 35128 manifest event at build time, and injects `requires` meta tags. v0.29.0 ships a `connect?: string[]` option for user-gated direct-network origin declaration and a fail-loud inline-script diagnostic; the `strictCsp` option from v0.28.0 is `@deprecated` (accepts-but-warns) since the shell is now the sole runtime CSP authority. |

## Changelog

- **v0.29.0** — Two complementary tracks in one milestone:
  - **NUB-CONNECT + NUB-CLASS** — shell-assigned class integer (`window.napplet.class`), user-gated direct-network origins via manifest `connect` tags (`window.napplet.connect`), shell as sole runtime CSP authority, `@napplet/vite-plugin` `strictCsp` option deprecated in favor of shell-emitted CSP.
  - **Class-Gated Decrypt Surface** — `identity.decrypt(event)` on NUB-IDENTITY: NIP-04 / NIP-44 / NIP-17 auto-detect decrypt returning `{ rumor, sender }` where `sender` is shell-authenticated. Gated shell-side to napplets assigned `class: 1` per NUB-CLASS-1 (strict baseline posture with `connect-src 'none'` — plaintext trapped inside the frame). See `packages/nub/README.md` and [NIP-5D §Security Considerations](specs/NIP-5D.md#security-considerations) for details.

## Architecture

### Package Dependency Graph

```
@napplet/shim ──┐
                ├──► @napplet/nub ──► @napplet/core
@napplet/sdk  ──┘

@napplet/vite-plugin  (build-time only, depends on nostr-tools)
```

### Napplet-Side Communication

```
Shell (any compatible shell)                @napplet/shim
  ShellBridge                                window.napplet.relay (subscribe/publish/query)
  ├── JSON envelope message routing          window.napplet.ifc   (emit/on)
  ├── Identity via message.source            window.napplet.storage (get/set/remove)
  ├── ACL enforcement                        window.napplet.resource (bytes/bytesAsObjectURL)
  ├── Class assignment (class.assigned)      window.napplet.connect  (granted/origins)
  ├── Connect grant injection (CSP + meta)   window.napplet.class    (shell-assigned integer)
  ├── NUB dispatch (relay/signer/storage)    window.napplet.shell.supports(domain)
  └── IFC routing

◄────────── postMessage: { type: 'relay.subscribe', id, filters } ──────────►
◄────────── postMessage: { type: 'relay.event', subId, event }    ──────────►

@napplet/vite-plugin (build time)
  └── NIP-5D manifest generation + requires tag injection
```

The iframe sandbox requires only `allow-scripts` -- **no `allow-same-origin`**. Shells MAY add additional tokens (`allow-forms`, `allow-popups`, etc.) per shell policy. Napplets cannot access the host shell's DOM, cookies, localStorage, or service workers. All persistent state goes through the shell's proxies.

## v0.28.0 — Browser-Enforced Resource Isolation

v0.28.0 converts napplet iframe security from ambient trust ("napplets shouldn't fetch directly") to browser-enforced isolation ("napplets cannot fetch directly — the browser blocks it"):

- **New NUB:** `@napplet/nub/resource` ships a single scheme-pluggable primitive — `napplet.resource.bytes(url) → Blob`. URL space is scheme-pluggable: `https:` (shell-side network under policy), `blossom:sha256:<hex>` (hash-verified), `nostr:<bech32>` (single-hop NIP-19), `data:` (RFC 2397, decoded in-shim).
- **Strict CSP:** `@napplet/vite-plugin` ships a `strictCsp` option that emits a 10-directive baseline (`default-src 'none'` + `connect-src 'none'` in prod) as the first child of `<head>`. The browser blocks every `fetch()`, `<img src=externalUrl>`, `XMLHttpRequest`, and direct WebSocket; everything network-sourced flows through the resource NUB.
- **Optional sidecar:** Shells MAY pre-resolve resources referenced by `relay.event` envelopes via an opt-in (default-OFF) `resources?` field; napplet-side `resource.bytes(sidecarUrl)` calls then resolve from cache without a postMessage round-trip.
- **SVG rasterization:** Shells MUST rasterize SVG to PNG/WebP in a sandboxed Worker with no network — napplets never receive parseable XML.
- **Specs:** `specs/NIP-5D.md` ships a Security Considerations subsection; NUB-RESOURCE is drafted at `napplet/nubs`; NUB-RELAY/IDENTITY/MEDIA carry coordination amendments.
- **Shell-deployer guide:** `specs/SHELL-RESOURCE-POLICY.md` checklists the private-IP block list, sidecar opt-in, SVG caps, MIME allowlist, and redirect chain limits.

Demo napplets exercising the model end-to-end (profile viewer, feed napplet with inline images, scheme-mixed consumer) live in the **downstream shell repo** — this monorepo ships only the wire + SDK surface.

## v0.29.0 — NUB-CONNECT + Shell as CSP Authority

v0.29.0 adds two new NUBs that together let napplets explicitly request direct browser-level network access while keeping the shell as the sole runtime CSP authority:

- **NUB-CLASS** — the shell assigns every napplet an integer class at iframe-ready time via a single `class.assigned` postMessage envelope. Napplets read `window.napplet.class` (`number | undefined`). The class selects a posture from the `NUB-CLASS-$N` sub-track; v0.29.0 ships two track members.
- **NUB-CLASS-1** — default strict baseline. CSP posture: `connect-src 'none'`. Triggered when the napplet manifest declares no class-contributing NUB tags. Shell sends `class.assigned` with `class: 1`. No consent prompt.
- **NUB-CLASS-2** — user-approved explicit-origin posture. CSP posture: `connect-src <granted-origins>`. Triggered when the manifest contains `["connect", "<origin>"]` tags AND the user approves at first load per `(dTag, aggregateHash)`. Shell sends `class.assigned` with `class: 2` on approval, or `class: 1` on denial (the denied napplet is served under the NUB-CLASS-1 posture).
- **NUB-CONNECT** — the manifest-tag + origin-format + runtime-surface NUB that contributes to class determination. Napplets declare origins at build time via `@napplet/vite-plugin`'s `connect: string[]` option; the plugin normalizes, validates, emits one `["connect", "<origin>"]` tag per origin, and folds the normalized origin set into `aggregateHash` via a synthetic `connect:origins` entry so any origin change auto-invalidates prior grants. Napplets read `window.napplet.connect` (`{ granted: boolean; origins: readonly string[] }`). No postMessage wire — grants flow through the runtime CSP header the shell serves plus a shell-injected `<meta name="napplet-connect-granted">` tag read synchronously at shim install.
- **Inline scripts forbidden** — the shell is now the sole runtime CSP authority. `@napplet/vite-plugin` fails the build on any `<script>` element without a `src` attribute (the CSP baseline all shells enforce is `script-src 'self'`).

### Default to NUB-RESOURCE; reach for NUB-CONNECT only when necessary

Default to NUB-RESOURCE for avatars, static assets, one-shot byte fetches, and bech32 resolution. Reach for NUB-CONNECT only when you need: POST/PUT/PATCH methods, WebSocket/SSE, custom headers, long-lived connections, streaming responses, or third-party libraries that call `fetch()` directly and aren't reasonable to refactor.

Declaring a `connect` origin is a tax (user-facing prompt, full trust vote) — earn it by needing what NUB-RESOURCE can't give you. The shell has zero browser-level hook to observe, filter, or rate-limit post-grant traffic between a napplet and an approved origin; that is the fundamental tradeoff of NUB-CONNECT versus NUB-RESOURCE's shell-mediated model.

- **Specs:** `NUB-CLASS.md`, `NUB-CLASS-1.md`, `NUB-CLASS-2.md`, and `NUB-CONNECT.md` are drafted at `napplet/nubs`; `specs/NIP-5D.md` carries a generic class-delegation paragraph.
- **Shell-deployer guides:** [`specs/SHELL-CONNECT-POLICY.md`](specs/SHELL-CONNECT-POLICY.md) + [`specs/SHELL-CLASS-POLICY.md`](specs/SHELL-CLASS-POLICY.md) checklist the HTTP-responder precondition, residual meta-CSP refuse-to-serve requirement, consent-prompt MUSTs, grant-persistence key, revocation UX, class-determination authority, wire timing, and the cross-NUB invariant (`class === 2` iff `connect.granted === true`).

### Class-Gated Decrypt Surface (companion track)

The v0.29.0 milestone also ships `identity.decrypt(event)` on NUB-IDENTITY — a shell-mediated NIP-04 / NIP-44 / NIP-17 gift-wrap auto-detect decrypt primitive. Napplets call `window.napplet.identity.decrypt(event)` and receive `{ rumor, sender }` where `rumor = UnsignedEvent & { id }` (nostr-tools canonical) and `sender` is shell-authenticated from the outer seal signature (never napplet-derived from `rumor.pubkey`, which is attacker-controlled on unsigned rumors).

- **Class-gated shell-side:** `identity.decrypt` is legal only for napplets assigned `class: 1` per `NUB-CLASS-1.md`. Napplets under `NUB-CLASS-2` (user-approved direct-network posture) receive a `class-forbidden` error — plaintext could exfiltrate to approved origins with zero shell visibility otherwise.
- **8 error codes:** `class-forbidden`, `signer-denied`, `signer-unavailable`, `decrypt-failed`, `malformed-wrap`, `impersonation`, `unsupported-encryption`, `policy-denied`.
- **Shell MUSTs:** outer-wrap signature verify, impersonation check (`seal.pubkey === rumor.pubkey` for NIP-17 flows), outer-`created_at` hiding (NIP-59 intentional ±2-day randomization privacy floor preserved).
- **NIP-07 injection residual:** NIP-5D §Security Considerations adds the `### NIP-07 Extension Injection Residual` subsection documenting the `all_frames: true` content-script injection vector, empirical Chromium 144+ nonce-based `script-src` legacy-injection block (`violatedDirective: script-src-elem`), the honest `world: 'MAIN'` residual, and `connect-src 'none'` as structural mitigation.
- **Specs:** `NUB-IDENTITY.md` amended with `identity.decrypt` envelope triad; `NUB-CLASS-1.md` amended with SHOULD `report-to` + MUST `(dTag, aggregateHash)` violation-correlation.

## Origin

The napplet protocol is documented in the [NIP-5D specification draft](specs/NIP-5D.md). Any shell can host napplets, and any web app can become a napplet by importing `@napplet/shim`.

## Development

```bash
pnpm install
pnpm build        # Build all packages via turborepo
pnpm type-check   # TypeScript validation
```

### Publishing

Uses [changesets](https://github.com/changesets/changesets) for versioning:

```bash
pnpm version-packages   # Apply changesets, bump versions
pnpm publish-packages   # Build + publish to npm
```

## Related

- **[NIP-5D](specs/NIP-5D.md)** -- Protocol specification for the napplet-shell protocol

## License

MIT

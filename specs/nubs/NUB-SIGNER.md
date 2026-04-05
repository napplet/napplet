NUB-SIGNER
==========

NIP-07 Signer Proxy
--------------------

`draft`

**NUB ID:** NUB-SIGNER
**Namespace:** `window.nostr`
**Discovery:** `shell.supports("NUB-SIGNER")`

## Description

NUB-SIGNER provides a [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md)
`window.nostr` interface inside sandboxed iframes. Napplets cannot access the
host's signer extension directly because `allow-same-origin` is absent. The
shell installs a proxy `window.nostr` object that forwards all signing requests
to the user's actual signer (NIP-07 browser extension or NIP-46 remote signer)
and returns results transparently. The interface contract is defined entirely by
NIP-07 -- this spec adds no extensions.

## API Surface

```typescript
// NIP-07 interface (see NIP-07 for full specification)
interface WindowNostr {
  getPublicKey(): Promise<string>;
  signEvent(event: EventTemplate): Promise<NostrEvent>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}
```

This is the standard NIP-07 interface. NUB-SIGNER does not extend or modify it.

## Shell Behavior

- The shell MUST install `window.nostr` in the napplet iframe before AUTH
  completes (the proxy is available immediately on shim load).
- The shell MUST proxy `signEvent()` calls to the user's actual signer and
  return the signed event.
- The shell MUST proxy `getPublicKey()` to return the user's public key (not
  the delegated session key used for AUTH).
- The shell MAY enforce ACL checks on `sign:event`, `sign:nip04`, and
  `sign:nip44` capabilities before forwarding requests.
- The shell SHOULD require user consent before signing destructive event kinds
  (0: metadata, 3: contacts, 5: deletion, 10002: relay list).
- The shell MUST NOT expose the user's private key material to the napplet.

## Event Kinds

| Kind | Name | Direction | Description |
|------|------|-----------|-------------|
| 29001 | Signer request | napplet -> shell | `method` tag identifies the operation (e.g., `signEvent`, `getPublicKey`). `id` tag for correlation. `param` tags carry method arguments. |
| 29002 | Signer response | shell -> napplet | `id` tag matching request. `result` tag with JSON-serialized return value, or `error` tag with reason string. |

## Security Considerations

- The signer proxy is the most security-sensitive interface. The shell stands
  between untrusted napplet code and the user's signing keys.
- Destructive kinds (0, 3, 5, 10002) SHOULD trigger user consent prompts via
  the shell's consent flow.
- The shell SHOULD rate-limit signing requests to prevent abuse.
- Events signed via the proxy are signed by the user's real key and will be
  published to external relays. Napplets cannot distinguish proxy-signed
  events from locally-signed events.
- NIP-04 and NIP-44 encryption/decryption expose plaintext to the napplet.
  The shell MAY gate these behind explicit ACL capabilities (`sign:nip04`,
  `sign:nip44`).
- Signer request timeouts (30 seconds in the reference implementation) prevent
  indefinite blocking when the signer is unavailable.

## Implementations

- [@napplet/shim](https://github.com/sandwichfarm/napplet) (napplet-side: `packages/shim/src/index.ts`)
- [@napplet/shell](https://github.com/sandwichfarm/napplet) (shell-side: `packages/runtime/src/signer-handler.ts`)

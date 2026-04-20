NUB-RELAY Amendment: Sidecar Pre-Resolution
===========================================

`draft amendment`

**Amends:** NUB-RELAY (currently on `nub-relay` branch of napplet/nubs)
**Coordinated with:** NUB-RESOURCE (new spec, see companion PR)
**Wire change:** additive optional field on `relay.event`; backward-compatible

## Summary

This amendment adds an optional `resources?: ResourceSidecarEntry[]` field to the `relay.event` envelope so shells MAY pre-resolve byte resources referenced by an event before delivering the event to the subscribing napplet. The napplet's `resource.bytes(url)` call (per NUB-RESOURCE) resolves from a sidecar-pre-populated cache transparently when the URL matches a sidecar entry, eliminating a `postMessage` round-trip for the common "render avatar / artwork inline with the event" pattern.

Pre-resolution is **OPTIONAL** with **default OFF** for privacy reasons documented below. Conformant shells MUST NOT enable sidecar pre-resolution by default; opt-in is per-shell-policy with per-event-kind allowlist guidance.

## Wire Change

### Existing field set on `relay.event`

The current NUB-RELAY Wire Protocol table row for `relay.event`:

```
| `relay.event` | shell -> napplet | `subId`, `event` (NostrEvent) |
```

### Amended field set on `relay.event`

The amended row:

```
| `relay.event` | shell -> napplet | `subId`, `event` (NostrEvent), `resources?` (ResourceSidecarEntry[]) |
```

### Field semantics

`resources?: ResourceSidecarEntry[]` is an optional array of pre-resolved resource entries the shell speculatively fetched on the napplet's behalf. The shape of `ResourceSidecarEntry` is owned by NUB-RESOURCE; this amendment imports it conceptually:

```typescript
interface ResourceSidecarEntry {
  url: string;       // canonical URL form for this resource
  blob: Blob;        // pre-fetched bytes
  mime: string;      // shell-classified by byte-sniffing -- NEVER upstream Content-Type
}
```

The field is additive and backward-compatible: shells that omit it produce envelopes that parse identically to pre-amendment; napplets that ignore it behave exactly as before. NIP-5D §Wire Format already mandates that unrecognized fields are silently ignored; this amendment relies on that property.

### Wire example (with sidecar)

Shell pre-resolved the author's avatar before delivering a kind 1 event:

```
<- {
     "type": "relay.event",
     "subId": "sub-1",
     "event": {
       "id": "abc...",
       "pubkey": "def...",
       "kind": 1,
       "content": "hello world",
       "tags": [],
       "created_at": 1234567890,
       "sig": "..."
     },
     "resources": [
       {
         "url": "https://example.com/avatar.png",
         "blob": <Blob 4321 bytes>,
         "mime": "image/png"
       }
     ]
   }
```

### Wire example (without sidecar -- default)

Default behavior, identical to pre-amendment:

```
<- {
     "type": "relay.event",
     "subId": "sub-1",
     "event": { "id": "abc...", "pubkey": "def...", "kind": 1, "content": "hello world", "tags": [], "created_at": 1234567890, "sig": "..." }
   }
```

## Ordering Semantics

When `resources` is present and non-empty, conformant napplet shim implementations MUST hydrate the resource cache from the entries BEFORE delivering the event to the subscribing napplet's event handler. This ordering is load-bearing: it allows a synchronous `napplet.resource.bytes(url)` lookup inside the napplet's event handler to resolve from cache without a `postMessage` round-trip, which is the entire point of the sidecar.

Specifically: the shim MUST iterate the `resources` array, populate its `resource.bytes` single-flight cache (per NUB-RESOURCE) keyed by `url`, and only then invoke the napplet's `onEvent(event)` callback. Hydration is a synchronous, in-shim operation -- no shell round-trip is involved.

If a `resources` entry's `url` is already present in the cache (e.g., from a prior fetch or a prior sidecar hydration), the shim MUST treat the existing cache entry as authoritative and discard the duplicate sidecar entry. This makes hydration idempotent and prevents a buggy shell from clobbering an in-flight fetch.

## Default OFF Privacy Rationale

### Sidecar pre-resolution is OPTIONAL with default OFF

**Conformant shells MUST default sidecar pre-resolution to OFF.** Opt-in is per-shell-policy and SHOULD be configurable by the user (or by the shell deployer for community-deployed shells).

The privacy concerns motivating default-OFF:

- **Pre-fetching reveals user activity to upstream hosts before the napplet has rendered the event.** When a shell pre-fetches the avatar URL on every event in a 1000-event timeline, that becomes 1000 HTTP requests to upstream avatar hosts -- each one a fingerprint visible to the operator of that host (IP address, user-agent, time-of-fetch). The user has not yet chosen to render any of these events; pre-fetching makes the choice for them.
- **Encrypted DM events with embedded image URLs leak "user is online and got the message" telemetry.** A kind 4 / kind 1059 event with an inline `https://attacker.example.com/track.png` URL would, under naive pre-fetching, trigger a fetch as soon as the event arrives at the shell -- before the user opens the DM, possibly even when the user is AFK and would never have opened it.
- **Pre-fetch failure on host-down events forces the napplet to fall back to `resource.bytes()` anyway**, doubling latency and RAM cost compared to fetching only when the napplet actually needs the bytes.
- **Pre-fetch success on never-rendered events occupies shell content-cache memory speculatively.** A user who scrolls past 90% of their timeline has paid for 90% of those fetches in network, RAM, and (worst case) credentials.

Together these concerns make "always on" sidecar pre-resolution privacy-hostile and resource-wasteful. Default OFF is the safe baseline; opt-in is the considered choice.

### Per-event-kind allowlist guidance

Shells that opt in to sidecar pre-resolution SHOULD only pre-fetch URLs that match a per-event-kind allowlist defined in shell policy. Recommended starting policy:

- **Pre-fetch profile picture URLs** from kind 0 (metadata) events for authors the user follows, where the URL host is on a known-good Blossom or avatar-CDN allowlist.
- **Pre-fetch artwork URLs** from kind 31337 / 31938 (long-form / podcast) events the user has explicitly subscribed to.
- **Do NOT pre-fetch arbitrary `https:` URLs from event content** (kind 1, kind 4, kind 1059, etc.) -- this is the dominant fingerprinting vector and accounts for the bulk of "leaked-by-pre-fetch" attack surface.

Shells SHOULD also provide users with control over:
- Which event kinds receive sidecar pre-resolution (per-kind opt-in toggles).
- Which URL hosts are eligible for pre-resolution (host allowlist).
- Which napplets receive sidecar pre-resolution (per-napplet opt-in).

Opt-out at any granularity MUST be honored. A user who opts out of sidecar pre-resolution for a specific napplet, kind, or host MUST receive `relay.event` envelopes with no `resources` field for the matching events; the shell MUST NOT silently downgrade to "we still fetched it but didn't tell you" -- if the user opted out, the fetch MUST NOT have happened.

## Coordination with NUB-RESOURCE

The `ResourceSidecarEntry` type is owned by NUB-RESOURCE; this amendment imports it conceptually (the wire shape is identical). Implementations MAY share a single type definition to avoid drift. The shell's responsibility for byte-sniffing the `mime` field (never honoring upstream `Content-Type`) is enforced by NUB-RESOURCE policy and applies to sidecar entries equally -- the sidecar is not a bypass for byte-sniffing, the SVG rasterization MUST, the private-IP block list MUST, or any other Default Resource Policy rule. Pre-resolution is "the same fetch, just earlier"; every safety property of `resource.bytes` MUST hold for sidecar entries too.

## Backward Compatibility

The `resources?` field is optional and additive. Shells that do not implement sidecar pre-resolution simply do not emit it; napplets that do not implement sidecar consumption simply ignore it. NIP-5D §Wire Format already mandates that unrecognized fields are silently ignored; this amendment relies on that property to remain backward-compatible with both pre-amendment shells and pre-amendment napplets.

## Implementations

- (none yet)

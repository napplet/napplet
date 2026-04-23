NUB-MEDIA Amendment: Artwork URLs Flow Through NUB-RESOURCE
===========================================================

`draft amendment`

**Amends:** NUB-MEDIA (currently on `nub-media` branch of napplet/nubs)
**Coordinated with:** NUB-RESOURCE (new spec, see companion PR)
**Wire change:** none -- documentation clarification only

## Summary

The `MediaMetadata.artwork.url` field passed to `media.createSession()` and `media.updateSession()` is a URL string (per the existing NUB-MEDIA spec). This amendment clarifies that napplets fetch the bytes for this URL via `window.napplet.resource.bytes(url)` (per NUB-RESOURCE). No wire change is introduced -- `artwork.url` stays as a string on the wire and the `MediaMetadata` shape is unchanged.

## Documentation Clarification

The existing `MediaMetadata` interface declares `artwork` as an optional record with a URL string and an optional content hash:

```typescript
interface MediaMetadata {
  // ...
  artwork?: { url?: string; hash?: string };
  // ...
}
```

This amendment proposes the following note paragraph be inserted into the NUB-MEDIA spec immediately after the `MediaMetadata` interface block:

> **Resource resolution.** The `artwork.url` field is a URL string. Napplets and shells that need the artwork bytes (for example, to render album art on a media controls surface) MUST fetch them through NUB-RESOURCE: `window.napplet.resource.bytes(url)`. The optional `artwork.hash` field, when present, MAY be used by shells as a content-addressed cache key but is not a substitute for the URL fetch -- napplets address artwork by URL through the resource NUB. Direct `<img src="https://...">` loads will not work under the iframe sandbox model defined by NIP-5D (`sandbox="allow-scripts"`, no `allow-same-origin`); the shell is the sole network-fetch broker. Standard NUB-RESOURCE policy applies (private-IP block list at DNS-resolution time, MIME byte-sniffing, SVG rasterization, etc.).

## Rationale

Same rationale as the NUB-IDENTITY amendment: browser-enforced isolation routes all byte fetches through NUB-RESOURCE. Documenting this on NUB-MEDIA prevents napplet authors from reaching for direct `<img src=...>` for album art and discovering their music-player napplet renders broken artwork under a strict-CSP shell. The clarification also makes it explicit that the `artwork.hash` field is an optimization hint, not a parallel fetch channel: the URL is authoritative, the hash is opportunistic.

## Backward Compatibility

No wire change. No type change. Documentation-only addition. Pre-amendment napplets that already use `resource.bytes(url)` for artwork continue to work; the clarification only documents the existing contract more clearly.

## Implementations

- (none yet)

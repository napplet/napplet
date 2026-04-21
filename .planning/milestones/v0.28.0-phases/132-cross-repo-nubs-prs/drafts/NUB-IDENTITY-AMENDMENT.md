NUB-IDENTITY Amendment: Picture and Banner URLs Flow Through NUB-RESOURCE
=========================================================================

`draft amendment`

**Amends:** NUB-IDENTITY (currently on `nub-identity` branch of napplet/nubs)
**Coordinated with:** NUB-RESOURCE (new spec, see companion PR)
**Wire change:** none -- documentation clarification only

## Summary

The `ProfileData.picture` and `ProfileData.banner` fields returned by `identity.getProfile()` are URL strings (per the existing NUB-IDENTITY spec). This amendment clarifies that napplets fetch the bytes for these URLs via `window.napplet.resource.bytes(url)` (per NUB-RESOURCE). No wire change is introduced -- the URL fields remain as strings on the wire and the `getProfile()` return type is unchanged.

## Documentation Clarification

The existing `ProfileData` interface declares `picture` and `banner` as URL strings:

```typescript
interface ProfileData {
  // ...
  picture?: string;   // URL
  banner?: string;    // URL
  // ...
}
```

This amendment proposes the following note paragraph be inserted into the NUB-IDENTITY spec immediately after the `ProfileData` interface block:

> **Resource resolution.** The `picture` and `banner` fields are URL strings. Napplets that need the bytes (for example, to render an `<img>` via an object URL) MUST fetch them through NUB-RESOURCE: `window.napplet.resource.bytes(url)`. Napplets MUST NOT attempt direct `<img src="https://...">` loads -- sandboxed napplets cannot make direct network requests under the iframe sandbox model defined by NIP-5D (`sandbox="allow-scripts"`, no `allow-same-origin`). Conformant shells expose every external byte resource through NUB-RESOURCE, including profile pictures and banners. The shell applies the standard NUB-RESOURCE policy to these fetches (private-IP block list at DNS-resolution time, MIME byte-sniffing, optional SVG rasterization, etc.).

## Rationale

Browser-enforced isolation (per NIP-5D Security Considerations and the strict-CSP shell posture) blocks napplet `connect-src`, so the canonical fetch path for any external byte resource is NUB-RESOURCE. Documenting this on NUB-IDENTITY removes ambiguity for napplet authors who would otherwise reach for `<img src=...>` and discover their profile-viewing napplet renders broken images under a strict-CSP shell. The clarification also makes it explicit that the same SSRF / SVG / MIME-sniffing protections that apply to napplet-initiated `resource.bytes()` calls also apply to picture / banner fetches -- there is no privileged "identity bytes" path that bypasses Default Resource Policy.

## Backward Compatibility

No wire change. No type change. Documentation-only addition. Pre-amendment napplets that already use `resource.bytes(url)` for these fields continue to work; the clarification only documents the existing contract more clearly.

## Implementations

- (none yet)

# Research Summary: SDK Naming Patterns for Ontology Audit

**Domain:** Naming conventions across iframe bridge, pubsub, DI, and capability SDK libraries
**Researched:** 2026-04-01
**Overall confidence:** HIGH

## Executive Summary

The napplet SDK's naming conventions were compared against 20+ established SDKs spanning iframe bridges (Penpal, Comlink, Postmate, Zoid), event/pubsub systems (Socket.IO, mitt, nanoevents, Ably, Pusher), platform SDKs with DI interfaces (Prisma, Auth.js, tRPC, MCP, Capacitor, Shopify App Bridge, Electron, VSCode), and capability/permission systems (Web Permissions API, Android, Deno, AWS IAM, WASI, Cloudflare workerd).

The majority of napplet's naming aligns well with ecosystem conventions. The event API (`emit`/`on`/`subscribe`/`publish`/`query`), capability types (`Capability` with `domain:action` format), service types (`ServiceDescriptor`, `ServiceHandler`, `ServiceRegistry`), bridge naming (`ShellBridge`), and topic namespacing (colon-delimited prefixes) all match established patterns.

One significant naming tension was identified: the use of `*Hooks` for dependency injection interfaces. In the broader TypeScript SDK ecosystem, the established term for "implement this interface to integrate your platform with our SDK" is **Adapter** (Prisma, Auth.js, tRPC), not Hooks. "Hooks" carries strong React connotations and implies per-feature composable callbacks, not composite platform integration contracts. Renaming `RuntimeHooks` to `RuntimeAdapter` and `ShellHooks` to `ShellAdapter` would align the SDK with the dominant convention.

The domain-specific vocabulary (`shell`/`napplet`) is defensible. Multiple protocol SDKs use custom role names (Electron: main/renderer, Figma: sandbox/iframe, Shopify: host/app). The shell/napplet pair accurately describes the authority relationship and is more precise than generic alternatives like parent/child or host/client.

## Key Findings

**DI Interface Naming:** `RuntimeHooks` -> `RuntimeAdapter` is the highest-priority naming change. Prisma, Auth.js, and tRPC all use "Adapter" for this exact pattern. Sub-interfaces (`RuntimeRelayPoolHooks`, etc.) should drop the `Runtime` prefix when nested.

**Event/IPC API:** Already matches universal consensus. `emit` + `on` (mitt, Socket.IO, nanoevents). `subscribe`/`publish` for relay operations (Ably, Pusher). No changes needed.

**Capability System:** `Capability` type with `domain:action` format matches AWS IAM, OAuth scopes, and WASI conventions. `@napplet/acl` package name is fine -- `acl` describes the operation, `Capability` describes the type.

**Bridge Naming:** `ShellBridge` correctly matches the Bridge pattern (Shopify App Bridge, Capacitor). Keep as-is.

**Role Vocabulary:** `shell`/`napplet` is domain-specific but defensible. Every protocol SDK with asymmetric roles uses domain-specific terms.

## Implications for Roadmap

The ontology audit should prioritize:

1. **`*Hooks` -> `*Adapter` rename** across runtime and shell packages -- this is the only naming choice that meaningfully departs from ecosystem convention
2. **Sub-interface prefix cleanup** -- drop redundant `Runtime` prefix from nested adapter interfaces
3. **Validate everything else** -- confirm the rest matches conventions (it does)
4. **Document domain vocabulary** -- `shell`/`napplet` are intentional choices that need explanation in SDK docs

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Iframe bridge patterns | HIGH | Directly verified against Penpal, Comlink, Postmate, Zoid source/docs |
| Event/pubsub patterns | HIGH | Socket.IO cheatsheet, mitt/nanoevents API docs, Ably/Pusher docs |
| DI interface naming | HIGH | Prisma, Auth.js, tRPC all verified; consistent "Adapter" convention |
| Role vocabulary | HIGH | 14 SDKs surveyed; clear pattern categories |
| Capability naming | HIGH | Web Permissions API spec, WASI spec, Cloudflare docs, AWS IAM docs |

## Gaps to Address

- **"Bridge" vs "Runtime" confusion** -- The SDK has both `ShellBridge` (the mediator object) and `RuntimeAdapter` (the DI interface). These serve different purposes but the distinction should be documented clearly.
- **`nappStorage` vs `nappState` aliasing** -- Not addressed by this naming research. The alias relationship needs separate investigation during the ontology audit.

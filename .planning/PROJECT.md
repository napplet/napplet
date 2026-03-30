# Napplet Protocol SDK

## What This Is

A portable SDK for the napplet protocol — sandboxed Nostr mini-apps that run in restrictive iframes and delegate functionality (signing, storage, relay access) to a host shell via NIP-01 postMessage wire format. Extracted from [hyprgate](https://github.com/sandwichfarm/hyprgate) into standalone `@napplet/*` npm packages that any Nostr developer can install and build with.

## Core Value

Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — these exist in the extracted codebase. -->

- ✓ Pseudo-relay message router (NIP-01 REQ/EVENT/CLOSE/COUNT dispatch) — existing
- ✓ NIP-42 AUTH handshake with ephemeral session keypairs — existing
- ✓ ACL capability system (relay:read, relay:write, sign:*, storage:*) — existing
- ✓ NIP-07/NIP-44 signer proxy (napplet requests signatures from shell) — existing
- ✓ Storage proxy with scoped keys (pubkey:dTag:aggregateHash isolation) — existing
- ✓ Inter-pane pubsub via kind 29003 topic events — existing
- ✓ Napplet-side SDK (subscribe, publish, query, emit, on, nappStorage) — existing
- ✓ Shell-side runtime (createPseudoRelay factory, ShellHooks DI) — existing
- ✓ Vite plugin for NIP-5A manifest generation and signing — existing
- ✓ Replay attack detection on incoming events — existing
- ✓ ConsentRequest flow for destructive signing kinds — existing

### Active

<!-- Current scope. Building toward these for v1.0. -->

- [ ] Get decoupled packages building and working end-to-end (wiring fixes)
- [ ] Multi-napplet demo: 2 napplets + shell + visual message debugger
- [ ] ACL enforcement demo: allow/block flows visible in debugger
- [ ] Inter-napplet communication demo: napplet1 ↔ napplet2 messaging
- [ ] Signing delegation demo: napplet requests signature, shell proxies to signer
- [ ] Behavioral test matrix covering full capability surface
- [ ] Runtime tests for ACL allow/block scenarios
- [ ] Runtime tests for inter-napplet messaging (approved vs blocked)
- [ ] Runtime tests for storage scoping isolation
- [ ] Runtime tests for AUTH handshake success/failure paths
- [ ] Visual test runner showing pass/fail with message flow
- [ ] Refined NIP-5A specification based on working implementation
- [ ] Published @napplet/shim, @napplet/shell, @napplet/vite-plugin packages
- [ ] Napplet boilerplate / starter template

### Out of Scope

- Mobile native wrapper — web-first protocol, native later
- Framework-specific bindings (Svelte/React components) — SDK is framework-agnostic by design
- Multi-shell federation — single shell per page for v1
- IndexedDB storage backend — localStorage sufficient for v1
- Key rotation for ephemeral keypairs — complexity not justified yet
- Rate limiting on signer requests — document expected behavior, don't enforce yet

## Context

- **Origin**: Extracted from hyprgate Phases 26-27 (v1.4 milestone). Hyprgate is the Svelte reference implementation; this repo is the portable SDK.
- **Existing codebase**: Three packages (shim, shell, vite-plugin) already extracted. Builds pass (`pnpm build`, `pnpm type-check`). No test suite exists yet.
- **Known issues**: Permissive ACL default, fake event IDs on injected events, lossy storage quota calculation, AUTH race condition with queued messages, postMessage origin '*' trust boundary. See `.planning/codebase/CONCERNS.md`.
- **NIP-5A spec**: Draft lives in hyprgate at `specs/NIP-napplet-shell-protocol.md`. Will be refined here based on implementation learnings.
- **Protocol wire format**: NIP-01 relay messages (REQ, EVENT, CLOSE, COUNT, AUTH, NOTICE, EOSE, OK, CLOSED) over postMessage. Custom kinds: 29001 (signer/storage requests), 29002 (signer responses), 29003 (inter-pane events), 35128 (manifests).

## Constraints

- **ESM-only**: No CJS output — all packages are ESM
- **Zero framework deps**: No Svelte, React, Vue — framework-agnostic SDK
- **nostr-tools peer dep**: shim and shell depend on nostr-tools >=2.23.3 <3.0.0
- **iframe sandbox**: No allow-same-origin — everything proxied via postMessage
- **Monorepo tooling**: pnpm workspaces + turborepo + tsup + changesets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extract from hyprgate rather than rewrite | Proven protocol implementation, minimize risk | — Pending |
| Behavioral tests over unit tests first | Visually confirm protocol works end-to-end before testing internals | — Pending |
| Refine existing NIP-5A spec, not write new | Spec already captures protocol; implementation will surface needed changes | — Pending |
| Permissive ACL default kept for v1 | Ease of development; document risk, add restrictive mode later | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 after initialization*

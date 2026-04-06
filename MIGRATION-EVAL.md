# Migration Evaluation Report

**Date:** 2026-04-06
**Context:** Phase 69, v0.14.0 (Repo Cleanup & Audit)
**Scope:** All remaining non-package content in @napplet that may belong in @kehto or the nubs governance repo.

## Evaluation Criteria

Every item is judged against these four rules, derived from the v0.13.0 extraction boundary:

1. **Napplet-side development** (how to build napplets) -- stays in @napplet
2. **Shell/runtime integration** (how to host napplets) -- move to @kehto
3. **Protocol standard** (NIP/NUB specification) -- stays in @napplet or moves to nubs repo (github.com/napplet/nubs)
4. **Implementation-specific to runtime/shell** -- move to @kehto

## Summary Table

| Item | Type | Recommendation | Destination | Priority |
|------|------|---------------|-------------|----------|
| RUNTIME-SPEC.md | Internal reference doc | **Stay** | @napplet (repo root) | None |
| specs/NIP-5D.md | Protocol standard | **Stay** | @napplet specs/ | None |
| specs/nubs/README.md | Governance doc | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/NUB-RELAY.md | Interface spec | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/NUB-STORAGE.md | Interface spec | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/NUB-SIGNER.md | Interface spec | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/NUB-NOSTRDB.md | Interface spec | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/NUB-IPC.md | Interface spec | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/NUB-PIPES.md | Interface spec | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/TEMPLATE-NN.md | Governance template | **Move** | github.com/napplet/nubs | Medium |
| specs/nubs/TEMPLATE-WORD.md | Governance template | **Move** | github.com/napplet/nubs | Medium |
| skills/build-napplet/ | Skill (napplet-side) | **Stay** | @napplet skills/ | None |
| skills/integrate-shell/ | Skill (shell-side) | **Move** | @kehto | Low |
| skills/add-service/ | Skill (shell-side) | **Move** | @kehto | Low |

## RUNTIME-SPEC.md

**What it contains:** A 1528-line internal runtime reference document covering 17 sections: transport layer, authentication handshake, NIP-01 message routing, signer proxy, storage proxy, audio management, relay management, window creation, cache proxy (NIPDB), hotkey forwarding, service discovery, protocol layers, ACL capabilities, security model, NIP-C4 kind numbers, minimal viable implementation, and implementation notes. It opens with a clear header: "Internal Runtime Reference -- This document describes the @napplet SDK's internal protocol implementation. It is NOT the NIP standard."

**Evaluation against criteria:**

- Does it teach napplet-side development? **Partially** -- sections on transport (1), authentication (2), and message format (1.3-1.5) are relevant to napplet developers understanding the protocol.
- Does it teach shell/runtime integration? **Yes** -- the majority of the content (sections 3-13, 16) describes how the shell/runtime handles messages, enforces ACL, proxies signing, manages audio, discovers services, and implements the protocol engine. These are @kehto runtime internals.
- Is it a protocol standard? **No** -- it explicitly disclaims this: "It is NOT the NIP standard." NIP-5D is the protocol standard.
- Is it implementation-specific? **Mostly** -- sections on ACL bit flags, service registry dispatch, conformance testing, and minimal viable implementation are all implementation concerns.

**Recommendation: Stay in @napplet.**

**Rationale:** Despite documenting mostly @kehto runtime behavior, this file has value as a cross-cutting reference for the entire protocol ecosystem. It was renamed from SPEC.md to RUNTIME-SPEC.md in Phase 61 specifically to distinguish it from NIP-5D. The header already links to NIP-5D as the authoritative spec. Moving it to @kehto would orphan the protocol-level sections that benefit napplet-side developers. Duplicating it across repos creates a maintenance burden. The pragmatic choice is to leave it here as a single-point-of-truth reference that both @napplet and @kehto consumers can consult. If @kehto eventually needs its own implementation guide, it should be written fresh from @kehto's perspective, not by moving this file.

## specs/NIP-5D.md

**What it contains:** A 142-line NIP standard draft defining the napplet shell protocol: transport, wire format, authentication handshake, extension discovery, NUB framework overview, security considerations, and event kinds. Formatted in nostr-protocol/nips markdown style with setext headings.

**Evaluation against criteria:**

- Is it a protocol standard? **Yes** -- this is the canonical protocol specification for the napplet ecosystem. It defines the wire format that both @napplet/shim and @kehto/runtime implement.
- Is it napplet-side? **Both** -- it defines the contract between napplet and shell. It is consumed by implementors on both sides.
- Is it implementation-specific? **No** -- it describes protocol behavior, not implementation details.

**Recommendation: Stay in @napplet.**

**Rationale:** NIP-5D is the foundational specification for the entire napplet protocol. It belongs in the project that defines the napplet concept. @napplet is the "napplet protocol SDK" -- the spec is part of the SDK's identity. The NIP will eventually be submitted as a PR to nostr-protocol/nips, at which point the canonical copy moves upstream. Until then, @napplet is the natural home. The nubs repo references NIP-5D as `../NIP-5D.md` from `specs/nubs/` -- if NUB specs move to the nubs repo, they should update references to point to @napplet's copy (or the upstream NIP once submitted).

## specs/nubs/

**Overview:** 6 NUB interface specs (RELAY, STORAGE, SIGNER, NOSTRDB, IPC, PIPES), a governance README, and 2 proposal templates (TEMPLATE-NN.md, TEMPLATE-WORD.md). Total: 9 files.

**Current state of nubs repo (github.com/napplet/nubs):** Contains README.md, TEMPLATE-NN.md, and TEMPLATE-WORD.md only. The 6 NUB specs have NOT been moved there yet.

**Per-spec analysis:**

### NUB-RELAY (NIP-01 Relay Proxy)
- **What it defines:** The `window.napplet.relay` interface (subscribe, publish, query) and shell-side relay proxy behavior. Lists ACL checks, scoped relay support, and NIP-01 routing requirements.
- **Protocol or implementation?** Primarily **protocol** -- it defines the interface contract that any shell must implement to provide relay access. The API surface and MUST/MAY requirements are shell-agnostic. Implementation references (@kehto/shell) are in the Implementations section only.
- **Recommendation: Move to github.com/napplet/nubs.**

### NUB-STORAGE (Scoped Key-Value Storage)
- **What it defines:** The `window.napplet.storage` interface (getItem, setItem, removeItem, keys) and shell-side storage scoping/quota enforcement.
- **Protocol or implementation?** Primarily **protocol** -- defines the interface contract and data isolation rules that any shell must honor. The 512KB quota is called "reference default."
- **Recommendation: Move to github.com/napplet/nubs.**

### NUB-SIGNER (NIP-07 Signer Proxy)
- **What it defines:** The `window.nostr` interface inside sandboxed iframes. The spec explicitly states it adds no extensions to NIP-07 -- it defines how the shell proxies NIP-07 access.
- **Protocol or implementation?** Primarily **protocol** -- the interface is defined by NIP-07; this spec defines the proxy contract and security requirements.
- **Recommendation: Move to github.com/napplet/nubs.**

### NUB-NOSTRDB (Local Event Database)
- **What it defines:** The `window.nostrdb` interface (query, add, event, replaceable, count, subscribe) and shell-side database proxy behavior.
- **Protocol or implementation?** Primarily **protocol** -- defines the interface contract for local event database access, independent of backend (OPFS, IndexedDB, etc.).
- **Recommendation: Move to github.com/napplet/nubs.**

### NUB-IPC (Inter-Napplet Pub/Sub)
- **What it defines:** The `window.napplet.ipc` interface (emit, on) and topic-based pub/sub routing through the shell.
- **Protocol or implementation?** Primarily **protocol** -- defines the topic convention, event kind (29003), and routing rules that any shell must follow.
- **Recommendation: Move to github.com/napplet/nubs.**

### NUB-PIPES (Authenticated Point-to-Point Connections)
- **What it defines:** The `window.napplet.pipes` interface (open, onOpen, broadcast) with auth-on-open semantics. Includes wire format (PIPE_OPEN/ACK/CLOSE/CLOSED/ERROR), lifecycle state machine, and security model.
- **Protocol or implementation?** Entirely **protocol** -- this is an unimplemented draft spec. No implementation exists in either @napplet or @kehto.
- **Recommendation: Move to github.com/napplet/nubs.**

### Governance files (README.md, TEMPLATE-NN.md, TEMPLATE-WORD.md)
- **What they define:** The NUB proposal process, two-track system (NUB-WORD interfaces vs NUB-NN message protocols), governance rules, and contribution templates.
- **Protocol or implementation?** **Governance** -- defines the community process for extending the napplet protocol.
- **Recommendation: Move to github.com/napplet/nubs.**

**Overall rationale for moving all NUB specs:**

All 6 NUB specs define abstract interface contracts that any shell implementation must satisfy. They are not tied to @kehto's specific implementation. Phase 68 already updated all NUB specs to reference @kehto as the reference implementation (in Implementations sections) -- the specs themselves are implementation-neutral.

The nubs repo (github.com/napplet/nubs) already exists with the README and templates. NIP-5D Section "NUB Extension Framework" says: "NUB proposals are maintained at github.com/napplet/nubs." This is the stated canonical home. The specs should live where the governance says they live.

**Migration steps:**
1. Copy all 9 files from `specs/nubs/` to the nubs repo root
2. Merge with existing README/templates in nubs repo (nubs repo versions may need updating to match the Phase 68-updated versions in @napplet)
3. Update NUB-RELAY, NUB-STORAGE, NUB-SIGNER, NUB-NOSTRDB, NUB-IPC, NUB-PIPES references to NIP-5D to use full URL: `https://github.com/sandwichfarm/napplet/blob/main/specs/NIP-5D.md` (or upstream NIP URL once submitted)
4. Remove `specs/nubs/` from @napplet
5. Add a `specs/nubs/` symlink or README pointing to the nubs repo
6. Update any cross-references in RUNTIME-SPEC.md or NIP-5D.md to point to the nubs repo

## skills/build-napplet

**What it teaches:** How to build a napplet using @napplet/shim. Covers Vite project setup, @napplet/vite-plugin configuration, subscribe/publish/query relay API, nappletState storage, window.nostr NIP-07 proxy, inter-pane events, and service discovery. All code examples import from `@napplet/shim` or `@napplet/vite-plugin`.

**Evaluation against criteria:**

- Napplet-side development? **Yes** -- this is entirely about building napplets.
- Shell/runtime integration? **No** -- does not reference @kehto at all (correctly).
- Protocol standard? **No** -- it is a tutorial, not a spec.
- Implementation-specific to @kehto? **No** -- all imports and APIs are @napplet.

**Recommendation: Stay in @napplet.**

**Rationale:** This skill teaches the napplet developer experience using @napplet packages exclusively. It belongs with the packages it documents. The only mention of a shell is the prerequisite note: "A host shell running @kehto/shell (or a test harness that implements the NIP-01 postMessage protocol)" -- appropriate since napplets need a shell to run, but the skill itself is @napplet-focused.

## skills/integrate-shell

**What it teaches:** How to integrate @kehto/shell into a host application. Covers createShellBridge(hooks) wiring, ShellAdapter implementation, iframe registration via originRegistry, NIP-42 AUTH challenge, consent handling, and service registration. All code examples import from `@kehto/shell` and `@kehto/services`.

**Evaluation against criteria:**

- Napplet-side development? **No** -- this teaches shell/host development.
- Shell/runtime integration? **Yes** -- entirely focused on @kehto/shell integration.
- Protocol standard? **No** -- it is a tutorial.
- Implementation-specific to @kehto? **Yes** -- all imports are `@kehto/shell`, all types are from @kehto, all patterns are @kehto-specific.

**Recommendation: Move to @kehto.**

**Rationale:** Phase 68 already updated this skill to reference @kehto packages (ShellHooks renamed to ShellAdapter, @napplet/shell to @kehto/shell). Every code example, import, and API reference targets @kehto. A developer looking for shell integration guidance should find it in the @kehto repo, not in the @napplet SDK repo. Having shell-side documentation in the napplet-side SDK creates confusion about which repo is the source of truth for shell development.

## skills/add-service

**What it teaches:** How to implement a ServiceHandler and register it with the napplet runtime. Covers ServiceDescriptor, handleMessage(), onWindowDestroyed() cleanup, parsing INTER_PANE topic events, and wiring into hooks.services or runtime.registerService(). All code examples import from `@kehto/shell`.

**Evaluation against criteria:**

- Napplet-side development? **No** -- services are shell-side handlers. The only napplet reference is Step 4 (verifying discovery), which imports from @napplet/shim as a consumer.
- Shell/runtime integration? **Yes** -- teaches how to extend the shell with custom services.
- Protocol standard? **No** -- it is a tutorial.
- Implementation-specific to @kehto? **Yes** -- all imports are `@kehto/shell`, references `packages/services/src/audio-service.ts` as the canonical example.

**Recommendation: Move to @kehto.**

**Rationale:** Same as integrate-shell -- this skill teaches @kehto development. The napplet-side verification snippet (Step 4) could remain as a cross-reference, but the skill's primary audience is shell/runtime developers. The reference implementation pointer (`packages/services/src/audio-service.ts`) already lives in kehto.

## Other Content

### README.md (repo root)
- Standard package README. Describes @napplet as a 4-package SDK. Already updated for v0.13.0.
- **Recommendation: Stay.** No action needed.

### CLAUDE.md (repo root)
- Project instructions for AI assistants. Describes packages, tech stack, conventions, architecture.
- **Recommendation: Stay.** This is repo-specific configuration.

### packages/ source code
- Not in evaluation scope (already settled as @napplet per plan instructions).
- **Recommendation: Stay.** The 4 packages (core, shim, sdk, vite-plugin) are @napplet's reason for existing.

## Action Items

Prioritized list of recommended actions for future milestones:

### Priority: Medium

1. **Move specs/nubs/ to github.com/napplet/nubs** -- All 9 files (6 NUB specs + README + 2 templates). The nubs repo already exists with a README and templates; merge the Phase 68-updated versions. Update NIP-5D cross-references to use absolute URLs. Add a `specs/nubs/` pointer file in @napplet noting the move. This aligns the repo structure with what NIP-5D Section "NUB Extension Framework" already states.

### Priority: Low

2. **Move skills/integrate-shell/ to @kehto** -- Copy to `skills/integrate-shell/` in the kehto repo. Remove from @napplet. Optionally leave a one-line pointer file in @napplet directing users to @kehto.

3. **Move skills/add-service/ to @kehto** -- Same approach as integrate-shell. Copy to `skills/add-service/` in kehto. Remove from @napplet.

### Priority: None (no action needed)

4. **RUNTIME-SPEC.md** -- Leave as-is. Serves as a cross-cutting internal reference.
5. **specs/NIP-5D.md** -- Leave until submitted upstream to nostr-protocol/nips.
6. **skills/build-napplet/** -- Leave as-is. Napplet-side skill belongs in @napplet.
7. **README.md, CLAUDE.md, packages/** -- Already correctly placed.

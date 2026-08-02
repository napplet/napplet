# @napplet/skills

## 0.3.1

### Patch Changes

- b3f0007: Accept independent NAP-INTENT archetype roles and payload conventions, and require structured invoke results.

## 0.3.0

### Minor Changes

- d201bd0: Add the `fs` NAP domain — shell-mediated virtual filesystem access ([NAP-FS](https://github.com/napplet/naps/pull/88)).

  Ships the virtual filesystem operations — `info`, `pickFile`, `pickFiles`, `pickDirectory`, `pickSaveFile`, `stat`, `list`, `read`, `write`, `mkdir`, `remove`, `move`, `watch`, `unwatch` — plus the runtime-pushed `fs.changed` event, reachable through `window.napplet.fs`, `@napplet/nap/fs`, and `@napplet/sdk`. The runtime owns host paths, mounts, backing store, normalization, policy, and authorization; the napplet sees only virtual paths.

  Byte transfer uses RFC 4648 standard padded base64 text for `fs.write.data` and `FsReadResult.data` on the JSON wire. `FsLimits.maxReadBytes`, `FsLimits.maxWriteBytes`, byte range options, and read/write result counts refer to decoded bytes.

## 0.2.12

### Patch Changes

- 7b67562: Align INC and INTENT with their merged canonical contracts.

  INC topic subscriptions now receive one `IncEvent` containing the exact topic, runtime-attested sender, and optional payload. The runtime no longer fabricates a Nostr event. INC also exposes the symmetric channel API through `channel.open`, `channel.onOpened`, `channel.list`, and `channel.broadcast`; channel handles support `emit`, `on`, `onClosed`, and `close`, including bounded early-notification replay and terminal close retention.

  INTENT now accepts `invoke(request)` and `open(archetype, payload?, opts?)`, supports `behavior.newWindow`, and returns the canonical structured result with required `ok`, `archetype`, `action`, and `handled` fields. Remove the unmerged URI invocation, `onDelivery`, `intent.deliver`, and acceptance-only result model.

  Archetype metadata now emits only the canonical `["archetype", slug, convention]` shape. Remove the draft-only `eventKinds` option and trailing `kind:<number>` fields.

## 0.2.11

### Patch Changes

- dd7b3a7: Update shipped generator, conformance CLI, and agent-skill guidance for
  queryless convention identities, optional same-tag event kinds, authoritative
  intent URIs, acceptance-before-delivery, runtime-attested sender, and
  carrier-neutral delivery without a public NAP-INC dependency.

## 0.2.10

### Patch Changes

- 49a8658: Make developer onboarding CLI-first from installation through deployment. The
  Napplet CLI now creates starters, owns deployment metadata, installs agent
  skills, prints a linked developer guide, and ships as checksum-verified
  standalone binaries. The boilerplate
  generator no longer prompts for deployment metadata, and the bundled skills
  teach the same ordered workflow as the CLI, docs, and web app.

## 0.2.9

### Patch Changes

- d6291de: Point generated projects to the current skills, remove undocumented build-time config guidance, and keep hard `count` requirements from being dropped by the Vite plugin.

## 0.2.8

### Patch Changes

- 0c76ded: Align NAP-OUTBOX publish fanout with the current draft by replacing
  `targetAuthors` with explicit `toOutbox`, `toInboxes`, and validated `relays`
  guidance.

## 0.2.7

### Patch Changes

- dc00955: Align napplet authoring guidance with the current SDK/runtime contract.

## 0.2.6

### Patch Changes

- dd2b0bc: Harden napplet sandbox authoring and verification.

  - `@napplet/nap` decodes `data:` resource URLs without using browser `fetch`.
  - `@napplet/conformance-cli` flags direct browser network, storage, cookie, and external network-loaded asset surfaces in served napplet code.
  - `@napplet/conformance` reports the broader forbidden-surface check accurately.
  - `@napplet/skills` moves the sandbox authority contract into the top-level authoring flow so generated napplets route bytes, state, relays, signing, and links through shell-owned NAPs.

- 22d2e45: Align NAP-RESOURCE public type and docs with the canonical `htree:` resource
  scheme.

## 0.2.5

### Patch Changes

- 85683dc: Teach napplet authoring skills to prefer `@napplet/sdk` helpers for implementation calls, reserving direct `window.napplet?.domain` access for capability gates and true SDK gaps.

## 0.2.4

### Patch Changes

- 4cfc04f: Teach napplet build skills to start from the boilerplate generator and preserve its tooling substrate.
- 0f3ed8c: Align napplet authoring skills with all NAP domains implemented by the current `@napplet/*` package surface, including explicit NAP-KEYS guidance for shortcuts and keybindings.

## 0.2.3

### Patch Changes

- bb5ff4b: Add `codex` as a project-local installer target that writes shipped napplet
  skills to `.codex/skills/<skill>/SKILL.md`.

## 0.2.2

### Patch Changes

- 82e50c2: Teach OUTBOX-first napplet construction, add a one-prompt `make-napplet` orchestration skill, and align copied package examples so agents do not default social reads and publishes to low-level NAP-RELAY.

## 0.2.1

### Patch Changes

- 688fb59: Align first-party packages with current NIP-5D runtime injection.

  Runtimes now expose available NAPs by injecting `window.napplet.<domain>`
  properties before napplet code runs. The retired generic shell capability
  surface is removed from active package APIs: no `window.napplet.shell`, no
  `shell.ready` / `shell.init` handshake, and no `@napplet/nap/shell` subpath.

  Conformance now injects the runtime namespace before fixture code and validates
  only NAP domain envelopes. Skills and package guidance now teach domain-property
  presence instead of the retired shell supports API.

## 0.2.0

### Minor Changes

- ced6043: Add `@napplet/skills` — three agent skills (`design-napplet`, `build-napplet`,
  `test-napplet`) that let a coding agent create a napplet end-to-end from one
  prompt, plus a `napplet-skills` CLI and programmatic API that install them into
  Claude Code, Cursor, Windsurf, `AGENTS.md` (Codex/Amp), Gemini, or Copilot. The
  skills are written against the verified live API surface (`@napplet/sdk` named
  API, injected-domain property presence for capability checks, scoped `storage`,
  the single-file artifact rule). The
  monorepo's root `skills/` is now a symlink to this package's `skills/` so the
  repo and the published package share one source of truth.

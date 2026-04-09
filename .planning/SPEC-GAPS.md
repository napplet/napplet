# Spec Gap Inventory

**Created:** 2026-04-08
**Phase:** 84 (Spec Gap Inventory)
**Purpose:** Catalog every piece of code in the napplet SDK not covered by NIP-5D or any NUB spec. Each entry includes location, purpose, evidence of no spec backing, and a recommendation category.

## Decision Summary (Phase 86)

**Decided:** 2026-04-09

| Verdict | Count | Items |
|---------|-------|-------|
| **drop** | 7 | GAP-01, GAP-02b, GAP-02c-config, GAP-02c-relay, GAP-03, GAP-04, GAP-05 |
| **defer** | 5 | GAP-02a, GAP-02c-keybinds, GAP-02c-wm, GAP-02c-audio, GAP-06 |
| **amend-spec** | 1 | GAP-07 |
| **removed (spec-backed)** | 1 | GAP-09 (IFC NUB draft) |

### Action Items

| Action | What | Next Milestone |
|--------|------|----------------|
| Delete code | `Capability` type + `ALL_CAPABILITIES` from core/types.ts | v0.19.0 |
| Delete code | 7 superseded TOPICS (AUTH + STATE_*) from core/topics.ts | v0.19.0 |
| Delete code | 3 config TOPICS (shell:config-*) from core/topics.ts | v0.19.0 |
| Delete code | 3 scoped relay TOPICS (shell:relay-scoped-*) from core/topics.ts | v0.19.0 |
| Delete code | `SHELL_BRIDGE_URI` from core/constants.ts | v0.19.0 |
| Delete code | `REPLAY_WINDOW_SECONDS` from core/constants.ts | v0.19.0 |
| Delete code | `PROTOCOL_VERSION` from core/constants.ts | v0.19.0 |
| Audit conformance | window.nostrdb proxy vs napplet/nubs#4 NUB spec | Future |
| Amend NIP-5D | Add keyboard forwarding to spec or create keyboard NUB | Future |

## Categories

| Category | Meaning |
|----------|---------|
| `future-nub` | Functionality that will become NUB messages (PR coming or planned) |
| `unknown` | No clear home yet -- needs a drop-or-amend decision |
| `superseded` | Replaced by existing NUB messages or removed protocol features |
| `shell-only` | Shell implementation concern, not an SDK/spec concern |

## Summary Table

| ID | What | Where | Category | Description |
|----|------|-------|----------|-------------|
| GAP-01 | `Capability` type + `ALL_CAPABILITIES` | core/src/types.ts:63-93 | shell-only | ACL string union for capability enforcement |
| GAP-02a | TOPICS -- future NUB entries | core/src/topics.ts:49-54,78 | future-nub | 5 topics for cross-napplet coordination |
| GAP-02b | TOPICS -- superseded entries | core/src/topics.ts:38,42-47 | superseded | 7 topics replaced by storage.* NUB or AUTH removal |
| GAP-02c | TOPICS -- unknown entries | core/src/topics.ts:57-75,81-84 | unknown | 16 topics with no clear spec home |
| GAP-03 | `SHELL_BRIDGE_URI` | core/src/constants.ts:29 | superseded | NIP-42 AUTH pseudo-relay URI (AUTH removed in v0.15.0) |
| GAP-04 | `REPLAY_WINDOW_SECONDS` | core/src/constants.ts:38 | shell-only | Replay protection constant |
| GAP-05 | `PROTOCOL_VERSION` | core/src/constants.ts:19 | unknown | Version string not defined in NIP-5D |
| GAP-06 | `window.nostrdb` proxy | shim/src/nipdb-shim.ts:1-224 | future-nub | Parallel NIP-DB local cache protocol |
| GAP-07 | `keyboard.forward` shim | shim/src/keyboard-shim.ts:1-91 | unknown | Hotkey forwarding protocol |
| ~~GAP-09~~ | ~~IFC channel types~~ | ~~nubs/ifc/src/types.ts:106-207~~ | ~~removed~~ | ~~Spec-backed: IFC NUB draft in napplet/nubs~~ |

---

## GAP-01: Capability Type and ALL_CAPABILITIES Constant

**Category:** `shell-only`

### What it is

A TypeScript string union type `Capability` defining 10 ACL capability strings, and a corresponding `ALL_CAPABILITIES` constant array containing all values. These represent the permissions that a shell's ACL system can grant or revoke from a napplet.

### Where

`packages/core/src/types.ts:63-93`

Exported from `packages/core/src/index.ts:44-45`:
```ts
export type { Capability } from './types.js';
export { ALL_CAPABILITIES } from './types.js';
```

### Code snippet

```ts
export type Capability =
  | 'relay:read'
  | 'relay:write'
  | 'cache:read'
  | 'cache:write'
  | 'hotkey:forward'
  | 'sign:event'
  | 'sign:nip04'
  | 'sign:nip44'
  | 'state:read'
  | 'state:write';

export const ALL_CAPABILITIES: readonly Capability[] = [
  'relay:read', 'relay:write', 'cache:read', 'cache:write',
  'hotkey:forward', 'sign:event', 'sign:nip04', 'sign:nip44',
  'state:read', 'state:write',
] as const;
```

### Evidence of no spec backing

NIP-5D Section "Security Considerations" states: *"Storage isolation, signing safety, relay access control, and ACL enforcement are defined by their respective NUB specs."* However, no NUB spec actually defines these capability strings. The Capability type is an SDK artifact from when the ACL package lived in this monorepo (extracted to a separate repo in v0.13.0). The strings themselves are not referenced by NIP-5D or any NUB message type definition.

### Reasoning

ACL enforcement is a shell implementation detail. The strings `relay:read`, `sign:event`, etc. are how one particular shell (the reference implementation) labels its internal permissions. Other shell implementations could use different granularity or naming. This is not a protocol-level concern -- it belongs in the shell's ACL implementation, not in the SDK's core package.

### Cross-references

- `hotkey:forward` capability relates to GAP-07 (keyboard forwarding shim)
- `cache:read`/`cache:write` capabilities relate to GAP-06 (nostrdb proxy)
- `state:read`/`state:write` capabilities use old "state" naming, while the NUB uses "storage"

### Decision

**Verdict: drop** — Remove `Capability` type and `ALL_CAPABILITIES` constant from `@napplet/core`. ACL strings are a shell implementation detail.

---

## GAP-02: TOPICS Constant

The `TOPICS` constant in `packages/core/src/topics.ts` defines 28 IPC topic strings from the pre-v4 era when napplet communication used NIP-01 kind 29003 events with `t` tags. NIP-5D says nothing about topic constants. The IFC NUB defines envelope message types (`ifc.emit`, `ifc.event`, etc.) but does not prescribe a fixed set of topic strings.

The 28 topics break down into three categories:

### GAP-02a: Future NUB Topics

**Category:** `future-nub`

**Where:** `packages/core/src/topics.ts:49-54,78`

**Topics (5):**

| Constant | Value | Purpose |
|----------|-------|---------|
| `STREAM_CHANNEL_SWITCH` | `stream:channel-switch` | Request the shell switch to a different content stream/channel |
| `STREAM_CURRENT_CONTEXT_GET` | `stream:current-context-get` | Query the shell for the current stream context |
| `STREAM_CURRENT_CONTEXT` | `stream:current-context` | Response with the current stream context data |
| `PROFILE_OPEN` | `profile:open` | Request the shell open a user profile view |
| `CHAT_OPEN_DM` | `chat:open-dm` | Request the shell open a DM conversation |

```ts
STREAM_CHANNEL_SWITCH: 'stream:channel-switch',
STREAM_CURRENT_CONTEXT_GET: 'stream:current-context-get',
STREAM_CURRENT_CONTEXT: 'stream:current-context',
PROFILE_OPEN: 'profile:open',
CHAT_OPEN_DM: 'chat:open-dm',
```

**Evidence:** These represent cross-napplet coordination patterns (one napplet asking the shell to navigate to a profile, open a DM, or switch streams). They are meaningful protocol concepts that could become standardized IFC topic conventions or a dedicated "navigation" NUB. Currently they are just string constants with no spec defining their payload shapes or shell behavior.

**Reasoning:** These topics represent real user-facing interactions that multiple napplets would want to trigger. They deserve formalization as either IFC topic conventions or a new NUB.

**Decision: defer** — Keep these 5 topic constants. Will become NUB messages via upcoming PR.

### GAP-02b: Superseded Topics

**Category:** `superseded`

**Where:** `packages/core/src/topics.ts:38,42-47`

**Topics (7):**

| Constant | Value | Superseded by |
|----------|-------|---------------|
| `AUTH_IDENTITY_CHANGED` | `auth:identity-changed` | AUTH removed in v0.15.0 -- no longer applicable |
| `STATE_GET` | `shell:state-get` | `storage.get` NUB message |
| `STATE_SET` | `shell:state-set` | `storage.set` NUB message |
| `STATE_REMOVE` | `shell:state-remove` | `storage.remove` NUB message |
| `STATE_CLEAR` | `shell:state-clear` | No direct NUB equivalent (storage.clear not in NUB), but `storage.remove` + `storage.keys` covers the use case |
| `STATE_KEYS` | `shell:state-keys` | `storage.keys` NUB message |
| `STATE_RESPONSE` | `napplet:state-response` | `storage.*.result` NUB messages |

```ts
AUTH_IDENTITY_CHANGED: 'auth:identity-changed',
STATE_GET: 'shell:state-get',
STATE_SET: 'shell:state-set',
STATE_REMOVE: 'shell:state-remove',
STATE_CLEAR: 'shell:state-clear',
STATE_KEYS: 'shell:state-keys',
STATE_RESPONSE: 'napplet:state-response',
```

**Evidence:** The `STATE_*` topics were the pre-v4 mechanism for napplet storage, using kind 29003 IPC events with `t` tags. The `storage.*` NUB messages (`storage.get`, `storage.set`, `storage.remove`, `storage.keys`) replaced them entirely. The shim's `state-shim.ts` now uses `storage.*` envelope messages directly (confirmed by reading the file -- it imports `StorageGetMessage`, `StorageSetMessage`, etc. from `@napplet/nub-storage`). `AUTH_IDENTITY_CHANGED` referenced NIP-42 AUTH which was removed in v0.15.0 (Phase 70).

**Reasoning:** These topics served a purpose that is now fully covered by NUB message types. They are dead protocol surface that should be removed.

**Decision: drop** — Remove all 7 superseded topics from `TOPICS` constant.

### GAP-02c: Unknown Topics

**Category:** `unknown`

**Where:** `packages/core/src/topics.ts:57-75,81-84`

**Topics (16):**

| Constant | Value | Purpose |
|----------|-------|---------|
| `SHELL_CONFIG_GET` | `shell:config-get` | Request shell configuration data |
| `SHELL_CONFIG_UPDATE` | `shell:config-update` | Update shell configuration |
| `SHELL_CONFIG_CURRENT` | `shell:config-current` | Response with current shell config |
| `KEYBINDS_GET` | `keybinds:get-all` | Request all keybind definitions |
| `KEYBINDS_ALL` | `keybinds:all` | Response with keybind list |
| `KEYBINDS_UPDATE` | `keybinds:update` | Update a keybind mapping |
| `KEYBINDS_RESET` | `keybinds:reset` | Reset keybinds to defaults |
| `KEYBINDS_CAPTURE_START` | `keybinds:capture-start` | Begin keystroke capture mode |
| `KEYBINDS_CAPTURE_END` | `keybinds:capture-end` | End keystroke capture mode |
| `WM_FOCUSED_WINDOW_CHANGED` | `wm:focused-window-changed` | Shell notifies napplets that the focused window changed |
| `RELAY_SCOPED_CONNECT` | `shell:relay-scoped-connect` | Connect to a specific relay for scoped operations |
| `RELAY_SCOPED_CLOSE` | `shell:relay-scoped-close` | Close a scoped relay connection |
| `RELAY_SCOPED_PUBLISH` | `shell:relay-scoped-publish` | Publish to a scoped relay |
| `AUDIO_REGISTER` | `shell:audio-register` | Register an audio source with the shell |
| `AUDIO_UNREGISTER` | `shell:audio-unregister` | Unregister an audio source |
| `AUDIO_STATE_CHANGED` | `shell:audio-state-changed` | Notify shell of audio state change |
| `AUDIO_MUTED` | `napplet:audio-muted` | Shell notifies napplet it was muted |

```ts
SHELL_CONFIG_GET: 'shell:config-get',
SHELL_CONFIG_UPDATE: 'shell:config-update',
SHELL_CONFIG_CURRENT: 'shell:config-current',
KEYBINDS_GET: 'keybinds:get-all',
KEYBINDS_ALL: 'keybinds:all',
KEYBINDS_UPDATE: 'keybinds:update',
KEYBINDS_RESET: 'keybinds:reset',
KEYBINDS_CAPTURE_START: 'keybinds:capture-start',
KEYBINDS_CAPTURE_END: 'keybinds:capture-end',
WM_FOCUSED_WINDOW_CHANGED: 'wm:focused-window-changed',
RELAY_SCOPED_CONNECT: 'shell:relay-scoped-connect',
RELAY_SCOPED_CLOSE: 'shell:relay-scoped-close',
RELAY_SCOPED_PUBLISH: 'shell:relay-scoped-publish',
AUDIO_REGISTER: 'shell:audio-register',
AUDIO_UNREGISTER: 'shell:audio-unregister',
AUDIO_STATE_CHANGED: 'shell:audio-state-changed',
AUDIO_MUTED: 'napplet:audio-muted',
```

**Evidence:** None of these topics are referenced by NIP-5D or any NUB spec. They represent shell-specific features (keybind management, window management, audio mixing, relay scoping, shell config) that were built for the reference shell implementation. NIP-5D explicitly delegates message type definitions to NUB specs, and no NUB defines these. The `RELAY_SCOPED_*` topics partially overlap with the relay NUB's `RelaySubscribeMessage.relay` field but use a completely different mechanism.

**Reasoning:** These topics cover real functionality but their future is unclear:
- **keybinds:** Could become a keybinds NUB, or could remain shell-specific
- **audio:** Could become an audio NUB, or could remain shell-specific
- **wm:** Window management is inherently shell-specific
- **shell:config:** Shell configuration access could be a NUB or stay shell-only
- **relay:scoped:** Overlaps with existing relay NUB `relay` field, may be redundant

Each needs an explicit decision from the spec author.

**Decisions (per sub-group):**
- **config (3):** **drop** — Shell config is shell-specific, remove `SHELL_CONFIG_*` topics
- **keybinds (6):** **defer** — Keep `KEYBINDS_*` topics, might become a NUB
- **wm (1):** **defer** — Keep `WM_FOCUSED_WINDOW_CHANGED`, might become a NUB
- **scoped relay (3):** **drop** — Relay NUB covers scoped relay via `relay` field, remove `RELAY_SCOPED_*` topics
- **audio (4):** **defer** — Keep `AUDIO_*` topics, might become an audio NUB

---

## GAP-03: SHELL_BRIDGE_URI Constant

**Category:** `superseded`

### What it is

A string constant `'napplet://shell'` intended as a pseudo-relay URI for NIP-42 AUTH relay tags, to distinguish shell-originated messages from real relay messages.

### Where

`packages/core/src/constants.ts:29`

Exported from `packages/core/src/index.ts:51`:
```ts
export { SHELL_BRIDGE_URI } from './constants.js';
```

### Code snippet

```ts
/**
 * URI identifying the shell bridge as a pseudo-relay endpoint.
 * Used in NIP-42 AUTH relay tags to distinguish shell messages from real relays.
 */
export const SHELL_BRIDGE_URI = 'napplet://shell' as const;
```

### Evidence of no spec backing

NIP-5D does not define any URI constants. The JSDoc explicitly references "NIP-42 AUTH relay tags" -- NIP-42 AUTH was removed from the napplet protocol in Phase 70 (v0.15.0, Protocol Simplification). The constant references a mechanism that no longer exists in the protocol.

### Reasoning

This constant served the AUTH handshake that was removed. With AUTH gone, there is no protocol reason for a pseudo-relay URI. The constant is dead protocol surface.

### Decision

**Verdict: drop** — Remove `SHELL_BRIDGE_URI` from `@napplet/core`. AUTH is gone, no protocol use.

### Cross-references

- Related to the AUTH removal in v0.15.0 (Phase 70)
- Related to GAP-02b `AUTH_IDENTITY_CHANGED` topic (also superseded by AUTH removal)

---

## GAP-04: REPLAY_WINDOW_SECONDS Constant

**Category:** `shell-only`

### What it is

A numeric constant defining the maximum age (30 seconds) for an event to be accepted, used for replay attack protection.

### Where

`packages/core/src/constants.ts:38`

Exported from `packages/core/src/index.ts:53`:
```ts
export { REPLAY_WINDOW_SECONDS } from './constants.js';
```

### Code snippet

```ts
/**
 * Maximum age in seconds for an event to be accepted (replay protection window).
 */
export const REPLAY_WINDOW_SECONDS = 30 as const;
```

### Evidence of no spec backing

NIP-5D mentions nothing about replay detection, replay windows, or event age validation. The protocol spec covers transport (postMessage), wire format (JSON envelope), identity (MessageEvent.source), and NUB negotiation. Replay protection is a shell implementation concern -- the shell decides whether to check event freshness and what window to use.

### Reasoning

Replay protection policy belongs in the shell's security implementation, not in the SDK's core package. Different shells may choose different replay windows (or none at all). Exporting this from `@napplet/core` implies it is protocol-level, but it is an implementation parameter.

### Decision

**Verdict: drop** — Remove `REPLAY_WINDOW_SECONDS` from `@napplet/core`. Shell defines its own replay policy.

---

## GAP-05: PROTOCOL_VERSION Constant

**Category:** `unknown`

### What it is

A string constant `'4.0.0'` representing the current napplet-shell protocol version. The "4.0.0" value marks the JSON envelope wire format era.

### Where

`packages/core/src/constants.ts:19`

Exported from `packages/core/src/index.ts:50`:
```ts
export { PROTOCOL_VERSION } from './constants.js';
```

### Code snippet

```ts
/**
 * Current protocol version for the napplet-shell communication protocol.
 * Version 4.0.0 marks the JSON envelope wire format era (NIP-5D v4).
 */
export const PROTOCOL_VERSION = '4.0.0' as const;
```

### Evidence of no spec backing

NIP-5D does not define a version constant. Nostr NIPs follow the convention of being versionless living documents -- they evolve through the NIP PR process. NIP-5D has no `version` field, no negotiation for protocol versions, and no mechanism for version checking between napplet and shell.

### Reasoning

This sits in an ambiguous position. On one hand, protocol versioning is useful for debugging and compatibility. On the other hand, NIP-5D is versionless by Nostr convention, and there is no version negotiation mechanism. The spec author needs to decide: either add version negotiation to NIP-5D (making this constant protocol-level) or remove it (making it shell-only metadata).

### Decision

**Verdict: drop** — Remove `PROTOCOL_VERSION` from `@napplet/core`. NIP-5D is versionless per Nostr convention.

---

## GAP-06: window.nostrdb Proxy (NIP-DB Shim)

**Category:** `future-nub`

### What it is

A complete `window.nostrdb` proxy that tunnels NIP-DB local cache operations through postMessage to the shell. It provides methods for querying, adding, and subscribing to events in the shell's local event cache (typically an OPFS-backed database like strfry or nostr-db). Uses its own `nostrdb.*` envelope message types outside any NUB domain.

### Where

`packages/shim/src/nipdb-shim.ts:1-224` (entire file)

Installed from `packages/shim/src/index.ts:340`:
```ts
installNostrDb();
```

### Code snippet

Key interface and message types:

```ts
interface NostrDbRequestMessage {
  type: 'nostrdb.request';
  id: string;
  method: string;
  content: string;
  subId?: string;
}

interface NostrDbResultMessage {
  type: 'nostrdb.result';
  id: string;
  method?: string;
  content: string;
}

interface NostrDbEventPushMessage {
  type: 'nostrdb.event-push';
  subId: string;
  content: string;
}
```

The proxy surface on `window.nostrdb`:

```ts
(window as any).nostrdb = {
  async query(filters): Promise<NostrEvent[]>,
  async add(event): Promise<boolean>,
  async event(id): Promise<NostrEvent | undefined>,
  async replaceable(kind, author, identifier?): Promise<NostrEvent | undefined>,
  async count(filters): Promise<number>,
  async supports(): Promise<string[]>,
  async *subscribe(filters): AsyncGenerator<NostrEvent>,
};
```

### Evidence of no spec backing

NIP-5D defines five NUB domains: relay, signer, storage, ifc, theme. The `nostrdb` domain is not among them. NIP-5D's NUB Framework section says "Each NUB owns a message domain" -- `nostrdb` is not a registered domain. The message types (`nostrdb.request`, `nostrdb.result`, `nostrdb.event-push`) are local envelope types defined only in this file, not in any NUB type package. The code itself acknowledges this with the comment: `// Local envelope types (nostrdb is not a NUB domain)`.

### Reasoning

NIP-DB (local event cache) access is a meaningful capability for napplets -- being able to query the shell's local cache without going to relays provides fast, offline-capable data access. This is a strong candidate for a future NUB spec (`nostrdb.*` or `cache.*` domain) that would formalize the query/add/subscribe interface and define proper typed envelope messages.

### Cross-references

- GAP-01 `cache:read`/`cache:write` capabilities in the ACL type relate to this proxy
- The relay NUB provides relay-based queries; nostrdb provides local cache queries -- complementary

### Decision

**Verdict: defer + audit** — Keep code. NUB spec exists as draft PR (napplet/nubs#4). Add future milestone item to audit conformance between shim implementation and NUB spec.

---

## GAP-07: Keyboard Forwarding Shim

**Category:** `unknown`

### What it is

A capture-phase keydown listener that intercepts keystrokes in the napplet iframe and forwards them to the parent shell as `keyboard.forward` envelope messages. This allows shell-level hotkeys (e.g., workspace switching, command palette) to work even when an iframe has DOM focus, since sandboxed iframes capture keyboard events and prevent them from bubbling to the parent.

### Where

`packages/shim/src/keyboard-shim.ts:1-91` (entire file)

Installed from `packages/shim/src/index.ts:343`:
```ts
installKeyboardShim();
```

### Code snippet

```ts
interface KeyboardForwardMessage {
  type: 'keyboard.forward';
  key: string;
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}
```

The forwarding logic:

```ts
function handleKeydown(event: KeyboardEvent): void {
  if (isTextInput(event.target)) return;   // Skip when user is typing in inputs
  if (isModifierOnly(event.key)) return;   // Skip bare modifier keys

  const msg: KeyboardForwardMessage = {
    type: 'keyboard.forward',
    key: event.key,
    code: event.code,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
  window.parent.postMessage(msg, '*');
}
```

### Evidence of no spec backing

NIP-5D does not mention keyboard forwarding, hotkey delegation, or input event proxying. The `keyboard` domain is not one of the five NUB domains (relay, signer, storage, ifc, theme). The `keyboard.forward` message type is not defined in any NUB type package. Like GAP-06, the code uses local envelope types defined only in the file.

### Reasoning

This is genuinely ambiguous. Keyboard forwarding solves a real iframe sandbox problem -- without it, shell hotkeys are dead when an iframe has focus. However, it is also deeply tied to the shell's UI architecture (what hotkeys exist, how they work). It could become:
- A NUB (`keyboard.*` domain) if other shells need the same pattern
- Part of the IFC NUB if keyboard forwarding is considered inter-frame communication
- A shell-only convention if different shells handle this differently

The spec author needs to decide whether keyboard forwarding belongs in the protocol or is purely a shell concern.

### Cross-references

- GAP-01 `hotkey:forward` capability in the ACL type gates this functionality
- GAP-02c `keybinds:*` topics (6 topics) relate to keybind management, which is the shell-side counterpart

### Decision

**Verdict: amend-spec** — Keep code. Add keyboard forwarding to NIP-5D or create a keyboard NUB spec.

---

## ~~GAP-09: IFC Channel Types~~ (REMOVED — Spec-Backed)

**Category:** ~~`future-nub`~~ → **removed from inventory**

> **Correction:** The IFC NUB is a draft spec in napplet/nubs. Channel types are part of that draft spec. These are spec-backed, not a gap. Removed from inventory during Phase 86 Decision Gate.

### What it is

Nine typed message definitions for a point-to-point channel mode within the IFC NUB. Channels allow two napplets to establish a direct, persistent communication link -- ACL is checked at channel open time only, subsequent messages are not re-checked. This provides higher-throughput inter-napplet communication compared to the per-message-checked topic pub/sub mode.

### Where

`packages/nubs/ifc/src/types.ts:106-207`

Specifically, these 9 interfaces:

| Message Type | Line | Direction |
|-------------|------|-----------|
| `IfcChannelOpenMessage` | 111-117 | Napplet -> Shell |
| `IfcChannelOpenResultMessage` | 122-133 | Shell -> Napplet |
| `IfcChannelEmitMessage` | 138-144 | Napplet -> Shell |
| `IfcChannelEventMessage` | 149-157 | Shell -> Napplet |
| `IfcChannelBroadcastMessage` | 162-166 | Napplet -> Shell |
| `IfcChannelListMessage` | 171-175 | Napplet -> Shell |
| `IfcChannelListResultMessage` | 180-186 | Shell -> Napplet |
| `IfcChannelCloseMessage` | 191-195 | Napplet -> Shell |
| `IfcChannelClosedMessage` | 200-206 | Shell -> Napplet |

### Code snippet

```ts
export interface IfcChannelOpenMessage extends IfcMessage {
  type: 'ifc.channel.open';
  id: string;
  target: string;
}

export interface IfcChannelOpenResultMessage extends IfcMessage {
  type: 'ifc.channel.open.result';
  id: string;
  channelId?: string;
  peer?: string;
  error?: string;
}

export interface IfcChannelEmitMessage extends IfcMessage {
  type: 'ifc.channel.emit';
  channelId: string;
  payload?: unknown;
}

export interface IfcChannelEventMessage extends IfcMessage {
  type: 'ifc.channel.event';
  channelId: string;
  sender: string;
  payload?: unknown;
}
```

Plus `IfcChannelBroadcastMessage`, `IfcChannelListMessage`, `IfcChannelListResultMessage`, `IfcChannelCloseMessage`, and `IfcChannelClosedMessage`.

### Evidence of no spec backing

While the IFC NUB *type package* (`@napplet/nub-ifc`) defines these types, the shim does NOT implement them. In `packages/shim/src/index.ts`, only topic pub/sub IFC types are imported:

```ts
import type {
  IfcEmitMessage,
  IfcSubscribeMessage,
  IfcUnsubscribeMessage,
  IfcEventMessage,
} from '@napplet/nub-ifc';
```

No channel types are imported or handled. The shim's `handleEnvelopeMessage` function only handles `ifc.event` -- no `ifc.channel.*` routing exists. These types are defined in the NUB type package as forward-looking design but have no implementation, no tests, and no runtime behavior.

The IFC NUB itself is a draft spec. The topic pub/sub portion is implemented and working. The channel portion exists only as typed interfaces.

### Reasoning

Channels represent a valid evolution of the IFC NUB -- high-throughput, persistent, ACL-efficient inter-napplet communication. The type definitions are well-designed and follow the same patterns as the working topic pub/sub types. They should become part of the IFC NUB spec once implemented. Marking as `future-nub` rather than `unknown` because the design is complete and consistent with the existing IFC architecture.

### Cross-references

- The 5 IFC topic pub/sub types (`ifc.emit`, `ifc.subscribe`, `ifc.subscribe.result`, `ifc.unsubscribe`, `ifc.event`) ARE implemented and spec-backed
- GAP-02a future NUB topics would use the IFC topic pub/sub system as their transport

---

*Phase: 84 (Spec Gap Inventory)*
*Created: 2026-04-08*

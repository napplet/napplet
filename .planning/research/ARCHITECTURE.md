# Architecture Research: NUB-CONFIG Integration

**Domain:** Napplet Protocol SDK — NUB-CONFIG (v0.25.0 milestone)
**Researched:** 2026-04-17
**Confidence:** HIGH (all conclusions derived from direct codebase analysis of the 8 existing NUB integrations — relay, storage, ifc, theme, keys, media, notify, identity; no external sources needed)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              BUILD TIME                                   │
│                                                                           │
│   vite.config.ts  ──► nip5aManifest({ nappletType, config: schema })     │
│                             │                                             │
│                             ▼                                             │
│                   @napplet/vite-plugin                                    │
│                             │                                             │
│                             ▼                                             │
│   dist/.nip5a-manifest.json  (kind 35128 event)                          │
│     tags: [['d','feed'], ['x',hash,path]..., ['config', schemaJson]]     │
│     aggregateHash incorporates schema bytes                               │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                             SHELL (runtime)                               │
│                                                                           │
│  ┌────────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │  Manifest Reader   │──►│  Config Store    │◄──│ Settings UI      │   │
│  │  (reads schema)    │   │  key: dTag:hash  │   │ (sole writer)    │   │
│  └────────────────────┘   └────────┬─────────┘   └────────┬─────────┘   │
│                                     │                       │             │
│                                     ▼ (validate + defaults) │             │
│                            ┌──────────────────────┐         │             │
│                            │ Config NUB Handler   │◄────────┘             │
│                            │ (router + emitter)   │                       │
│                            └──────────┬───────────┘                       │
└──────────────────────────────────────┼───────────────────────────────────┘
                                        │ postMessage (JSON envelope)
                                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          NAPPLET IFRAME (sandbox: allow-scripts)          │
│                                                                           │
│   @napplet/shim ─► window.napplet.config ─► @napplet/nub-config/shim     │
│                                                        │                  │
│    config.get()      ──► sendRequest ──► { config.get, requestId }       │
│    config.subscribe()──► addListener  ──► { config.subscribe }           │
│    config.registerSchema(schema) ────────► { config.registerSchema }     │
│    config.openSettings({section?}) ──────► { config.openSettings }       │
│                                                                           │
│    handleConfigMessage() ◄── config.values (snapshot + push)             │
│                         ◄── config.schemaError (malformed schema)        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `@napplet/nub-config` (NEW) | Typed message interfaces, DOMAIN constant, discriminated unions, shim installer, SDK wrappers | `@napplet/core` (extends `NappletMessage`) |
| `@napplet/core` `envelope.ts` | Add `'config'` to `NubDomain` union and `NUB_DOMAINS` array | All consumers of `NubDomain` |
| `@napplet/core` `types.ts` | Add `config` namespace to `NappletGlobal` interface (inline structural types) | Shim (implements), SDK (wraps) |
| `@napplet/shim` `index.ts` | Import `installConfigShim` + handlers from `@napplet/nub-config`; mount `window.napplet.config`; route `config.*` envelope messages | `@napplet/nub-config` |
| `@napplet/sdk` `index.ts` | Re-export `config` namespace wrapper, type re-exports, `CONFIG_DOMAIN` constant, `installConfigShim` re-export | `@napplet/nub-config`, `window.napplet.config` |
| `@napplet/vite-plugin` | Accept `config: JSONSchema \| string \| URL` in options; embed into kind 35128 manifest `config` tag; include schema bytes in aggregate hash; inject `<meta name="napplet-config-schema">` into `index.html` | Build output |

## Recommended Project Structure

```
packages/
├── core/
│   └── src/
│       ├── envelope.ts           # MODIFIED — add 'config' to NubDomain, NUB_DOMAINS
│       ├── types.ts              # MODIFIED — add NappletGlobal.config namespace
│       └── index.ts              # unchanged (barrel re-exports already complete)
│
├── nubs/
│   └── config/                    # NEW PACKAGE — @napplet/nub-config
│       ├── package.json           # NEW — deps: @napplet/core (workspace:*)
│       ├── tsconfig.json          # NEW — extends root
│       ├── tsup.config.ts         # NEW — ESM, dts, sourcemap
│       ├── README.md              # NEW — package-level docs
│       └── src/
│           ├── types.ts           # NEW — 10 message interfaces + DOMAIN + ConfigSchema + ConfigValues + unions
│           ├── shim.ts            # NEW — installConfigShim + handleConfigMessage + public API (registerSchema, get, subscribe, openSettings)
│           ├── sdk.ts             # NEW — configRegisterSchema, configGet, configSubscribe, configOpenSettings wrappers
│           └── index.ts           # NEW — barrel + registerNub(DOMAIN, handler)
│
├── shim/
│   ├── package.json               # MODIFIED — add @napplet/nub-config workspace dep
│   └── src/
│       └── index.ts               # MODIFIED — import installConfigShim + handleConfigMessage + API fns, mount on window.napplet.config, add routing branch for 'config.'
│
├── sdk/
│   ├── package.json               # MODIFIED — add @napplet/nub-config workspace dep
│   └── src/
│       └── index.ts               # MODIFIED — export const config = { ... }, re-export types, export CONFIG_DOMAIN, export installConfigShim
│
└── vite-plugin/
    └── src/
        └── index.ts               # MODIFIED — extend Nip5aManifestOptions with config field; load + parse schema; add ['config', schemaJson] tag; include schema bytes in aggregate hash; inject meta tag
```

### Structure Rationale

- **`packages/nubs/config/`:** Follows the file-per-concern pattern already established by nub-identity and nub-notify (types.ts, shim.ts, sdk.ts, index.ts). pnpm workspace glob `packages/nubs/*` auto-discovers it.
- **Types live in the NUB package, not core:** Per project memory `[NUB packages own ALL logic]` — types, shim code, SDK helpers all live in the NUB package. Core stays dependency-free on NUB packages via inline structural types (prevents circular deps).
- **Shim routing remains central in shim/index.ts:** The existing `handleEnvelopeMessage` dispatcher routes domain prefixes to per-NUB handlers. We add one branch: `if (type.startsWith('config.')) handleConfigMessage(msg)`.
- **Vite-plugin extension is the authoritative schema path:** Per milestone decision "manifest-authoritative schema declaration." Runtime `config.registerSchema` is the escape hatch for runtime-declared schemas.

## Wire Message Definitions

Following the exact naming and shape pattern used by nub-notify and nub-identity, the NUB-CONFIG wire surface is **9 message types** (6 napplet→shell, 3 shell→napplet).

### Naplet → Shell Messages

| Type | `id` field | Direction | Payload |
|------|-----------|-----------|---------|
| `config.registerSchema` | no | napplet→shell | `{ type, schema: JSONSchema, version?: number }` — runtime escape hatch |
| `config.get` | yes (`requestId`) | napplet→shell | `{ type, requestId: string }` — one-shot snapshot |
| `config.subscribe` | no | napplet→shell | `{ type }` — start push updates; shell replies with initial `config.values` (no `requestId`) and subsequent pushes |
| `config.unsubscribe` | no | napplet→shell | `{ type }` — stop push updates (rationale below) |
| `config.openSettings` | no | napplet→shell | `{ type, section?: string }` — request UI open, optionally deep-link to section |

### Shell → Napplet Messages

| Type | `requestId` field | Direction | Payload |
|------|------------------|-----------|---------|
| `config.values` | optional | shell→napplet | `{ type, values: ConfigValues, requestId?: string }` — **dual use**: response to `config.get` (with `requestId`) AND push update to subscribers (no `requestId`) |
| `config.schemaError` | no | shell→napplet | `{ type, error: string, code: 'invalid-schema' \| 'version-conflict' \| 'unsupported-draft' }` — pushed when shell rejects a `config.registerSchema` call or cannot parse manifest schema |
| `config.settingsOpened` | no (optional) | shell→napplet | `{ type, opened: boolean, reason?: string }` — optional ack for `config.openSettings` so napplet can fall back if UI is unavailable |

### Wire surface decisions

**Does `config.validationError` need its own message type?** **No.** Values delivered via `config.values` are always already validated by the shell (MUST guarantee). What the spec *does* need is a distinct **`config.schemaError`** for when the *napplet-registered schema itself* is malformed (missing draft, invalid JSON Schema, unsupported keywords). This is the only error surface the napplet can remedy. Invalid *values* are a shell-UI concern, not a wire concern — the shell simply won't deliver invalid values.

**Is `config.unsubscribe` necessary?** **Yes, include it.** Three reasons:
1. **Consistency:** Every other NUB with push semantics has an explicit unsubscribe (IFC: `ifc.unsubscribe`; relay: `relay.close`). NUB-CONFIG should not break the pattern.
2. **Multi-napplet shells / nested iframes:** A napplet may iframe another napplet or swap views; it must be able to stop config pushes without destroying its iframe.
3. **Testing ergonomics:** Shim unit tests need to tear down listeners deterministically.

However, `unsubscribe` is **not** the primary teardown mechanism — iframe unmount still implicitly disconnects (shell tracks `MessageEvent.source`). `unsubscribe` is the clean-shutdown path.

**Do napplet-side listener teardowns (`Subscription.close()`) send wire messages?** **No.** They only remove local callbacks from `subscribers` Set. A single wire-level `config.subscribe` is sent once on first `subscribe()` call; `config.unsubscribe` is sent only when the last local subscriber closes. This matches the `ifc.on` pattern (subscription ref-counting).

**Why `requestId` instead of `id`?** Aesthetic distinction — the milestone spec uses `requestId` to emphasize the dual role of `config.values` (sometimes has correlation, sometimes doesn't). Project memory `[User preferences — aesthetics matter]`. Internally the shim uses a Map keyed on this requestId exactly like other NUBs use `id`.

### Supporting Types (`packages/nubs/config/src/types.ts`)

```typescript
import type { NappletMessage } from '@napplet/core';

/** The NUB domain name for config messages. */
export const DOMAIN = 'config' as const;

// ─── Schema + Values ────────────────────────────────────────────────────────

/**
 * JSON Schema (draft-07+) describing a napplet's configuration surface.
 * Napplets SHOULD use `$schema: "http://json-schema.org/draft-07/schema#"`.
 *
 * Napplet-specific extensions (all optional, all under x-napplet-*):
 * - x-napplet-secret: boolean — field contains sensitive data (shell masks input)
 * - x-napplet-section: string — grouping key for settings UI
 * - x-napplet-order: number — display ordering hint
 *
 * The top-level `$version` field (number) is the migration-version potentiality.
 */
export type ConfigSchema = Record<string, unknown>;

/**
 * Shell-validated configuration values matching the registered schema.
 * Keys are property names from the schema; values are JSON-serializable.
 */
export type ConfigValues = Record<string, unknown>;

// ─── Base Message Type ──────────────────────────────────────────────────────

export interface ConfigMessage extends NappletMessage {
  type: `config.${string}`;
}

// ─── Napplet → Shell Messages ───────────────────────────────────────────────

export interface ConfigRegisterSchemaMessage extends ConfigMessage {
  type: 'config.registerSchema';
  schema: ConfigSchema;
  version?: number;
}

export interface ConfigGetMessage extends ConfigMessage {
  type: 'config.get';
  requestId: string;
}

export interface ConfigSubscribeMessage extends ConfigMessage {
  type: 'config.subscribe';
}

export interface ConfigUnsubscribeMessage extends ConfigMessage {
  type: 'config.unsubscribe';
}

export interface ConfigOpenSettingsMessage extends ConfigMessage {
  type: 'config.openSettings';
  section?: string;
}

// ─── Shell → Napplet Messages ───────────────────────────────────────────────

export interface ConfigValuesMessage extends ConfigMessage {
  type: 'config.values';
  values: ConfigValues;
  /** Present only when this message answers a specific config.get request. */
  requestId?: string;
}

export interface ConfigSchemaErrorMessage extends ConfigMessage {
  type: 'config.schemaError';
  error: string;
  code: 'invalid-schema' | 'version-conflict' | 'unsupported-draft';
}

export interface ConfigSettingsOpenedMessage extends ConfigMessage {
  type: 'config.settingsOpened';
  opened: boolean;
  reason?: string;
}

// ─── Discriminated Unions ───────────────────────────────────────────────────

export type ConfigRequestMessage =
  | ConfigRegisterSchemaMessage
  | ConfigGetMessage
  | ConfigSubscribeMessage
  | ConfigUnsubscribeMessage
  | ConfigOpenSettingsMessage;

export type ConfigResultMessage =
  | ConfigValuesMessage
  | ConfigSchemaErrorMessage
  | ConfigSettingsOpenedMessage;

export type ConfigNubMessage = ConfigRequestMessage | ConfigResultMessage;
```

## Manifest Integration (NIP-5A + vite-plugin)

### Where does the schema live in the manifest?

The NIP-5A manifest is a **kind 35128 replaceable event**. Its tags already follow `['x', hash, path]` and `['requires', ...]` conventions. The schema is added as a dedicated tag — nested under `nubs.config` would require a wire-format change to the manifest; a flat tag is simpler and consistent with `requires`.

**Proposed:** Add a single `['config', <schemaJson>]` tag on the manifest event.

```json
{
  "kind": 35128,
  "tags": [
    ["d", "feed"],
    ["x", "ab12...", "index.html"],
    ["x", "cd34...", "assets/app.js"],
    ["requires", "relay"],
    ["config", "{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"type\":\"object\",\"properties\":{...},\"$version\":1}"]
  ],
  "content": "",
  "sig": "..."
}
```

**Why embedded (not URL-referenced)?**
1. **Atomicity:** Schema bytes are part of the signed manifest. Cannot be tampered with post-publish.
2. **Aggregate hash integration:** Schema JSON bytes participate in aggregateHash computation — any schema change bumps the hash, which changes the storage scope. This is the migration trigger.
3. **Offline-capable:** No extra HTTP fetch on napplet load.
4. **Consistent with existing tag conventions:** `requires` is embedded; `config` follows suit.
5. **Size is not a concern:** Typical config schemas are 0.5-5 KB; kind 35128 events already carry the full file-hash manifest (can be tens of KB for large apps).

### Aggregate hash integration

Current `computeAggregateHash` in `packages/vite-plugin/src/index.ts` operates on `[sha256hex, relativePath]` pairs. For v0.25.0, extend to include one synthetic line for the schema:

```
<sha256(schemaJson)> config:schema
```

This line sorts alphabetically among the file-hash lines. Schema mutation ⇒ different hash ⇒ different aggregateHash ⇒ storage scope `dTag:aggregateHash` changes ⇒ shell-resolved migration triggers.

**Why a synthetic path prefix:** `config:schema` cannot collide with any real file path (colon is not in relative paths from `walkDir`). Deterministic and tamper-evident.

### Vite-plugin API surface change

**Current:**
```typescript
export interface Nip5aManifestOptions {
  nappletType: string;
  requires?: string[];
}
```

**Extended (v0.25.0):**
```typescript
export interface Nip5aManifestOptions {
  nappletType: string;
  requires?: string[];
  /**
   * Napplet configuration schema declaration.
   *
   * - JSONSchema object: embedded directly
   * - string (path): loaded from disk relative to project root (e.g. 'napplet.config.schema.json')
   * - string (starts with '{'): parsed as JSON literal
   *
   * Absent = napplet declares no config. Shell will not render a settings entry.
   */
  config?: ConfigSchema | string;
}
```

**Developer usage (vite.config.ts):**

```typescript
// Option A: inline object
nip5aManifest({
  nappletType: 'feed',
  config: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $version: 1,
    type: 'object',
    properties: {
      relayUrl: { type: 'string', format: 'uri', default: 'wss://relay.damus.io' },
      apiKey:   { type: 'string', 'x-napplet-secret': true },
    },
  },
});

// Option B: file reference
nip5aManifest({
  nappletType: 'feed',
  config: './napplet.config.schema.json',
});
```

### HTML injection for runtime discovery

Mirror the existing `napplet-aggregate-hash` and `napplet-type` meta tags — add one new meta tag so the shim can read the schema **before** the shell has a chance to deliver it:

```html
<meta name="napplet-config-schema" content="{JSON-encoded schema}">
```

This lets shim-side `window.napplet.config.schema` getter work synchronously at napplet startup without an additional round trip. Shell still reads from the signed kind 35128 manifest for authority.

## Core / Shim / SDK Integration Points

### `packages/core/src/envelope.ts` (MODIFIED)

Two changes — exact surgical edits:

```typescript
// Line 65 — extend union:
export type NubDomain =
  | 'relay' | 'identity' | 'storage' | 'ifc'
  | 'theme' | 'keys' | 'media' | 'notify'
  | 'config';

// Line 78 — extend runtime constant:
export const NUB_DOMAINS: readonly NubDomain[] = [
  'relay', 'identity', 'storage', 'ifc',
  'theme', 'keys', 'media', 'notify',
  'config',
] as const;
```

Also extend the JSDoc table (lines 49-58) with one row:
```
| `config`   | Per-napplet JSON Schema-driven configuration |
```

`NamespacedCapability` auto-derives from `NubDomain`, so `'nub:config'` and bare `'config'` become valid automatically.

### `packages/core/src/types.ts` (MODIFIED)

Add `config` namespace to `NappletGlobal` with inline structural types (no import from `@napplet/nub-config` — preserves core's zero-NUB-dependency invariant):

```typescript
export interface NappletGlobal {
  relay: { ... };
  ifc:   { ... };
  storage: { ... };
  keys:  { ... };
  media: { ... };
  notify:{ ... };
  identity:{ ... };

  /**
   * Per-napplet declarative configuration.
   *
   * Napplet declares a JSON Schema (via vite-plugin manifest OR runtime
   * escape hatch); shell renders settings UI, validates and persists
   * values in a (dTag, aggregateHash)-scoped store, delivers live values
   * via snapshot + push.
   *
   * Napplet never writes values — shell UI is the sole writer. Napplet
   * only reads, subscribes, and requests-settings-open.
   *
   * @example
   * ```ts
   * // Read current values (one-shot):
   * const values = await window.napplet.config.get();
   *
   * // Subscribe to live updates:
   * const sub = window.napplet.config.subscribe((values) => {
   *   applyTheme(values.theme);
   * });
   * // later: sub.close();
   *
   * // Request settings UI:
   * window.napplet.config.openSettings({ section: 'privacy' });
   * ```
   */
  config: {
    /**
     * Runtime escape hatch: register a JSON Schema at load time.
     * Preferred path is manifest-declared schema via @napplet/vite-plugin.
     * Shell MAY reject malformed schemas with a schemaError callback.
     * @param schema  JSON Schema (draft-07+) object
     * @param version Optional migration version number ($version potentiality)
     */
    registerSchema(schema: Record<string, unknown>, version?: number): void;

    /**
     * One-shot snapshot of current config values.
     * Returns shell-validated values with schema defaults applied.
     */
    get(): Promise<Record<string, unknown>>;

    /**
     * Subscribe to live config value updates.
     * Receives an initial snapshot, then pushes whenever the shell's
     * settings UI mutates values.
     *
     * @param callback  Invoked with the new values on every change
     * @returns Subscription with `close()` to stop receiving pushes
     */
    subscribe(
      callback: (values: Record<string, unknown>) => void,
    ): Subscription;

    /**
     * Request the shell open its settings UI for this napplet.
     * The shell decides how to render (modal, panel, new tab).
     *
     * @param options Optional deep-link: `{ section }` for section anchor
     */
    openSettings(options?: { section?: string }): void;

    /**
     * Listen for schema errors (malformed schema rejected by shell).
     * Useful when calling registerSchema at runtime.
     *
     * @param callback  Invoked with the error payload
     * @returns Subscription with `close()` to stop listening
     */
    onSchemaError(
      callback: (error: {
        error: string;
        code: 'invalid-schema' | 'version-conflict' | 'unsupported-draft';
      }) => void,
    ): Subscription;

    /**
     * Read-accessor: returns the currently-registered schema
     * (from manifest meta tag or last registerSchema call).
     * Returns null if no schema has been declared.
     */
    readonly schema: Record<string, unknown> | null;
  };

  shell: NappletGlobalShell;
}
```

**On `readonly schema`:** This addresses the "Is there a `window.napplet.config.schema` read-accessor?" question directly. **Yes, expose it.** Napplets commonly need to render their own capability-dependent UI (e.g., "Connect to relay X" button is only shown if the schema has a `relayUrl` field). Reading the currently-active schema lets the napplet stay in sync with shell-resolved migrations. Implementation: shim reads `<meta name="napplet-config-schema">` at startup, overwrites on `registerSchema()`.

### `packages/shim/src/index.ts` (MODIFIED)

Add import block (after existing NUB imports):
```typescript
import {
  installConfigShim,
  handleConfigMessage,
  registerSchema,
  get as configGet,
  subscribe as configSubscribe,
  openSettings as configOpenSettings,
  onSchemaError as configOnSchemaError,
  getSchema as configGetSchema,
} from '@napplet/nub-config';
```

Add routing branch in `handleEnvelopeMessage` (follows the `notify.*` pattern):
```typescript
// Route config.* messages to config shim
if (type.startsWith('config.')) {
  handleConfigMessage(msg as { type: string; [key: string]: unknown });
  return;
}
```

Add `config` namespace to the `window.napplet` installation block:
```typescript
config: {
  registerSchema,
  get: configGet,
  subscribe: configSubscribe,
  openSettings: configOpenSettings,
  onSchemaError: configOnSchemaError,
  get schema() { return configGetSchema(); },
},
```

Add initialization call near other `install*Shim()` calls:
```typescript
// Install config shim (schema registry + subscription manager)
installConfigShim();
```

Add workspace dep in `packages/shim/package.json`:
```json
"@napplet/nub-config": "workspace:*"
```

### `packages/sdk/src/index.ts` (MODIFIED)

Add `config` namespace wrapper (follows `identity` namespace pattern):

```typescript
/**
 * Per-napplet declarative configuration.
 *
 * @example
 * ```ts
 * import { config } from '@napplet/sdk';
 *
 * const values = await config.get();
 * const sub = config.subscribe((v) => applyTheme(v.theme));
 * config.openSettings({ section: 'privacy' });
 * ```
 */
export const config = {
  registerSchema(schema: Record<string, unknown>, version?: number): void {
    requireNapplet().config.registerSchema(schema, version);
  },
  get(): Promise<Record<string, unknown>> {
    return requireNapplet().config.get();
  },
  subscribe(callback: (values: Record<string, unknown>) => void): Subscription {
    return requireNapplet().config.subscribe(callback);
  },
  openSettings(options?: { section?: string }): void {
    requireNapplet().config.openSettings(options);
  },
  onSchemaError(
    callback: (err: { error: string; code: 'invalid-schema' | 'version-conflict' | 'unsupported-draft' }) => void,
  ): Subscription {
    return requireNapplet().config.onSchemaError(callback);
  },
  get schema(): Record<string, unknown> | null {
    return requireNapplet().config.schema;
  },
};
```

Add type re-exports (alphabetized into existing block):
```typescript
// Config NUB
export type {
  ConfigSchema,
  ConfigValues,
  ConfigMessage,
  ConfigRegisterSchemaMessage,
  ConfigGetMessage,
  ConfigSubscribeMessage,
  ConfigUnsubscribeMessage,
  ConfigOpenSettingsMessage,
  ConfigValuesMessage,
  ConfigSchemaErrorMessage,
  ConfigSettingsOpenedMessage,
  ConfigRequestMessage,
  ConfigResultMessage,
  ConfigNubMessage,
} from '@napplet/nub-config';
```

Add domain constant + installer re-exports:
```typescript
export { DOMAIN as CONFIG_DOMAIN } from '@napplet/nub-config';
export { installConfigShim } from '@napplet/nub-config';
export { configRegisterSchema, configGet, configSubscribe, configOpenSettings } from '@napplet/nub-config';
```

Add workspace dep in `packages/sdk/package.json`:
```json
"@napplet/nub-config": "workspace:*"
```

## Data Flow

### Flow 1: Napplet load with manifest-declared schema (happy path)

```
BUILD TIME:
  vite.config.ts: nip5aManifest({ config: {...} })
    ↓
  vite-plugin: serializes schema, includes in aggregateHash line,
  writes ['config', schemaJson] tag to .nip5a-manifest.json,
  injects <meta name="napplet-config-schema" content="{...}"> into index.html

LOAD TIME:
  1. Iframe loads → @napplet/shim boots → installConfigShim()
  2. Config shim reads <meta name="napplet-config-schema"> → local schema cache populated
  3. Shell creates iframe → reads signed manifest → extracts ['config', schemaJson] tag
  4. Shell validates schema is parseable JSON Schema (draft-07+)
     ↓ invalid: post config.schemaError to napplet
     ↓ valid:
  5. Shell computes storage scope = (dTag, aggregateHash)
  6. Shell loads persisted values from scoped store (or empty if first run)
  7. Shell applies schema defaults to missing keys
  8. Shell caches (scope → values, schema) in session map — ready to serve
```

### Flow 2: Napplet reads values once

```
Napplet: await window.napplet.config.get()
  ↓
Shim: generates requestId, postMessage { type:'config.get', requestId }
  ↓
Shell: looks up cached values for this source (MessageEvent.source → scope)
  ↓
Shell: postMessage { type:'config.values', values, requestId }
  ↓
Shim: handleConfigMessage matches requestId → resolves Promise
  ↓
Napplet: receives values object
```

### Flow 3: Napplet subscribes to live updates

```
Napplet: const sub = window.napplet.config.subscribe(onChange)
  ↓
Shim: adds callback to local subscribers Set
     If Set.size === 1 (first subscriber): postMessage { type:'config.subscribe' }
  ↓
Shell: marks source as subscribed, postMessage { type:'config.values', values } (no requestId)
  ↓
Shim: handleConfigMessage receives values without requestId → fans out to all subscribers
  ↓
   [user opens settings UI, changes a value]
  ↓
Shell: validates new value against schema → persists → postMessage { type:'config.values', values }
  ↓
Shim: fans out new values to subscribers
  ↓
   [napplet calls sub.close()]
  ↓
Shim: removes callback. If Set.size === 0 (last subscriber): postMessage { type:'config.unsubscribe' }
  ↓
Shell: marks source as unsubscribed, stops pushing
```

### Flow 4: Runtime `registerSchema` escape hatch

```
Napplet: window.napplet.config.registerSchema({ ...schema... }, 2)
  ↓
Shim: updates local schema cache, postMessage { type:'config.registerSchema', schema, version:2 }
  ↓
Shell: validates schema parseability
       ↓ invalid:
         postMessage { type:'config.schemaError', code, error }
         → shim fans to onSchemaError subscribers
       ↓ valid:
  ↓
Shell: computes merge plan:
       - drop keys not in new schema
       - apply defaults for new keys
       - preserve keys that still exist (with compatible types)
       - if version mismatch: shell-resolved migration strategy applies
  ↓
Shell: persists merged values to (dTag, aggregateHash) scope
  ↓
Shell: pushes { type:'config.values', values } to all subscribers of this source
```

### Flow 5: aggregateHash change on napplet update (migration trigger)

```
Napplet v1: aggregateHash = abc123, storage scope = dTag:abc123
            persisted values = { theme:'dark', relayUrl:'wss://damus' }
  ↓ [developer publishes v2 with new schema field]
Napplet v2: aggregateHash = def456, storage scope = dTag:def456
  ↓
Shell sees new aggregateHash on napplet load:
  Strategy A (default): fresh scope, defaults-only (no migration)
  Strategy B (shell-resolved opt-in):
    - Load old scope's values
    - Run shell-resolved migration UX (user prompted, programmatic mapping, etc.)
    - Write migrated values into new scope
  ↓
In all cases, napplet sees only post-migration values via config.values.
The $version field is a hint for shell migration logic; napplet never sees old values.
```

## Architectural Patterns

### Pattern 1: Request/Response Correlation via `requestId` (not `id`)

**What:** Messages that need a correlated response use a distinct `requestId` field (rather than the `id` field used by other NUBs).
**When to use:** Only `config.get` correlates; everything else is fire-and-forget or push-based.
**Trade-offs:** Slight inconsistency with other NUBs — but `config.values` serves dual purposes (correlated response AND uncorrelated push), and the distinct field name makes this explicit in the type system.

**Example:**
```typescript
interface ConfigGetMessage extends ConfigMessage {
  type: 'config.get';
  requestId: string;
}
interface ConfigValuesMessage extends ConfigMessage {
  type: 'config.values';
  values: ConfigValues;
  requestId?: string;  // present = response; absent = subscription push
}
```

### Pattern 2: Single subscription channel with local fan-out

**What:** Only one wire-level `config.subscribe` is sent per iframe, regardless of how many `napplet.config.subscribe(cb)` calls the napplet makes. Shim maintains a local `Set<callback>` and fans out incoming `config.values` pushes to all.
**When to use:** When multiple code paths in the napplet need live values (e.g., theme + feature flags + API endpoints) but the shell only needs one subscription per source.
**Trade-offs:** Requires ref-counting (`subscribe` on first callback, `unsubscribe` on last). Simpler for the shell, slightly more state in the shim.

**Example (matches existing `ifc.on` pattern):**
```typescript
const subscribers = new Set<(values: ConfigValues) => void>();
let wireSubscribed = false;

export function subscribe(callback: (values: ConfigValues) => void): Subscription {
  subscribers.add(callback);
  if (!wireSubscribed) {
    window.parent.postMessage({ type: 'config.subscribe' } satisfies ConfigSubscribeMessage, '*');
    wireSubscribed = true;
  }
  return {
    close() {
      subscribers.delete(callback);
      if (subscribers.size === 0 && wireSubscribed) {
        window.parent.postMessage({ type: 'config.unsubscribe' } satisfies ConfigUnsubscribeMessage, '*');
        wireSubscribed = false;
      }
    },
  };
}
```

### Pattern 3: Inline structural types in core (zero-dep invariant)

**What:** `NappletGlobal.config` uses inline object types (`Record<string, unknown>` instead of `ConfigValues`). The canonical `ConfigValues`/`ConfigSchema` types live in `@napplet/nub-config`.
**When to use:** Always — every NUB follows this. Core must not import from NUB packages.
**Trade-offs:** Type duplication between core and NUB package. Mitigated by the fact that the shapes are trivial (`Record<string, unknown>`) and the NUB package exports the named type aliases for rich use.

**Example:**
```typescript
// In @napplet/core/src/types.ts:
config: {
  get(): Promise<Record<string, unknown>>;
  // ...
};

// In @napplet/nub-config/src/types.ts:
export type ConfigValues = Record<string, unknown>;

// SDK and napplet code use the rich alias:
import type { ConfigValues } from '@napplet/sdk';
const v: ConfigValues = await window.napplet.config.get();
```

### Pattern 4: Manifest-authoritative with runtime escape hatch

**What:** The manifest (kind 35128, signed) is the authoritative schema declaration path. `config.registerSchema` is allowed but is a runtime escape hatch for advanced use cases (dynamic schemas, framework-generated config).
**When to use:** Manifest-declared for 95% of napplets; `registerSchema` only when the schema truly cannot be static.
**Trade-offs:** Slight duplication (two paths), but solves two real use cases: build-time declaration AND runtime-generated schemas. Shell treats both identically once registered.

### Pattern 5: Synthetic aggregate-hash participation

**What:** Schema bytes participate in aggregateHash via a synthetic path prefix `config:schema` that cannot collide with real file paths.
**When to use:** Always. This makes schema change a first-class cause of storage scope migration.
**Trade-offs:** Coupling between the schema and aggregateHash means trivial schema changes bump the hash. This is the intent — version field on schema is optional.

## Scaling Considerations

| Concern | At 9 NUBs (v0.25) | At 15 NUBs | At 30+ NUBs |
|---------|-------------------|------------|-------------|
| `NubDomain` union size | 9 literals, fine | Still fine | Consider code-generating from package list |
| Shim routing branches | 9 `if (type.startsWith(...))` blocks | Manageable | Consider table-driven dispatch |
| Subscribers map per napplet | Small (usually 1-3 callbacks) | Still small | Per-napplet isolation prevents cross-contamination |
| Schema size in manifest | 0.5-5 KB typical | Same | Consider external URL + hash if >50 KB (unlikely) |
| Validation cost per value push | Cached AJV validator per source | Same | Should still be sub-ms per validation |

### Scaling priorities

1. **First bottleneck:** Schema validation on every settings UI keystroke (shell-side concern, not wire). Mitigation: debounce in UI, validate on commit only. Spec stays schema-agnostic.
2. **Second bottleneck:** Fan-out of `config.values` to many simultaneously-mounted napplets after a global settings change. Mitigation: shells already batch postMessage; rare in practice (each napplet has its own scope).

## Anti-Patterns

### Anti-Pattern 1: Napplet-side write path

**What people might do:** Add `config.set(key, value)` because "it's just a proxy — napplet should be able to update its own config."
**Why it's wrong:** Violates the MUST-level spec guarantee "shell is sole writer." Defeats the purpose of shell-validated, shell-UI-rendered settings. Opens attack surface (malicious napplet overrides user preferences silently).
**Do this instead:** Napplet only *reads* via `get()`/`subscribe()` and *requests* UI open via `openSettings()`. If a napplet legitimately needs mutable state that the user doesn't configure, use `@napplet/nub-storage` — that's what it's for.

### Anti-Pattern 2: Schema declaration duplicated in code and manifest

**What people might do:** Declare schema in `vite.config.ts` AND also call `registerSchema` at napplet startup with the same schema.
**Why it's wrong:** Divergence risk; if one gets out of sync, the shell sees different schemas across load paths. `registerSchema` would blow away the manifest-declared schema, including its aggregateHash binding.
**Do this instead:** Pick one path. Manifest-declared is the default; `registerSchema` is the escape hatch only when the schema genuinely cannot be static.

### Anti-Pattern 3: Using config for high-frequency or ephemeral state

**What people might do:** Store view-state like "last selected tab" or "scroll position" in config so settings UI can show them.
**Why it's wrong:** Config is meant for user-facing declarative settings with schema-validated UI. High-frequency writes degrade settings UX (show up in the settings panel), burn validation cycles, and conflate "preferences" with "ephemeral state."
**Do this instead:** Use `@napplet/nub-storage` for ephemeral/high-frequency state. Config is for settings a user would recognize as a setting.

### Anti-Pattern 4: Exposing `$version` in wire or napplet-visible payloads

**What people might do:** Add `version` to `ConfigValuesMessage` so the napplet knows which schema version generated the values.
**Why it's wrong:** Per milestone decision: "migration is shell-resolved; napplet never sees old values." Exposing version leaks implementation detail that napplets will inevitably couple to, defeating the point.
**Do this instead:** Napplet operates on current schema only. Shell handles all migration. Version lives in the schema and on `config.registerSchema` — it is an input to the shell, never an output.

### Anti-Pattern 5: Coupling core to nub-config for ConfigValues type

**What people might do:** Import `ConfigValues` from `@napplet/nub-config` into `@napplet/core/src/types.ts` "for type safety."
**Why it's wrong:** Project memory `[NUB packages own ALL logic]` and `[No circular deps]`. Core must not depend on any NUB package — doing so breaks the layering and risks dependency cycles.
**Do this instead:** Use `Record<string, unknown>` inline in core. Rich type lives in the NUB package and is re-exported via SDK.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Shell settings UI | postMessage envelope (`config.values` push on user change) | Shell-owned UI; napplet has zero control over rendering. `openSettings({section})` is a hint only. |
| Shell persistence layer | Shell-internal (spec surface doesn't care) | MAY be backed by NUB-STORAGE internally per milestone decision; this is an implementation choice, not a protocol concern. |
| JSON Schema validator (shell-side) | AJV or equivalent; shell-internal | Spec requires draft-07+ compatibility but does not mandate a specific library. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `@napplet/vite-plugin` → build output | File write (kind 35128 manifest event, HTML meta tag) | Schema bytes serialized once at build; aggregateHash updated transactionally. |
| `@napplet/nub-config` → `@napplet/core` | Type import only (`NappletMessage`) | Core never imports from nub-config. |
| `@napplet/shim` → `@napplet/nub-config` | Named imports (`installConfigShim`, `handleConfigMessage`, public API fns) | Shim mounts fns onto `window.napplet.config`. Follows exact pattern of nub-notify, nub-identity. |
| `@napplet/sdk` → `@napplet/nub-config` | Named imports + type re-exports | SDK wraps with `requireNapplet()` lazy delegation. |
| `@napplet/shim` routing dispatcher → config shim | `if (type.startsWith('config.')) handleConfigMessage(msg)` | Single new branch in `handleEnvelopeMessage`. |

## Build Order (Recommended Phase Sequence)

Matches the established pattern from v0.22 (media), v0.23 (notify), and v0.24 (identity) — six phases. v0.24 had a fifth SECURITY/KILL phase because it was removing window.nostr; v0.25 has no such teardown, so it collapses to the standard six.

### Phase 1: Spec Draft (napplet/nubs#13)

Draft the NUB-CONFIG specification in the `napplet/nubs` PUBLIC repo per memory rule `[No private refs in public repos]`. Covers:
- JSON Schema draft-07+ wire contract
- `$version` field potentiality
- `x-napplet-secret`, `x-napplet-section`, `x-napplet-order` extension potentialities
- MUST guarantees (validation, defaults, scoped storage, shell-sole-writer)
- 9 wire message shapes with direction and payload
- Manifest integration (kind 35128 `config` tag)
- Aggregate hash participation

**Rationale:** Spec-first matches v0.22 Phase 97, v0.23 Phase 101, v0.24 Phase 106. Spec is the contract; everything else implements the contract.

### Phase 2: Package Scaffold (`@napplet/nub-config` types only)

Create `packages/nubs/config/` with `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/types.ts` (all 9 message types + `DOMAIN` + `ConfigSchema` + `ConfigValues` + unions), `src/index.ts` (barrel + `registerNub(DOMAIN, handler)`).

**Rationale:** Types are the contract layer. Leaf dependency on `@napplet/core` only. Can be built and type-checked independently. Matches v0.23 Phase 102 scope.

### Phase 3: Shim + SDK in-package (`packages/nubs/config/src/shim.ts` + `sdk.ts`)

Implement `installConfigShim`, `handleConfigMessage`, public API (`registerSchema`, `get`, `subscribe`, `openSettings`, `onSchemaError`, `getSchema`) in `shim.ts`. Implement SDK wrappers in `sdk.ts`. Update `index.ts` barrel exports.

**Rationale:** Per memory `[NUB packages own ALL logic]` — shim and SDK for the config domain live inside the NUB package. The shim file implements the message sending, pending-request correlation, subscriber set, and meta-tag schema reading.

### Phase 4: Vite-plugin Extension

Extend `Nip5aManifestOptions` with `config?: ConfigSchema | string`. Add schema loading (inline object OR file path OR JSON-literal string), add `['config', schemaJson]` tag to kind 35128 manifest, include synthetic schema-hash line in aggregateHash, inject `<meta name="napplet-config-schema">` into `index.html`.

**Rationale:** Build-time authoritative schema path. Manifest-first is the design; runtime `registerSchema` is the escape hatch. Separate phase because it touches a different package with different test surface.

### Phase 5: Core / Shim / SDK Integration

**5a. Core:** Add `'config'` to `NubDomain` + `NUB_DOMAINS`; add `config` namespace to `NappletGlobal`.
**5b. Shim:** Add `@napplet/nub-config` workspace dep; import shim API fns; add `config.*` routing branch in `handleEnvelopeMessage`; mount `window.napplet.config`; call `installConfigShim()`.
**5c. SDK:** Add `@napplet/nub-config` workspace dep; add `config` namespace export + type re-exports + `CONFIG_DOMAIN` + `installConfigShim` re-export.

**Rationale:** Matches v0.24 Phase 109 (`'identity' in NubDomain + core/shim/SDK integration`). Small, surgical changes across three packages; turborepo handles build order automatically via `dependsOn: ["^build"]`.

### Phase 6: Docs Update

- `packages/nubs/config/README.md` — package-level docs with examples
- NIP-5D "Known NUBs" section? (per memory `[No private refs in public repos]` and `[No implementations in NUB specs]`, NIP-5D should reference NUB-CONFIG spec by number, not @napplet/* package)
- `packages/core/README.md`, `packages/shim/README.md`, `packages/sdk/README.md` — add `config` to the NUB list
- `packages/vite-plugin/README.md` — document the new `config` option with usage examples
- Root `README.md` — bump NUB count to 9 (13 total packages)

**Rationale:** Always the last phase. Matches v0.24 Phase 110, v0.23 Phase 104, v0.22 Phase 100.

### Build Order Deviations

**No deviation from v0.22-v0.24 pattern.** NUB-CONFIG follows the established six-phase template exactly. One notable difference from v0.20 (keys NUB): config does not replace any existing pre-NUB module (keys replaced keyboard-shim). It is pure addition, which makes Phase 5 cleaner (no deletions).

## Sources

- Direct source code analysis of 8 existing NUB packages (`packages/nubs/relay`, `storage`, `ifc`, `theme`, `keys`, `media`, `notify`, `identity`) — type patterns, shim patterns, SDK patterns, index-barrel patterns, registerNub usage
- Direct source code analysis of `packages/core/src/envelope.ts`, `packages/core/src/types.ts`, `packages/core/src/index.ts` — NubDomain, NappletGlobal, barrel shape
- Direct source code analysis of `packages/shim/src/index.ts` — central `handleEnvelopeMessage` routing, window.napplet installation, shim initialization order
- Direct source code analysis of `packages/sdk/src/index.ts` — namespace wrapper pattern, type re-exports, NUB SDK helper re-exports
- Direct source code analysis of `packages/vite-plugin/src/index.ts` — manifest generation, aggregateHash computation, meta tag injection
- `.planning/PROJECT.md` — current milestone goals, phase-ordering precedent (v0.22/v0.23/v0.24)
- `.planning/STATE.md` — locked v0.25.0 decisions (shell-sole-writer, manifest-authoritative, subscribe-live, scoped storage)
- Project memory files — `[NUB packages own ALL logic]`, `[No implementations in NUB specs]`, `[No private refs in public repos]`, shim design rule, file pattern awareness

---
*Architecture research for: Napplet Protocol SDK — NUB-CONFIG integration*
*Researched: 2026-04-17*

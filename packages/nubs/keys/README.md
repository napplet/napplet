# @napplet/nub-keys

> TypeScript message types for the keys NUB domain (keyboard forwarding and action keybindings).

## Installation

```bash
npm install @napplet/nub-keys
```

## Overview

NUB-KEYS provides bidirectional keyboard interaction between napplets and the shell. Sandboxed iframes capture keyboard events and prevent them from reaching the parent window, so shell-level hotkeys do not work when a napplet has focus. NUB-KEYS solves this with two mechanisms:

1. **Keyboard forwarding** -- the napplet sends unbound keystrokes to the shell via `keys.forward`
2. **Action registration** -- the napplet declares named actions the shell can bind to keys

When the shell binds an action to a key, it pushes binding updates to the napplet. The napplet suppresses forwarding for bound keys and triggers the action locally with zero latency.

## Message Types

All messages use the NIP-5D JSON envelope wire format (`{ type: "keys.<action>", ...payload }`).

### Napplet -> Shell

| Type | Payload | Description |
|------|---------|-------------|
| `keys.forward` | `key`, `code`, `ctrl`, `alt`, `shift`, `meta` | Forward a keystroke (fire-and-forget, no `id`) |
| `keys.registerAction` | `id`, `action` | Register a named action (correlated by `id`) |
| `keys.unregisterAction` | `actionId` | Remove a registered action (fire-and-forget) |

### Shell -> Napplet

| Type | Payload | Description |
|------|---------|-------------|
| `keys.registerAction.result` | `id`, `actionId`, `binding?`, `error?` | Result of action registration |
| `keys.bindings` | `bindings[]` | Complete binding list (not a diff) |
| `keys.action` | `actionId` | Shell triggers an action in the napplet |

## Usage

```ts
import type {
  KeysForwardMessage,
  KeysRegisterActionMessage,
  KeysRegisterActionResultMessage,
  KeysUnregisterActionMessage,
  KeysBindingsMessage,
  KeysActionMessage,
  KeysNubMessage,
  Action,
  RegisterResult,
  KeyBinding,
} from '@napplet/nub-keys';

import { DOMAIN } from '@napplet/nub-keys';
// DOMAIN === 'keys'
```

### Supporting Types

```ts
interface Action {
  id: string;          // unique action identifier, e.g. "editor.save"
  label: string;       // human-readable label for the shell's keybinding UI
  defaultKey?: string; // suggested binding hint, e.g. "Ctrl+S"
}

interface RegisterResult {
  actionId: string;
  binding?: string;    // key combo the shell assigned, if any
}

interface KeyBinding {
  actionId: string;
  key: string;         // key combo string, e.g. "Ctrl+S"
}
```

### Key Combo Format

Modifiers in alphabetical order: `Alt+Ctrl+Meta+Shift+Key`. Examples: `Ctrl+S`, `Alt+Shift+P`, `F5`, `Escape`.

## Domain Registration

Importing `@napplet/nub-keys` automatically registers the `'keys'` domain with the core dispatch singleton via `registerNub()`. This ensures `dispatch.getRegisteredDomains()` includes `'keys'`.

## Protocol Reference

- [NUB-KEYS spec](https://github.com/napplet/nubs/blob/main/NUB-KEYS.md)
- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification

## License

MIT

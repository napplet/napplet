# Technology Stack: Keys NUB

**Project:** napplet v0.20.0 -- Keys NUB (bidirectional keyboard protocol)
**Researched:** 2026-04-09

## Recommended Stack

### New Package: @napplet/nub-keys

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | 5.9.3 | Type definitions for keys NUB messages | Match existing monorepo version exactly. Keys NUB is a type package like nub-theme. |
| tsup | 8.5.0 | ESM-only build | Identical config to all 5 existing NUB packages. Copy `tsup.config.ts` verbatim from nub-theme. |
| @napplet/core | workspace:* | Base `NappletMessage` type, `registerNub` | Same dependency pattern as every NUB package. Keys messages extend `NappletMessage`. |

### No New Dependencies

**Zero new npm packages required.** The keys NUB needs:

1. **Type definitions** -- pure TypeScript interfaces (zero runtime code)
2. **Key combo string parsing** -- a ~30-line function, not a library
3. **Key combo string normalization** -- a ~20-line function, not a library
4. **Modifier extraction** -- trivial destructuring from KeyboardEvent properties

Every keyboard shortcut library (hotkeys-js, mousetrap, keymaster, Keypress, KeyboardJS) is designed for the wrong problem -- they bind DOM listeners and manage state. The napplet protocol only needs to **describe** key combos in a serializable string format and let the shell handle actual binding. Adding any keyboard library would violate the zero-framework-deps constraint and add runtime weight to what is fundamentally a type+serialization package.

### Shim Changes (packages/shim)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| No new deps | -- | keyboard-shim.ts rewrite | Current shim is 91 lines. New version will be similar size but use keys.* envelope types instead of local `KeyboardForwardMessage` interface. |

### SDK Changes (packages/sdk)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| No new deps | -- | `keys` namespace + `registerAction()` convenience | SDK wraps `window.napplet.keys.*` like it wraps `relay`, `ipc`, `storage`. Pure delegation, no new runtime deps. |

### Core Changes (packages/core)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| No new deps | -- | Add `'keys'` to `NubDomain` union, `NUB_DOMAINS` array | One-line type change + one array element. `NappletGlobal` gets a `keys` property. |

## Key Technical Decisions

### 1. Use `key` (not `code`) as the Primary Identifier

**Decision:** Key combo strings use `KeyboardEvent.key` values, normalized to lowercase for alpha keys. `KeyboardEvent.code` is forwarded as metadata but is NOT used for matching.

**Why:** The keys NUB is a command/action protocol, not a game input protocol.

- `key` represents "what the user intended to type" -- correct for shortcuts like Ctrl+S (save), Ctrl+Z (undo)
- `code` represents "which physical button was pressed" -- correct for WASD game controls, which are not the target use case
- International layout users expect Ctrl+Z to work on their Z key, wherever it is physically
- VS Code uses `key` for keybinding matching (except on macOS/Linux where it dispatches on `code` for specific edge cases)

**Caveat (must document):** Shift modifies `key` values inconsistently across layouts. German Shift+2 = `"` not `@`. The safe subset is: A-Z letters, 0-9 digits, F1-F12, Arrow keys, Enter, Tab, Escape, Space, Backspace, Delete, Home, End, PageUp, PageDown. This is sufficient for shell WM shortcuts. Napplets that need exotic combos can use the raw `code` field in the forwarded message.

**Confidence:** HIGH -- based on W3C spec (Proposed Recommendation 2024), MDN documentation, and analysis of VS Code's keybinding architecture.

### 2. Canonical Key Combo String Format

**Decision:** Use `Modifier+Modifier+Key` format with canonical modifier ordering.

**Format:** `[Ctrl+][Alt+][Shift+][Meta+]Key`

Examples:
- `Ctrl+s` -- save
- `Ctrl+Shift+p` -- command palette
- `Alt+1` -- switch to tab 1
- `F5` -- refresh/run
- `Escape` -- close/cancel

**Normalization rules (implement in nub-keys, ~20 lines):**
1. Modifiers sorted: Ctrl before Alt before Shift before Meta (alphabetical)
2. Alpha keys lowercased: `s` not `S` (Shift is explicit modifier)
3. `Control` normalized to `Ctrl` (KeyboardEvent.key returns `Control`)
4. `Meta` stays `Meta` (not `Cmd` or `Win` -- platform-neutral)
5. Bare modifier keys excluded (Control alone is not a combo)

**Why this format:**
- Human-readable in JSON payloads and debug output
- Deterministic -- same combo always produces same string regardless of press order
- Matches developer mental model (VS Code, browser DevTools, Hyprland all use `Mod+Key`)
- Trivial to parse: `combo.split('+')` gives ordered parts

**Why NOT use existing libraries:**
- `hotkeys-js` uses its own format with `command`, `option` aliases -- platform-specific
- `mousetrap` uses `mod` as a meta-modifier -- ambiguous
- `keyboard-shortcut-string` npm package does normalization but adds a dependency for ~15 lines of logic
- Our format is wire protocol -- it must be stable and owned by the spec, not an npm package's whims

**Confidence:** HIGH -- this is the overwhelmingly standard format across tools.

### 3. Action-Keybinding Separation (VS Code Model)

**Decision:** Napplets register **actions** (string identifiers + metadata). The **shell** binds keys to actions. Napplets do NOT choose their own keybindings.

**Why:**
- Multiple napplets share a single keyboard -- conflicts are inevitable if napplets pick keys
- Shell is the keybinding authority (like a WM), napplet is the command provider (like an app)
- Matches tiling WM architecture: apps declare actions, WM assigns keys
- Enables user customization at the shell level without napplet changes
- Avoids the Figma problem where plugins fight over keyboard focus

**Data model:**
```typescript
// Napplet registers actions:
{ type: 'keys.register', actions: [
  { id: 'save', label: 'Save Document', defaultKey?: 'Ctrl+s' },
  { id: 'undo', label: 'Undo', defaultKey?: 'Ctrl+z' },
]}

// Shell assigns bindings and notifies:
{ type: 'keys.bind', bindings: [
  { action: 'save', combo: 'Ctrl+s' },
  { action: 'undo', combo: 'Ctrl+z' },
]}

// Shell invokes action on keypress:
{ type: 'keys.action', action: 'save' }
```

The `defaultKey` field is a **hint** -- the shell may honor it, remap it, or ignore it. This preserves shell authority while giving napplets a way to suggest ergonomic defaults.

**Confidence:** HIGH -- this is the proven pattern from VS Code, Sublime Text, Zed, and every tiling WM.

### 4. Smart Forwarding as a Mode, Not a Library

**Decision:** The shim's keyboard forwarding behavior (currently: forward everything that isn't text input) becomes a shell-controlled mode negotiated via keys NUB messages. No forwarding library needed.

**Three states for any key combo in a focused napplet:**
1. **Shell-bound** -- shell intercepts, napplet never sees it (WM hotkeys like Alt+Tab)
2. **Action-bound** -- shell intercepts, sends `keys.action` to napplet (registered actions)
3. **Unbound/passthrough** -- napplet handles natively (typing, game input, napplet-internal shortcuts)

**The forwarding shim does NOT need to know the binding table.** Instead:
- Shim forwards ALL non-text-input keystrokes as `keys.forward` (same as today)
- Shell checks its binding table and either handles or lets the napplet keep it
- If shell claims a key, it sends `keys.suppress` to tell the napplet to preventDefault future occurrences
- Shell can update suppression list via `keys.config` push message

This inverts the current one-way model (napplet pushes keys to shell) into a bidirectional negotiation (napplet pushes, shell responds with config), without requiring the napplet to pre-know the binding table.

**Why NOT push the full binding table to the napplet:**
- Leaks shell configuration into the sandbox (information principle)
- Napplet would need its own binding-match logic (complexity)
- Shell-side changes would require re-syncing (consistency burden)
- Current forward-everything model already works for the happy path

**Confidence:** MEDIUM -- the suppress-list approach is sound architecturally but the exact message flow needs protocol design validation. The fallback is the simpler model where forwarding stays one-way and shell just handles everything server-side.

### 5. Text Input Detection Stays in the Shim

**Decision:** The `isTextInput()` function from the current keyboard-shim.ts stays. No external library for form field detection.

**Why:**
- The function is 16 lines, handles all standard cases (input, textarea, select, contentEditable)
- No DOM library can do this more correctly
- The napplet knows its own DOM better than any heuristic

**Confidence:** HIGH -- the existing implementation is correct and complete.

### 6. Forward Both `key` AND `code` in Wire Messages

**Decision:** The `keys.forward` message carries both `key` and `code` from the KeyboardEvent, but combo matching uses only `key`.

**Why:**
- Shell may need `code` for game-oriented napplets or accessibility tools
- Cost is one extra string field per message -- negligible
- Matches the current `keyboard-shim.ts` which already sends both
- Future NUB versions could add a `matchMode: 'key' | 'code'` field if needed

**Confidence:** HIGH -- backward compatible with current wire format, low cost.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Key combo parsing | Inline ~30-line function | hotkeys-js (4KB, 0 deps) | Adds external dependency for trivial logic. Wire format must be owned by spec, not library. |
| Key combo parsing | Inline ~30-line function | mousetrap (4.5KB, 0 deps) | Uses `mod` pseudo-modifier. Platform-specific API. Designed to bind DOM listeners, not serialize combos. |
| Key identifier | `KeyboardEvent.key` | `KeyboardEvent.code` | `code` is physical-position-based, wrong for command shortcuts. International layout users would get wrong bindings. |
| Key identifier | `KeyboardEvent.key` | Both `key` and `code` as dual match | Over-engineering. Forward both in the wire message for shell flexibility, but only match on `key`. |
| Action model | Napplet registers actions, shell binds keys | Napplet binds its own keys | Multi-napplet conflict. Shell loses authority. User can't customize. |
| Forwarding | Forward all + shell suppress-list | Push binding table to napplet | Leaks shell config. Napplet needs match logic. Sync burden. |
| Forwarding | Forward all + shell suppress-list | Napplet-side filtering before forward | Same problems as pushing binding table. Napplet must understand shell state. |
| Package location | `packages/nubs/keys/` | Add to existing nub-ifc or core | NUBs are separate packages by design. Keys is its own domain. Core stays zero-logic. |
| Normalize utility | In nub-keys package | In @napplet/core | Core is types+dispatch only. Normalize is domain-specific to keys. |
| Normalize utility | In nub-keys package | Separate @napplet/keys-util package | Over-packaging. Two functions do not warrant a separate package. |

## Package Structure

The new package follows the **exact** pattern of existing NUB packages:

```
packages/nubs/keys/
  package.json          # @napplet/nub-keys, depends on @napplet/core workspace:*
  tsconfig.json         # extends ../../../tsconfig.json
  tsup.config.ts        # identical to nub-theme
  src/
    index.ts            # barrel export + registerNub('keys', ...)
    types.ts            # message type definitions + DOMAIN constant
    normalize.ts        # normalizeCombo() and parseCombo() utilities
```

**Why `normalize.ts` in nub-keys (not core or shim):**
- Both napplet-side (shim/SDK) and shell-side code need to produce and parse combo strings
- nub-keys is the natural home -- it owns the keys domain wire format
- Core stays zero-logic (types + dispatch only)
- Shim imports from nub-keys like it imports from nub-signer, nub-ifc

## Wire Message Inventory (Expected)

Based on existing NUB patterns (theme has 3 messages, ifc has 14, signer has 14):

| Message | Direction | Purpose | Has `id`? |
|---------|-----------|---------|-----------|
| `keys.register` | Napplet -> Shell | Register available actions | Yes |
| `keys.register.result` | Shell -> Napplet | Confirm registration, return assigned bindings | Yes |
| `keys.unregister` | Napplet -> Shell | Remove actions | No (fire-and-forget) |
| `keys.forward` | Napplet -> Shell | Forward a keystroke (replaces current keyboard.forward) | No (fire-and-forget) |
| `keys.action` | Shell -> Napplet | Invoke a registered action | No (fire-and-forget) |
| `keys.bind` | Shell -> Napplet | Push binding updates (shell changed keybinds) | No (push) |
| `keys.config` | Shell -> Napplet | Push forwarding configuration (suppress list) | No (push) |

**~7 message types.** Comparable to storage (10) and theme (3). Much simpler than ifc (14) or signer (14).

## Integration Points

### Shim Integration
- `keyboard-shim.ts` rewritten to use `keys.forward` message type from nub-keys
- Adds `keys.action` listener in `handleEnvelopeMessage()` central router
- Adds `keys.config` listener to update local suppress list
- `isTextInput()` and `isModifierOnly()` stay as internal helpers
- New: `window.napplet.keys.registerAction()` and `window.napplet.keys.onAction()` installed

### SDK Integration
- New `keys` namespace in SDK (`export const keys = { ... }`)
- `registerAction(id, label, opts?)` -- convenience wrapper
- `onAction(actionId, callback)` -- subscribe to shell-invoked actions
- Type re-exports from @napplet/nub-keys

### Core Integration
- `NubDomain` union: add `'keys'`
- `NUB_DOMAINS` array: add `'keys'`
- `NappletGlobal`: add `keys` property to interface

### NIP-5D Update
- Reference keys NUB in the NUB domain table
- No spec text changes beyond the reference (NUBs are separate specs)

## Installation

```bash
# No new external dependencies. Only workspace changes:
# 1. Create packages/nubs/keys/ with package.json
# 2. Add @napplet/nub-keys dependency to shim and sdk

pnpm install  # resolves workspace links
pnpm build    # builds all including new nub-keys
```

## Sources

- [KeyboardEvent.code -- MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) -- HIGH confidence, official W3C standard
- [KeyboardEvent.key -- MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) -- HIGH confidence, official W3C standard
- [UI Events KeyboardEvent code Values -- W3C Proposed Recommendation 2024](https://www.w3.org/TR/uievents-code/) -- HIGH confidence
- [UI Events KeyboardEvent key Values -- W3C Proposed Recommendation 2024](https://www.w3.org/TR/uievents-key/) -- HIGH confidence
- [All JavaScript Keyboard Shortcut Libraries Are Broken -- Jack Duvall](https://blog.duvallj.pw/posts/2025-01-10-all-javascript-keyboard-shortcut-libraries-are-broken.html) -- MEDIUM confidence, well-argued analysis of key vs code pitfalls
- [VS Code Keybindings Architecture -- DeepWiki](https://deepwiki.com/microsoft/vscode-docs/6.4-keybindings-and-commands) -- MEDIUM confidence, describes action/keybinding separation pattern
- [VS Code Keybindings Documentation](https://code.visualstudio.com/docs/configure/keybindings) -- HIGH confidence, official docs
- [Figma Plugin postMessage API](https://www.figma.com/plugin-docs/api/properties/figma-ui-postmessage/) -- MEDIUM confidence, analogous sandbox architecture
- Existing codebase: `packages/shim/src/keyboard-shim.ts`, `packages/core/src/dispatch.ts`, `packages/nubs/theme/src/types.ts`, `packages/nubs/ifc/src/types.ts` -- HIGH confidence, primary source

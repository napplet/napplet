# Feature Landscape: Keys NUB

**Domain:** Keyboard/keybinding delegation protocol for sandboxed iframes
**Researched:** 2026-04-09
**Confidence:** HIGH (existing codebase + well-understood domain patterns)

## Table Stakes

Features users expect. Missing = protocol feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Forward unbound keystrokes to shell | Shell hotkeys (workspace switch, command palette) are dead when iframe has focus. This is the entire reason the keyboard-shim.ts exists. Without it the shell feels broken. | Low | Already implemented as `keyboard.forward`. Becomes `keys.forward`. |
| Suppress bound keys from forwarding | If a napplet registers Ctrl+S for "save draft", that keystroke must NOT also trigger the shell's Ctrl+S handler. Dual-fire is the #1 complaint in iframe keyboard delegation. | Med | Shell maintains a per-napplet bound-key set. Shim checks before forwarding. |
| Action registration by napplet | Napplet declares named actions with suggested default bindings. Shell owns the actual binding. This is how VS Code extensions, Chrome extensions, Zed, and Electron all work. | Med | `keys.registerAction` message. Shell ACKs with actual binding (may differ from suggestion). |
| Text input suppression | Forwarding keystrokes while the user is typing in an `<input>` or `<textarea>` is catastrophic -- shell interprets typing as hotkeys. | Low | Already implemented in keyboard-shim.ts via `isTextInput()`. Carry forward. |
| Modifier-only suppression | Bare Ctrl/Alt/Shift/Meta presses without a companion key are noise. No shell hotkey system triggers on a lone modifier. | Low | Already implemented via `isModifierOnly()`. Carry forward. |
| Shell notifies napplet of focus state | Napplet needs to know when it gains/loses focus to manage local keyboard listeners. Without this, napplets keep processing keys when backgrounded. | Low | `keys.focused` / `keys.blurred` push messages from shell. Maps to existing `wm:focused-window-changed` topic. |
| Cleanup on napplet unload | When a napplet iframe is destroyed, its registered actions and bound keys must be cleaned up. Leaked registrations cause ghost shortcuts. | Low | Shell handles this via existing MessageEvent.source identity tracking. |

## Differentiators

Features that set the keys NUB apart from ad-hoc keyboard forwarding. Not expected, but high value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Action descriptors with human labels | Actions carry `label` and optional `description` so the shell can render a command palette or keybinding settings UI showing napplet-contributed actions. | Low | Mirrors VS Code `contributes.keybindings` with `command` + `title`. Zero runtime cost. |
| Shell-assigned bindings (suggested vs actual) | Napplet suggests `Ctrl+S`, shell may remap to `Ctrl+Shift+S` to avoid conflict. Napplet receives the actual binding in the registration ACK. This is how Chrome extensions and VS Code both handle it. | Med | `keys.registerAction.result` returns `{ binding: 'Ctrl+Shift+S' }`. Napplet can display the correct shortcut in UI. |
| Binding conflict notification | Shell tells napplet when its suggested binding conflicts with a shell-level or other-napplet binding. Napplet can adapt its UI or suggest an alternative. | Low | `keys.registerAction.result` with `conflict: true` and `binding` showing what the shell actually assigned. |
| Keystroke capture mode | Napplet requests "send me ALL keystrokes for N seconds" for custom keybinding configuration UIs. Shell temporarily suspends its own hotkey processing for that napplet. | Med | `keys.capture.start` / `keys.capture.end` + `keys.capture.key` push events. Maps directly to existing `keybinds:capture-start` / `keybinds:capture-end` topics. |
| Action triggered notification (shell -> napplet) | When user presses a bound key, shell dispatches `keys.action` to the napplet with the action name. Napplet does not need to listen for raw keystrokes at all for its registered actions. | Med | This is the core value: napplet declares intent, shell handles dispatch. Eliminates napplet-side keyboard listeners for registered shortcuts. |
| Batch registration | Register multiple actions in a single message to avoid message-per-action overhead during init. | Low | `keys.registerActions` (plural) with array payload. Single ACK. |
| Context-scoped actions | Action is active only in certain napplet states (e.g., "editor focused", "modal open"). Napplet updates its context, shell only dispatches matching actions. | High | Mirrors VS Code's `when` clause. Adds significant complexity. Better as a future extension. |

## Anti-Features

Features to explicitly NOT build. Tempting but wrong for this protocol.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Napplet-side keybinding resolution | Napplet should NOT resolve which action a keystroke maps to. That is the shell's job. If napplets resolve bindings locally, shells cannot remap, and conflicts are invisible. | Napplet registers named actions. Shell resolves keystrokes to actions and dispatches `keys.action`. |
| Synthetic KeyboardEvent injection | Shells should NOT inject fake KeyboardEvent objects into the napplet iframe. This is a sandbox violation pattern (requires allow-same-origin), fragile across browsers, and creates untrusted events that scripts may reject. | Use typed envelope messages (`keys.action`, `keys.forward`). Never synthesize DOM events across the iframe boundary. |
| Global hotkey registration | Napplets should NOT register OS-level global shortcuts (like Electron's `globalShortcut`). Napplets are web content in a sandbox -- they have no business claiming system-wide keyboard real estate. | All bindings are scoped to the shell. Shell decides if any napplet shortcuts become global. |
| Full keymap management by napplet | Napplets should NOT be able to read, list, or modify the shell's full keymap. That is a shell configuration concern. Exposing it creates a privacy/security surface. | Napplet can only register its own actions and receive its own bindings. No shell keymap introspection. |
| Raw `keyCode`/`which` in wire format | Deprecated APIs. `keyCode` and `which` are inconsistent across browsers and keyboard layouts. The existing shim correctly uses `key` and `code`. | Use `key` (logical key) + `code` (physical key) from KeyboardEvent. Both are current standard. |
| `keyup`/`keypress` forwarding | Only `keydown` matters for hotkey dispatch. `keyup` adds message volume with no value. `keypress` is deprecated. | Forward `keydown` only. If a future NUB needs `keyup` (e.g., for games), that is a separate "input" NUB, not keys. |
| Automatic `preventDefault()` in napplet | The shim should NOT call `preventDefault()` on forwarded keystrokes. The napplet may still need the default behavior (e.g., Ctrl+C for copy). Only the shell decides if a key is consumed. | Forward the keystroke, let the shell decide. If the shell consumes it, the napplet's default behavior is irrelevant (it happened in a different frame). |
| Per-napplet keybinding persistence | The keys NUB should NOT persist keybinding customizations. That is shell state. If the user remaps a napplet's Ctrl+S to Ctrl+Shift+S, the shell stores that mapping, not the napplet. | Shell owns persistence. Napplet re-registers actions on every load. Shell applies its stored overrides. |
| KEYBINDS_GET / KEYBINDS_ALL / KEYBINDS_UPDATE / KEYBINDS_RESET | These 4 legacy TOPICS expose shell keymap CRUD to napplets. This is the wrong trust direction -- napplets register actions, they do not manage the shell's keymap. | Drop or supersede these topics. Napplets register actions; shells manage bindings. The `keys.registerAction.result` message tells the napplet its actual binding. |

## Feature Dependencies

```
Text input suppression ─────────────────────────────┐
Modifier-only suppression ──────────────────────────┤
                                                    v
Forward unbound keystrokes (keys.forward) ──> Smart forwarding
                                                    ^
Suppress bound keys ────────────────────────────────┘
                                                    |
                                                    | (requires knowing what is bound)
                                                    v
Action registration (keys.registerAction) ──> Shell bound-key set
        |                                           |
        v                                           v
Action triggered (keys.action) <──── Shell keystroke resolution
        |
        v
Shell-assigned bindings (result.binding) ──> Napplet UI shortcut display

Focus notification (keys.focused/blurred) ──> (independent, no deps)

Capture mode (keys.capture.*) ──> (depends on action registration for "what to rebind")
```

## Message Type Inventory

Based on existing NUB patterns (domain.action envelope format), the keys NUB needs:

### Napplet -> Shell

| Message Type | Purpose | Has Correlation ID |
|-------------|---------|-------------------|
| `keys.registerAction` | Register a named action with suggested binding | Yes |
| `keys.registerActions` | Batch register multiple actions | Yes |
| `keys.unregisterAction` | Remove a registered action | No |
| `keys.forward` | Forward an unbound keystroke to the shell | No |
| `keys.capture.start` | Request capture mode (all keys forwarded) | Yes |
| `keys.capture.end` | End capture mode | No |

### Shell -> Napplet

| Message Type | Purpose | Has Correlation ID |
|-------------|---------|-------------------|
| `keys.registerAction.result` | ACK with actual binding, conflict flag | Yes |
| `keys.registerActions.result` | Batch ACK | Yes |
| `keys.action` | Shell dispatches a bound action to the napplet | No |
| `keys.capture.start.result` | ACK/NACK capture mode | Yes |
| `keys.capture.key` | Keystroke during capture mode | No |
| `keys.focused` | Napplet gained focus | No |
| `keys.blurred` | Napplet lost focus | No |

### Wire Format Details

**keys.forward** (evolved from current `keyboard.forward`):
```typescript
{
  type: 'keys.forward';
  key: string;     // KeyboardEvent.key (logical key value)
  code: string;    // KeyboardEvent.code (physical key position)
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}
```

**keys.registerAction**:
```typescript
{
  type: 'keys.registerAction';
  id: string;           // correlation ID
  action: string;       // action name, e.g. 'save-draft'
  label: string;        // human-readable, e.g. 'Save Draft'
  binding?: string;     // suggested binding, e.g. 'Ctrl+S'
  description?: string; // optional longer description
}
```

**keys.action** (shell dispatches to napplet):
```typescript
{
  type: 'keys.action';
  action: string;  // the registered action name
}
```

## MVP Recommendation

Prioritize (Phase 1 -- table stakes):
1. **keys.forward** -- rename from keyboard.forward, same logic
2. **keys.registerAction** + **keys.registerAction.result** -- core bidirectional contract
3. **keys.action** -- shell dispatches bound actions to napplet
4. **Smart forwarding** -- suppress registered bindings from keys.forward
5. **keys.focused / keys.blurred** -- focus state notifications

Defer:
- **Capture mode** (keys.capture.*): Real value, but no current consumer. Add when a napplet needs a keybinding configuration UI.
- **Batch registration** (keys.registerActions): Convenience, not correctness. Add when init performance matters.
- **Context-scoped actions**: High complexity (VS Code's when-clause is thousands of lines). Only add if a real napplet needs conditional shortcuts.
- **keys.unregisterAction**: Rare use case. Shell already cleans up on iframe destroy. Add if napplets need dynamic action sets.

## Relationship to Existing Code

### Replaces

| Existing | Replacement | Notes |
|----------|-------------|-------|
| `keyboard.forward` message type | `keys.forward` | Same payload, new domain prefix |
| `installKeyboardShim()` in shim | Keys NUB shim integration | Shim installs keys NUB listener, not standalone keyboard-shim |
| `keyboard-shim.ts` file | Keys NUB shim code (inline or separate file) | `isTextInput()` and `isModifierOnly()` logic preserved |
| `hotkey:forward` ACL capability (deleted in v0.19.0) | Shell-side keys NUB ACL | Shell decides per-napplet keyboard policy |

### Supersedes (TOPICS to drop or supersede)

| Topic | Keys NUB Replacement |
|-------|---------------------|
| `keybinds:get-all` | No replacement. Napplets do not introspect the shell keymap. |
| `keybinds:all` | No replacement. |
| `keybinds:update` | `keys.registerAction` (napplet registers, shell decides binding) |
| `keybinds:reset` | No replacement. Shell manages its own keymap lifecycle. |
| `keybinds:capture-start` | `keys.capture.start` (deferred) |
| `keybinds:capture-end` | `keys.capture.end` (deferred) |

### Integrates With

| Existing Infrastructure | How Keys NUB Uses It |
|------------------------|---------------------|
| `NappletMessage` base type | All keys.* messages extend it |
| `NubDomain` union | Add `'keys'` to the union |
| `NUB_DOMAINS` array | Add `'keys'` to the array |
| `shell.supports('keys')` / `shell.supports('nub:keys')` | Napplet checks before registering actions |
| `handleEnvelopeMessage()` in shim | Route `keys.action`, `keys.focused`, `keys.blurred` to local handlers |
| `MessageEvent.source` identity | Shell tracks which napplet registered which actions |

## Edge Cases

### Keyboard Layout Sensitivity
- Use `key` for display (shows what user typed) and `code` for matching (physical position is layout-stable)
- Bindings should be stored as `code`-based internally but displayed as `key`-based to the user
- macOS Option key modifies `key` values (e.g., Option+C = c-cedilla). The `code` remains 'KeyC'. Forward both.
- Confidence: HIGH -- this is well-documented in the KeyboardEvent spec and the "all JS keyboard libraries are broken" analysis

### Timing and Race Conditions
- Napplet registers action AFTER shell has already forwarded that key. Solution: shell re-evaluates forwarding rules on registration change.
- Napplet iframe loads and immediately receives keystrokes before shim is installed. Solution: shim installs in capture phase on document (already does this).
- Two napplets register conflicting bindings. Solution: shell resolves conflicts, each napplet gets its own `registerAction.result` with the actual binding.

### Focus Edge Cases
- User clicks directly into napplet text input -- forward nothing until they leave the input
- User Alt-Tabs away from browser entirely -- no keyboard events fire, no edge case
- Napplet opens a `<dialog>` or modal -- `isTextInput()` check still applies per-element
- contentEditable elements -- already handled by existing `isContentEditable` check

### Security Considerations
- Napplet could register thousands of actions to exhaust shell memory. Shell should cap registrations per napplet (e.g., 100 actions).
- Napplet could register every possible key combination to suppress all forwarding (DoS against shell hotkeys). Shell should have a reserved/protected binding set that cannot be suppressed.
- Capture mode is powerful -- shell should require explicit user consent or limit duration.

## Sources

- [VS Code Keybindings](https://code.visualstudio.com/docs/getstarted/keybindings) -- action registration, when-clause contexts, conflict resolution
- [VS Code Contribution Points](https://code.visualstudio.com/api/references/contribution-points) -- extension manifest keybinding declaration pattern
- [Chrome Extension Commands API](https://developer.chrome.com/docs/extensions/reference/api/commands) -- manifest declaration, suggested_key, conflict handling
- [Zed Key Bindings](https://zed.dev/docs/key-bindings) -- context-aware action map, hierarchical priority, conflict resolution
- [Electron Keyboard Shortcuts](https://www.electronjs.org/docs/latest/tutorial/keyboard-shortcuts) -- webview keyboard trapping, before-input-event interception
- [Figma Plugin Architecture](https://developers.figma.com/docs/plugins/how-plugins-run/) -- sandbox keyboard limitations, iframe/main thread separation
- [All JS Keyboard Libraries Are Broken](https://blog.duvallj.pw/posts/2025-01-10-all-javascript-keyboard-shortcut-libraries-are-broken.html) -- key vs code vs keyCode, deprecated APIs, layout pitfalls
- [Wayland Keyboard Grab Protocol](https://wayland.app/protocols/xwayland-keyboard-grab-unstable-v1) -- compositor-level keyboard grab patterns
- Existing codebase: `keyboard-shim.ts`, `SPEC-GAPS.md` GAP-07, `topics.ts` KEYBINDS_* entries

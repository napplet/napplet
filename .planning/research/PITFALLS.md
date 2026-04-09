# Domain Pitfalls: Adding a Keys NUB to Sandboxed Iframes

**Domain:** Keyboard delegation protocol for sandboxed iframe apps (napplet <-> shell)
**Researched:** 2026-04-09
**Overall confidence:** HIGH (findings grounded in browser specifications, real-world iframe keyboard projects, existing codebase analysis, and documented browser bugs)

---

## Critical Pitfalls

Mistakes that cause rewrites, security vulnerabilities, or broken UX across browsers.

### Pitfall 1: Key vs Code Confusion -- Matching on the Wrong Property

**What goes wrong:** The protocol uses `KeyboardEvent.key` for shortcut matching, which varies by keyboard layout and locale. A user on an AZERTY keyboard pressing the physical Q key produces `key: "a"`, not `key: "q"`. Shortcuts like "Ctrl+Q" break on non-QWERTY layouts because the key that physically occupies the Q position generates a different character.

Conversely, using only `KeyboardEvent.code` (which is layout-independent and always returns `"KeyQ"` for the physical Q position) breaks character-based shortcuts. A user expects "Ctrl+/" to work regardless of physical key position, but `code` returns the physical scan code, not the character.

**Why it happens:** The existing `keyboard-shim.ts` sends both `key` and `code`, but the protocol does not define which one the shell should use for matching. VSCode spent years on this exact problem (issue #17521) migrating from `keyCode` to `code`+`key` because no single property works for all shortcut types.

**Consequences:** International users (AZERTY, Dvorak, QWERTZ, CJK layouts) find shortcuts broken. Actions bound by the shell fail to trigger when the user presses what they believe is the correct key. This is a silent failure -- no error, just dead shortcuts.

**Prevention:**
- The keys NUB MUST send both `key` and `code` in every forward message
- The protocol MUST document that shells use `code` for positional shortcuts (WASD gaming, arrow-like navigation) and `key` for character shortcuts (Ctrl+/, Ctrl+S)
- Action registration SHOULD specify whether the binding is positional or character-based
- Consider a `match` field in the action registration: `match: 'code'` or `match: 'key'` (default `'code'` for modifier combos, `'key'` for character input)

**Detection:** Test with at least two non-QWERTY layouts. If any registered action fails to fire on a Dvorak or AZERTY keyboard, the matching logic is wrong.

**Phase:** Must be addressed in the NUB type design phase (message type definitions). Cannot be deferred.

**Confidence:** HIGH -- VSCode issue #17521 documents this in detail. MDN explicitly warns: "it is impossible to use the value of `code` to determine what the name of the key is to users if they're not using an anticipated keyboard layout."

### Pitfall 2: postMessage Flooding from Key Repeat

**What goes wrong:** Holding a key down fires `keydown` events at the OS repeat rate (typically 30-60 Hz). The current `keyboard-shim.ts` forwards every single one to the parent via `postMessage`. This creates 30-60 postMessage calls per second per held key, potentially saturating the message channel and starving other NUB messages (relay events, signer responses, storage operations).

**Why it happens:** The current shim has no awareness of `KeyboardEvent.repeat`. It treats every keydown identically. The `repeat` property is `true` for held-key events, but the shim does not check it.

**Consequences:**
- Shell message handler gets flooded with keyboard messages during key-hold
- Other NUB messages (relay events, signer results) are delayed because the browser's message queue is saturated
- On low-end devices, the shell's `message` event handler becomes the performance bottleneck
- In the worst case, a malicious napplet could intentionally dispatch synthetic KeyboardEvent repeat events to DoS the shell's message processing

**Prevention:**
- Forward messages MUST include the `repeat` boolean from `KeyboardEvent.repeat`
- The shim SHOULD throttle repeat events (e.g., max 10/sec for forwarded repeats)
- The shell SHOULD implement its own rate limiting per-napplet on `keys.forward` messages
- Consider making repeat forwarding opt-in: the default behavior forwards only the first keydown (repeat: false), and the shell explicitly requests repeat events for specific actions that need them (e.g., arrow key scrolling)

**Detection:** Hold a key for 3 seconds and count postMessage calls. If you see > 100 messages, there is no throttling. Profile the shell's message handler CPU usage during key-hold.

**Phase:** Must be addressed in the shim integration phase. The NUB type should include `repeat` in the message shape. The shim must implement throttling.

**Confidence:** HIGH -- MDN documents that keydown fires repeatedly. The current shim provably forwards all repeats (no `event.repeat` check in the code).

### Pitfall 3: Race Between Focus, Forward, and Shell Action Dispatch

**What goes wrong:** The napplet forwards a keydown via postMessage. The shell receives it and dispatches the bound action (e.g., "focus next pane"). That action changes which napplet has focus. Meanwhile, the napplet is still processing the same keystroke locally (it has not been `preventDefault()`-ed because the forward decision is async). The keystroke triggers both the shell action AND a local napplet behavior.

This is the fundamental race condition of bidirectional keyboard delegation: the napplet and shell both see the same keystroke, and the decision about who "owns" it cannot be synchronous because postMessage is inherently asynchronous.

**Why it happens:** `postMessage` is async. The napplet cannot wait for the shell to confirm "I handled this, suppress it" before the browser's default keydown processing completes. By the time the shell responds, the napplet has already let the event propagate.

**Consequences:** Double-action: a workspace-switch hotkey both switches the workspace AND types a character into the napplet's input. Or: pressing Escape to close a shell overlay also triggers the napplet's own Escape handler. Users experience "ghost" keystrokes in the napplet after shell actions.

**Prevention:**
- The keys NUB MUST define a "bound keys" list that the napplet receives at registration time or when bindings change
- The shim MUST `preventDefault()` + `stopPropagation()` keystrokes that match bound keys BEFORE forwarding -- the napplet decides locally and synchronously, no round-trip needed
- The shell sends `keys.bindings` messages to the napplet listing which key combinations the shell claims
- The napplet's shim maintains a local Set of bound combos and suppresses them on capture-phase keydown
- When bindings change (user rebinds a key), the shell sends an updated `keys.bindings` message
- This is the "smart forwarding" pattern: forward unbound keys as informational, suppress-and-forward bound keys as actions

**Detection:** Register a shell action on Ctrl+K. Type Ctrl+K in a napplet with a text input focused. If both the shell action fires AND a character/behavior occurs in the napplet, the race exists.

**Phase:** This is the core architectural decision. Must be resolved in the NUB protocol design phase before any implementation.

**Confidence:** HIGH -- this is a well-known problem in JupyterLab (#5719), Mozilla Horizon (#51), and any iframe-based IDE. The async nature of postMessage makes synchronous coordination impossible without pre-distributed binding lists.

### Pitfall 4: IME Composition Interference

**What goes wrong:** CJK (Chinese, Japanese, Korean) input method editors generate `keydown` events with `keyCode: 229` and `isComposing: true` during composition. The shim forwards these to the shell as regular keystrokes. The shell interprets partial IME composition as hotkey triggers, breaking text input for CJK users.

**Why it happens:** The existing `keyboard-shim.ts` checks `isTextInput(event.target)` to skip forwarding when the user is typing in an input. But IME composition can occur on any element (contentEditable divs, custom elements, canvas-based editors). The `isTextInput()` check misses non-standard text entry surfaces. Even worse: some IME workflows produce events where `isComposing` transitions from `false` to `true` after the `keydown` fires but before `compositionstart` fires, creating a timing gap.

**Consequences:** CJK users cannot type in any napplet that uses contentEditable or custom input elements. Partial composition keystrokes trigger shell hotkeys mid-typing. This is not a niche concern -- CJK users represent a significant portion of the Nostr community.

**Prevention:**
- The shim MUST check `event.isComposing === true` and skip forwarding entirely during composition
- ALSO check `event.keyCode === 229` as a fallback (Firefox 65+ fires keydown during composition but older behavior varies)
- The forward message SHOULD include an `isComposing` boolean so the shell can make its own decision
- The `isTextInput()` check must be expanded to include `contentEditable` elements on ancestor nodes (the current implementation checks the target element but not parents)
- Consider adding `compositionstart`/`compositionend` listeners that set a module-level flag, since `isComposing` can be `false` at the edge of composition boundaries

**Detection:** Enable a CJK IME, start composing in a contentEditable div inside a napplet. If any shell action fires during composition, the filter is broken.

**Phase:** Must be addressed in the shim integration phase. The NUB type should include `composing: boolean` in the message shape.

**Confidence:** HIGH -- MDN explicitly documents the `isComposing`/`keyCode: 229` pattern. Firefox/Chrome behavior is verified in the MDN keydown event docs.

---

## Moderate Pitfalls

### Pitfall 5: Napplet-Initiated Focus Stealing via Keyboard Protocol

**What goes wrong:** A malicious napplet uses the keys NUB to register many actions, then sends fabricated `keys.forward` messages to trick the shell into believing the user pressed focus-changing key combinations. The shell shifts focus to the malicious napplet, which then captures subsequent real keystrokes.

**Why it happens:** The shell trusts `keys.forward` messages from any napplet. If the shell does not validate that a forwarded key event corresponds to an actual user keystroke (it cannot -- there is no way to cryptographically prove a keystroke happened), a malicious napplet can forge keyboard messages.

**Consequences:** Keystroke hijacking: a malicious napplet silently captures passwords, seed phrases, or other sensitive input by stealing focus. This is documented as a real attack vector (W3C WebAppSec issue #273, Imperva keyboard shortcut exploitation research).

**Prevention:**
- The shell MUST NOT change focus based solely on napplet-forwarded keyboard events
- Focus management must be a shell-initiated operation, not something napplets can trigger via keyboard messages
- Shell actions that change focus (workspace switch, pane navigation) should be bound to shell-level key listeners, NOT to forwarded napplet messages
- The keys NUB forward messages are informational for the shell's hotkey system; they MUST NOT be the sole trigger for security-sensitive operations (focus change, signer requests, ACL modifications)
- Rate-limit `keys.forward` messages per napplet (e.g., max 20/sec). A napplet sending 100+ keyboard messages per second is either buggy or malicious

**Detection:** Create a test napplet that sends 50 fabricated `keys.forward` messages per second. If the shell's behavior changes (focus shifts, actions fire), the trust boundary is too permissive.

**Phase:** Must be addressed in the security model design. Add to the NUB spec's security considerations section.

**Confidence:** HIGH -- focus stealing via iframe is a documented attack vector (Mozilla bug #604289, W3C WebAppSec #273/543).

### Pitfall 6: Unidirectional Protocol -- Shell Cannot Send Keys to Napplet

**What goes wrong:** The protocol only supports napplet -> shell key forwarding. The shell has no way to inject synthetic keyboard events into a napplet. This means shell-level features that need to send keystrokes to the focused napplet (global search focus with Ctrl+K, "type ahead" from command palette) are impossible.

**Why it happens:** The current `keyboard-shim.ts` is purely unidirectional: napplet captures keydown, forwards to parent. There is no message listener for shell-to-napplet key injection. This made sense for the simple "forward hotkeys" use case, but a full keys NUB needs bidirectional flow.

**Consequences:** The shell cannot implement features like:
- "Focus search box" (shell presses Ctrl+K, napplet should focus its search input)
- "Insert text" from command palette or voice input
- "Undo/Redo" delegation where the shell manages the undo stack

Without shell-to-napplet key delivery, the protocol is an incomplete keyboard abstraction.

**Prevention:**
- The keys NUB MUST define shell -> napplet message types for key injection
- At minimum: `keys.inject` (shell sends a key event the napplet should process) and `keys.focus` (shell requests the napplet focus a specific action target)
- The napplet shim must listen for `keys.inject` and dispatch a synthetic `KeyboardEvent` on the document
- Synthetic events must be clearly distinguishable from real user events (`event.isTrusted` will be `false` -- this is fine and expected)
- Shell-to-napplet key injection SHOULD be gated by the napplet's registered action list: the shell can only inject keys the napplet has registered handlers for

**Detection:** If the NUB spec has no shell -> napplet message types, it is incomplete. Check: can the shell trigger any keyboard-driven behavior in the napplet without the user physically pressing a key?

**Phase:** Must be designed in the NUB type definition phase. Adding it later is a breaking protocol change.

**Confidence:** MEDIUM -- the current use case is forward-only, but the NUB is described as "bidirectional" in PROJECT.md requirements.

### Pitfall 7: Stale Binding List After Dynamic Napplet Changes

**What goes wrong:** The shell sends a binding list at napplet load time. The napplet's shim caches it and uses it for local suppress-or-forward decisions. Later, the user changes keybindings in the shell's settings, or a different napplet is loaded that claims conflicting bindings. The original napplet's cached binding list is now stale. Keystrokes that should be forwarded are suppressed (or vice versa).

**Why it happens:** The binding list is treated as static. No update mechanism exists. The shell's keybinding state can change at any time (user settings, napplet lifecycle, shell plugin changes), but the napplet does not learn about these changes.

**Consequences:** After a keybinding change, users experience phantom behavior: keys they expect to be handled by the shell are consumed by the napplet, or keys they expect the napplet to handle are swallowed by the shell's outdated claims.

**Prevention:**
- The keys NUB MUST define a `keys.bindings` message type for the shell to push updated binding lists at any time
- The shim MUST replace its cached binding set atomically when a new `keys.bindings` message arrives
- The shell MUST send `keys.bindings` on: initial load, user keybinding change, and when another napplet's registration changes the binding landscape
- The binding list should include a version or sequence number so the napplet can detect missed updates
- On binding update, the shim should NOT tear down and reinstall the keydown listener -- just swap the suppression set

**Detection:** Register a binding, change it in the shell settings, then press the old binding in the napplet. If the old behavior persists, the update mechanism is broken.

**Phase:** Must be designed in the NUB protocol phase and implemented in the shim integration phase.

**Confidence:** HIGH -- any publish-subscribe system with cached state has stale cache problems. The KEYBINDS_* topics in the existing codebase (6 topic constants for get/update/reset) prove this was already anticipated.

### Pitfall 8: Tab Key and Focus Trap Accessibility Violation

**What goes wrong:** The keys NUB captures Tab key events and forwards them to the shell for workspace navigation, trapping keyboard-only users inside the napplet. Users who rely on Tab for navigation (screen reader users, keyboard-only users) cannot tab out of the napplet.

**Why it happens:** Tab is a natural candidate for shell hotkeys (next pane, next workspace). But Tab is also a fundamental accessibility navigation key. WCAG 2.1.2 (No Keyboard Trap, Level A) requires that users can tab into and out of every component.

**Consequences:** The app fails WCAG Level A compliance. Keyboard-only users are trapped. Screen reader users cannot navigate. This is a legal liability in some jurisdictions (ADA, EN 301 549).

**Prevention:**
- The keys NUB MUST NOT suppress bare Tab or Shift+Tab -- these are reserved for accessibility navigation
- Only modified Tab (Ctrl+Tab, Alt+Tab) may be claimed by the shell
- The NUB spec should include a "reserved keys" section listing keys that MUST NOT be suppressed: Tab, Shift+Tab, Escape (for focus escape)
- The shim should have a hardcoded allowlist of keys that are never forwarded regardless of shell bindings
- Consider also reserving: F1 (help), F5 (refresh), F11 (fullscreen), F12 (devtools) -- these are browser-reserved

**Detection:** Tab into a napplet, then try to Tab out. If focus stays in the napplet, the Tab key is being captured. Run an accessibility audit (axe, Lighthouse) on a page with napplet iframes.

**Phase:** Must be defined in the NUB spec phase. The reserved keys list is a protocol-level concern.

**Confidence:** HIGH -- WCAG 2.1.2 is a Level A requirement. iframe focus trapping is a known accessibility failure pattern.

### Pitfall 9: Browser-Reserved Shortcuts Cannot Be Overridden

**What goes wrong:** The shell tries to bind Ctrl+T (new tab), Ctrl+W (close tab), Ctrl+N (new window), Ctrl+L (address bar), Ctrl+P (print), or Ctrl+S (save). These are browser-reserved and cannot be intercepted by JavaScript. The shell's binding list claims these keys, the napplet suppresses them locally, but the browser handles them before any JavaScript runs. The user experiences: key does nothing in the napplet (suppressed), AND nothing in the shell (browser stole it).

**Why it happens:** Browser-level keyboard shortcuts take priority over all JavaScript event handlers. `preventDefault()` does not work for most browser shortcuts. This is by design -- browsers must maintain control for user safety. Web applications cannot override OS-level shortcuts either (Alt+F4, Cmd+Q, Ctrl+Alt+Del).

**Consequences:** Dead keys: the binding exists in the protocol but never fires. Users see the shortcut listed in the shell's keybinding UI but it never works. Worse: the napplet suppressed the key, so the normal browser behavior (which the user might want) is also blocked in some browsers.

**Prevention:**
- The NUB spec MUST document a list of browser-reserved shortcuts that MUST NOT appear in binding lists
- The shell SHOULD validate binding lists and warn when a reserved shortcut is configured
- The napplet shim SHOULD NOT suppress keys that are known browser-reserved (the suppression has no effect but wastes cycles)
- Minimum reserved list: Ctrl+T, Ctrl+W, Ctrl+N, Ctrl+L, Ctrl+P, Ctrl+S, Ctrl+H, Ctrl+J, Ctrl+D, F5, F11, F12, Alt+F4, Ctrl+Shift+I, Ctrl+Shift+J
- Note: the exact list varies by browser and OS. The NUB should define a minimum reserved set and allow shells to extend it.

**Detection:** Bind Ctrl+T to a shell action. Press Ctrl+T in a napplet. If a new browser tab opens instead of the shell action, the key is browser-reserved and should not be in the binding list.

**Phase:** Must be documented in the NUB spec. The reserved list should be a constant exported from the nub-keys package.

**Confidence:** HIGH -- browser shortcut reservation is well-documented (Mozilla bug #380637, Chrome commands API docs).

---

## Minor Pitfalls

### Pitfall 10: Missing keyup Causes Stuck Modifier State

**What goes wrong:** The shim only forwards `keydown` events (as the current implementation does). The user presses Ctrl+K (keydown for Ctrl, keydown for K, both forwarded). Then the user releases Ctrl while a different napplet has focus (or while the mouse is in the parent frame). The shell never receives the Ctrl keyup. The shell's internal modifier state thinks Ctrl is still held, and subsequent keypresses are incorrectly interpreted as Ctrl+X combinations.

**Why it happens:** Focus can shift between keydown and keyup. MDN explicitly documents: "the event target can change between keydown and keyup events." If the user clicks outside the napplet between pressing and releasing a key, the keyup fires in a different context.

**Prevention:**
- The keys NUB should support both `keys.forward` (keydown) and `keys.release` (keyup) message types
- At minimum, the shim MUST forward keyup events for modifier keys (Ctrl, Alt, Shift, Meta)
- The shell MUST implement a "modifier reset" on focus change: when a napplet gains or loses focus, assume all modifiers are released
- The shell SHOULD also listen for `blur` events on the iframe and reset modifier state

**Detection:** Press and hold Ctrl in a napplet. Click outside the napplet (into the shell UI). Release Ctrl. Then click back into the napplet and press a regular key. If the shell interprets it as Ctrl+key, the modifier state is stuck.

**Phase:** Should be addressed in the NUB type definition phase. Adding keyup support later is additive but changes the expected message flow.

**Confidence:** MEDIUM -- modifier sticking is a known issue in keyboard shortcut libraries (mousetrap #128, react-hotkeys #177).

### Pitfall 11: Duplicate Installation of Keyboard Shim

**What goes wrong:** The shim is installed multiple times (hot module reload, SPA navigation, dynamic import). Each installation adds another capture-phase keydown listener. Every keystroke is forwarded N times, once per installation.

**Why it happens:** The current `keyboard-shim.ts` has a guard (`if (installed && activeCleanup) return activeCleanup`), but if the module is re-evaluated (as happens with some bundlers during HMR), the `installed` flag resets and a new listener is added alongside the old one.

**Consequences:** Shell receives duplicate `keys.forward` messages. Actions fire multiple times. Throttling logic is defeated because each shim instance throttles independently.

**Prevention:**
- Use a global sentinel on `window` rather than a module-level variable: `if (window.__napplet_keyboard_installed) return`
- The cleanup function should be stored on `window` so any shim instance can find and clean up a previous installation
- Alternatively: use `{ once: false, capture: true }` with a named function and `removeEventListener` before `addEventListener` to ensure only one listener exists
- The NUB's shim integration should check for existing installation via the global sentinel

**Detection:** Import the keyboard shim twice. Press a key. Count postMessage calls. If more than one message per keydown, there is duplicate installation.

**Phase:** Should be addressed in the shim integration phase.

**Confidence:** HIGH -- the existing code's module-level guard is insufficient for HMR scenarios. This is a known pattern in side-effect modules.

### Pitfall 12: Action Registration Collision Between Napplets

**What goes wrong:** Two napplets register actions that claim the same key combination. Napplet A registers `Ctrl+Enter` for "send message." Napplet B registers `Ctrl+Enter` for "execute code." The shell must decide which napplet's action wins when the user presses Ctrl+Enter.

**Why it happens:** The keys NUB allows napplets to register actions with preferred key bindings. Without a conflict resolution strategy, the shell has no principled way to break ties.

**Consequences:** Unpredictable behavior: sometimes napplet A's action fires, sometimes napplet B's. Or: the focused napplet always wins, which is intuitive but means the other napplet's action is unreachable. Or: the shell's binding list becomes contradictory.

**Prevention:**
- The NUB spec should define conflict resolution rules:
  1. The **focused napplet** has priority for its registered bindings
  2. Shell-level (global) bindings always override napplet bindings
  3. Unfocused napplets' bindings are dormant (not suppressed, not forwarded)
- The `keys.bindings` message sent to each napplet should only include bindings relevant to that napplet (its own registrations + global shell bindings), not other napplets' bindings
- The shell maintains a per-napplet binding registry. Only the focused napplet's bindings are active at any time.
- Action registration should use semantic action names (e.g., `"send-message"`) not key combinations. The shell maps actions to keys. The napplet suggests a default binding but the shell has final authority.

**Detection:** Load two napplets that both register the same key combination. Focus one, press the key. Focus the other, press the key. If the wrong action fires, or both fire, the conflict resolution is broken.

**Phase:** Must be designed in the NUB protocol phase. Conflict resolution is a protocol-level concern.

**Confidence:** MEDIUM -- the project already has 6 KEYBINDS_* topic constants suggesting this problem domain was encountered during reference shell development.

### Pitfall 13: Safari iOS Virtual Keyboard Viewport Shift

**What goes wrong:** When a napplet contains an input field and the iOS virtual keyboard opens, Safari shifts the viewport upward, causing the napplet iframe to be partially or fully hidden behind the keyboard. The napplet's own layout does not know the keyboard is open because `visualViewport.resize` events do not propagate into sandboxed iframes.

**Why it happens:** iOS Safari handles virtual keyboard viewport adjustment at the browser level, outside the napplet's sandbox. The napplet cannot query `window.visualViewport` (returns the iframe's viewport, not the screen viewport). The shell cannot communicate the virtual keyboard height to the napplet because there is no protocol message for it.

**Consequences:** Mobile users cannot see what they are typing. The napplet's input field scrolls behind the virtual keyboard. This is a well-documented Safari iframe bug (Apple Developer Forums thread #28656, multiple WebKit bugs).

**Prevention:**
- This is primarily a shell layout concern, not a keys NUB concern
- However, the keys NUB could include a `keys.virtualKeyboard` message type for the shell to notify the napplet of virtual keyboard state (open/closed, height)
- The napplet could adjust its layout based on this information
- For v1, document this as a known limitation and recommend shells handle it via CSS (`env(safe-area-inset-bottom)`, dynamic iframe resizing)
- Do NOT try to solve this in the keyboard shim -- it requires shell-level viewport management

**Detection:** Open a napplet with a text input on iOS Safari. Tap the input. If the input is obscured by the virtual keyboard and the napplet does not adjust, the pitfall is present.

**Phase:** Out of scope for v0.20.0. Document as a known limitation. May be addressed in a future NUB extension or theme NUB integration.

**Confidence:** MEDIUM -- documented in Apple Developer Forums and WebKit bugs, but the impact on sandboxed iframes specifically (no `allow-same-origin`) needs verification.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| NUB type definitions (nub-keys package) | Key vs code confusion (P1) | Send both `key` and `code`. Define `match` field for action registration. |
| NUB type definitions (nub-keys package) | Missing shell->napplet direction (P6) | Design bidirectional from day one. Include `keys.inject`, `keys.bindings`, `keys.focus`. |
| NUB type definitions (nub-keys package) | Missing keyup support (P10) | Include `keys.release` message type for modifier tracking. |
| NUB type definitions (nub-keys package) | Action collision (P12) | Define focused-napplet-wins conflict resolution. Actions use semantic names. |
| Shim integration | postMessage flooding (P2) | Check `event.repeat`. Throttle repeated key forwards. |
| Shim integration | Forward/suppress race (P3) | Pre-distribute binding list. Suppress locally and synchronously before forwarding. |
| Shim integration | IME interference (P4) | Check `isComposing` and `keyCode === 229`. Track composition state with start/end listeners. |
| Shim integration | Duplicate installation (P11) | Use `window.__napplet_keyboard_installed` sentinel instead of module-level flag. |
| Shim integration | Binding cache staleness (P7) | Listen for `keys.bindings` updates. Replace set atomically. |
| Security model | Focus stealing (P5) | Shell must not change focus based solely on forwarded keys. Rate limit per-napplet. |
| Security model | Browser-reserved shortcuts (P9) | Document and export reserved key list. Shell validates bindings. |
| NUB spec writing | Tab/accessibility trap (P8) | Define reserved keys list in spec. Hardcode Tab/Shift+Tab exemption. |
| SDK convenience wrappers | Missing bindings context | SDK `registerAction()` must receive initial bindings list before the first keydown. |
| NIP-5D amendment | Overspecification | Reference keys NUB by domain name only. Do not inline message types. |
| Testing | Cross-browser coverage | Test IME on Firefox 65+ and Chrome. Test key/code on Dvorak/AZERTY. Test Tab trapping with screen reader. |

---

## Pitfall Dependency Map

Some pitfalls compound each other:

```
P1 (key/code) + P3 (race) = Wrong key suppressed, wrong action fires
P2 (flooding) + P5 (focus steal) = DoS + keystroke hijack combined attack
P3 (race) + P7 (stale bindings) = Suppress decisions based on outdated binding list
P4 (IME) + P3 (race) = IME keystroke forwarded, shell action fires mid-composition
P8 (Tab trap) + P6 (no inject) = Cannot programmatically un-trap user
P10 (no keyup) + P3 (race) = Modifier stuck after focus shift during key chord
```

The P1+P3 and P3+P7 chains are the most likely to occur together and produce confusing behavior that is hard to debug.

---

## Risk Assessment Summary

| Pitfall | Severity | Likelihood | Phase Impact |
|---------|----------|------------|--------------|
| P1: Key vs Code | Critical | HIGH (any non-QWERTY user) | NUB types |
| P2: Repeat Flooding | Critical | HIGH (any held key) | Shim |
| P3: Forward/Suppress Race | Critical | HIGH (architectural) | NUB protocol + Shim |
| P4: IME Composition | Critical | HIGH (CJK users) | Shim |
| P5: Focus Stealing | Moderate | MEDIUM (malicious napplet) | Security model |
| P6: No Shell->Napplet | Moderate | HIGH (missing capability) | NUB types |
| P7: Stale Bindings | Moderate | HIGH (any binding change) | NUB protocol + Shim |
| P8: Tab/A11y Trap | Moderate | HIGH (any keyboard user) | NUB spec |
| P9: Browser-Reserved | Moderate | MEDIUM (misconfigured shell) | NUB spec |
| P10: Stuck Modifiers | Minor | MEDIUM (focus shift during chord) | NUB types |
| P11: Duplicate Install | Minor | MEDIUM (HMR/dev) | Shim |
| P12: Action Collision | Minor | MEDIUM (multi-napplet shell) | NUB protocol |
| P13: iOS Virtual KB | Minor | LOW (mobile, Safari-specific) | Future/docs |

---

## Sources

### Browser Documentation
- [MDN: KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) -- layout-independent key identification
- [MDN: KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) -- layout-dependent character value
- [MDN: KeyboardEvent.repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat) -- key repeat detection
- [MDN: Element keydown event](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event) -- IME composition handling, browser quirks
- [MDN: Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) -- cross-origin messaging
- [Chrome: KeyboardEvent keys and codes](https://developer.chrome.com/blog/keyboardevent-keys-codes) -- key vs code explained

### Real-World iframe Keyboard Problems
- [VSCode: Move keybinding dispatch off keyCode (#17521)](https://github.com/microsoft/vscode/issues/17521) -- key/code migration in large codebase
- [JupyterLab: Focus selectors in keyboard shortcuts block shortcuts when iframe has focus (#5719)](https://github.com/jupyterlab/jupyterlab/issues/5719) -- synthetic focus events and iframe
- [Mozilla Horizon: Cannot listen for keyboard shortcuts when iframe has focus (#51)](https://github.com/MozillaReality/horizon/issues/51) -- fundamental iframe keyboard capture problem
- [WebKit Bug 17670: Key events may improperly propagate from iframe to parent frame](https://bugs.webkit.org/show_bug.cgi?id=17670) -- browser-level propagation bug

### Security Research
- [W3C WebAppSec: Prevent programmatic focus in iframe (#273)](https://github.com/w3c/webappsec-permissions-policy/issues/273) -- focus-without-user-activation policy
- [Mozilla: Content can steal focus (#604289)](https://bugzilla.mozilla.org/show_bug.cgi?id=604289) -- focus stealing attack
- [Imperva: Hacking Microsoft and Wix with Keyboard Shortcuts](https://www.imperva.com/blog/hacking-microsoft-and-wix-with-keyboard-shortcuts/) -- keyboard shortcut exploitation via iframe
- [MSRC: PostMessaged and Compromised](https://www.microsoft.com/en-us/msrc/blog/2025/08/postmessaged-and-compromised) -- postMessage vulnerability patterns

### Accessibility
- [WCAG 2.1.2: No Keyboard Trap](https://wcag.dock.codes/documentation/wcag212/) -- Level A requirement for focus escape
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/) -- keyboard navigation best practices

### Browser Shortcut Conflicts
- [Mozilla Bug 380637: Web pages overriding browser shortcuts](https://bugzilla.mozilla.org/show_bug.cgi?id=380637) -- browser shortcut reservation
- [xjavascript: Cross-Browser Safe Keyboard Shortcuts](https://www.xjavascript.com/blog/available-keyboard-shortcuts-for-web-applications/) -- available shortcut space

### iOS/Safari
- [Apple Developer Forums: Input focus issue inside iframe](https://developer.apple.com/forums/thread/28656) -- virtual keyboard viewport shift
- [WebKit Bug 158629: Focus event in iframe causes incorrect scroll](https://bugs.webkit.org/show_bug.cgi?id=158629) -- Safari focus behavior

### Existing Codebase
- `packages/shim/src/keyboard-shim.ts` -- current unidirectional forward-only implementation
- `packages/core/src/topics.ts` -- 6 KEYBINDS_* topic constants showing prior art
- `.planning/SPEC-GAPS.md` -- GAP-07 decision: amend spec for keyboard forwarding

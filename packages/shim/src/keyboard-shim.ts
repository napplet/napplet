// @napplet/shim — Keyboard forwarding shim
// Captures keydown events in the napplet and forwards them to the parent shell
// as signed kind 29004 events so WM hotkeys work even when an iframe has DOM focus.

import { finalizeEvent } from 'nostr-tools/pure';
import { BusKind } from './types.js';
import type { NappletKeypair } from './napplet-keypair.js';

// keypair is set by index.ts after createEphemeralKeypair via setKeyboardShimKeypair()
let shimKeypair: NappletKeypair | null = null;

/**
 * Provide the napplet keypair to the keyboard shim so it can sign forwarded hotkey events.
 * Called by index.ts immediately after createEphemeralKeypair() resolves and also inside
 * handleAuthChallenge() as a safety net in case AUTH challenge arrives before eager init.
 */
export function setKeyboardShimKeypair(kp: NappletKeypair): void {
  shimKeypair = kp;
}

/**
 * Returns true if the given event target is a text-entry input element.
 * Mirrors the shell's isFocusInInput() logic so both sides agree on what
 * constitutes "the user is typing".
 */
function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type?.toLowerCase() ?? 'text';
    const textTypes = new Set([
      'text', 'search', 'email', 'url', 'password', 'number', 'tel', 'date',
      'datetime-local', 'month', 'time', 'week',
    ]);
    return textTypes.has(type) || type === '';
  }
  if ((target as HTMLElement).isContentEditable) return true;
  const ce = (target as HTMLElement).contentEditable;
  if (ce === 'true' || ce === 'plaintext-only') return true;
  return false;
}

/**
 * Returns true if the key is a lone modifier key.
 */
function isModifierOnly(key: string): boolean {
  return key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta';
}

/**
 * Install the keyboard forwarding shim.
 *
 * Attaches a capture-phase keydown listener to the document. For every
 * keystroke that is NOT in a text input and NOT a bare modifier, sends
 * a signed kind 29004 event to the parent shell via NIP-01 postMessage.
 *
 * @returns cleanup function that removes the listener
 */
let installed = false;
let activeCleanup: (() => void) | null = null;

export function installKeyboardShim(): () => void {
  if (installed && activeCleanup) {
    return activeCleanup;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (isTextInput(event.target)) return;
    if (isModifierOnly(event.key)) return;
    if (!shimKeypair) return;

    const hotkeyEvent = finalizeEvent({
      kind: BusKind.HOTKEY_FORWARD,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['key', event.key],
        ['code', event.code],
        ['ctrl', event.ctrlKey ? '1' : '0'],
        ['alt', event.altKey ? '1' : '0'],
        ['shift', event.shiftKey ? '1' : '0'],
        ['meta', event.metaKey ? '1' : '0'],
      ],
      content: '',
    }, shimKeypair.privkey);

    window.parent.postMessage(['EVENT', hotkeyEvent], '*');
  }

  document.addEventListener('keydown', handleKeydown, true);
  installed = true;

  activeCleanup = () => {
    document.removeEventListener('keydown', handleKeydown, true);
    installed = false;
    activeCleanup = null;
  };

  return activeCleanup;
}

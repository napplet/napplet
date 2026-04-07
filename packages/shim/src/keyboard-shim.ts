// @napplet/shim -- Keyboard forwarding shim
// Captures keydown events in the napplet and forwards them to the parent shell
// as keyboard.forward envelope messages so WM hotkeys work even when an iframe has DOM focus.

// ─── Local envelope type (keyboard is not a NUB domain) ──────────────────────

interface KeyboardForwardMessage {
  type: 'keyboard.forward';
  key: string;
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
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
 * a keyboard.forward envelope message to the parent shell via postMessage.
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

  document.addEventListener('keydown', handleKeydown, true);
  installed = true;

  activeCleanup = () => {
    document.removeEventListener('keydown', handleKeydown, true);
    installed = false;
    activeCleanup = null;
  };

  return activeCleanup;
}

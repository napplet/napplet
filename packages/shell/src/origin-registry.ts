/**
 * Origin Registry — Window reference to windowId mapping.
 *
 * Used by the pseudo-relay to validate that postMessage senders are known
 * napp iframes. event.source (a Window reference) is the only unforgeable
 * origin — never trust event.origin from the message payload.
 */

const registry = new Map<Window, string>();

export const originRegistry = {
  register(win: Window, windowId: string): void {
    registry.set(win, windowId);
  },

  unregister(windowId: string): void {
    for (const [win, id] of registry.entries()) {
      if (id === windowId) {
        registry.delete(win);
      }
    }
  },

  getWindowId(win: Window): string | undefined {
    return registry.get(win);
  },

  getIframeWindow(windowId: string): Window | null {
    for (const [win, id] of registry.entries()) {
      if (id === windowId) return win;
    }
    return null;
  },

  getAllWindowIds(): string[] {
    return Array.from(registry.values());
  },

  clear(): void {
    registry.clear();
  },
};

/**
 * Origin Registry — Window reference to windowId mapping.
 *
 * Used by the pseudo-relay to validate that postMessage senders are known
 * napp iframes. `event.source` (a Window reference) is the only unforgeable
 * origin — never trust `event.origin` from the message payload.
 *
 * Host app registers iframe contentWindows on mount.
 */

const registry = new Map<Window, string>();

/**
 * Window-to-windowId registry for postMessage sender validation.
 */
export const originRegistry = {
  /**
   * Register an iframe window with its shell-assigned windowId.
   */
  register(win: Window, windowId: string): void {
    registry.set(win, windowId);
  },

  /**
   * Remove all entries for a given windowId.
   */
  unregister(windowId: string): void {
    for (const [win, id] of registry.entries()) {
      if (id === windowId) {
        registry.delete(win);
      }
    }
  },

  /**
   * Get the windowId for a known iframe window.
   * Returns undefined if the window is not registered (unknown sender).
   */
  getWindowId(win: Window): string | undefined {
    return registry.get(win);
  },

  /**
   * Reverse lookup — get the iframe Window by windowId.
   */
  getIframeWindow(windowId: string): Window | null {
    for (const [win, id] of registry.entries()) {
      if (id === windowId) return win;
    }
    return null;
  },

  /**
   * Return all currently registered windowIds.
   */
  getAllWindowIds(): string[] {
    return Array.from(registry.values());
  },

  /**
   * Clear all registered windows.
   */
  clear(): void {
    registry.clear();
  },
};

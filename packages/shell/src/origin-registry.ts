/**
 * Origin Registry — Window reference to windowId mapping.
 *
 * Used by the ShellBridge to validate that postMessage senders are known
 * napp iframes. event.source (a Window reference) is the only unforgeable
 * origin — never trust event.origin from the message payload.
 */

const registry = new Map<Window, string>();

/**
 * Bidirectional registry mapping Window references to windowId strings.
 *
 * @example
 * ```ts
 * import { originRegistry } from '@napplet/shell';
 *
 * originRegistry.register(iframe.contentWindow, 'napp-1');
 * const id = originRegistry.getWindowId(iframe.contentWindow); // 'napp-1'
 * ```
 */
export const originRegistry = {
  /**
   * Register a window reference with a windowId.
   *
   * @param win - The iframe's contentWindow reference
   * @param windowId - The unique identifier for this napp window
   */
  register(win: Window, windowId: string): void {
    registry.set(win, windowId);
  },

  /**
   * Unregister a window by its windowId, removing the mapping.
   *
   * @param windowId - The window identifier to remove
   */
  unregister(windowId: string): void {
    for (const [win, id] of registry.entries()) {
      if (id === windowId) {
        registry.delete(win);
      }
    }
  },

  /**
   * Look up the windowId for a given Window reference.
   *
   * @param win - The Window reference (typically from event.source)
   * @returns The windowId string, or undefined if not registered
   */
  getWindowId(win: Window): string | undefined {
    return registry.get(win);
  },

  /**
   * Look up the Window reference for a given windowId.
   *
   * @param windowId - The window identifier to look up
   * @returns The Window reference, or null if not found
   */
  getIframeWindow(windowId: string): Window | null {
    for (const [win, id] of registry.entries()) {
      if (id === windowId) return win;
    }
    return null;
  },

  /**
   * Get all registered windowId strings.
   *
   * @returns Array of all registered window identifiers
   */
  getAllWindowIds(): string[] {
    return Array.from(registry.values());
  },

  /** Clear all registrations. */
  clear(): void {
    registry.clear();
  },
};

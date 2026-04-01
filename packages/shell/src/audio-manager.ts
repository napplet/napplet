/**
 * audio-manager.ts — Shell-side registry of active audio sources.
 *
 * Tracks which windows are producing audio. UI components read the registry
 * reactively via the version counter and CustomEvent pattern.
 */

import { originRegistry } from './origin-registry.js';
import { BusKind } from './types.js';

/**
 * An active audio source registered by a napplet.
 * @example
 * ```ts
 * const source: AudioSource = {
 *   windowId: 'win-1', nappletClass: 'music-player',
 *   title: 'Now Playing', muted: false,
 * };
 * ```
 */
export interface AudioSource {
  windowId: string;
  nappletClass: string;
  title: string;
  muted: boolean;
}

const sources = new Map<string, AudioSource>();
let version = 0;

function bump(): void {
  version++;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('napplet:audio-changed'));
  }
}

/**
 * Registry of active audio sources across all napplet windows.
 * Emits 'napplet:audio-changed' CustomEvents when the registry changes.
 *
 * @example
 * ```ts
 * import { audioManager } from '@napplet/shell';
 *
 * audioManager.register('win-1', 'music', 'My Song');
 * audioManager.mute('win-1', true);
 * ```
 */
export const audioManager = {
  /**
   * Register a new audio source for a window.
   *
   * @param windowId - The window identifier
   * @param nappletClass - The napplet class/type (e.g., 'music-player')
   * @param title - Human-readable title for the audio source
   */
  register(windowId: string, nappletClass: string, title: string): void {
    sources.set(windowId, { windowId, nappletClass, title, muted: false });
    bump();
  },

  /**
   * Unregister an audio source for a window.
   *
   * @param windowId - The window identifier to remove
   */
  unregister(windowId: string): void {
    if (sources.delete(windowId)) bump();
  },

  /**
   * Update the state of an audio source (e.g., change title).
   *
   * @param windowId - The window identifier
   * @param update - Partial update with optional title
   */
  updateState(windowId: string, update: { title?: string }): void {
    const src = sources.get(windowId);
    if (!src) return;
    if (update.title !== undefined) src.title = update.title;
    bump();
  },

  /**
   * Mute or unmute an audio source and notify the napplet via postMessage.
   *
   * @param windowId - The window identifier
   * @param muted - True to mute, false to unmute
   * @example
   * ```ts
   * audioManager.mute('win-1', true); // mute
   * audioManager.mute('win-1', false); // unmute
   * ```
   */
  mute(windowId: string, muted: boolean): void {
    const src = sources.get(windowId);
    if (src) { src.muted = muted; bump(); }
    const iframeWindow = originRegistry.getIframeWindow(windowId);
    if (iframeWindow) {
      const muteEvent = {
        kind: BusKind.IPC_PEER,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', 'napplet:audio-muted']],
        content: JSON.stringify({ muted }),
        pubkey: '__shell__',
        id: `audio-mute-${windowId}-${Date.now()}`,
        sig: '',
      };
      iframeWindow.postMessage(['EVENT', '__shell__', muteEvent], '*');
    }
  },

  /**
   * Check if a window has a registered audio source.
   *
   * @param windowId - The window identifier
   * @returns True if the window has an active audio source
   */
  has(windowId: string): boolean { return sources.has(windowId); },

  /**
   * Get the audio source for a window.
   *
   * @param windowId - The window identifier
   * @returns The AudioSource, or undefined if not found
   */
  get(windowId: string): AudioSource | undefined { return sources.get(windowId); },

  /**
   * Get a snapshot of all audio sources.
   *
   * @returns A new Map of all active audio sources
   */
  getSources(): Map<string, AudioSource> { return new Map(sources); },

  /** Current version counter (incremented on every change). */
  get version(): number { return version; },

  /** Number of active audio sources. */
  get count(): number { return sources.size; },

  /** Clear all audio sources and reset version counter. */
  clear(): void { sources.clear(); version = 0; },
};

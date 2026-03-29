/**
 * audio-manager.ts — Shell-side registry of active audio sources.
 *
 * Tracks which windows are producing audio. UI components read the registry
 * reactively via the version counter and CustomEvent pattern.
 */

import { originRegistry } from './origin-registry.js';
import { BusKind } from './types.js';

export interface AudioSource {
  windowId: string;
  nappClass: string;
  title: string;
  muted: boolean;
}

const sources = new Map<string, AudioSource>();
let version = 0;

function bump(): void {
  version++;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hyprgate:audio-changed'));
  }
}

export const audioManager = {
  register(windowId: string, nappClass: string, title: string): void {
    sources.set(windowId, { windowId, nappClass, title, muted: false });
    bump();
  },

  unregister(windowId: string): void {
    if (sources.delete(windowId)) bump();
  },

  updateState(windowId: string, update: { title?: string }): void {
    const src = sources.get(windowId);
    if (!src) return;
    if (update.title !== undefined) src.title = update.title;
    bump();
  },

  mute(windowId: string, muted: boolean): void {
    const src = sources.get(windowId);
    if (src) { src.muted = muted; bump(); }
    const iframeWindow = originRegistry.getIframeWindow(windowId);
    if (iframeWindow) {
      const muteEvent = {
        kind: BusKind.INTER_PANE,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', 'napp:audio-muted']],
        content: JSON.stringify({ muted }),
        pubkey: '__shell__',
        id: `audio-mute-${windowId}-${Date.now()}`,
        sig: '',
      };
      iframeWindow.postMessage(['EVENT', '__shell__', muteEvent], '*');
    }
  },

  has(windowId: string): boolean { return sources.has(windowId); },
  get(windowId: string): AudioSource | undefined { return sources.get(windowId); },
  getSources(): Map<string, AudioSource> { return new Map(sources); },
  get version(): number { return version; },
  get count(): number { return sources.size; },
  clear(): void { sources.clear(); version = 0; },
};

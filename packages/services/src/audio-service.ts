/**
 * audio-service.ts — Audio source registry as a ServiceHandler.
 *
 * Tracks which napplet windows are producing audio. Shell hosts wire this
 * into the runtime via registerService('audio', createAudioService(opts)).
 * Browser-agnostic — no DOM, no window, no postMessage.
 */

import type { NostrEvent, ServiceDescriptor } from '@napplet/core';
import { BusKind } from '@napplet/core';
import type { ServiceHandler } from '@napplet/runtime';
import type { AudioSource, AudioServiceOptions } from './types.js';

/** Audio service version — follows semver. */
const AUDIO_SERVICE_VERSION = '1.0.0';

/**
 * Create an audio service handler.
 *
 * The audio service is a state registry that tracks active audio sources
 * per napplet window. Napplets announce audio state via `audio:*` topic
 * events; the service tracks sources and can relay mute commands back.
 *
 * @param options - Optional configuration (onChange callback for UI updates)
 * @returns A ServiceHandler to register with the runtime
 *
 * @example
 * ```ts
 * import { createAudioService } from '@napplet/services';
 *
 * const audio = createAudioService({
 *   onChange: (sources) => {
 *     // Update UI with current audio sources
 *     for (const [windowId, source] of sources) {
 *       console.log(`${source.title} (${source.muted ? 'muted' : 'playing'})`);
 *     }
 *   },
 * });
 *
 * runtime.registerService('audio', audio);
 * ```
 */
export function createAudioService(options?: AudioServiceOptions): ServiceHandler {
  const sources = new Map<string, AudioSource>();
  const onChange = options?.onChange;

  function notify(): void {
    onChange?.(new Map(sources));
  }

  /**
   * Parse JSON content from an event, returning undefined on failure.
   */
  function parseContent(event: NostrEvent): Record<string, unknown> | undefined {
    try {
      const parsed: unknown = JSON.parse(event.content);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* Invalid JSON — ignore event */
    }
    return undefined;
  }

  /**
   * Extract the topic string from an event's tags.
   */
  function extractTopic(event: NostrEvent): string | undefined {
    return event.tags?.find((t) => t[0] === 't')?.[1];
  }

  /**
   * Create a synthetic IPC-PEER event to send back to a napplet.
   */
  function createResponseEvent(topic: string, content: Record<string, unknown>): NostrEvent {
    return {
      id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pubkey: '__shell__',
      created_at: Math.floor(Date.now() / 1000),
      kind: BusKind.IPC_PEER,
      tags: [['t', topic]],
      content: JSON.stringify(content),
      sig: '',
    };
  }

  function handleAudioEvent(
    windowId: string,
    event: NostrEvent,
    send: (msg: unknown[]) => void,
  ): void {
    const topic = extractTopic(event);
    if (!topic) return;

    // Strip the 'audio:' prefix to get the action
    const action = topic.slice(6); // 'audio:'.length === 6

    switch (action) {
      case 'register': {
        const content = parseContent(event);
        if (!content) return;
        const nappletClass = typeof content.nappletClass === 'string' ? content.nappletClass : '';
        const title = typeof content.title === 'string' ? content.title : '';
        sources.set(windowId, { windowId, nappletClass, title, muted: false });
        notify();
        break;
      }

      case 'unregister': {
        if (sources.delete(windowId)) {
          notify();
        }
        break;
      }

      case 'state-changed': {
        const source = sources.get(windowId);
        if (!source) return;
        const content = parseContent(event);
        if (!content) return;
        if (typeof content.title === 'string') {
          source.title = content.title;
        }
        notify();
        break;
      }

      case 'mute': {
        // Mute command — can target a specific window or default to sender
        const content = parseContent(event);
        if (!content) return;
        const targetWindowId = typeof content.windowId === 'string'
          ? content.windowId
          : windowId;
        const muted = content.muted === true;

        const source = sources.get(targetWindowId);
        if (source) {
          source.muted = muted;
          notify();
        }

        // Send mute notification back to the target napplet
        const muteResponse = createResponseEvent('napplet:audio-muted', { muted });
        send(['EVENT', '__shell__', muteResponse]);
        break;
      }

      default:
        // Unknown audio action — ignore
        break;
    }
  }

  const descriptor: ServiceDescriptor = {
    name: 'audio',
    version: AUDIO_SERVICE_VERSION,
    description: 'Audio source registry — tracks active audio sources per napplet window',
  };

  return {
    descriptor,

    handleMessage(windowId: string, message: unknown[], send: (msg: unknown[]) => void): void {
      // Services receive ['EVENT', event] messages from the runtime's service dispatch
      if (message[0] !== 'EVENT' || !message[1]) return;
      const event = message[1] as NostrEvent;

      // Only handle IPC-PEER events with audio:* topics
      if (event.kind !== BusKind.IPC_PEER) return;
      const topic = extractTopic(event);
      if (!topic?.startsWith('audio:')) return;

      handleAudioEvent(windowId, event, send);
    },

    onWindowDestroyed(windowId: string): void {
      if (sources.delete(windowId)) {
        notify();
      }
    },
  };
}

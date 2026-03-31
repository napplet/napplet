/**
 * @napplet/services — Reference service implementations for the napplet protocol.
 *
 * Provides factory functions for creating ServiceHandler implementations:
 * - createAudioService() — Audio source registry
 * - createNotificationService() — Notification state management
 *
 * These are reference implementations. Shell hosts wire them into the
 * runtime via registerService(). The services are browser-agnostic —
 * shell adapters provide browser-specific callbacks.
 *
 * @example
 * ```ts
 * import { createAudioService, createNotificationService } from '@napplet/services';
 * import type { AudioSource, Notification } from '@napplet/services';
 *
 * const audio = createAudioService({ onChange: (sources) => updateUI(sources) });
 * const notifications = createNotificationService({ onChange: (list) => updateBadge(list) });
 *
 * runtime.registerService('audio', audio);
 * runtime.registerService('notifications', notifications);
 * ```
 *
 * @packageDocumentation
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type {
  AudioSource,
  AudioServiceOptions,
  Notification,
  NotificationServiceOptions,
} from './types.js';

// ─── Audio Service ─────────────────────────────────────────────────────────

export { createAudioService } from './audio-service.js';

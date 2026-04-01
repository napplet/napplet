/**
 * @napplet/core — Topic constants for the napplet IPC-PEER event bus.
 *
 * These constants define the topic strings used in IPC-PEER
 * events for shell commands, state operations, audio,
 * and UI coordination.
 */

/**
 * Built-in topic constants for the napplet shell IPC-PEER protocol.
 *
 * @example
 * ```ts
 * import { TOPICS } from '@napplet/core';
 *
 * // Subscribe to auth identity changes
 * shim.subscribe([{ kinds: [29003], '#t': [TOPICS.AUTH_IDENTITY_CHANGED] }]);
 *
 * // Use topic constant for state operations
 * shim.publish({ kind: 29003, tags: [['t', TOPICS.STATE_GET]], content: '{}' });
 * ```
 */
export const TOPICS = {
  // ─── Auth and Identity ──────────────────────────────────────────────────
  AUTH_IDENTITY_CHANGED: 'auth:identity-changed',

  // ─── State Operations ──────────────────────────────────────────────────
  STATE_GET: 'shell:state-get',
  STATE_SET: 'shell:state-set',
  STATE_REMOVE: 'shell:state-remove',
  STATE_CLEAR: 'shell:state-clear',
  STATE_KEYS: 'shell:state-keys',
  STATE_RESPONSE: 'napplet:state-response',

  // ─── Stream and Content ─────────────────────────────────────────────────
  STREAM_CHANNEL_SWITCH: 'stream:channel-switch',
  STREAM_CURRENT_CONTEXT_GET: 'stream:current-context-get',
  STREAM_CURRENT_CONTEXT: 'stream:current-context',

  // ─── Profile ────────────────────────────────────────────────────────────
  PROFILE_OPEN: 'profile:open',

  // ─── Shell Config ───────────────────────────────────────────────────────
  SHELL_CONFIG_GET: 'shell:config-get',
  SHELL_CONFIG_UPDATE: 'shell:config-update',
  SHELL_CONFIG_CURRENT: 'shell:config-current',

  // ─── Keybinds ───────────────────────────────────────────────────────────
  KEYBINDS_GET: 'keybinds:get-all',
  KEYBINDS_ALL: 'keybinds:all',
  KEYBINDS_UPDATE: 'keybinds:update',
  KEYBINDS_RESET: 'keybinds:reset',
  KEYBINDS_CAPTURE_START: 'keybinds:capture-start',
  KEYBINDS_CAPTURE_END: 'keybinds:capture-end',

  // ─── Window Manager ─────────────────────────────────────────────────────
  WM_FOCUSED_WINDOW_CHANGED: 'wm:focused-window-changed',

  // ─── Relay Scoping ──────────────────────────────────────────────────────
  RELAY_SCOPED_CONNECT: 'shell:relay-scoped-connect',
  RELAY_SCOPED_CLOSE: 'shell:relay-scoped-close',
  RELAY_SCOPED_PUBLISH: 'shell:relay-scoped-publish',

  // ─── Chat ───────────────────────────────────────────────────────────────
  CHAT_OPEN_DM: 'chat:open-dm',

  // ─── Audio ──────────────────────────────────────────────────────────────
  AUDIO_REGISTER: 'shell:audio-register',
  AUDIO_UNREGISTER: 'shell:audio-unregister',
  AUDIO_STATE_CHANGED: 'shell:audio-state-changed',
  AUDIO_MUTED: 'napplet:audio-muted',
} as const;

/** Key type for the TOPICS constant object. */
export type TopicKey = keyof typeof TOPICS;

/** Value type for the TOPICS constant object. */
export type TopicValue = (typeof TOPICS)[TopicKey];

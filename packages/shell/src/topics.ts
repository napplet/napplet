/**
 * topics.ts — Built-in topic constants for the inter-pane event bus.
 *
 * These constants define the topic strings used in inter-pane
 * INTER_PANE events for shell commands, audio, and UI coordination.
 */

/**
 * Built-in topic constants for the napplet shell inter-pane protocol.
 *
 * @example
 * ```ts
 * import { TOPICS } from '@napplet/shell';
 *
 * // Subscribe to auth identity changes
 * shim.subscribe([{ kinds: [29003], '#t': [TOPICS.AUTH_IDENTITY_CHANGED] }]);
 *
 * // Use topic constant for audio registration
 * shim.publish({ kind: 29003, tags: [['t', TOPICS.AUDIO_REGISTER]], content: '{}' });
 * ```
 */
export const TOPICS = {
  AUTH_IDENTITY_CHANGED: 'auth:identity-changed',
  STREAM_CHANNEL_SWITCH: 'stream:channel-switch',
  PROFILE_OPEN: 'profile:open',
  SHELL_CONFIG_GET: 'shell:config-get',
  SHELL_CONFIG_UPDATE: 'shell:config-update',
  SHELL_CONFIG_CURRENT: 'shell:config-current',
  KEYBINDS_GET: 'keybinds:get-all',
  KEYBINDS_ALL: 'keybinds:all',
  KEYBINDS_UPDATE: 'keybinds:update',
  KEYBINDS_RESET: 'keybinds:reset',
  KEYBINDS_CAPTURE_START: 'keybinds:capture-start',
  KEYBINDS_CAPTURE_END: 'keybinds:capture-end',
  WM_FOCUSED_WINDOW_CHANGED: 'wm:focused-window-changed',
  RELAY_SCOPED_CONNECT: 'shell:relay-scoped-connect',
  RELAY_SCOPED_CLOSE: 'shell:relay-scoped-close',
  RELAY_SCOPED_PUBLISH: 'shell:relay-scoped-publish',
  CHAT_OPEN_DM: 'chat:open-dm',
  STREAM_CURRENT_CONTEXT_GET: 'stream:current-context-get',
  STREAM_CURRENT_CONTEXT: 'stream:current-context',
  AUDIO_REGISTER: 'shell:audio-register',
  AUDIO_UNREGISTER: 'shell:audio-unregister',
  AUDIO_STATE_CHANGED: 'shell:audio-state-changed',
  AUDIO_MUTED: 'napp:audio-muted',
} as const;

/** Key type for the TOPICS constant object. */
export type TopicKey = keyof typeof TOPICS;

/** Value type for the TOPICS constant object. */
export type TopicValue = (typeof TOPICS)[TopicKey];

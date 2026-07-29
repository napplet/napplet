/** Built-in topic constants for the napplet INC event bus. */
export const TOPICS = {
  STREAM_CHANNEL_SWITCH: 'stream:channel-switch',
  STREAM_CURRENT_CONTEXT_GET: 'stream:current-context-get',
  STREAM_CURRENT_CONTEXT: 'stream:current-context',

  NOTE_OPEN: 'napplet:note/open',
  PROFILE_OPEN: 'napplet:profile/open',
  DM_OPEN: 'napplet:dm/open',

  KEYBINDS_GET: 'keybinds:get-all',
  KEYBINDS_ALL: 'keybinds:all',
  KEYBINDS_UPDATE: 'keybinds:update',
  KEYBINDS_RESET: 'keybinds:reset',
  KEYBINDS_CAPTURE_START: 'keybinds:capture-start',
  KEYBINDS_CAPTURE_END: 'keybinds:capture-end',

  WM_FOCUSED_WINDOW_CHANGED: 'wm:focused-window-changed',

} as const;

/** Key type for the TOPICS constant object. */
export type TopicKey = keyof typeof TOPICS;

/** Value type for the TOPICS constant object. */
export type TopicValue = (typeof TOPICS)[TopicKey];

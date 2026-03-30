// @napplet/shim internal types — inlined protocol constants and interfaces.
// These constants and interfaces must match the napplet shell protocol exactly.

/** NIP-01 nostr event. */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/** NIP-01 subscription filter. */
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}

/**
 * Ephemeral event kinds (29000-29999) used by the napplet bus.
 * Ephemeral events are auto-discarded by real relays per NIP-01 spec —
 * perfect for bus traffic that should never persist beyond the ShellBridge.
 */
export const BusKind = {
  REGISTRATION: 29000,
  SIGNER_REQUEST: 29001,
  SIGNER_RESPONSE: 29002,
  INTER_PANE: 29003,
  HOTKEY_FORWARD: 29004,
  METADATA: 29005,
  NIPDB_REQUEST: 29006,
  NIPDB_RESPONSE: 29007,
} as const;

export type BusKindValue = (typeof BusKind)[keyof typeof BusKind];

/** NIP-42 authentication event kind. */
export const AUTH_KIND = 22242 as const;

/** The ShellBridge URI used in NIP-42 AUTH challenges. */
export const SHELL_BRIDGE_URI = 'napplet://shell' as const;

/** Protocol version string. */
export const PROTOCOL_VERSION = '2.0.0' as const;

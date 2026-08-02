/**
 * Identifies a ContextVM server by its Nostr public key, with optional relay hints.
 * The shell decides which relays to actually route through per its relay policy.
 */
export interface CvmServerRef {
  /** Hex-encoded Nostr public key of the ContextVM server. */
  pubkey: string;
  /** Optional relay URL hints; the shell MAY use, ignore, or augment these. */
  relays?: string[];
}

/**
 * Filter for `cvm.discover`. All fields are optional; an empty query asks the
 * shell for whatever public ContextVM server announcements it knows about.
 */
export interface CvmDiscoverQuery {
  /** Free-text search over server name/description/capabilities. */
  search?: string;
  /** Restrict to specific Nostr event kinds (announcement kinds). */
  kinds?: number[];
  /** Relay URL hints to search. */
  relays?: string[];
  /** Maximum number of servers to return. */
  limit?: number;
}

/**
 * A discovered ContextVM server announcement.
 */
export interface CvmServer extends CvmServerRef {
  /** Display name from the server announcement. */
  name?: string;
  /** Human-readable description. */
  description?: string;
  /** Advertised capability tags (e.g. MCP capabilities). */
  capabilities?: string[];
  /** Whether the server requires value exchange before serving requests. */
  paymentRequired?: boolean;
}

/**
 * Per-request options for `cvm.request` and the MCP convenience wrappers.
 */
export interface CvmRequestOptions {
  /** Wall-clock budget for the request, in milliseconds. */
  timeoutMs?: number;
  /** Ask the shell to perform MCP initialization before this request. */
  initialize?: boolean;
  /**
   * Payment posture if the server requires value exchange:
   * - `deny`   -- never pay (fail with `payment required`)
   * - `prompt` -- ask the user
   * - `allow`  -- pay within the user's explicit allowance
   */
  payment?: 'deny' | 'prompt' | 'allow';
}

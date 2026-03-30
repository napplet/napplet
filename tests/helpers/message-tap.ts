/**
 * message-tap.ts -- Transparent postMessage interceptor for protocol testing.
 *
 * Captures all NIP-01 messages flowing between shell and napplet iframes.
 * Shell-side only -- no injection into sandboxed napplet iframes.
 *
 * Usage in browser context (injected via Playwright page.evaluate):
 *   const tap = createMessageTap();
 *   tap.install(window);
 *   // ... protocol messages flow ...
 *   const authMsg = tap.waitForMessage({ verb: 'AUTH', direction: 'shell->napplet' });
 */

/** Known NIP-01 verbs for the napplet protocol */
const KNOWN_VERBS = new Set([
  'EVENT', 'REQ', 'CLOSE', 'AUTH', 'OK', 'EOSE', 'NOTICE', 'CLOSED', 'COUNT',
]);

/** A captured protocol message with parsed metadata */
export interface TappedMessage {
  /** Monotonic capture index */
  index: number;
  /** Timestamp when the message was captured (ms) */
  timestamp: number;
  /** Message direction */
  direction: 'napplet->shell' | 'shell->napplet';
  /** NIP-01 verb (EVENT, REQ, AUTH, OK, etc.) */
  verb: string;
  /** The full raw message array as sent via postMessage */
  raw: unknown[];
  /** Parsed metadata extracted from the message */
  parsed: {
    /** Subscription ID (for REQ, EVENT, CLOSE, EOSE, CLOSED) */
    subId?: string;
    /** Event kind (for EVENT, AUTH) */
    eventKind?: number;
    /** Event ID (for EVENT, OK) */
    eventId?: string;
    /** Topic tag value (for inter-pane events with kind 29003) */
    topic?: string;
    /** Success flag (for OK responses) */
    success?: boolean;
    /** Reason string (for OK false, CLOSED, NOTICE) */
    reason?: string;
    /** Event pubkey (for EVENT, AUTH) */
    pubkey?: string;
  };
}

/** Criteria for filtering/waiting on messages */
export interface MessageCriteria {
  verb?: string;
  direction?: 'napplet->shell' | 'shell->napplet';
  subId?: string;
  eventKind?: number;
  success?: boolean;
}

export interface MessageTap {
  /** All captured messages in chronological order */
  messages: TappedMessage[];
  /** Install the tap on a window (call before any iframes load) */
  install(shellWindow: Window): void;
  /** Record an outbound message (shell->napplet). Call this from the postMessage wrapper. */
  recordOutbound(msg: unknown[]): void;
  /** Wait for a message matching criteria. Resolves with the message or rejects on timeout. */
  waitForMessage(criteria: MessageCriteria, timeoutMs?: number): Promise<TappedMessage>;
  /** Get all messages matching criteria */
  filter(criteria: MessageCriteria): TappedMessage[];
  /** Clear all captured messages */
  clear(): void;
  /** Subscribe to new messages in real-time */
  onMessage(callback: (msg: TappedMessage) => void): () => void;
  /** Remove the tap and clean up listeners */
  destroy(): void;
}

/**
 * Parse a raw NIP-01 message array into structured metadata.
 */
function parseMessage(raw: unknown[]): TappedMessage['parsed'] {
  const verb = raw[0] as string;
  const parsed: TappedMessage['parsed'] = {};

  switch (verb) {
    case 'EVENT': {
      // Inbound: ['EVENT', event] or ['EVENT', subId, event]
      if (raw.length === 2 && typeof raw[1] === 'object' && raw[1] !== null) {
        // Napplet->shell: ['EVENT', event]
        const event = raw[1] as Record<string, unknown>;
        parsed.eventId = event.id as string;
        parsed.eventKind = event.kind as number;
        parsed.pubkey = event.pubkey as string;
        // Check for inter-pane topic
        const tags = (event.tags as string[][] | undefined) ?? [];
        const topicTag = tags.find(t => t[0] === 't');
        if (topicTag) parsed.topic = topicTag[1];
      } else if (raw.length === 3) {
        // Shell->napplet: ['EVENT', subId, event]
        parsed.subId = raw[1] as string;
        const event = raw[2] as Record<string, unknown>;
        parsed.eventId = event.id as string;
        parsed.eventKind = event.kind as number;
        parsed.pubkey = event.pubkey as string;
        const tags = (event.tags as string[][] | undefined) ?? [];
        const topicTag = tags.find(t => t[0] === 't');
        if (topicTag) parsed.topic = topicTag[1];
      }
      break;
    }
    case 'REQ': {
      // ['REQ', subId, ...filters]
      parsed.subId = raw[1] as string;
      break;
    }
    case 'CLOSE': {
      // ['CLOSE', subId]
      parsed.subId = raw[1] as string;
      break;
    }
    case 'AUTH': {
      // Inbound: ['AUTH', authEvent] or Outbound: ['AUTH', challengeString]
      if (typeof raw[1] === 'object' && raw[1] !== null) {
        const event = raw[1] as Record<string, unknown>;
        parsed.eventId = event.id as string;
        parsed.eventKind = event.kind as number;
        parsed.pubkey = event.pubkey as string;
      }
      // If raw[1] is a string, it's the challenge -- no extra parsing needed
      break;
    }
    case 'OK': {
      // ['OK', eventId, success, reason]
      parsed.eventId = raw[1] as string;
      parsed.success = raw[2] as boolean;
      parsed.reason = raw[3] as string;
      break;
    }
    case 'EOSE': {
      // ['EOSE', subId]
      parsed.subId = raw[1] as string;
      break;
    }
    case 'NOTICE': {
      // ['NOTICE', message]
      parsed.reason = raw[1] as string;
      break;
    }
    case 'CLOSED': {
      // ['CLOSED', subId, reason]
      parsed.subId = raw[1] as string;
      parsed.reason = raw[2] as string;
      break;
    }
  }

  return parsed;
}

/**
 * Check if a tapped message matches the given criteria.
 */
function matchesCriteria(msg: TappedMessage, criteria: MessageCriteria): boolean {
  if (criteria.verb !== undefined && msg.verb !== criteria.verb) return false;
  if (criteria.direction !== undefined && msg.direction !== criteria.direction) return false;
  if (criteria.subId !== undefined && msg.parsed.subId !== criteria.subId) return false;
  if (criteria.eventKind !== undefined && msg.parsed.eventKind !== criteria.eventKind) return false;
  if (criteria.success !== undefined && msg.parsed.success !== criteria.success) return false;
  return true;
}

/**
 * Create a message tap instance.
 *
 * The tap captures inbound messages (napplet->shell) by listening for 'message'
 * events on the shell window. Outbound messages (shell->napplet) must be recorded
 * explicitly by calling tap.recordOutbound() -- the test harness wraps the
 * ShellBridge's postMessage calls to do this.
 */
export function createMessageTap(): MessageTap {
  const messages: TappedMessage[] = [];
  const listeners: Array<(msg: TappedMessage) => void> = [];
  let messageIndex = 0;
  let messageHandler: ((event: MessageEvent) => void) | null = null;
  let installedWindow: Window | null = null;

  function record(direction: TappedMessage['direction'], raw: unknown[]): TappedMessage {
    const verb = (typeof raw[0] === 'string' && KNOWN_VERBS.has(raw[0])) ? raw[0] : 'UNKNOWN';
    const msg: TappedMessage = {
      index: messageIndex++,
      timestamp: Date.now(),
      direction,
      verb,
      raw,
      parsed: parseMessage(raw),
    };
    messages.push(msg);
    for (const listener of listeners) {
      try { listener(msg); } catch { /* ignore listener errors */ }
    }
    return msg;
  }

  return {
    messages,

    install(shellWindow: Window) {
      installedWindow = shellWindow;
      messageHandler = (event: MessageEvent) => {
        // Only capture array messages (NIP-01 wire format)
        if (!Array.isArray(event.data)) return;
        // Skip test-internal messages
        if (event.data[0] === '__TEST_DONE__') return;
        record('napplet->shell', event.data);
      };
      // Use capture phase to see messages before the ShellBridge
      shellWindow.addEventListener('message', messageHandler, true);
    },

    recordOutbound(msg: unknown[]) {
      if (!Array.isArray(msg)) return;
      record('shell->napplet', msg);
    },

    waitForMessage(criteria: MessageCriteria, timeoutMs = 5000): Promise<TappedMessage> {
      // Check existing messages first
      const existing = messages.find(m => matchesCriteria(m, criteria));
      if (existing) return Promise.resolve(existing);

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = listeners.indexOf(listener);
          if (idx !== -1) listeners.splice(idx, 1);
          reject(new Error(
            `waitForMessage timeout (${timeoutMs}ms) waiting for ${JSON.stringify(criteria)}. ` +
            `Captured ${messages.length} messages: ${messages.map(m => `${m.direction} ${m.verb}`).join(', ')}`
          ));
        }, timeoutMs);

        const listener = (msg: TappedMessage) => {
          if (matchesCriteria(msg, criteria)) {
            clearTimeout(timer);
            const idx = listeners.indexOf(listener);
            if (idx !== -1) listeners.splice(idx, 1);
            resolve(msg);
          }
        };
        listeners.push(listener);
      });
    },

    filter(criteria: MessageCriteria): TappedMessage[] {
      return messages.filter(m => matchesCriteria(m, criteria));
    },

    clear() {
      messages.length = 0;
      messageIndex = 0;
    },

    onMessage(callback: (msg: TappedMessage) => void): () => void {
      listeners.push(callback);
      return () => {
        const idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },

    destroy() {
      if (installedWindow && messageHandler) {
        installedWindow.removeEventListener('message', messageHandler, true);
      }
      messages.length = 0;
      listeners.length = 0;
      messageHandler = null;
      installedWindow = null;
    },
  };
}

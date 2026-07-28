/** How the shell should pick the handling napplet for an intent (NAP-INTENT). */
export type IntentHandlerPreference = 'default' | 'choose' | (string & {});

/** Window and focus hints for an intent invocation. */
export interface IntentBehavior {
  /** Focus the target surface. */
  focus?: boolean;
  /** Request a new target window instead of reuse. */
  newWindow?: boolean;
  /** Permit reuse of an existing matching window. */
  reuse?: boolean;
}

/** Optional fields accepted by the `intent.open` convenience operation. */
export interface IntentOpenOptions {
  /** Convention that shapes the opaque payload. */
  convention?: string;
  /** Runtime-authorized handler selection preference. */
  handler?: IntentHandlerPreference;
  /** Window and focus hints. */
  behavior?: IntentBehavior;
}

/** A request to dispatch an action to a napplet archetype. */
export interface IntentRequest extends IntentOpenOptions {
  /** Role slug used for handler resolution. */
  archetype: string;
  /** Action to dispatch; defaults to `open`. */
  action?: string;
  /** Opaque payload shaped by `convention` when present. */
  payload?: unknown;
}

/** A napplet that can fulfill an archetype (from the manifest catalog). */
export interface IntentCandidate {
  /** Napplet dTag. */
  dTag: string;
  /** Optional human-readable handler label. */
  title?: string;
  /** Actions supported by this candidate. */
  actions: string[];
  /** Payload conventions supported by this candidate. */
  conventions: string[];
  /** Whether this candidate is the current default. */
  isDefault?: boolean;
}

/** Availability of an archetype, sourced from the installed-napplet catalog. */
export interface IntentAvailability {
  /** Queried archetype. */
  archetype: string;
  /** Whether at least one candidate is available. */
  available: boolean;
  /** Candidate napplets. */
  candidates: IntentCandidate[];
  /** Whether the runtime has a default handler. */
  hasDefault: boolean;
}

/** The result of an intent invocation. */
export interface IntentResult {
  /** Whether dispatch completed. */
  ok: boolean;
  /** Requested archetype. */
  archetype: string;
  /** Dispatched action. */
  action: string;
  /** Whether a handler accepted the dispatch. */
  handled: boolean;
  /** dTag of the handling napplet. */
  handler?: string;
  /** Runtime-assigned target window identifier. */
  windowId?: string;
  /** Convention used for payload delivery. */
  convention?: string;
  /** Failure reason. */
  error?: string;
}

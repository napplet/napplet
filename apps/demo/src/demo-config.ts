/**
 * demo-config.ts — Mutable configuration registry for all protocol magic numbers.
 *
 * Holds every constant the napplet protocol relies on, supports live get/set/reset,
 * tracks modifications, and notifies subscribers on change.
 * Session-scoped: all state lives in-memory, page reload resets to defaults.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Describes a single protocol constant for display and editing. */
export interface ConstantDef {
  /** Unique ID e.g. 'core.REPLAY_WINDOW_SECONDS'. */
  key: string;
  /** Human-readable label e.g. 'Replay Window'. */
  label: string;
  /** Original module-level const value. */
  defaultValue: number;
  /** Live mutable value. */
  currentValue: number;
  /** Unit label: 'ms' | 's' | 'count' | 'bytes' | 'px'. */
  unit: string;
  /** Slider minimum. */
  min: number;
  /** Slider maximum. */
  max: number;
  /** Slider step. */
  step: number;
  /** Package grouping. */
  pkg: string;
  /** Domain grouping. */
  domain: string;
  /** Whether the constant can be edited in the panel. */
  editable: boolean;
  /** Tooltip/hover description. */
  description: string;
}

// ─── Constant Inventory ──────────────────────────────────────────────────────

const CONSTANT_DEFS: ConstantDef[] = [
  // ─── Editable behavioral constants ──────────────────────────────────────────
  {
    key: 'core.REPLAY_WINDOW_SECONDS',
    label: 'Replay Window',
    defaultValue: 30,
    currentValue: 30,
    unit: 's',
    min: 1,
    max: 300,
    step: 1,
    pkg: 'core',
    domain: 'timeouts',
    editable: true,
    description: 'Maximum age in seconds for an event to be accepted (replay protection)',
  },
  {
    key: 'runtime.RING_BUFFER_SIZE',
    label: 'Ring Buffer Size',
    defaultValue: 100,
    currentValue: 100,
    unit: 'count',
    min: 1,
    max: 1000,
    step: 1,
    pkg: 'runtime',
    domain: 'sizes',
    editable: true,
    description: 'Maximum events held in the ring buffer before oldest is evicted',
  },
  {
    key: 'shim.REQUEST_TIMEOUT_MS',
    label: 'Shim Request Timeout',
    defaultValue: 5000,
    currentValue: 5000,
    unit: 'ms',
    min: 100,
    max: 60000,
    step: 100,
    pkg: 'shim',
    domain: 'timeouts',
    editable: false,
    description: 'Timeout for shim state requests (display only — shim runs in iframe)',
  },
  {
    key: 'services.DEFAULT_EOSE_TIMEOUT_MS',
    label: 'EOSE Timeout',
    defaultValue: 15000,
    currentValue: 15000,
    unit: 'ms',
    min: 1000,
    max: 60000,
    step: 500,
    pkg: 'services',
    domain: 'timeouts',
    editable: true,
    description: 'Default timeout for EOSE (end of stored events) in coordinated relay',
  },
  {
    key: 'services.EOSE_FALLBACK_MS',
    label: 'EOSE Fallback',
    defaultValue: 15000,
    currentValue: 15000,
    unit: 'ms',
    min: 1000,
    max: 60000,
    step: 500,
    pkg: 'services',
    domain: 'timeouts',
    editable: true,
    description: 'Fallback timeout for EOSE in relay pool service',
  },
  {
    key: 'services.DEFAULT_MAX_PER_WINDOW',
    label: 'Max Notifications Per Window',
    defaultValue: 100,
    currentValue: 100,
    unit: 'count',
    min: 1,
    max: 1000,
    step: 1,
    pkg: 'services',
    domain: 'sizes',
    editable: true,
    description: 'Maximum notifications per napplet window before oldest is discarded',
  },
  {
    key: 'acl.DEFAULT_QUOTA',
    label: 'Default Storage Quota',
    defaultValue: 524288,
    currentValue: 524288,
    unit: 'bytes',
    min: 1024,
    max: 10485760,
    step: 1024,
    pkg: 'acl',
    domain: 'sizes',
    editable: true,
    description: 'Default state storage quota per napplet (512 KB)',
  },
  {
    key: 'demo.FLASH_DURATION',
    label: 'Flash Duration (animator)',
    defaultValue: 500,
    currentValue: 500,
    unit: 'ms',
    min: 50,
    max: 5000,
    step: 50,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'Duration of node/edge flash animations in the flow animator',
  },
  {
    key: 'demo.FLASH_DURATION_MS',
    label: 'Flash Duration (topology)',
    defaultValue: 500,
    currentValue: 500,
    unit: 'ms',
    min: 50,
    max: 5000,
    step: 50,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'Duration of Leader Line edge flash animations in the topology view',
  },
  {
    key: 'demo.TOAST_DISPLAY_MS',
    label: 'Toast Display Time',
    defaultValue: 5000,
    currentValue: 5000,
    unit: 'ms',
    min: 500,
    max: 30000,
    step: 500,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'How long notification toasts remain visible before auto-dismiss',
  },
  {
    key: 'demo.MAX_RECENT_REQUESTS',
    label: 'Max Recent Signer Requests',
    defaultValue: 20,
    currentValue: 20,
    unit: 'count',
    min: 1,
    max: 100,
    step: 1,
    pkg: 'demo',
    domain: 'sizes',
    editable: true,
    description: 'Maximum signer request records held in the rolling history',
  },
  {
    key: 'demo.ROLLING_WINDOW_SIZE',
    label: 'Color Rolling Window',
    defaultValue: 10,
    currentValue: 10,
    unit: 'count',
    min: 1,
    max: 50,
    step: 1,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'Number of recent messages per edge direction used to determine persistent color (rolling window mode)',
  },
  {
    key: 'demo.DECAY_DURATION_MS',
    label: 'Color Decay Duration',
    defaultValue: 5000,
    currentValue: 5000,
    unit: 'ms',
    min: 500,
    max: 30000,
    step: 500,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'Milliseconds before edge color fades to neutral after last message (decay mode)',
  },
  {
    key: 'demo.TRACE_HOP_DURATION_MS',
    label: 'Trace Hop Duration',
    defaultValue: 150,
    currentValue: 150,
    unit: 'ms',
    min: 30,
    max: 1000,
    step: 10,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'Duration of each hop in per-message trace animation (edge lights up for this long per hop)',
  },
  {
    key: 'demo.ACL_RING_BUFFER_SIZE',
    label: 'ACL Ring Buffer Size',
    defaultValue: 50,
    currentValue: 50,
    unit: 'count',
    min: 5,
    max: 500,
    step: 5,
    pkg: 'demo',
    domain: 'sizes',
    editable: true,
    description: 'Number of ACL check events retained per napplet',
  },
  {
    key: 'demo.HEADER_HEIGHT',
    label: 'Sequence Diagram Header',
    defaultValue: 40,
    currentValue: 40,
    unit: 'px',
    min: 10,
    max: 100,
    step: 1,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'Height of the header row in the SVG sequence diagram',
  },
  {
    key: 'demo.ROW_HEIGHT',
    label: 'Sequence Diagram Row',
    defaultValue: 28,
    currentValue: 28,
    unit: 'px',
    min: 10,
    max: 100,
    step: 1,
    pkg: 'demo',
    domain: 'ui-timing',
    editable: true,
    description: 'Height of each message row in the SVG sequence diagram',
  },

  // ─── Read-only protocol constants ──────────────────────────────────────────
  {
    key: 'core.AUTH_KIND',
    label: 'AUTH Kind',
    defaultValue: 22242,
    currentValue: 22242,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'NIP-42 AUTH event kind for napplet authentication handshakes',
  },
  {
    key: 'core.BusKind.REGISTRATION',
    label: 'Bus: Registration',
    defaultValue: 29000,
    currentValue: 29000,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'Bus event kind for napplet registration (29000)',
  },
  {
    key: 'core.BusKind.SIGNER_REQUEST',
    label: 'Bus: Signer Request',
    defaultValue: 29001,
    currentValue: 29001,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'Bus event kind for signer requests from napplets (29001)',
  },
  {
    key: 'core.BusKind.SIGNER_RESPONSE',
    label: 'Bus: Signer Response',
    defaultValue: 29002,
    currentValue: 29002,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'Bus event kind for signer responses to napplets (29002)',
  },
  {
    key: 'core.BusKind.IPC_PEER',
    label: 'Bus: IPC Peer',
    defaultValue: 29003,
    currentValue: 29003,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'Bus event kind for peer-to-peer IPC between napplets (29003)',
  },
  {
    key: 'core.BusKind.HOTKEY_FORWARD',
    label: 'Bus: Hotkey Forward',
    defaultValue: 29004,
    currentValue: 29004,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'Bus event kind for keyboard shortcut forwarding (29004)',
  },
  {
    key: 'core.BusKind.METADATA',
    label: 'Bus: Metadata',
    defaultValue: 29005,
    currentValue: 29005,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'Bus event kind for napplet metadata exchange (29005)',
  },
  {
    key: 'core.BusKind.SERVICE_DISCOVERY',
    label: 'Bus: Service Discovery',
    defaultValue: 29010,
    currentValue: 29010,
    unit: '',
    min: 0,
    max: 65535,
    step: 1,
    pkg: 'core',
    domain: 'protocol',
    editable: false,
    description: 'Bus event kind for service discovery queries (29010)',
  },
  {
    key: 'runtime.SECRET_LENGTH',
    label: 'Secret Length',
    defaultValue: 32,
    currentValue: 32,
    unit: 'bytes',
    min: 0,
    max: 64,
    step: 1,
    pkg: 'runtime',
    domain: 'protocol',
    editable: false,
    description: 'Length of the shell secret used for deterministic keypair derivation',
  },
];

// ─── DemoConfig Class ────────────────────────────────────────────────────────

type ChangeCallback = (key: string, value: number) => void;

/** Mutable configuration registry for demo protocol constants. */
export class DemoConfig {
  private _defs: Map<string, ConstantDef>;
  private _listeners: ChangeCallback[] = [];

  constructor(defs: ConstantDef[]) {
    this._defs = new Map(defs.map((d) => [d.key, { ...d }]));
  }

  /** Get the current value of a constant. */
  get(key: string): number {
    const def = this._defs.get(key);
    if (!def) throw new Error(`Unknown constant: ${key}`);
    return def.currentValue;
  }

  /** Set a constant value, clamped to its min/max range. */
  set(key: string, value: number): void {
    const def = this._defs.get(key);
    if (!def) throw new Error(`Unknown constant: ${key}`);
    if (!def.editable) return;
    const clamped = Math.min(def.max, Math.max(def.min, value));
    if (clamped === def.currentValue) return;
    def.currentValue = clamped;
    this._notify(key, clamped);
  }

  /** Reset a single constant to its default value. */
  reset(key: string): void {
    const def = this._defs.get(key);
    if (!def) return;
    if (def.currentValue === def.defaultValue) return;
    def.currentValue = def.defaultValue;
    this._notify(key, def.defaultValue);
  }

  /** Reset all constants to their defaults. */
  resetAll(): void {
    for (const def of this._defs.values()) {
      if (def.currentValue !== def.defaultValue) {
        def.currentValue = def.defaultValue;
        this._notify(def.key, def.defaultValue);
      }
    }
  }

  /** Check if a constant differs from its default. */
  isModified(key: string): boolean {
    const def = this._defs.get(key);
    return def ? def.currentValue !== def.defaultValue : false;
  }

  /** Get all keys where the current value differs from the default. */
  getModifiedKeys(): string[] {
    const result: string[] = [];
    for (const def of this._defs.values()) {
      if (def.currentValue !== def.defaultValue) result.push(def.key);
    }
    return result;
  }

  /** Get all constant definitions. */
  getAllDefs(): ConstantDef[] {
    return [...this._defs.values()];
  }

  /** Get constant definitions grouped by package. */
  getByPackage(): Map<string, ConstantDef[]> {
    const groups = new Map<string, ConstantDef[]>();
    for (const def of this._defs.values()) {
      const list = groups.get(def.pkg) ?? [];
      list.push(def);
      groups.set(def.pkg, list);
    }
    return groups;
  }

  /** Get constant definitions grouped by domain. */
  getByDomain(): Map<string, ConstantDef[]> {
    const groups = new Map<string, ConstantDef[]>();
    for (const def of this._defs.values()) {
      const list = groups.get(def.domain) ?? [];
      list.push(def);
      groups.set(def.domain, list);
    }
    return groups;
  }

  /**
   * Subscribe to constant value changes.
   * @returns An unsubscribe function.
   */
  subscribe(callback: ChangeCallback): () => void {
    this._listeners.push(callback);
    return () => {
      const i = this._listeners.indexOf(callback);
      if (i !== -1) this._listeners.splice(i, 1);
    };
  }

  private _notify(key: string, value: number): void {
    for (const cb of this._listeners) {
      try { cb(key, value); } catch { /* ignore listener errors */ }
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

/** Global demo configuration instance. */
export const demoConfig = new DemoConfig(CONSTANT_DEFS);

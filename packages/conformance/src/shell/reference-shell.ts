/**
 * @napplet/conformance -- Reference mock shell.
 *
 * @packageDocumentation
 */

import {
  REFERENCE_ENDPOINT,
  type ReferenceEndpoint,
} from './reference-responses.js';
import {
  createReferenceHandler,
  type RecordedEnvelope,
} from './reference-handler.js';
import { createIntentHandlers } from './reference-intents.js';

export { REFERENCE_PUBKEY, REFERENCE_ENDPOINT } from './reference-responses.js';
export type { ReferenceEndpoint } from './reference-responses.js';
export type { RecordedEnvelope } from './reference-handler.js';

/** Options for {@link createReferenceShell}. */
export interface ReferenceShellOptions {
  /** Injectable clock for deterministic tests. Defaults to `Date.now`. */
  now?: () => number;
}

/** A reference shell instance. */
export interface ReferenceShell {
  /** All envelopes recorded so far, in arrival order. */
  readonly records: readonly RecordedEnvelope[];
  /** Process one inbound envelope from the napplet. */
  handle(envelope: unknown): unknown[];
  /** Process one inbound envelope from an authenticated source endpoint. */
  handleFrom(endpoint: ReferenceEndpoint, envelope: unknown): unknown[];
  /** Drain retained target deliveries for one resolved reference target. */
  takeDeliveries(target: string): unknown[];
  /** Clear recorded envelopes. */
  reset(): void;
}

/** Create a reference shell. */
export function createReferenceShell(options: ReferenceShellOptions = {}): ReferenceShell {
  const records: RecordedEnvelope[] = [];
  const deliveries = createDeliveryQueue();
  const handleFrom = createReferenceHandler({
    now: options.now ?? Date.now,
    records,
    queueDelivery: deliveries.queue,
    intents: createIntentHandlers(),
  });

  return {
    get records() {
      return records;
    },
    handle: (envelope) => handleFrom(REFERENCE_ENDPOINT, envelope),
    handleFrom,
    takeDeliveries: deliveries.take,
    reset() {
      records.length = 0;
      deliveries.clear();
    },
  };
}

function createDeliveryQueue() {
  const queues = new Map<string, unknown[]>();
  return {
    queue(target: string, delivery: unknown): void {
      const queue = queues.get(target);
      if (queue) queue.push(delivery);
      else queues.set(target, [delivery]);
    },
    take(target: string): unknown[] {
      const queue = queues.get(target) ?? [];
      queues.delete(target);
      return queue;
    },
    clear(): void {
      queues.clear();
    },
  };
}

/** Minimal window surface {@link attachReferenceShell} needs (eases testing). */
export interface MessageWindowLike {
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}

/** Minimal target surface the shell posts responses to. */
export interface PostTargetLike {
  postMessage(message: unknown, targetOrigin: string): void;
}

/** Options for {@link attachReferenceShell}. */
export interface AttachOptions {
  host: MessageWindowLike;
  target: PostTargetLike;
  expectedSource?: unknown;
  endpoint?: ReferenceEndpoint;
}

/** Bind a {@link ReferenceShell} to a real postMessage channel. */
export function attachReferenceShell(shell: ReferenceShell, options: AttachOptions): () => void {
  const listener = (event: MessageEvent): void => {
    if (options.expectedSource !== undefined && event.source !== options.expectedSource) return;
    for (const response of shell.handleFrom(options.endpoint ?? REFERENCE_ENDPOINT, event.data)) {
      options.target.postMessage(response, '*');
    }
  };
  options.host.addEventListener('message', listener);
  return () => options.host.removeEventListener('message', listener);
}

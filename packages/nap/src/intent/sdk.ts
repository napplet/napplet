/**
 * Napplet NAP intent SDK entrypoint.
 *
 * @module
 */

import type { NappletGlobal, Subscription } from '@napplet/core';
import type {
  IntentAvailability,
  IntentOpenOptions,
  IntentRequest,
  IntentResult,
} from './types.js';

function requireIntent(): NonNullable<NappletGlobal['intent']> {
  const target = window as Window & { napplet?: NappletGlobal };
  if (!target.napplet?.intent) {
    throw new Error('window.napplet.intent is unavailable -- runtime did not inject this domain');
  }
  return target.napplet.intent;
}

/**
 * Invoke a napplet by archetype.
 *
 * @param request Archetype dispatch request
 * @returns Promise resolving to the dispatch result
 *
 * @example
 * ```ts
 * await intentInvoke({ archetype: 'note', payload: { id: 'abc' } });
 * ```
 */
export function intentInvoke(request: IntentRequest): Promise<IntentResult> {
  return requireIntent().invoke(request);
}

/**
 * Open a napplet by archetype.
 *
 * @param archetype Role slug to open
 * @param payload Optional opaque payload
 * @param opts Optional convention, handler selection, and behavior hints
 * @returns Promise resolving to the dispatch result
 *
 * @example
 * ```ts
 * await intentOpen('note', { id: 'abc' }, { convention: 'napplet:note/open' });
 * ```
 */
export function intentOpen(
  archetype: string,
  payload?: unknown,
  opts?: IntentOpenOptions,
): Promise<IntentResult> {
  return requireIntent().open(archetype, payload, opts);
}

/**
 * Check whether the runtime can satisfy an archetype.
 *
 * @param archetype Role slug to inspect
 * @returns Installed-catalog availability
 */
export function intentAvailable(archetype: string): Promise<IntentAvailability> {
  return requireIntent().available(archetype);
}

/**
 * List every archetype the runtime can satisfy.
 *
 * @returns Installed-catalog availability records
 */
export function intentHandlers(): Promise<IntentAvailability[]> {
  return requireIntent().handlers();
}

/**
 * Subscribe to runtime-pushed availability changes.
 *
 * @param handler Callback for each availability update
 * @returns Subscription handle
 */
export function intentOnChanged(handler: (availability: IntentAvailability) => void): Subscription {
  return requireIntent().onChanged(handler);
}

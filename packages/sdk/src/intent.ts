import type {
  IntentAvailability,
  IntentOpenOptions,
  IntentRequest,
  IntentResult,
  Subscription,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Archetype intent dispatch (NAP-INTENT): invoke an installed handler by role
 * without directly addressing a target instance.
 *
 * @example
 * ```ts
 * import { intent } from '@napplet/sdk';
 *
 * if ((await intent.available('note')).available) {
 *   await intent.open('note', { event: id }, { convention: 'napplet:note/open' });
 * }
 * ```
 */
export const intent: SdkDomain<'intent'> = {
  /**
   * Invoke an archetype request.
   * @param request Archetype, action, convention, payload, and behavior hints
   * @returns Promise resolving to the dispatch result
   */
  invoke(request: IntentRequest): Promise<IntentResult> {
    return requireDomain('intent').invoke(request);
  },

  /**
   * Open a napplet by archetype.
   * @param archetype Role slug to open
   * @param payload Optional opaque payload
   * @param opts Optional convention, handler preference, and behavior hints
   * @returns Promise resolving to the dispatch result
   */
  open(
    archetype: string,
    payload?: unknown,
    opts?: IntentOpenOptions,
  ): Promise<IntentResult> {
    return requireDomain('intent').open(archetype, payload, opts);
  },

  /**
   * Check whether the runtime can currently satisfy an archetype and expose the
   * manifest-derived conventions each candidate serves.
   * @param archetype  Role slug to check
   * @returns Promise resolving to the archetype availability
   */
  available(archetype: string): Promise<IntentAvailability> {
    return requireDomain('intent').available(archetype);
  },

  /**
   * Get availability for every archetype the runtime can satisfy.
   * @returns Promise resolving to availability for each satisfiable archetype
   */
  handlers(): Promise<IntentAvailability[]> {
    return requireDomain('intent').handlers();
  },

  /**
   * Register for shell-pushed availability updates.
   * @param handler  Called with each updated IntentAvailability
   * @returns A Subscription with `close()` to stop listening
   */
  onChanged(handler: (availability: IntentAvailability) => void): Subscription {
    return requireDomain('intent').onChanged(handler);
  },

};

import type { CountFilter, CountOptions, CountResult } from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Runtime-mediated event counts (NAP-COUNT): ask the runtime to count NIP-01
 * filter matches without returning matching event payloads. The runtime owns
 * relay selection, NIP-45 COUNT support, indexing, aggregation, approximation,
 * and refusal policy.
 *
 * @example
 * ```ts
 * import { count } from '@napplet/sdk';
 *
 * const result = await count.query({ kinds: [7], '#e': [eventId] });
 * ```
 */
export const count: SdkDomain<'count'> = {
  /**
   * Count events matching one or more NIP-01 filters.
   * @param filters  One NIP-01 filter or a non-empty array of filters
   * @param options  Optional approximation and HyperLogLog hints
   * @returns Promise resolving to the runtime count result
   */
  query(filters: CountFilter | CountFilter[], options?: CountOptions): Promise<CountResult> {
    return requireDomain('count').query(filters, options);
  },
};

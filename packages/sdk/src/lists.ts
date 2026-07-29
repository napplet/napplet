import type {
  ListItem,
  ListMutationResult,
  ListOptions,
  ListRef,
  ListSupport,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Runtime-mediated NIP-51 list mutations (NAP-LISTS): add or remove semantic
 * items from supported NIP-51 lists while the runtime owns lookup, merge,
 * encryption, signing, and publishing.
 *
 * @example
 * ```ts
 * import { lists } from '@napplet/sdk';
 *
 * await lists.add({ type: 'mute-list' }, [
 *   { itemType: 'pubkey', value: 'abc123...' },
 * ]);
 * ```
 */
export const lists: SdkDomain<'lists'> = {
  /**
   * Return the NIP-51 list kinds/types this runtime supports.
   * @returns Promise resolving to supported list descriptions
   */
  supported(): Promise<ListSupport[]> {
    return requireDomain('lists').supported();
  },

  /**
   * Add items to a runtime-supported NIP-51 list.
   * @param list     List reference by kind or derived type
   * @param items    Items to add
   * @param options  Optional create/metadata hints
   */
  add(list: ListRef, items: ListItem[], options?: ListOptions): Promise<ListMutationResult> {
    return requireDomain('lists').add(list, items, options);
  },

  /**
   * Remove items from a runtime-supported NIP-51 list.
   * @param list     List reference by kind or derived type
   * @param items    Items to remove
   * @param options  Optional runtime hints
   */
  remove(list: ListRef, items: ListItem[], options?: ListOptions): Promise<ListMutationResult> {
    return requireDomain('lists').remove(list, items, options);
  },
};

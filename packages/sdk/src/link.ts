import type { LinkOpenOptions, LinkOpenResult } from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Shell-mediated link opening (NAP-LINK): ask the shell to open an external URL
 * for user-visible navigation. The shell owns prompting, policy, opener
 * isolation, and browser context.
 *
 * @example
 * ```ts
 * import { link } from '@napplet/sdk';
 *
 * const result = await link.open('https://example.com/post/123', { label: 'Read post' });
 * ```
 */
export const link: SdkDomain<'link'> = {
  /**
   * Request that the shell open an external URL for the user.
   * @param url      Absolute URL to open
   * @param options  Optional prompt/display hints
   * @returns Promise resolving to the shell's open/deny status
   */
  open(url: string, options?: LinkOpenOptions): Promise<LinkOpenResult> {
    return requireDomain('link').open(url, options);
  },
};

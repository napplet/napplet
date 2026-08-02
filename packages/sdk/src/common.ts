import type {
  CommonActionResult,
  CommonFollowsResult,
  CommonNip19DecodeResult,
  CommonNip19EncodeInput,
  CommonNip19EncodeResult,
  CommonProfileResult,
  CommonProfileTarget,
  CommonReaction,
  CommonReportReason,
  CommonReportTarget,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Common social actions (NAP-COMMON): shell-mediated public NIP-19 helpers,
 * profile lookup, follows, follow/unfollow, reactions, and reports. The shell
 * owns identity, consent, event construction, signing, publishing, relay access,
 * and NIP-19 handling.
 *
 * @example
 * ```ts
 * import { common } from '@napplet/sdk';
 *
 * const { pubkeys } = await common.follows();
 * await common.react(noteId, '+');
 * ```
 */
export const common: SdkDomain<'common'> = {
  /**
   * Encode a supported public NIP-19 value.
   * @param input  Structured NIP-19 encode input
   * @returns Promise resolving to the shell encode result
   */
  encodeNip19(input: CommonNip19EncodeInput): Promise<CommonNip19EncodeResult> {
    return requireDomain('common').encodeNip19(input);
  },

  /**
   * Decode a supported public NIP-19 value.
   * @param value  NIP-19 value to decode
   * @returns Promise resolving to normalized decoded fields
   */
  decodeNip19(value: string): Promise<CommonNip19DecodeResult> {
    return requireDomain('common').decodeNip19(value);
  },

  /**
   * Resolve a profile by hex pubkey, npub, or nprofile.
   * @param target  Profile target
   * @returns Promise resolving to latest profile data when available
   */
  getProfile(target: CommonProfileTarget): Promise<CommonProfileResult> {
    return requireDomain('common').getProfile(target);
  },

  /**
   * Return the shell user's followed pubkeys as hex.
   * @returns Promise resolving to followed pubkeys
   */
  follows(): Promise<CommonFollowsResult> {
    return requireDomain('common').follows();
  },

  /**
   * Ask the shell to follow one or more npub targets.
   * @param pubkeys  Npub targets to follow
   * @returns Promise resolving to the action result
   */
  follow(...pubkeys: string[]): Promise<CommonActionResult> {
    return requireDomain('common').follow(...pubkeys);
  },

  /**
   * Ask the shell to unfollow one or more npub targets.
   * @param pubkeys  Npub targets to unfollow
   * @returns Promise resolving to the action result
   */
  unfollow(...pubkeys: string[]): Promise<CommonActionResult> {
    return requireDomain('common').unfollow(...pubkeys);
  },

  /**
   * React to a native Nostr event.
   * @param targetEventId     Event id to react to
   * @param reaction          Reaction content
   * @param customEmojiHref   Optional custom emoji URL
   * @returns Promise resolving to the action result
   */
  react(
    targetEventId: string,
    reaction: CommonReaction,
    customEmojiHref?: string,
  ): Promise<CommonActionResult> {
    return requireDomain('common').react(targetEventId, reaction, customEmojiHref);
  },

  /**
   * Report an event or pubkey with a NIP-56 reason.
   * @param target  Structured report target
   * @param reason  NIP-56 report reason
   * @param text    Report text
   * @returns Promise resolving to the action result
   */
  report(
    target: CommonReportTarget,
    reason: CommonReportReason,
    text: string,
  ): Promise<CommonActionResult> {
    return requireDomain('common').report(target, reason, text);
  },
};

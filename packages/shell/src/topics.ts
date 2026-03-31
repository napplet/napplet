/**
 * topics.ts — Re-exports topic constants from @napplet/core.
 *
 * Shell previously owned these constants. They now live in @napplet/core
 * so all packages share a single source of truth.
 */
export { TOPICS } from '@napplet/core';
export type { TopicKey, TopicValue } from '@napplet/core';

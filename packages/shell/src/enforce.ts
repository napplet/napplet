/**
 * enforce.ts — Single ACL enforcement gate for ShellBridge.
 *
 * All message paths pass through enforce() before any handler acts.
 * resolveCapabilities() maps each message type to the required capability.
 * Both functions are designed to be the sole ACL chokepoint — no handler
 * should call @napplet/acl directly.
 */

import type { Capability, AclCheckEvent, NostrEvent } from './types.js';
import { BusKind } from './types.js';

// ─── Capability Resolution ────────────────────────────────────────────────────

/**
 * Result of resolving what capabilities a message requires.
 *
 * @param senderCap - Capability the sender must have, or null if no check needed (CLOSE, AUTH)
 * @param recipientCap - Capability the recipient must have at delivery time, or null if no recipient check
 */
export interface CapabilityResolution {
  senderCap: Capability | null;
  recipientCap: Capability | null;
}

/**
 * Map a raw NIP-01 message to the capability(ies) it requires.
 *
 * Pure function — no side effects, no state access.
 * Examines verb, event kind, and topic tag to determine required capabilities.
 *
 * @param msg - Raw NIP-01 message array (e.g., ['EVENT', {...}], ['REQ', 'sub1', {...}])
 * @returns The sender and recipient capabilities required, or null for each if no check needed
 *
 * @example
 * resolveCapabilities(['REQ', 'sub1', { kinds: [1] }])
 * // => { senderCap: 'relay:read', recipientCap: null }
 *
 * @example
 * resolveCapabilities(['EVENT', { kind: 29001, tags: [['method', 'signEvent']] }])
 * // => { senderCap: 'sign:event', recipientCap: null }
 */
export function resolveCapabilities(msg: unknown[]): CapabilityResolution {
  const verb = msg[0];

  switch (verb) {
    case 'AUTH':
      return { senderCap: null, recipientCap: null };

    case 'CLOSE':
      return { senderCap: null, recipientCap: null };

    case 'REQ':
      return { senderCap: 'relay:read', recipientCap: null };

    case 'COUNT':
      return { senderCap: 'relay:read', recipientCap: null };

    case 'EVENT': {
      const event = msg[1] as NostrEvent | undefined;
      if (!event || typeof event !== 'object') {
        return { senderCap: 'relay:write', recipientCap: null };
      }

      // Signer request — needs sign:event capability
      if (event.kind === BusKind.SIGNER_REQUEST) {
        return { senderCap: 'sign:event', recipientCap: null };
      }

      // Hotkey forward — needs hotkey:forward capability
      if (event.kind === BusKind.HOTKEY_FORWARD) {
        return { senderCap: 'hotkey:forward', recipientCap: null };
      }

      // Inter-pane events — check topic for state operations
      if (event.kind === BusKind.INTER_PANE) {
        const topic = event.tags?.find((t: string[]) => t[0] === 't')?.[1];

        if (topic === 'shell:state-get' || topic === 'shell:state-keys') {
          return { senderCap: 'state:read', recipientCap: null };
        }

        if (
          topic === 'shell:state-set' ||
          topic === 'shell:state-remove' ||
          topic === 'shell:state-clear'
        ) {
          return { senderCap: 'state:write', recipientCap: null };
        }

        // Non-state inter-pane messages (including audio, shell commands)
        // require relay:write to send, relay:read to receive
        return { senderCap: 'relay:write', recipientCap: 'relay:read' };
      }

      // All other event kinds — standard relay publish
      return { senderCap: 'relay:write', recipientCap: 'relay:read' };
    }

    default:
      // Unknown verb — require relay:write as a safe default
      return { senderCap: 'relay:write', recipientCap: null };
  }
}

// ─── Enforcement ──────────────────────────────────────────────────────────────

/**
 * Result of an enforcement check.
 *
 * @param allowed - Whether the capability check passed
 * @param capability - The capability that was checked (human-readable string)
 */
export interface EnforceResult {
  allowed: boolean;
  capability: Capability;
}

/**
 * Identity lookup function type — resolves a pubkey to its full identity.
 * Provided by nappKeyRegistry at runtime.
 */
export type IdentityResolver = (pubkey: string) => { dTag: string; aggregateHash: string } | undefined;

/**
 * ACL check function type — performs the actual capability check.
 * Provided by @napplet/acl's check() at runtime, or by the legacy aclStore.check().
 */
export type AclChecker = (pubkey: string, dTag: string, aggregateHash: string, capability: Capability) => boolean;

/**
 * Enforcement gate configuration.
 *
 * @param checkAcl - The ACL check function (wraps @napplet/acl or legacy aclStore)
 * @param resolveIdentity - Maps pubkey to full identity (dTag, aggregateHash)
 * @param onAclCheck - Optional audit callback (from ShellHooks)
 * @param emitAuditEvent - Optional function to emit acl:check events to subscribers
 */
export interface EnforceConfig {
  checkAcl: AclChecker;
  resolveIdentity: IdentityResolver;
  onAclCheck?: (event: AclCheckEvent) => void;
  emitAuditEvent?: (topic: string, payload: unknown) => void;
}

/**
 * Create an enforcement gate with the given configuration.
 *
 * Returns a function that checks a single capability for a given pubkey.
 * Every call is logged to both the hooks callback and the event emitter.
 *
 * @param config - Enforcement configuration with ACL checker, identity resolver, and audit hooks
 * @returns An enforce function that checks capabilities and logs decisions
 *
 * @example
 * const gate = createEnforceGate({
 *   checkAcl: aclStore.check,
 *   resolveIdentity: (pk) => nappKeyRegistry.getEntry(pk),
 *   onAclCheck: hooks.onAclCheck,
 * });
 * const result = gate('abc123...', 'relay:write');
 * // result.allowed === true | false
 * // result.capability === 'relay:write'
 */
export function createEnforceGate(config: EnforceConfig): (pubkey: string, capability: Capability) => EnforceResult {
  const { checkAcl, resolveIdentity, onAclCheck, emitAuditEvent } = config;

  return function enforce(pubkey: string, capability: Capability): EnforceResult {
    const entry = resolveIdentity(pubkey);
    const dTag = entry?.dTag ?? '';
    const aggregateHash = entry?.aggregateHash ?? '';

    const allowed = checkAcl(pubkey, dTag, aggregateHash, capability);

    // Audit logging — every check, both allows and denials (ENF-05)
    const identity = { pubkey, dTag, hash: aggregateHash };
    const decision = allowed ? 'allow' as const : 'deny' as const;

    if (onAclCheck) {
      onAclCheck({ identity, capability, decision });
    }

    if (emitAuditEvent) {
      emitAuditEvent('acl:check', { identity, capability, decision });
    }

    return { allowed, capability };
  };
}

// ─── Denial Response Helpers ──────────────────────────────────────────────────

/**
 * Format a denial reason string with the standard 'denied:' prefix.
 *
 * All denial reasons follow the pattern: 'denied: {capability}'.
 * This is machine-parseable and consistent across all message types (ENF-04).
 *
 * @param capability - The denied capability name
 * @returns Formatted denial string, e.g., 'denied: relay:write'
 *
 * @example
 * formatDenialReason('relay:write')
 * // => 'denied: relay:write'
 */
export function formatDenialReason(capability: Capability): string {
  return `denied: ${capability}`;
}

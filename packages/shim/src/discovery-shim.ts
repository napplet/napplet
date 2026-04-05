// @napplet/shim — Service discovery API
// Queries available shell services via kind 29010 and caches results.

import { query } from './relay-shim.js';
import { BusKind } from './types.js';
import type { NostrEvent, ServiceInfo } from '@napplet/core';

// ─── Session-scoped cache ───────────────────────────────────────────────────

let cachedServices: ServiceInfo[] | null = null;

// ─── Discovery functions ────────────────────────────────────────────────────

/**
 * Parse a kind 29010 event into a ServiceInfo object.
 * Extracts s (name), v (version), and optional d (description) tags.
 */
function parseServiceEvent(event: NostrEvent): ServiceInfo | null {
  const sTag = event.tags.find(t => t[0] === 's');
  const vTag = event.tags.find(t => t[0] === 'v');
  if (!sTag?.[1] || !vTag?.[1]) return null;

  const dTag = event.tags.find(t => t[0] === 'd');
  return {
    name: sTag[1],
    version: vTag[1],
    description: dTag?.[1],
  };
}

/**
 * Discover available services in the shell.
 *
 * Sends a one-shot kind 29010 REQ via the existing relay shim query() function.
 * The shell responds with one event per registered service, each carrying
 * s (name), v (version), and optional d (description) tags per RUNTIME-SPEC.md Section 11.2.
 *
 * Results are cached session-scoped — subsequent calls return the cached
 * array without sending another REQ. Cache is cleared on page reload.
 *
 * The REQ flows through the pre-AUTH message queue automatically, so calling
 * discoverServices() before AUTH completes is safe — the promise resolves
 * after AUTH + discovery round-trip.
 *
 * @returns Array of ServiceInfo objects describing available services
 *
 * @example
 * ```ts
 * const services = await window.napplet.discoverServices();
 * console.log(`Shell provides ${services.length} services`);
 * ```
 */
async function discoverServices(): Promise<ServiceInfo[]> {
  if (cachedServices !== null) return cachedServices;

  const events = await query({ kinds: [BusKind.SERVICE_DISCOVERY] });
  const services: ServiceInfo[] = [];

  for (const event of events) {
    const info = parseServiceEvent(event);
    if (info) services.push(info);
  }

  cachedServices = services;
  return services;
}

/**
 * Check whether a named service is available in the shell.
 *
 * Internally calls discoverServices() (leveraging the cache) and checks
 * if any service matches the given name.
 *
 * @param name  Service name to check (e.g., 'audio', 'notifications')
 * @returns true if the service is registered in the shell
 *
 * @example
 * ```ts
 * if (await window.napplet.hasService('audio')) {
 *   // Safe to use audio API
 * }
 * ```
 */
async function hasService(name: string): Promise<boolean> {
  const services = await discoverServices();
  return services.some(s => s.name === name);
}

/**
 * Check whether a named service with a specific version is available.
 *
 * Performs an exact version string match. Name-only matching via
 * hasService() is the primary check (Phase 18 D-07); this is a
 * convenience for version-aware napplets.
 *
 * @param name     Service name to check
 * @param version  Exact version string to match (e.g., '1.0.0')
 * @returns true if the service exists with the specified version
 *
 * @example
 * ```ts
 * if (await window.napplet.hasServiceVersion('audio', '1.0.0')) {
 *   // Audio v1.0.0 features are available
 * }
 * ```
 */
async function hasServiceVersion(name: string, version: string): Promise<boolean> {
  const services = await discoverServices();
  return services.some(s => s.name === name && s.version === version);
}

// ─── Internal exports for index.ts ──────────────────────────────────────────
export { discoverServices };

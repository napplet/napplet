/**
 * Explicit-domain runtime prelude helpers for shell-managed injection.
 *
 * @module
 */

import type { NapDomain, NappletGlobal } from '@napplet/core';
import { installNappletGlobal, registerNappletExtension } from './runtime.js';
import type { NappletShimExtension } from './runtime.js';

/** Options for installing a constrained `window.napplet` runtime prelude. */
export interface NappletRuntimePreludeOptions {
  /** Explicit domain allowlist the shell exposes to this napplet. */
  domains: readonly string[];
}

function normalizePreludeDomains(options: NappletRuntimePreludeOptions): string[] {
  if (!options || !Array.isArray(options.domains)) {
    throw new TypeError('Napplet runtime prelude requires an explicit domains array');
  }

  return options.domains
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0);
}

/**
 * Install callable `window.napplet.<domain>` objects from a host-injected prelude.
 *
 * Unlike the legacy side-effect entry point, this host surface requires an
 * explicit domain allowlist so shell runtimes do not accidentally expose every
 * bundled NAP domain.
 *
 * @param options Explicit runtime domain allowlist.
 * @returns The installed `window.napplet` namespace.
 * @example
 * ```ts
 * import { installNappletRuntimePrelude } from '@napplet/shim/prelude';
 *
 * installNappletRuntimePrelude({ domains: ['identity', 'storage'] });
 * ```
 */
export function installNappletRuntimePrelude(options: NappletRuntimePreludeOptions): NappletGlobal {
  return installNappletGlobal({ domains: normalizePreludeDomains(options) });
}

/**
 * Render the JavaScript call that activates the browser IIFE prelude artifact.
 *
 * Shells can inline `dist/prelude.global.js` once, then append this call before
 * authored napplet scripts run.
 *
 * @param options Explicit runtime domain allowlist.
 * @returns JavaScript source that invokes the IIFE global installer.
 * @example
 * ```ts
 * const call = renderNappletRuntimePreludeCall({ domains: ['identity'] });
 * ```
 */
export function renderNappletRuntimePreludeCall(options: NappletRuntimePreludeOptions): string {
  return `globalThis.NappletShimPrelude.install(${JSON.stringify({
    domains: normalizePreludeDomains(options),
  })});`;
}

/**
 * Render a `<script>` element body that activates the browser IIFE prelude.
 *
 * This helper intentionally renders the activation call, not the bundled
 * prelude artifact itself. The shell should inline `dist/prelude.global.js`
 * before this activation script when constructing `srcdoc`.
 *
 * @param options Explicit runtime domain allowlist.
 * @returns HTML script tag that invokes the IIFE global installer.
 * @example
 * ```ts
 * const script = renderNappletRuntimePreludeScript({ domains: ['identity'] });
 * ```
 */
export function renderNappletRuntimePreludeScript(options: NappletRuntimePreludeOptions): string {
  return `<script>${renderNappletRuntimePreludeCall(options)}</script>`;
}

/** Alias for {@link installNappletRuntimePrelude}. */
export const install: typeof installNappletRuntimePrelude = installNappletRuntimePrelude;
/** Alias for registering runtime-local experimental domains before installation. */
export const registerExtension: typeof registerNappletRuntimeExtension = registerNappletRuntimeExtension;
export type { NapDomain, NappletGlobal, NappletShimExtension };

/** Register a runtime-local experimental domain for the browser prelude. */
export function registerNappletRuntimeExtension(extension: NappletShimExtension): void {
  registerNappletExtension(extension);
}

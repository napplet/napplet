import type { NapDomain, NappletGlobal } from '@napplet/core';
import { installCoreDomains } from './runtime-globals-core.js';
import { installServiceDomains } from './runtime-globals-services.js';

/** Construct the runtime-provided namespace for the selected NAP domains. */
export function createNappletGlobal(domains: ReadonlySet<NapDomain>): NappletGlobal {
  const napplet: Partial<NappletGlobal> = {};
  installCoreDomains(domains, napplet);
  installServiceDomains(domains, napplet);
  return napplet as NappletGlobal;
}

/**
 * Napplet NAP cvm shim entrypoint.
 *
 * @module
 */

import {
  eventHandlers,
  installed,
  pendingClose,
  pendingDiscover,
  pendingRegistryCall,
  pendingRegistryDescribe,
  pendingRegistryHas,
  pendingRegistryList,
  pendingRequest,
  setInstalled,
} from './cvm-state.js';

export { handleCvmMessage } from './cvm-incoming.js';
export {
  callTool,
  close,
  discover,
  listResources,
  listTools,
  onEvent,
  readResource,
  request,
} from './cvm-requests.js';
export {
  registry,
  registryCall,
  registryDescribe,
  registryHas,
  registryList,
} from './cvm-registry.js';

/** Install the ContextVM shim and return its cleanup function. */
export function installCvmShim(): () => void {
  if (installed) return () => undefined;
  setInstalled(true);
  return () => {
    for (const pending of [
      ...pendingDiscover.values(),
      ...pendingRequest.values(),
      ...pendingClose.values(),
      ...pendingRegistryList.values(),
      ...pendingRegistryHas.values(),
      ...pendingRegistryDescribe.values(),
      ...pendingRegistryCall.values(),
    ]) clearTimeout(pending.timeout);
    pendingDiscover.clear();
    pendingRequest.clear();
    pendingClose.clear();
    pendingRegistryList.clear();
    pendingRegistryHas.clear();
    pendingRegistryDescribe.clear();
    pendingRegistryCall.clear();
    eventHandlers.clear();
    setInstalled(false);
  };
}

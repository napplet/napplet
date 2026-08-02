import { postToShell } from '../boundary.js';
import type {
  CvmRegistryCallMessage,
  CvmRegistryCallOptions,
  CvmRegistryDescribeMessage,
  CvmRegistryEntry,
  CvmRegistryHasMessage,
  CvmRegistryListMessage,
  CvmRegistryOptions,
  CvmRegistryQuery,
  JsonObject,
  McpToolResult,
} from './types.js';
import {
  pendingRegistryCall,
  pendingRegistryDescribe,
  pendingRegistryHas,
  pendingRegistryList,
  REQUEST_TIMEOUT_MS,
} from './cvm-state.js';

/**
 * List shell-curated ContextVM registry families.
 *
 * @param query  Optional search/family/schema filter
 * @returns Promise resolving to registry entries
 */
export function registryList(query?: CvmRegistryQuery): Promise<CvmRegistryEntry[]> {
  const id = crypto.randomUUID();
  return new Promise<CvmRegistryEntry[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingRegistryList.delete(id)) reject(new Error('cvm.registry.list timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingRegistryList.set(id, { resolve, reject, timeout });

    const msg: CvmRegistryListMessage = {
      type: 'cvm.registry.list',
      id,
      ...(query === undefined ? {} : { query }),
    };
    postToShell(msg);
  });
}

/**
 * Test whether the shell can call a ContextVM registry family.
 *
 * @param family   Registry family name
 * @param options  Optional schema/provider constraints
 * @returns Promise resolving to availability
 */
export function registryHas(
  family: string,
  options?: CvmRegistryOptions,
): Promise<boolean> {
  const id = crypto.randomUUID();
  return new Promise<boolean>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingRegistryHas.delete(id)) reject(new Error('cvm.registry.has timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingRegistryHas.set(id, { resolve, reject, timeout });

    const msg: CvmRegistryHasMessage = {
      type: 'cvm.registry.has',
      id,
      family,
      ...(options === undefined ? {} : { options }),
    };
    postToShell(msg);
  });
}

/**
 * Describe a shell-selected ContextVM registry family.
 *
 * @param family   Registry family name
 * @param options  Optional schema/provider constraints
 * @returns Promise resolving to the selected registry entry
 */
export function registryDescribe(
  family: string,
  options?: CvmRegistryOptions,
): Promise<CvmRegistryEntry> {
  const id = crypto.randomUUID();
  return new Promise<CvmRegistryEntry>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingRegistryDescribe.delete(id)) reject(new Error('cvm.registry.describe timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingRegistryDescribe.set(id, { resolve, reject, timeout });

    const msg: CvmRegistryDescribeMessage = {
      type: 'cvm.registry.describe',
      id,
      family,
      ...(options === undefined ? {} : { options }),
    };
    postToShell(msg);
  });
}

/**
 * Call a tool on the shell-selected provider for a ContextVM registry family.
 *
 * @param family   Registry family name
 * @param tool     Tool name inside the family
 * @param args     Optional tool arguments
 * @param options  Optional schema/provider/cache/payment constraints
 * @returns Promise resolving to the MCP tool result
 */
export function registryCall(
  family: string,
  tool: string,
  args?: JsonObject,
  options?: CvmRegistryCallOptions,
): Promise<McpToolResult> {
  const id = crypto.randomUUID();
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  return new Promise<McpToolResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingRegistryCall.delete(id)) reject(new Error('cvm.registry.call timed out'));
    }, timeoutMs);
    pendingRegistryCall.set(id, { resolve, reject, timeout });

    const msg: CvmRegistryCallMessage = {
      type: 'cvm.registry.call',
      id,
      family,
      tool,
      ...(args === undefined ? {} : { args }),
      ...(options === undefined ? {} : { options }),
    };
    postToShell(msg);
  });
}

/** Shell-curated ContextVM registry helper namespace. */
export const registry = {
  list: registryList,
  has: registryHas,
  describe: registryDescribe,
  call: registryCall,
};

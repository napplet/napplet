import { postToShell } from '../boundary.js';
import type { Subscription } from '@napplet/core';
import type {
  CvmCloseMessage,
  CvmDiscoverMessage,
  CvmDiscoverQuery,
  CvmRequestMessage,
  CvmRequestOptions,
  CvmServer,
  CvmServerRef,
  McpMessage,
  McpResource,
  McpResourceContent,
  McpTool,
  McpToolResult,
} from './types.js';
import {
  eventHandlers,
  pendingClose,
  pendingDiscover,
  pendingRequest,
  REQUEST_TIMEOUT_MS,
} from './cvm-state.js';

/**
 * Discover public ContextVM servers known to the shell.
 *
 * @param query  Optional discovery filter (`search`, `kinds`, `relays`, `limit`)
 * @returns Promise resolving to the discovered servers
 *
 * @example
 * ```ts
 * const servers = await discover({ search: 'relay', limit: 5 });
 * ```
 */
export function discover(query?: CvmDiscoverQuery): Promise<CvmServer[]> {
  const id = crypto.randomUUID();
  return new Promise<CvmServer[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingDiscover.delete(id)) reject(new Error('cvm.discover timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingDiscover.set(id, { resolve, reject, timeout });

    const msg: CvmDiscoverMessage = {
      type: 'cvm.discover',
      id,
      ...(query === undefined ? {} : { query }),
    };
    postToShell(msg);
  });
}

/**
 * Send a raw MCP JSON-RPC message to a ContextVM server and resolve with the
 * matching MCP response. The shell handles ContextVM transport, correlation,
 * signature verification, and (per options) initialization and payment.
 *
 * @param server   Target ContextVM server (pubkey + optional relay hints)
 * @param message  MCP JSON-RPC message to deliver
 * @param options  Optional per-request options (`timeoutMs`, `initialize`, `payment`)
 * @returns Promise resolving to the MCP response message
 *
 * @example
 * ```ts
 * const reply = await request(
 *   { pubkey: '65a334...' },
 *   { jsonrpc: '2.0', id: 1, method: 'tools/list' },
 *   { initialize: true },
 * );
 * ```
 */
export function request(
  server: CvmServerRef,
  message: McpMessage,
  options?: CvmRequestOptions,
): Promise<McpMessage> {
  const id = crypto.randomUUID();
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  return new Promise<McpMessage>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingRequest.delete(id)) reject(new Error('cvm.request timed out'));
    }, timeoutMs);
    pendingRequest.set(id, { resolve, reject, timeout });

    const msg: CvmRequestMessage = {
      type: 'cvm.request',
      id,
      server,
      message,
      ...(options === undefined ? {} : { options }),
    };
    postToShell(msg);
  });
}

/**
 * Build an MCP JSON-RPC request, send it via `request`, and surface MCP-level
 * errors (`message.error`) as a thrown Error. Returns the MCP `result` payload.
 */
async function mcpCall<T>(
  server: CvmServerRef,
  method: string,
  params: unknown,
  options?: CvmRequestOptions,
): Promise<T> {
  const reply = await request(
    server,
    {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      ...(params === undefined ? {} : { params }),
    },
    options,
  );
  if (reply.error !== undefined) {
    const err = reply.error as { message?: string; code?: number };
    throw new Error(err?.message ? `${method}: ${err.message}` : `${method} failed`);
  }
  return reply.result as T;
}

/**
 * List the tools exposed by a ContextVM server (MCP `tools/list`).
 *
 * @param server   Target ContextVM server
 * @param options  Optional per-request options
 * @returns Promise resolving to the server's tool definitions
 */
export async function listTools(
  server: CvmServerRef,
  options?: CvmRequestOptions,
): Promise<McpTool[]> {
  const result = await mcpCall<{ tools?: McpTool[] }>(server, 'tools/list', undefined, options);
  return result?.tools ?? [];
}

/**
 * Call a tool on a ContextVM server (MCP `tools/call`).
 *
 * @param server   Target ContextVM server
 * @param name     Tool name (from {@link listTools})
 * @param args     Tool arguments
 * @param options  Optional per-request options
 * @returns Promise resolving to the MCP tool result
 *
 * @example
 * ```ts
 * const result = await callTool(
 *   { pubkey: '65a334...' },
 *   'get_relay',
 *   { url: 'wss://relay.example.com' },
 *   { payment: 'prompt' },
 * );
 * ```
 */
export function callTool(
  server: CvmServerRef,
  name: string,
  args?: Record<string, unknown>,
  options?: CvmRequestOptions,
): Promise<McpToolResult> {
  return mcpCall<McpToolResult>(
    server,
    'tools/call',
    { name, ...(args === undefined ? {} : { arguments: args }) },
    options,
  );
}

/**
 * List the resources exposed by a ContextVM server (MCP `resources/list`).
 *
 * @param server   Target ContextVM server
 * @param options  Optional per-request options
 * @returns Promise resolving to the server's resource descriptors
 */
export async function listResources(
  server: CvmServerRef,
  options?: CvmRequestOptions,
): Promise<McpResource[]> {
  const result = await mcpCall<{ resources?: McpResource[] }>(server, 'resources/list', undefined, options);
  return result?.resources ?? [];
}

/**
 * Read a resource from a ContextVM server (MCP `resources/read`).
 *
 * MCP returns a `contents` array; this convenience wrapper resolves with the
 * first entry per the NAP-CVM API surface. Use {@link request} directly for
 * multi-content resources.
 *
 * @param server   Target ContextVM server
 * @param uri      Resource URI (from {@link listResources})
 * @param options  Optional per-request options
 * @returns Promise resolving to the first resource content entry (text or blob)
 */
export async function readResource(
  server: CvmServerRef,
  uri: string,
  options?: CvmRequestOptions,
): Promise<McpResourceContent> {
  const result = await mcpCall<{ contents?: McpResourceContent[] }>(
    server,
    'resources/read',
    { uri },
    options,
  );
  const first = result?.contents?.[0];
  if (!first) throw new Error(`resources/read returned no contents for ${uri}`);
  return first;
}

/**
 * Close shell-maintained session state for a server (subscriptions, cached
 * initialization state, pending correlation records).
 *
 * @param server  Server whose session should be torn down
 * @returns Promise that resolves once the shell confirms closure
 */
export function close(server: CvmServerRef): Promise<void> {
  const id = crypto.randomUUID();
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingClose.delete(id)) reject(new Error('cvm.close timed out'));
    }, REQUEST_TIMEOUT_MS);
    pendingClose.set(id, { resolve, reject, timeout });

    const msg: CvmCloseMessage = {
      type: 'cvm.close',
      id,
      server,
    };
    postToShell(msg);
  });
}

/**
 * Listen for server-pushed MCP messages (`cvm.event`) -- notifications and
 * unsolicited server messages not correlated to a single request. The callback
 * receives every event; filter on `server.pubkey` when scoping to one server.
 *
 * @param callback  Called with `(server, message)` for each server event
 * @returns A Subscription with `close()` to stop listening
 *
 * @example
 * ```ts
 * const sub = onEvent((server, message) => {
 *   if (message.method === 'notifications/progress') updateProgress(message.params);
 * });
 * // later: sub.close();
 * ```
 */
export function onEvent(
  callback: (server: CvmServerRef, message: McpMessage) => void,
): Subscription {
  eventHandlers.add(callback);
  return {
    close(): void {
      eventHandlers.delete(callback);
    },
  };
}

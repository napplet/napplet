import type {
  CvmServer,
  CvmServerRef,
  McpMessage,
  McpToolResult,
  CvmRegistryEntry,
} from './types.js';

/** Default timeout for ContextVM requests. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Pending discover requests: correlation id -> resolver record. */
export const pendingDiscover = new Map<string, {
  resolve: (servers: CvmServer[]) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

/** Pending request operations: correlation id -> resolver record. */
export const pendingRequest = new Map<string, {
  resolve: (message: McpMessage) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

/** Pending close operations: correlation id -> resolver record. */
export const pendingClose = new Map<string, {
  resolve: () => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

/** Pending registry list requests. */
export const pendingRegistryList = new Map<string, {
  resolve: (entries: CvmRegistryEntry[]) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

/** Pending registry availability requests. */
export const pendingRegistryHas = new Map<string, {
  resolve: (has: boolean) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

/** Pending registry describe requests. */
export const pendingRegistryDescribe = new Map<string, {
  resolve: (entry: CvmRegistryEntry) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

/** Pending registry tool calls. */
export const pendingRegistryCall = new Map<string, {
  resolve: (result: McpToolResult) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

/** Server-event listeners. Each receives every cvm.event; filter by server.pubkey as needed. */
export const eventHandlers = new Set<(server: CvmServerRef, message: McpMessage) => void>();

/** Guard against double-install. */
export let installed = false;

export function setInstalled(value: boolean): void {
  installed = value;
}

import type {
  SerialEvent,
  SerialOpenRequest,
  SerialOpenResult,
  Subscription,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Runtime-mediated serial device access (NAP-SERIAL): ask the shell to select
 * and open a user-approved serial session, write byte arrays to that session,
 * and receive shell-pushed state/data/close events. The shell owns raw port
 * handles, streams, OS paths, permissions, read loops, and lifecycle policy.
 *
 * @example
 * ```ts
 * import { serial } from '@napplet/sdk';
 *
 * const { session } = await serial.open({ options: { baudRate: 115200 } });
 * await serial.write(session.id, [112, 105, 110, 103, 10]);
 * ```
 */
export const serial: SdkDomain<'serial'> = {
  /**
   * Ask the runtime to select and open a serial session.
   * @param request  Filters, options, and optional chooser label
   * @returns Promise resolving to the runtime-assigned serial open result
   */
  open(request: SerialOpenRequest): Promise<SerialOpenResult> {
    return requireDomain('serial').open(request);
  },

  /**
   * Write bytes to an open serial session.
   * @param sessionId  Runtime-assigned serial session id
   * @param data       Byte values to write
   * @returns Promise resolving after the runtime acknowledges the write
   */
  write(sessionId: string, data: Uint8Array | number[]): Promise<void> {
    return requireDomain('serial').write(sessionId, data);
  },

  /**
   * Close an open serial session.
   * @param sessionId  Runtime-assigned serial session id
   * @param reason     Optional reason for the close request
   * @returns Promise resolving after the runtime acknowledges the close
   */
  close(sessionId: string, reason?: string): Promise<void> {
    return requireDomain('serial').close(sessionId, reason);
  },

  /**
   * Register for shell-pushed serial events.
   * @param handler  Called with each serial event
   * @returns A Subscription with `close()` to stop listening
   */
  onEvent(handler: (event: SerialEvent) => void): Subscription {
    return requireDomain('serial').onEvent(handler);
  },
};

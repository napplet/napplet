import type {
  BleAttribute,
  BleEvent,
  BleOpenRequest,
  BleOpenResult,
  BleService,
  BleWriteOptions,
  Subscription,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Runtime-mediated Bluetooth LE/GATT sessions (NAP-BLE): ask the shell to
 * select a user-approved BLE device, expose opaque sessions and GATT
 * attributes, and receive shell-pushed state/notification/close events. The
 * shell owns chooser UI, permissions, device handles, lifecycle, and policy.
 *
 * @example
 * ```ts
 * import { ble } from '@napplet/sdk';
 *
 * const { session } = await ble.open({ acceptAllDevices: true });
 * const services = await ble.services(session.id);
 * ```
 */
export const ble: SdkDomain<'ble'> = {
  /**
   * Ask the runtime to select and open a BLE session.
   * @param request  Device selection and optional service request
   * @returns Promise resolving to the runtime-assigned BLE open result
   */
  open(request: BleOpenRequest): Promise<BleOpenResult> {
    return requireDomain('ble').open(request);
  },

  /**
   * List exposed GATT services for a session.
   * @param sessionId  Runtime-assigned BLE session id
   * @returns Promise resolving to exposed services
   */
  services(sessionId: string): Promise<BleService[]> {
    return requireDomain('ble').services(sessionId);
  },

  /**
   * Read a characteristic or descriptor value.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT attribute target
   * @returns Promise resolving to bytes
   */
  read(sessionId: string, target: BleAttribute): Promise<number[]> {
    return requireDomain('ble').read(sessionId, target);
  },

  /**
   * Write bytes to a characteristic or descriptor.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT attribute target
   * @param data       Byte values to write
   * @param options    Optional write mode preference
   * @returns Promise resolving after the runtime acknowledges the write
   */
  write(
    sessionId: string,
    target: BleAttribute,
    data: number[],
    options?: BleWriteOptions,
  ): Promise<void> {
    return requireDomain('ble').write(sessionId, target, data, options);
  },

  /**
   * Start notifications or indications for a characteristic.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT characteristic target
   */
  subscribe(sessionId: string, target: BleAttribute): Promise<void> {
    return requireDomain('ble').subscribe(sessionId, target);
  },

  /**
   * Stop notifications or indications for a characteristic.
   * @param sessionId  Runtime-assigned BLE session id
   * @param target     GATT characteristic target
   */
  unsubscribe(sessionId: string, target: BleAttribute): Promise<void> {
    return requireDomain('ble').unsubscribe(sessionId, target);
  },

  /**
   * Close an open BLE session.
   * @param sessionId  Runtime-assigned BLE session id
   * @param reason     Optional reason for the close request
   */
  close(sessionId: string, reason?: string): Promise<void> {
    return requireDomain('ble').close(sessionId, reason);
  },

  /**
   * Register for shell-pushed BLE events.
   * @param handler  Called with each BLE event
   * @returns A Subscription with `close()` to stop listening
   */
  onEvent(handler: (event: BleEvent) => void): Subscription {
    return requireDomain('ble').onEvent(handler);
  },
};

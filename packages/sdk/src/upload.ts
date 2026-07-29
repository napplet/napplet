import type {
  Subscription,
  UploadInfo,
  UploadRequest,
  UploadResult,
  UploadStatus,
} from '@napplet/core';
import { requireDomain } from './require-napplet.js';
import type { SdkDomain } from './sdk-domain.js';

/**
 * Shell-mediated file/blob upload (NAP-UPLOAD): hand the shell raw bytes plus
 * upload intent; the shell selects a server, signs the rail authorization
 * (NIP-98 for NIP-96, kind 24242 for Blossom), performs the HTTP upload, and
 * returns a stable URL plus NIP-94 integrity metadata. The shell owns consent,
 * policy, server selection, and signing.
 *
 * @example
 * ```ts
 * import { upload } from '@napplet/sdk';
 *
 * const result = await upload.upload({ data: blob, filename: 'pic.png' });
 * if (result.status === 'complete') attach(result.url, result.nip94);
 * ```
 */
export const upload: SdkDomain<'upload'> = {
  /**
   * Inspect upload rails and coarse runtime policy limits.
   * @returns Promise resolving to advisory upload info.
   */
  info(): Promise<UploadInfo> {
    return requireDomain('upload').info();
  },

  /**
   * Upload bytes through the shell's storage pipeline.
   * @param request  The upload request (Blob/ArrayBuffer bytes + intent)
   * @returns Promise resolving to the initial upload result
   */
  upload(request: UploadRequest): Promise<UploadResult> {
    return requireDomain('upload').upload(request);
  },

  /**
   * Get the latest known status for a prior upload.
   * @param uploadId  The shell-generated upload id
   * @returns Promise resolving to the latest status
   */
  status(uploadId: string): Promise<UploadStatus> {
    return requireDomain('upload').status(uploadId);
  },

  /**
   * Register for shell-pushed upload status updates.
   * @param handler  Called with each new UploadStatus
   * @returns A Subscription with `close()` to stop listening
   */
  onStatus(handler: (status: UploadStatus) => void): Subscription {
    return requireDomain('upload').onStatus(handler);
  },
};

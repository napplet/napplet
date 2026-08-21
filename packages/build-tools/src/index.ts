/** Public platform-neutral build-tool contracts. */

export { RedactedSecret } from "./contracts.ts";
export { createBuildSigner } from "./signer.ts";
export { createPlatformSecretStore } from "./secret-store.ts";
export { BUILD_SIGNER_SESSION_KEY, pairBuildSigner, reconnectBuildSigner } from "./terminal.ts";
export type {
  BuildSigner,
  BuildSignerServices,
  BuildSignerSession,
  Clock,
  FileSystemAdapter,
  Nip46Request,
  Nip46Response,
  ProcessAdapter,
  ProcessArgument,
  ProcessResult,
  RelayClient,
  RelayRequest,
  SafeLogger,
  SafeStatus,
  SecretStore,
  SignedEvent,
  TerminalAdapter,
  UnsignedEvent,
} from "./contracts.ts";
export type { PlatformSecretStoreOptions } from "./secret-store.ts";
export type {
  PairBuildSignerOptions,
  QrPairing,
  ReconnectBuildSignerOptions,
  StoredSessionIdentity,
} from "./terminal.ts";

/** Public platform-neutral build-tool contracts. */

export { RedactedSecret } from "./contracts.js";
export { createBuildSigner } from "./signer.js";
export { createPlatformSecretStore } from "./secret-store.js";
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
} from "./contracts.js";
export type { PlatformSecretStoreOptions } from "./secret-store.js";

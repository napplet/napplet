/**
 * @napplet/nub-config -- NUB-CONFIG message types and configuration type
 * aliases for the JSON envelope wire protocol.
 *
 * Per-napplet declarative configuration: napplet declares a JSON Schema
 * (typically at build time via @napplet/vite-plugin manifest tag, or at
 * runtime via config.registerSchema); shell renders settings UI, validates,
 * persists values scoped by (dTag, aggregateHash), and delivers live values
 * via snapshot + push. Shell is the sole writer.
 *
 * This package currently exports types only. Shim + SDK helpers are added
 * in a subsequent phase. Domain registration with @napplet/core dispatch
 * happens at core/shim/SDK integration time.
 *
 * @example
 * ```ts
 * import type {
 *   NappletConfigSchema,
 *   ConfigValues,
 *   ConfigValuesMessage,
 *   ConfigNubMessage,
 * } from '@napplet/nub-config';
 * import { DOMAIN } from '@napplet/nub-config';
 * ```
 *
 * @packageDocumentation
 */

export { DOMAIN } from './types.js';

// ─── Type Exports ──────────────────────────────────────────────────────────

export type {
  // Schema + values aliases
  NappletConfigSchema,
  ConfigSchema,
  ConfigValues,
  ConfigSchemaErrorCode,
  // Schema extension potentialities
  NappletConfigSchemaExtensions,
  // Base message type
  ConfigMessage,
  // Napplet -> Shell request messages
  ConfigRegisterSchemaMessage,
  ConfigGetMessage,
  ConfigSubscribeMessage,
  ConfigUnsubscribeMessage,
  ConfigOpenSettingsMessage,
  // Shell -> Napplet result / push messages
  ConfigRegisterSchemaResultMessage,
  ConfigValuesMessage,
  ConfigSchemaErrorMessage,
  // Discriminated unions
  ConfigRequestMessage,
  ConfigResultMessage,
  ConfigNubMessage,
} from './types.js';

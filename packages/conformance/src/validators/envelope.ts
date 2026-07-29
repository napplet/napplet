/**
 * @napplet/conformance -- Runtime envelope validators for the napplet wire protocol.
 *
 * @packageDocumentation
 */

export { ENVELOPE_SPECS } from './envelope-specs.js';
export { knownEnvelopeTypes, validateEnvelope } from './envelope-validation.js';
export type {
  EnvelopeDirection,
  EnvelopeError,
  EnvelopeSpec,
  EnvelopeVerdict,
  FieldKind,
} from './envelope-types.js';

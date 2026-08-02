import { NAP_DOMAINS } from '@napplet/core';
import { ENVELOPE_SPECS } from './envelope-specs.js';
import type {
  EnvelopeError,
  EnvelopeVerdict,
  FieldKind,
} from './envelope-types.js';

function kindOf(value: unknown): FieldKind | 'undefined' | 'null' {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  if (t === 'object') return 'object';
  return 'present';
}

function matchesKind(value: unknown, kind: FieldKind): boolean {
  if (kind === 'present') return value !== undefined && value !== null;
  return kindOf(value) === kind;
}

/** Validate the merged NAP-INTENT request shape. */
function validateIntentInvokeRequest(request: unknown, errors: EnvelopeError[]): void {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return;

  const intent = request as Record<string, unknown>;
  if (typeof intent.archetype !== 'string') {
    errors.push({
      code: intent.archetype === undefined ? 'missing-field' : 'wrong-type',
      message: 'Intent request requires a string "archetype" field',
      field: 'request.archetype',
    });
  }
  for (const field of ['action', 'convention'] as const) {
    if (intent[field] !== undefined && typeof intent[field] !== 'string') {
      errors.push({
        code: 'wrong-type',
        message: `Intent request field "${field}" must be a string`,
        field: `request.${field}`,
      });
    }
  }

  if ('sender' in intent) {
    errors.push({
      code: 'forbidden-field',
      message: 'Intent request does not define a caller-supplied sender field',
      field: 'request.sender',
    });
  }
}

/**
 * Validate a single postMessage envelope as if emitted by a napplet.
 *
 * Returns `ok: true` only when the message is an object with a known `domain.action`
 * `type` whose spec is **outbound** and whose required fields are present with the
 * right primitive kinds. Emitting an inbound (shell→napplet) type, an unknown type,
 * or a type in an unknown domain all fail — that is the point: it catches napplets
 * that put malformed or illegal traffic on the wire.
 *
 * @param message - The raw `MessageEvent.data` value the napplet posted.
 * @returns A structured {@link EnvelopeVerdict}.
 *
 * @example
 * ```ts
 * validateEnvelope({ type: 'relay.subscribe', id: 'a', subId: 'b', filters: [{}] }).ok; // true
 * validateEnvelope({ type: 'relay.subscribe', id: 'a' }).ok; // false (missing subId, filters)
 * validateEnvelope({ type: 'relay.event', subId: 'b' }).ok;  // false (inbound type emitted)
 * ```
 */
export function validateEnvelope(message: unknown): EnvelopeVerdict {
  const errors: EnvelopeError[] = [];

  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return { ok: false, errors: [{ code: 'not-an-object', message: 'Envelope must be a non-null object' }] };
  }

  const record = message as Record<string, unknown>;
  const type = record['type'];
  if (typeof type !== 'string') {
    return { ok: false, errors: [{ code: 'missing-type', message: 'Envelope is missing a string `type` field' }] };
  }

  const dotIndex = type.indexOf('.');
  if (dotIndex <= 0) {
    return { ok: false, type, errors: [{ code: 'malformed-type', message: `Envelope type "${type}" is not in domain.action form` }] };
  }

  const domain = type.slice(0, dotIndex);
  const isKnownDomain = (NAP_DOMAINS as readonly string[]).includes(domain);
  if (!isKnownDomain) {
    return { ok: false, type, domain, errors: [{ code: 'unknown-domain', message: `"${domain}" is not a known NAP domain` }] };
  }

  const spec = ENVELOPE_SPECS[type];
  if (!spec) {
    return { ok: false, type, domain, errors: [{ code: 'unknown-type', message: `"${type}" is not a known ${domain} message type` }] };
  }

  for (const [field, kind] of Object.entries(spec.fields ?? {})) {
    if (!(field in record) || record[field] === undefined) {
      errors.push({ code: 'missing-field', message: `Required field "${field}" is missing`, field });
      continue;
    }
    if (!matchesKind(record[field], kind)) {
      errors.push({
        code: 'wrong-type',
        message: `Field "${field}" should be ${kind} but is ${kindOf(record[field])}`,
        field,
      });
    }
  }

  if (spec.dir === 'in') {
    return {
      ok: false,
      type,
      domain,
      direction: 'in',
      errors: [
        { code: 'inbound-type-emitted', message: `"${type}" is a shell→napplet message; a napplet must not emit it` },
        ...errors,
      ],
    };
  }

  for (const field of spec.forbiddenFields ?? []) {
    if (field in record) {
      errors.push({
        code: 'forbidden-field',
        message: `Field "${field}" must be runtime-derived and cannot be emitted by a napplet`,
        field,
      });
    }
  }

  if (type === 'intent.invoke') {
    validateIntentInvokeRequest(record.request, errors);
  }

  return { ok: errors.length === 0, type, domain, direction: 'out', errors };
}

/** Every envelope `type` known to the validator. */
export function knownEnvelopeTypes(): string[] {
  return Object.keys(ENVELOPE_SPECS);
}

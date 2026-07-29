import {
  REFERENCE_CONVENTION,
  REFERENCE_HANDLER,
  ok,
} from './reference-responses.js';

export interface IntentHandlers {
  handleInvoke(endpoint: { dTag: string }, env: Record<string, unknown>): unknown[];
  availability(archetype: unknown): Record<string, unknown>;
}

function unavailableIntent(
  id: unknown,
  archetype: string,
  action: string,
  error: string,
): unknown[] {
  return ok({
    type: 'intent.invoke.result',
    id,
    result: { ok: false, archetype, action, handled: false, error },
  });
}

export function createIntentHandlers(): IntentHandlers {
  return { handleInvoke, availability };
}

function handleInvoke(_endpoint: { dTag: string }, env: Record<string, unknown>): unknown[] {
  const request = env.request;
  if (typeof request !== 'object' || request === null || Array.isArray(request)) {
    return unavailableIntent(env.id, '', 'open', 'invalid intent request');
  }

  const intent = request as Record<string, unknown>;
  const archetype = typeof intent.archetype === 'string' ? intent.archetype : '';
  const action = typeof intent.action === 'string' ? intent.action : 'open';
  if (!archetype) {
    return unavailableIntent(env.id, archetype, action, 'intent request requires an archetype');
  }
  if (archetype !== 'note') return unavailableIntent(env.id, archetype, action, 'no handler');
  if (intent.convention !== undefined && intent.convention !== REFERENCE_CONVENTION) {
    return unavailableIntent(env.id, archetype, action, 'unsupported convention');
  }

  return ok({
    type: 'intent.invoke.result',
    id: env.id,
    result: {
      ok: true,
      archetype,
      action,
      handled: true,
      handler: REFERENCE_HANDLER,
      windowId: 'reference-window',
      convention: typeof intent.convention === 'string' ? intent.convention : REFERENCE_CONVENTION,
    },
  });
}

function availability(archetype: unknown): Record<string, unknown> {
  if (archetype !== 'note') {
    return { archetype, available: false, candidates: [], hasDefault: false };
  }
  return {
    archetype,
    available: true,
    candidates: [{
      dTag: REFERENCE_HANDLER,
      actions: ['open'],
      conventions: [REFERENCE_CONVENTION],
      isDefault: true,
    }],
    hasDefault: true,
  };
}

import { describe, expect, it } from 'vitest';
import type {
  IntentBehavior,
  IntentCandidate,
  IntentOpenOptions,
  IntentRequest,
  IntentResult,
} from './index.js';

describe('NAP-INTENT public contract', () => {
  it('models the merged archetype request and open options', () => {
    const behavior: IntentBehavior = {
      focus: true,
      newWindow: true,
      reuse: false,
    };
    const options: IntentOpenOptions = {
      convention: 'napplet:profile/open',
      handler: 'default',
      behavior,
    };
    const request: IntentRequest = {
      archetype: 'profile',
      payload: { pubkey: 'abc123' },
      ...options,
    };
    const candidate: IntentCandidate = {
      dTag: 'profile-viewer',
      actions: ['open'],
      conventions: ['napplet:profile/open'],
    };

    expect(request.action).toBeUndefined();
    expect(request.behavior?.newWindow).toBe(true);
    expect(candidate.conventions).toEqual(['napplet:profile/open']);
  });

  it('requires canonical result identity and handling state', () => {
    const accepted: IntentResult = {
      ok: true,
      archetype: 'profile',
      action: 'open',
      handled: true,
      handler: 'profile-viewer',
      windowId: 'window-1',
      convention: 'napplet:profile/open',
    };
    const rejected: IntentResult = {
      ok: false,
      archetype: 'profile',
      action: 'open',
      handled: false,
      error: 'no handler',
    };

    expect(accepted.handled).toBe(true);
    expect(rejected.handled).toBe(false);
  });

  it('keeps archetype and convention orthogonal', () => {
    const request: IntentRequest = {
      archetype: 'viewer',
      convention: 'napplet:profile/open',
    };

    expect(request.archetype).toBe('viewer');
    expect(request.convention).toBe('napplet:profile/open');
  });
});

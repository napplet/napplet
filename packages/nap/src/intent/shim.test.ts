import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  IntentCandidate as CoreIntentCandidate,
  IntentOpenOptions as CoreIntentOpenOptions,
  IntentRequest as CoreIntentRequest,
  IntentResult as CoreIntentResult,
} from '@napplet/core';
import type {
  IntentCandidate,
  IntentOpenOptions,
  IntentRequest,
  IntentResult,
} from './types.js';

const coreRequest: CoreIntentRequest = {
  archetype: 'note',
  convention: 'napplet:note/open',
  payload: { id: 'abc' },
};
const napRequest: IntentRequest = coreRequest;
const coreOptions: CoreIntentOpenOptions = {
  convention: 'napplet:note/open',
  behavior: { focus: true, newWindow: true },
};
const napOptions: IntentOpenOptions = coreOptions;
const coreResult: CoreIntentResult = {
  ok: true,
  archetype: 'note',
  action: 'open',
  handled: true,
  handler: 'noteview',
  convention: 'napplet:note/open',
};
const napResult: IntentResult = coreResult;
const coreCandidate: CoreIntentCandidate = {
  dTag: 'noteview',
  actions: ['open'],
  conventions: ['napplet:note/open'],
};
const napCandidate: IntentCandidate = coreCandidate;

void napRequest;
void napOptions;
void napResult;
void napCandidate;

interface PostedMessage {
  msg: Record<string, unknown>;
  targetOrigin: string;
}

let postedMessages: PostedMessage[];
let uuidCounter: number;
let originalCryptoDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  postedMessages = [];
  uuidCounter = 0;
  originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `intent-test-${++uuidCounter}` },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      parent: {
        postMessage(msg: Record<string, unknown>, targetOrigin: string) {
          postedMessages.push({ msg, targetOrigin });
        },
      },
    },
  });
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalCryptoDescriptor) {
    Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'crypto');
  }
  Reflect.deleteProperty(globalThis, 'window');
});

function lastPosted(type: string): Record<string, unknown> {
  for (let index = postedMessages.length - 1; index >= 0; index -= 1) {
    if (postedMessages[index].msg.type === type) return postedMessages[index].msg;
  }
  throw new Error(`no posted message of type ${type}`);
}

describe('@napplet/nap/intent shim', () => {
  it('posts the caller-provided archetype request unchanged', async () => {
    const { handleIntentMessage, invoke } = await import('./shim.js');
    const request: IntentRequest = {
      archetype: 'viewer',
      action: 'edit',
      convention: 'napplet:profile/open',
      payload: { pubkey: 'abc123' },
      behavior: { focus: true, newWindow: true },
    };

    const promise = invoke(request);
    const sent = lastPosted('intent.invoke');
    expect(sent.request).toEqual(request);

    handleIntentMessage({
      type: 'intent.invoke.result',
      id: sent.id,
      result: {
        ok: true,
        archetype: 'viewer',
        action: 'edit',
        handled: true,
        handler: 'profile-viewer',
        windowId: 'window-1',
        convention: 'napplet:profile/open',
      },
    });

    await expect(promise).resolves.toMatchObject({
      ok: true,
      handled: true,
      windowId: 'window-1',
    });
  });

  it('implements open as action-open sugar with canonical options', async () => {
    const { handleIntentMessage, open } = await import('./shim.js');
    const payload = { seed: ['🤙'] };
    const promise = open('emoji-list', payload, {
      convention: 'napplet:emoji-list/open',
      behavior: { focus: true, newWindow: true },
    });
    const sent = lastPosted('intent.invoke');
    expect(sent.request).toEqual({
      archetype: 'emoji-list',
      action: 'open',
      payload,
      convention: 'napplet:emoji-list/open',
      behavior: { focus: true, newWindow: true },
    });

    handleIntentMessage({
      type: 'intent.invoke.result',
      id: sent.id,
      result: {
        ok: false,
        archetype: 'emoji-list',
        action: 'open',
        handled: false,
        error: 'no handler',
      },
    });

    await expect(promise).resolves.toMatchObject({
      ok: false,
      handled: false,
      error: 'no handler',
    });
  });

  it('rejects a top-level invoke error', async () => {
    const { handleIntentMessage, invoke } = await import('./shim.js');
    const promise = invoke({ archetype: 'note' });
    const sent = lastPosted('intent.invoke');
    handleIntentMessage({
      type: 'intent.invoke.result',
      id: sent.id,
      error: 'invoke failed',
    });

    await expect(promise).rejects.toThrow('invoke failed');
  });

  it('resolves availability and handler catalog responses', async () => {
    const { available, handleIntentMessage, handlers } = await import('./shim.js');
    const availablePromise = available('note');
    const availableMessage = lastPosted('intent.available');
    const availability = {
      archetype: 'note',
      available: true,
      candidates: [{
        dTag: 'noteview',
        actions: ['open'],
        conventions: ['napplet:note/open'],
      }],
      hasDefault: true,
    };
    handleIntentMessage({
      type: 'intent.available.result',
      id: availableMessage.id,
      availability,
    });
    await expect(availablePromise).resolves.toEqual(availability);

    const handlersPromise = handlers();
    const handlersMessage = lastPosted('intent.handlers');
    handleIntentMessage({
      type: 'intent.handlers.result',
      id: handlersMessage.id,
      handlers: [availability],
    });
    await expect(handlersPromise).resolves.toEqual([availability]);
  });

  it('subscribes to availability changes and ignores retired draft delivery messages', async () => {
    const { handleIntentMessage, onChanged } = await import('./shim.js');
    const callback = vi.fn();
    const subscription = onChanged(callback);
    const availability = {
      archetype: 'note',
      available: true,
      candidates: [],
      hasDefault: false,
    };

    handleIntentMessage({ type: 'intent.changed', availability });
    handleIntentMessage({
      type: 'intent.deliver',
      delivery: { sender: 'invented' },
    });
    expect(callback).toHaveBeenCalledOnce();

    subscription.close();
    handleIntentMessage({ type: 'intent.changed', availability });
    expect(callback).toHaveBeenCalledOnce();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  installNappletRuntimePrelude,
  registerNappletRuntimeExtension,
  renderNappletRuntimePreludeCall,
  renderNappletRuntimePreludeScript,
} from './prelude.js';

beforeEach(() => {
  delete (window as Window & { napplet?: unknown }).napplet;
});

describe('@napplet/shim/prelude', () => {
  it('requires an explicit domain allowlist', () => {
    const install = installNappletRuntimePrelude as (options?: unknown) => unknown;

    expect(() => install()).toThrow('explicit domains array');
  });

  it('installs only requested callable domain objects', () => {
    const installed = installNappletRuntimePrelude({ domains: ['identity', 'storage'] });

    expect(installed.identity?.getPublicKey).toEqual(expect.any(Function));
    expect(installed.storage?.getItem).toEqual(expect.any(Function));
    expect(installed.relay).toBeUndefined();
    expect(installed.inc).toBeUndefined();
    expect((window as Window & { napplet?: typeof installed }).napplet).toBe(installed);
  });

  it('preserves custom domains in rendered activation calls', () => {
    const call = renderNappletRuntimePreludeCall({
      domains: ['identity', 'foo', 'storage'],
    });

    expect(call).toBe(
      'globalThis.NappletShimPrelude.install({"domains":["identity","foo","storage"]});',
    );
  });

  it('installs pre-registered custom domains', () => {
    const api = { ping: () => 'pong' };
    registerNappletRuntimeExtension({ domain: 'foo', api });

    const installed = installNappletRuntimePrelude({ domains: ['foo'] }) as unknown as { foo?: typeof api };

    expect(installed.foo).toBe(api);
    expect(installed.foo?.ping()).toBe('pong');
  });

  it('renders a script tag for the IIFE activation call', () => {
    expect(renderNappletRuntimePreludeScript({ domains: ['identity'] })).toBe(
      '<script>globalThis.NappletShimPrelude.install({"domains":["identity"]});</script>',
    );
  });
});

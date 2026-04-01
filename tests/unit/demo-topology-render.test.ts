import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDemoTopology, renderDemoTopology } from '../../apps/demo/src/topology.ts';
import type { SignerConnectionStateView } from '../../apps/demo/src/topology.ts';

describe('demo topology render output', () => {
  const topology = buildDemoTopology({
    hostPubkey: 'demo-host-pubkey',
    napplets: [
      {
        name: 'chat',
        label: 'chat',
        statusId: 'chat-status',
        aclId: 'chat-acl',
        frameContainerId: 'chat-frame-container',
      },
      {
        name: 'bot',
        label: 'bot',
        statusId: 'bot-status',
        aclId: 'bot-acl',
        frameContainerId: 'bot-frame-container',
      },
    ],
    services: ['signer'],
  });

  it('renders distinct napplet, shell, acl, runtime, and service regions', () => {
    const markup = renderDemoTopology(topology);

    expect(markup).toContain('topology-napplets');
    expect(markup).toContain('topology-node-shell');
    expect(markup).toContain('topology-node-acl');
    expect(markup).toContain('topology-node-runtime');
    expect(markup).toContain('topology-services');
    expect(markup).toContain('topology-node-service-signer');
    expect(markup).not.toContain('shell / acl');
  });

  it('keeps shell, acl, and runtime labels separate in the rendered architecture markup', () => {
    const markup = renderDemoTopology(topology);

    expect(markup).toContain('>shell<');
    expect(markup).toContain('>acl<');
    expect(markup).toContain('>runtime<');
    expect(markup).not.toContain('rotate(90deg)');
  });

  it('replaces the old merged label and preserves the bottom debugger shell in index.html', () => {
    const html = readFileSync(resolve(process.cwd(), 'apps/demo/index.html'), 'utf8');

    expect(html).not.toContain('shell / acl');
    expect(html).not.toContain('rotate(90deg)');
    expect(html).toContain('id="flow-area"');
    expect(html).toContain('id="debugger-section"');
  });
});

describe('signer node rendering states', () => {
  const baseInput = {
    hostPubkey: 'demo-host-pubkey',
    napplets: [
      {
        name: 'chat',
        label: 'chat',
        statusId: 'chat-status',
        aclId: 'chat-acl',
        frameContainerId: 'chat-frame-container',
      },
    ],
    services: ['signer'],
  };

  it('renders "not connected" state when no signerState is provided', () => {
    const topology = buildDemoTopology(baseInput);
    const markup = renderDemoTopology(topology);

    expect(markup).toContain('signer-status-disconnected');
    expect(markup).toContain('not connected');
    expect(markup).toContain('data-action="open-signer-connect"');
    expect(markup).toContain('Connect Signer');
  });

  it('renders "not connected" state when method is "none"', () => {
    const signerState: SignerConnectionStateView = {
      method: 'none',
      pubkey: null,
      relay: null,
      recentRequests: [],
      isConnecting: false,
      error: null,
    };
    const topology = buildDemoTopology({ ...baseInput, signerState });
    const markup = renderDemoTopology(topology);

    expect(markup).toContain('signer-status-disconnected');
    expect(markup).toContain('Connect Signer');
  });

  it('renders error text when signerState has an error and method is "none"', () => {
    const signerState: SignerConnectionStateView = {
      method: 'none',
      pubkey: null,
      relay: null,
      recentRequests: [],
      isConnecting: false,
      error: 'No NIP-07 extension detected',
    };
    const topology = buildDemoTopology({ ...baseInput, signerState });
    const markup = renderDemoTopology(topology);

    expect(markup).toContain('signer-status-error');
    expect(markup).toContain('No NIP-07 extension detected');
  });

  it('renders connected NIP-07 state with method badge and truncated pubkey', () => {
    const pubkey = 'abcdef12'.repeat(8); // 64-char hex pubkey
    const signerState: SignerConnectionStateView = {
      method: 'nip07',
      pubkey,
      relay: null,
      recentRequests: [],
      isConnecting: false,
      error: null,
    };
    const topology = buildDemoTopology({ ...baseInput, signerState });
    const markup = renderDemoTopology(topology);

    expect(markup).toContain('signer-status-connected');
    expect(markup).toContain('nip-07');
    expect(markup).toContain('abcdef12'); // truncated prefix
    expect(markup).not.toContain('nip-46');
    expect(markup).toContain('data-action="disconnect-signer"');
  });

  it('renders connected NIP-46 state with relay shown', () => {
    const pubkey = '12345678'.repeat(8);
    const relay = 'wss://relay.nsec.app';
    const signerState: SignerConnectionStateView = {
      method: 'nip46',
      pubkey,
      relay,
      recentRequests: [],
      isConnecting: false,
      error: null,
    };
    const topology = buildDemoTopology({ ...baseInput, signerState });
    const markup = renderDemoTopology(topology);

    expect(markup).toContain('nip-46');
    expect(markup).toContain(relay);
    expect(markup).not.toContain('nip-07');
  });

  it('renders the signer connect modal in index.html', () => {
    const html = readFileSync(resolve(process.cwd(), 'apps/demo/index.html'), 'utf8');

    expect(html).toContain('id="signer-connect-modal"');
    expect(html).toContain('data-action="close-signer-modal"');
    expect(html).toContain('id="nip07-connect-btn"');
    expect(html).toContain('id="nip46-connect-btn"');
    expect(html).toContain('id="nip46-relay-input"');
    expect(html).toContain('id="nip46-bunker-uri-input"');
    expect(html).toContain('id="nip46-qr-container"');
  });
});

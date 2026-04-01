import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDemoTopology, renderDemoTopology } from '../../apps/demo/src/topology.ts';

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

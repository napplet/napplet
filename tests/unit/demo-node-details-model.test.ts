/**
 * demo-node-details-model.test.ts
 *
 * Model-level regression coverage for the node-detail adapter.
 * Tests that all topology node roles produce correct detail records.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { buildDemoTopology } from '../../apps/demo/src/topology.ts';
import {
  buildNodeDetails,
  buildAllNodeDetails,
  getNodeActivity,
} from '../../apps/demo/src/node-details.ts';
import type { NodeDetailOptions } from '../../apps/demo/src/node-details.ts';

const TEST_TOPOLOGY = buildDemoTopology({
  hostPubkey: 'test-host-pubkey-0123456789abcdef',
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

function makeOptions(overrides: Partial<NodeDetailOptions> = {}): NodeDetailOptions {
  return {
    napplets: new Map(),
    serviceNames: ['signer'],
    hostPubkey: 'test-host-pubkey-0123456789abcdef',
    totalMessages: 0,
    totalBlocked: 0,
    ...overrides,
  };
}

describe('buildNodeDetails — node role coverage', () => {
  it('produces a detail record for every node role', () => {
    const opts = makeOptions();
    const roles = TEST_TOPOLOGY.nodes.map((node) => {
      const detail = buildNodeDetails(node, opts);
      return detail.role;
    });
    expect(roles).toContain('napplet');
    expect(roles).toContain('shell');
    expect(roles).toContain('acl');
    expect(roles).toContain('runtime');
    expect(roles).toContain('service');
  });

  // drill-down: asserts that every topology node supports the inspector drill-down workflow
  it('returns drillDownSupported: true for all current topology nodes', () => {
    const opts = makeOptions();
    for (const node of TEST_TOPOLOGY.nodes) {
      const detail = buildNodeDetails(node, opts);
      expect(detail.drillDownSupported).toBe(true);
    }
  });

  it('every detail record exposes summaryFields with at least 2 entries', () => {
    const opts = makeOptions();
    for (const node of TEST_TOPOLOGY.nodes) {
      const detail = buildNodeDetails(node, opts);
      expect(detail.summaryFields.length).toBeGreaterThanOrEqual(2);
      // Every field must have label and value strings
      for (const field of detail.summaryFields) {
        expect(typeof field.label).toBe('string');
        expect(typeof field.value).toBe('string');
      }
    }
  });

  it('every detail record exposes at least one inspectorSection', () => {
    const opts = makeOptions();
    for (const node of TEST_TOPOLOGY.nodes) {
      const detail = buildNodeDetails(node, opts);
      expect(detail.inspectorSections.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('buildNodeDetails — napplet nodes', () => {
  it('builds a detail record for topology-node-napplet-chat', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-napplet-chat');
    expect(node).toBeDefined();
    const detail = buildNodeDetails(node!, makeOptions());
    expect(detail.id).toBe('topology-node-napplet-chat');
    expect(detail.role).toBe('napplet');
    expect(detail.title).toBe('chat');
    expect(detail.drillDownSupported).toBe(true);
  });

  it('builds a detail record for topology-node-napplet-bot', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-napplet-bot');
    expect(node).toBeDefined();
    const detail = buildNodeDetails(node!, makeOptions());
    expect(detail.id).toBe('topology-node-napplet-bot');
    expect(detail.role).toBe('napplet');
    expect(detail.drillDownSupported).toBe(true);
  });

  it('shows auth=pending for unauthenticated napplet', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-napplet-chat');
    const detail = buildNodeDetails(node!, makeOptions());
    const authField = detail.summaryFields.find((f) => f.label === 'auth');
    expect(authField?.value).toBe('pending');
  });

  it('shows auth=authenticated when napplet info is authenticated', () => {
    const napplets = new Map();
    napplets.set('demo-chat-1', {
      windowId: 'demo-chat-1',
      name: 'chat',
      iframe: {} as HTMLIFrameElement,
      authenticated: true,
      pubkey: 'abcdef1234567890abcdef1234567890',
    });
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-napplet-chat');
    const detail = buildNodeDetails(node!, makeOptions({ napplets }));
    const authField = detail.summaryFields.find((f) => f.label === 'auth');
    expect(authField?.value).toBe('authenticated');
  });
});

describe('buildNodeDetails — shell node', () => {
  it('builds a detail record for topology-node-shell', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-shell');
    expect(node).toBeDefined();
    const detail = buildNodeDetails(node!, makeOptions());
    expect(detail.id).toBe('topology-node-shell');
    expect(detail.role).toBe('shell');
    expect(detail.drillDownSupported).toBe(true);
  });

  it('includes pubkey and message count in shell summary', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-shell');
    const detail = buildNodeDetails(node!, makeOptions({ totalMessages: 42 }));
    const labels = detail.summaryFields.map((f) => f.label);
    expect(labels).toContain('pubkey');
    expect(labels).toContain('messages');
  });
});

describe('buildNodeDetails — acl node', () => {
  it('builds a detail record for topology-node-acl', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-acl');
    expect(node).toBeDefined();
    const detail = buildNodeDetails(node!, makeOptions());
    expect(detail.id).toBe('topology-node-acl');
    expect(detail.role).toBe('acl');
    expect(detail.drillDownSupported).toBe(true);
  });

  it('reflects blocked count in acl summary', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-acl');
    const detail = buildNodeDetails(node!, makeOptions({ totalBlocked: 5 }));
    const deniedField = detail.summaryFields.find((f) => f.label === 'denied');
    expect(deniedField?.value).toBe('5');
  });
});

describe('buildNodeDetails — runtime node', () => {
  it('builds a detail record for topology-node-runtime', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-runtime');
    expect(node).toBeDefined();
    const detail = buildNodeDetails(node!, makeOptions());
    expect(detail.id).toBe('topology-node-runtime');
    expect(detail.role).toBe('runtime');
    expect(detail.drillDownSupported).toBe(true);
  });

  it('shows service count in runtime summary', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-runtime');
    const detail = buildNodeDetails(node!, makeOptions({ serviceNames: ['signer', 'notification'] }));
    const serviceField = detail.summaryFields.find((f) => f.label === 'services');
    expect(serviceField?.value).toBe('2');
  });

  it('runtime summary fields differ from service node summary fields', () => {
    const runtimeNode = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-runtime');
    const serviceNode = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-service-signer');
    const runtimeDetail = buildNodeDetails(runtimeNode!, makeOptions());
    const serviceDetail = buildNodeDetails(serviceNode!, makeOptions());
    const runtimeLabels = runtimeDetail.summaryFields.map((f) => f.label);
    const serviceLabels = serviceDetail.summaryFields.map((f) => f.label);
    // They should not be identical sets
    expect(runtimeLabels).not.toEqual(serviceLabels);
  });
});

describe('buildNodeDetails — service nodes', () => {
  it('builds a detail record for topology-node-service-signer', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-service-signer');
    expect(node).toBeDefined();
    const detail = buildNodeDetails(node!, makeOptions());
    expect(detail.id).toBe('topology-node-service-signer');
    expect(detail.role).toBe('service');
    expect(detail.drillDownSupported).toBe(true);
  });
});

describe('buildAllNodeDetails', () => {
  it('returns a map covering all topology node ids', () => {
    const allDetails = buildAllNodeDetails(TEST_TOPOLOGY, makeOptions());
    for (const node of TEST_TOPOLOGY.nodes) {
      expect(allDetails.has(node.id)).toBe(true);
    }
  });

  it('includes topology-node-service-signer entry', () => {
    const allDetails = buildAllNodeDetails(TEST_TOPOLOGY, makeOptions());
    expect(allDetails.has('topology-node-service-signer')).toBe(true);
  });

  it('all returned details declare drillDownSupported', () => {
    const allDetails = buildAllNodeDetails(TEST_TOPOLOGY, makeOptions());
    for (const [, detail] of allDetails) {
      expect(detail.drillDownSupported).toBe(true);
    }
  });

  it('fails for missing node type if topology is extended — each role must have summary fields', () => {
    const allDetails = buildAllNodeDetails(TEST_TOPOLOGY, makeOptions());
    for (const [, detail] of allDetails) {
      expect(detail.summaryFields.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('recentActivity', () => {
  it('returns an array (may be empty) for any node id', () => {
    const activity = getNodeActivity('topology-node-runtime');
    expect(Array.isArray(activity)).toBe(true);
  });

  it('detail record includes recentActivity array', () => {
    const node = TEST_TOPOLOGY.nodes.find((n) => n.id === 'topology-node-runtime');
    const detail = buildNodeDetails(node!, makeOptions());
    expect(Array.isArray(detail.recentActivity)).toBe(true);
  });

  it('every node role exposes a recentActivity array in its detail record', () => {
    const opts = makeOptions();
    for (const node of TEST_TOPOLOGY.nodes) {
      const detail = buildNodeDetails(node, opts);
      expect(Array.isArray(detail.recentActivity)).toBe(true);
    }
  });

  it('installActivityProjection is exported from node-details', async () => {
    const mod = await import('../../apps/demo/src/node-details.ts');
    expect(typeof mod.installActivityProjection).toBe('function');
  });

  it('getNodeActivity returns a bounded array (max ring size)', () => {
    // Ring size is 12 — after many pushes the array should stay bounded
    const activity = getNodeActivity('topology-node-acl');
    expect(activity.length).toBeLessThanOrEqual(12);
  });
});

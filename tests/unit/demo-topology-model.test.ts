import { describe, expect, it } from 'vitest';
import {
  buildDemoTopology,
  getAclNodeId,
  getRuntimeNodeId,
  getServiceNodeId,
  getShellNodeId,
} from '../../apps/demo/src/topology.ts';

describe('demo topology model', () => {
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

  it('includes the required shell, acl, runtime, napplet, and service node ids', () => {
    const nodeIds = topology.nodes.map((node) => node.id);

    expect(nodeIds).toContain('topology-node-shell');
    expect(nodeIds).toContain('topology-node-acl');
    expect(nodeIds).toContain('topology-node-runtime');
    expect(nodeIds).toContain('topology-node-napplet-chat');
    expect(nodeIds).toContain('topology-node-napplet-bot');
    expect(nodeIds).toContain('topology-node-service-signer');
  });

  it('keeps acl and runtime distinct while making runtime the direct parent of services', () => {
    const aclNode = topology.nodes.find((node) => node.id === getAclNodeId());
    const runtimeNode = topology.nodes.find((node) => node.id === getRuntimeNodeId());
    const signerNode = topology.nodes.find((node) => node.id === getServiceNodeId('signer'));

    expect(aclNode?.id).toBe('topology-node-acl');
    expect(runtimeNode?.parentId).toBe('topology-node-acl');
    expect(runtimeNode?.parentId).not.toBe(getShellNodeId());
    expect(signerNode?.parentId).toBe('topology-node-runtime');
    expect(topology.nodes.filter((node) => node.role === 'napplet').every((node) => node.parentId === null)).toBe(true);
  });

  it('exposes topology ids for animation paths including signer traffic', () => {
    const edgeIds = topology.edges.map((edge) => edge.id);

    expect(edgeIds).toContain('topology-edge-shell-acl');
    expect(edgeIds).toContain('topology-edge-acl-runtime');
    expect(edgeIds).toContain('topology-edge-runtime-service-signer');
    expect(getServiceNodeId('signer')).toBe('topology-node-service-signer');
  });
});

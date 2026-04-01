import { describe, expect, it } from 'vitest';
import { DEMO_CAPABILITY_LABELS } from '../../apps/demo/src/acl-panel.ts';
import {
  DEMO_PROTOCOL_PATH_INDEX,
  DEMO_PROTOCOL_PATHS,
  DEMO_SIGNER_MODE,
  getDemoHostAuditSummary,
} from '../../apps/demo/src/shell-host.ts';

describe('demo host audit metadata', () => {
  it('exports the expected audited protocol paths and capabilities', () => {
    expect(DEMO_PROTOCOL_PATHS.map((entry) => entry.path)).toEqual([
      'auth',
      'relay-publish',
      'relay-subscribe',
      'inter-pane-send',
      'inter-pane-receive',
      'state-read',
      'state-write',
      'signer-request',
      'signer-response',
    ]);

    expect(DEMO_PROTOCOL_PATH_INDEX['relay-publish'].capability).toBe('relay:write');
    expect(DEMO_PROTOCOL_PATH_INDEX['relay-subscribe'].capability).toBe('relay:read');
    expect(DEMO_PROTOCOL_PATH_INDEX['inter-pane-send'].capability).toBe('relay:write');
    expect(DEMO_PROTOCOL_PATH_INDEX['inter-pane-receive'].capability).toBe('relay:read');
    expect(DEMO_PROTOCOL_PATH_INDEX['state-read'].capability).toBe('state:read');
    expect(DEMO_PROTOCOL_PATH_INDEX['state-write'].capability).toBe('state:write');
    expect(DEMO_PROTOCOL_PATH_INDEX['signer-request'].capability).toBe('sign:event');
  });

  it('makes signer mode explicit instead of leaving runtime behavior implicit', () => {
    expect(DEMO_SIGNER_MODE === 'service' || DEMO_SIGNER_MODE === 'fallback').toBe(true);
  });

  it('summarizes audited paths for the demo boot flow', () => {
    const summary = getDemoHostAuditSummary();
    expect(summary).toContain('signer mode: service');
    expect(summary).toContain('relay-publish:relay:write');
    expect(summary).toContain('inter-pane-send:relay:write');
    expect(summary).toContain('state-read:state:read');
    expect(summary).toContain('signer-request:sign:event');
  });

  it('exports the corrected ACL wording and debugger path labels', async () => {
    class TestElement {}
    Object.assign(globalThis, {
      HTMLElement: TestElement,
      customElements: { define: () => undefined },
    });
    const { DEBUGGER_PATH_LABELS } = await import('../../apps/demo/src/debugger.ts');

    expect(DEMO_CAPABILITY_LABELS['relay:write']).toBe('Relay Publish / Inter-Pane Send');
    expect(DEMO_CAPABILITY_LABELS['relay:read']).toBe('Relay Subscribe');
    expect(DEMO_CAPABILITY_LABELS['sign:event']).toBe('Signer Requests');
    expect(DEMO_CAPABILITY_LABELS['state:read']).toBe('State Read');
    expect(DEMO_CAPABILITY_LABELS['state:write']).toBe('State Write');

    expect(DEBUGGER_PATH_LABELS).toContain('relay-publish');
    expect(DEBUGGER_PATH_LABELS).toContain('inter-pane-send');
    expect(DEBUGGER_PATH_LABELS).toContain('state-read');
    expect(DEBUGGER_PATH_LABELS).toContain('state-write');
    expect(DEBUGGER_PATH_LABELS).toContain('signer-request');
    expect(Object.values(DEMO_CAPABILITY_LABELS)).not.toContain('Read Shell');
    expect(Object.values(DEMO_CAPABILITY_LABELS)).not.toContain('Write Shell');
  });
});

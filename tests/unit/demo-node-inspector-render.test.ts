/**
 * demo-node-inspector-render.test.ts
 *
 * Render-level regression coverage for the node-inspector layout and
 * selected-node interaction model.
 *
 * Tests protect layout invariants:
 * - upper workspace has a dedicated right-side inspector region
 * - debugger-section is a separate bottom region, never inside inspector
 * - selection hooks exist for all topology node roles
 * - inspector topology markup can represent both no-selection and selected states
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDemoTopology, renderDemoTopology } from '../../apps/demo/src/topology.ts';

const HTML_PATH = resolve(process.cwd(), 'apps/demo/index.html');

function loadHtml(): string {
  return readFileSync(HTML_PATH, 'utf8');
}

const TEST_TOPOLOGY = buildDemoTopology({
  hostPubkey: 'test-host-pubkey-render',
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

describe('index.html layout invariants', () => {
  it('contains a dedicated inspector pane (node-inspector class)', () => {
    const html = loadHtml();
    expect(html).toContain('node-inspector');
  });

  it('contains a flow-area upper workspace', () => {
    const html = loadHtml();
    expect(html).toContain('id="flow-area"');
  });

  it('contains a topology-pane within the upper workspace', () => {
    const html = loadHtml();
    expect(html).toContain('id="topology-pane"');
  });

  it('contains inspector-pane as sibling of topology-pane', () => {
    const html = loadHtml();
    expect(html).toContain('id="inspector-pane"');
  });

  it('preserves debugger-section as a separate bottom region', () => {
    const html = loadHtml();
    expect(html).toContain('id="debugger-section"');
  });

  it('debugger-section is outside the inspector pane — not nested inside it', () => {
    const html = loadHtml();
    // inspector-pane must appear before debugger-section, not wrap it
    const inspectorIdx = html.indexOf('id="inspector-pane"');
    const debuggerIdx = html.indexOf('id="debugger-section"');
    expect(inspectorIdx).toBeGreaterThan(-1);
    expect(debuggerIdx).toBeGreaterThan(-1);
    // debugger-section must come AFTER inspector-pane in document order
    expect(debuggerIdx).toBeGreaterThan(inspectorIdx);
  });

  it('flow-area-inner provides the two-pane workspace container', () => {
    const html = loadHtml();
    expect(html).toContain('id="flow-area-inner"');
  });

  it('has inspector-open CSS for expanding the inspector pane', () => {
    const html = loadHtml();
    expect(html).toContain('inspector-open');
  });
});

describe('rendered topology markup — selection hooks', () => {
  it('every topology node has a data-node-id attribute (selection hook)', () => {
    const markup = renderDemoTopology(TEST_TOPOLOGY);
    // Check all five role types
    expect(markup).toContain('data-node-id="topology-node-napplet-chat"');
    expect(markup).toContain('data-node-id="topology-node-napplet-bot"');
    expect(markup).toContain('data-node-id="topology-node-shell"');
    expect(markup).toContain('data-node-id="topology-node-acl"');
    expect(markup).toContain('data-node-id="topology-node-runtime"');
    expect(markup).toContain('data-node-id="topology-node-service-signer"');
  });

  it('every role type has a node-summary slot', () => {
    const markup = renderDemoTopology(TEST_TOPOLOGY);
    // Check summary slots for all roles
    expect(markup).toContain('id="node-summary-topology-node-napplet-chat"');
    expect(markup).toContain('id="node-summary-topology-node-napplet-bot"');
    expect(markup).toContain('id="node-summary-topology-node-shell"');
    expect(markup).toContain('id="node-summary-topology-node-acl"');
    expect(markup).toContain('id="node-summary-topology-node-runtime"');
    expect(markup).toContain('id="node-summary-topology-node-service-signer"');
  });

  it('node cards include the node-box class for click affordances', () => {
    const markup = renderDemoTopology(TEST_TOPOLOGY);
    expect(markup.match(/class="[^"]*node-box[^"]*"/g)?.length).toBeGreaterThanOrEqual(5);
  });
});

describe('inspector render states', () => {
  it('topology markup supports no-selection state (node-summary slots empty by default)', () => {
    const markup = renderDemoTopology(TEST_TOPOLOGY);
    // Summary slots exist but have no content yet (filled by JS at runtime)
    expect(markup).toContain('class="node-summary"');
    // Markup should not pre-bake any dynamic summary content
    expect(markup).not.toContain('node-summary-label');
  });

  it('debugger section is never folded into the inspector layout', () => {
    const html = loadHtml();
    // The inspector-pane is a sibling inside flow-area-inner.
    // The napplet-debugger is inside debugger-section which comes AFTER flow-area in document order.
    const flowAreaEnd = html.indexOf('</section>', html.indexOf('id="flow-area"'));
    const debuggerIdx = html.indexOf('napplet-debugger');
    const inspectorIdx = html.indexOf('id="inspector-pane"');

    // Both inspector-pane and napplet-debugger must be found
    expect(inspectorIdx).toBeGreaterThan(-1);
    expect(debuggerIdx).toBeGreaterThan(-1);
    // The napplet-debugger must come after the flow-area section closes
    expect(debuggerIdx).toBeGreaterThan(flowAreaEnd);
    // The inspector-pane must be inside the flow-area (before it closes)
    expect(inspectorIdx).toBeLessThan(flowAreaEnd);
  });
});

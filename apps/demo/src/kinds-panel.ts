/** kinds-panel.ts -- Read-only protocol kind reference cards for the inspector Kinds tab. */

import { demoConfig } from './demo-config.js';
import type { ConstantDef } from './demo-config.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render a single read-only kind reference card.
 *
 * @param def - The constant definition to render
 * @returns HTML string for one kind row
 */
function renderKindRow(def: ConstantDef): string {
  return `
    <div class="kinds-row">
      <div class="kinds-label">${escapeHtml(def.label)}</div>
      <div class="kinds-value">${def.currentValue}</div>
      <div class="kinds-desc">${escapeHtml(def.description)}</div>
    </div>
  `;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Render the Kinds panel HTML. Called from node-inspector when the
 * kinds tab is active. Shows read-only protocol kind constants as
 * compact reference cards, split into protocol kinds and other read-only.
 *
 * @returns HTML string for the kinds panel content
 */
export function renderKindsPanel(): string {
  const readOnly = demoConfig.getReadOnlyDefs();
  const protocolKinds = readOnly.filter(d => d.domain === 'protocol');
  const otherReadOnly = readOnly.filter(d => d.domain !== 'protocol');

  let html = '<div style="padding:12px 16px 16px;display:flex;flex-direction:column;gap:10px">';

  // Protocol kinds section
  html += '<div class="kinds-section-header">protocol kinds</div>';
  for (const def of protocolKinds) {
    html += renderKindRow(def);
  }

  // Other read-only section (if any)
  if (otherReadOnly.length > 0) {
    html += '<div class="kinds-section-header">other read-only</div>';
    for (const def of otherReadOnly) {
      html += renderKindRow(def);
    }
  }

  html += '</div>';
  return html;
}

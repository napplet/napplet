/**
 * constants-panel.ts — Constants panel UI for the inspector pane.
 *
 * Renders a browsable list of all protocol magic numbers with grouping,
 * search/filter, number input + slider editing, per-constant reset,
 * global Reset All, flash animation on edit, and modified-value indicator.
 */

import { demoConfig } from './demo-config.js';
import type { ConstantDef } from './demo-config.js';

// ─── Module State ────────────────────────────────────────────────────────────

let _groupingMode: 'package' | 'domain' | 'flat' = 'package';
let _searchQuery = '';

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function formatValue(def: ConstantDef): string {
  if (def.unit === 'bytes' && def.currentValue >= 1024) {
    const kb = def.currentValue / 1024;
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${Math.round(kb)} KB`;
  }
  return String(def.currentValue);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Flash Animation ─────────────────────────────────────────────────────────

function flashConstantRow(key: string): void {
  const row = document.querySelector(`[data-const-key="${key}"]`) as HTMLElement | null;
  if (!row) return;
  row.style.background = 'rgba(57,255,20,0.08)';
  setTimeout(() => { row.style.background = 'transparent'; }, 400);
}

// ─── Render Helpers ──────────────────────────────────────────────────────────

function matchesSearch(def: ConstantDef): boolean {
  if (!_searchQuery) return true;
  const q = _searchQuery.toLowerCase();
  return (
    def.key.toLowerCase().includes(q) ||
    def.label.toLowerCase().includes(q) ||
    def.description.toLowerCase().includes(q)
  );
}

function renderConstantRow(def: ConstantDef): string {
  const isModified = demoConfig.isModified(def.key);
  const dotDisplay = isModified ? 'block' : 'none';
  const resetDisplay = isModified ? 'inline' : 'none';
  const escapedKey = escapeHtml(def.key);

  if (!def.editable) {
    return `
      <div class="const-row" data-const-key="${escapedKey}" style="padding:6px 0;border-bottom:1px solid #1a1a28;position:relative">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:10px;color:#d0d4e8">${escapeHtml(def.label)}</span>
          <span style="font-size:9px;color:#666">${escapeHtml(def.unit || 'kind')}</span>
        </div>
        <div style="font-size:12px;color:#62d0ff;padding:2px 0">${formatValue(def)}</div>
        <div style="font-size:9px;color:#555;margin-top:2px">${escapeHtml(def.description)}</div>
      </div>
    `;
  }

  return `
    <div class="const-row" data-const-key="${escapedKey}" style="padding:6px 0;border-bottom:1px solid #1a1a28;position:relative">
      <div class="const-modified-dot" style="display:${dotDisplay}"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:10px;color:#d0d4e8">${escapeHtml(def.label)}</span>
        <span style="font-size:9px;color:#666">${escapeHtml(def.unit)}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="number" class="const-number-input" data-const-input="${escapedKey}"
          value="${def.currentValue}" min="${def.min}" max="${def.max}" step="${def.step}" />
        <input type="range" class="const-slider" data-const-slider="${escapedKey}"
          value="${def.currentValue}" min="${def.min}" max="${def.max}" step="${def.step}" />
        <button class="const-reset-btn" data-const-reset="${escapedKey}"
          style="display:${resetDisplay}"
          title="Reset to default (${def.defaultValue})">&#8634;</button>
      </div>
      <div style="font-size:9px;color:#555;margin-top:2px">${escapeHtml(def.description)}</div>
    </div>
  `;
}

function getGroupedDefs(): Array<{ groupLabel: string; defs: ConstantDef[] }> {
  const groups: Array<{ groupLabel: string; defs: ConstantDef[] }> = [];

  if (_groupingMode === 'flat') {
    const all = demoConfig.getAllDefs().filter(matchesSearch);
    if (all.length > 0) groups.push({ groupLabel: 'all constants', defs: all });
    return groups;
  }

  const grouped = _groupingMode === 'package'
    ? demoConfig.getByPackage()
    : demoConfig.getByDomain();

  for (const [label, defs] of grouped) {
    const filtered = defs.filter(matchesSearch);
    if (filtered.length > 0) {
      const displayLabel = _groupingMode === 'domain' && label === 'protocol'
        ? 'protocol (read-only)'
        : label === 'ui-timing'
          ? 'ui timing'
          : label === 'sizes'
            ? 'sizes & limits'
            : label;
      groups.push({ groupLabel: displayLabel, defs: filtered });
    }
  }

  return groups;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Render the constants panel HTML. Called from node-inspector when the
 * constants tab is active.
 *
 * @returns HTML string for the constants panel content
 */
export function renderConstantsPanel(): string {
  const hasModified = demoConfig.getModifiedKeys().length > 0;
  const resetAllDisplay = hasModified ? 'inline-block' : 'none';

  const groupingButtons = (['package', 'domain', 'flat'] as const)
    .map((mode) => {
      const active = _groupingMode === mode ? ' active' : '';
      return `<button class="const-grouping-btn${active}" data-grouping-mode="${mode}">${mode}</button>`;
    })
    .join('');

  const groups = getGroupedDefs();
  const groupsHtml = groups
    .map(({ groupLabel, defs }) => {
      const rows = defs.map(renderConstantRow).join('');
      return `
        <div class="const-group-header">${escapeHtml(groupLabel)}</div>
        ${rows}
      `;
    })
    .join('');

  const emptyHtml = groups.length === 0
    ? '<div style="padding:12px 0;color:#3a3a4a;font-size:11px;text-align:center">no matching constants</div>'
    : '';

  return `
    <div style="padding:12px 16px 16px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7c86a7">protocol constants</div>
        <button id="constants-reset-all" class="const-reset-all-btn" style="display:${resetAllDisplay}">Reset All</button>
      </div>
      <input id="constants-search" class="const-search-input" type="text" placeholder="filter..." value="${escapeHtml(_searchQuery)}" />
      <div style="display:flex;gap:4px">${groupingButtons}</div>
      <div id="constants-list">
        ${groupsHtml}
        ${emptyHtml}
      </div>
    </div>
  `;
}

/**
 * Wire event handlers for the constants panel. Must be called after the
 * panel HTML has been inserted into the DOM.
 *
 * @param rerender - Callback to re-render the panel (typically updateInspectorPane)
 */
export function wireConstantsPanelEvents(rerender: () => void): void {
  // Number input changes
  document.querySelectorAll<HTMLInputElement>('[data-const-input]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.constInput!;
      const value = parseFloat(input.value);
      if (isNaN(value)) return;
      demoConfig.set(key, value);
      // Sync slider
      const slider = document.querySelector<HTMLInputElement>(`[data-const-slider="${key}"]`);
      if (slider) slider.value = String(demoConfig.get(key));
      // Update input to show clamped value
      input.value = String(demoConfig.get(key));
      flashConstantRow(key);
      // Update modified indicator and reset button
      updateRowState(key);
    });
  });

  // Slider changes
  document.querySelectorAll<HTMLInputElement>('[data-const-slider]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const key = slider.dataset.constSlider!;
      const value = parseFloat(slider.value);
      if (isNaN(value)) return;
      demoConfig.set(key, value);
      // Sync number input
      const input = document.querySelector<HTMLInputElement>(`[data-const-input="${key}"]`);
      if (input) input.value = String(demoConfig.get(key));
      flashConstantRow(key);
      updateRowState(key);
    });
  });

  // Per-constant reset
  document.querySelectorAll<HTMLButtonElement>('[data-const-reset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.constReset!;
      demoConfig.reset(key);
      // Update controls
      const input = document.querySelector<HTMLInputElement>(`[data-const-input="${key}"]`);
      const slider = document.querySelector<HTMLInputElement>(`[data-const-slider="${key}"]`);
      if (input) input.value = String(demoConfig.get(key));
      if (slider) slider.value = String(demoConfig.get(key));
      flashConstantRow(key);
      updateRowState(key);
    });
  });

  // Reset All
  const resetAllBtn = document.getElementById('constants-reset-all');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      demoConfig.resetAll();
      rerender();
    });
  }

  // Search
  const searchInput = document.getElementById('constants-search') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      _searchQuery = searchInput.value;
      rerender();
      // Restore focus to search after re-render
      const newSearch = document.getElementById('constants-search') as HTMLInputElement | null;
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
      }
    });
  }

  // Grouping toggles
  document.querySelectorAll<HTMLButtonElement>('[data-grouping-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      _groupingMode = btn.dataset.groupingMode as 'package' | 'domain' | 'flat';
      rerender();
    });
  });
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function updateRowState(key: string): void {
  const isModified = demoConfig.isModified(key);
  const row = document.querySelector(`[data-const-key="${key}"]`) as HTMLElement | null;
  if (!row) return;

  const dot = row.querySelector('.const-modified-dot') as HTMLElement | null;
  if (dot) dot.style.display = isModified ? 'block' : 'none';

  const resetBtn = row.querySelector(`[data-const-reset="${key}"]`) as HTMLElement | null;
  if (resetBtn) resetBtn.style.display = isModified ? 'inline' : 'none';

  // Toggle Reset All visibility
  const resetAllBtn = document.getElementById('constants-reset-all');
  if (resetAllBtn) {
    resetAllBtn.style.display = demoConfig.getModifiedKeys().length > 0 ? 'inline-block' : 'none';
  }
}

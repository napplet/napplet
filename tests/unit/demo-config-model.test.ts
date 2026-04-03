/**
 * demo-config-model.test.ts
 *
 * Behavioral tests for TRANS-01:
 * - DemoConfig data model: getAllDefs, getByPackage, getByDomain, get(), constant inventory completeness
 * - renderConstantsPanel(): HTML structure with data attributes, grouping modes, search filtering
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { DemoConfig, demoConfig } from '../../apps/demo/src/demo-config.ts';
import type { ConstantDef } from '../../apps/demo/src/demo-config.ts';

// ─── DemoConfig data model ────────────────────────────────────────────────────

describe('DemoConfig data model', () => {
  describe('getAllDefs', () => {
    it('returns at least 20 constants covering editable and protocol read-only entries', () => {
      const defs = demoConfig.getAllDefs();
      expect(defs.length).toBeGreaterThanOrEqual(20);
    });

    it('includes the core replay window constant', () => {
      const defs = demoConfig.getAllDefs();
      const keys = defs.map((d) => d.key);
      expect(keys).toContain('core.REPLAY_WINDOW_SECONDS');
    });

    it('includes the runtime ring buffer size constant', () => {
      const defs = demoConfig.getAllDefs();
      const keys = defs.map((d) => d.key);
      expect(keys).toContain('runtime.RING_BUFFER_SIZE');
    });

    it('includes demo ui-timing constants', () => {
      const defs = demoConfig.getAllDefs();
      const keys = defs.map((d) => d.key);
      expect(keys).toContain('demo.FLASH_DURATION');
      expect(keys).toContain('demo.FLASH_DURATION_MS');
      expect(keys).toContain('demo.TOAST_DISPLAY_MS');
    });

    it('includes protocol read-only bus kind constants', () => {
      const defs = demoConfig.getAllDefs();
      const keys = defs.map((d) => d.key);
      expect(keys).toContain('core.AUTH_KIND');
      expect(keys).toContain('core.BusKind.REGISTRATION');
      expect(keys).toContain('core.BusKind.SIGNER_REQUEST');
      expect(keys).toContain('core.BusKind.SIGNER_RESPONSE');
    });

    it('every def has required shape fields', () => {
      const defs = demoConfig.getAllDefs();
      for (const def of defs) {
        expect(typeof def.key).toBe('string');
        expect(typeof def.label).toBe('string');
        expect(typeof def.defaultValue).toBe('number');
        expect(typeof def.currentValue).toBe('number');
        expect(typeof def.pkg).toBe('string');
        expect(typeof def.domain).toBe('string');
        expect(typeof def.editable).toBe('boolean');
        expect(typeof def.description).toBe('string');
      }
    });
  });

  describe('get()', () => {
    it('returns the default value for core.REPLAY_WINDOW_SECONDS', () => {
      const fresh = new DemoConfig(demoConfig.getAllDefs().map((d) => ({ ...d, currentValue: d.defaultValue })));
      expect(fresh.get('core.REPLAY_WINDOW_SECONDS')).toBe(30);
    });

    it('returns the default value for runtime.RING_BUFFER_SIZE', () => {
      const fresh = new DemoConfig(demoConfig.getAllDefs().map((d) => ({ ...d, currentValue: d.defaultValue })));
      expect(fresh.get('runtime.RING_BUFFER_SIZE')).toBe(100);
    });

    it('returns the default value for core.AUTH_KIND (22242)', () => {
      const fresh = new DemoConfig(demoConfig.getAllDefs().map((d) => ({ ...d, currentValue: d.defaultValue })));
      expect(fresh.get('core.AUTH_KIND')).toBe(22242);
    });

    it('throws for an unknown constant key', () => {
      expect(() => demoConfig.get('nonexistent.CONSTANT')).toThrow('Unknown constant: nonexistent.CONSTANT');
    });
  });

  describe('getByPackage()', () => {
    it('returns a Map with core, runtime, services, and demo package groups', () => {
      const byPkg = demoConfig.getByPackage();
      expect(byPkg.has('core')).toBe(true);
      expect(byPkg.has('runtime')).toBe(true);
      expect(byPkg.has('services')).toBe(true);
      expect(byPkg.has('demo')).toBe(true);
    });

    it('core package group contains the REPLAY_WINDOW_SECONDS constant', () => {
      const byPkg = demoConfig.getByPackage();
      const coreGroup = byPkg.get('core') ?? [];
      expect(coreGroup.some((d) => d.key === 'core.REPLAY_WINDOW_SECONDS')).toBe(true);
    });

    it('demo package group contains FLASH_DURATION', () => {
      const byPkg = demoConfig.getByPackage();
      const demoGroup = byPkg.get('demo') ?? [];
      expect(demoGroup.some((d) => d.key === 'demo.FLASH_DURATION')).toBe(true);
    });

    it('every constant appears in exactly one package group', () => {
      const byPkg = demoConfig.getByPackage();
      const allInGroups: string[] = [];
      for (const defs of byPkg.values()) {
        for (const d of defs) allInGroups.push(d.key);
      }
      const allKeys = demoConfig.getAllDefs().map((d) => d.key);
      expect(allInGroups.sort()).toEqual(allKeys.sort());
    });
  });

  describe('getByDomain()', () => {
    it('returns a Map with timeouts, sizes, ui-timing, and protocol domain groups', () => {
      const byDomain = demoConfig.getByDomain();
      expect(byDomain.has('timeouts')).toBe(true);
      expect(byDomain.has('sizes')).toBe(true);
      expect(byDomain.has('ui-timing')).toBe(true);
      expect(byDomain.has('protocol')).toBe(true);
    });

    it('timeouts domain contains EOSE_TIMEOUT constant', () => {
      const byDomain = demoConfig.getByDomain();
      const timeoutGroup = byDomain.get('timeouts') ?? [];
      expect(timeoutGroup.some((d) => d.key === 'services.DEFAULT_EOSE_TIMEOUT_MS')).toBe(true);
    });

    it('protocol domain only contains non-editable constants', () => {
      const byDomain = demoConfig.getByDomain();
      const protocolGroup = byDomain.get('protocol') ?? [];
      expect(protocolGroup.length).toBeGreaterThan(0);
      expect(protocolGroup.every((d) => d.editable === false)).toBe(true);
    });

    it('every constant appears in exactly one domain group', () => {
      const byDomain = demoConfig.getByDomain();
      const allInGroups: string[] = [];
      for (const defs of byDomain.values()) {
        for (const d of defs) allInGroups.push(d.key);
      }
      const allKeys = demoConfig.getAllDefs().map((d) => d.key);
      expect(allInGroups.sort()).toEqual(allKeys.sort());
    });
  });

  describe('constant inventory completeness', () => {
    it('has at least one editable behavioral constant per package in core and services', () => {
      const byPkg = demoConfig.getByPackage();
      const coreEditable = (byPkg.get('core') ?? []).filter((d) => d.editable);
      const servicesEditable = (byPkg.get('services') ?? []).filter((d) => d.editable);
      expect(coreEditable.length).toBeGreaterThanOrEqual(1);
      expect(servicesEditable.length).toBeGreaterThanOrEqual(1);
    });

    it('all editable constants have valid min < max and positive step', () => {
      const editable = demoConfig.getAllDefs().filter((d) => d.editable);
      for (const def of editable) {
        expect(def.min).toBeLessThan(def.max);
        expect(def.step).toBeGreaterThan(0);
        expect(def.defaultValue).toBeGreaterThanOrEqual(def.min);
        expect(def.defaultValue).toBeLessThanOrEqual(def.max);
      }
    });
  });
});

// ─── renderConstantsPanel HTML structure ─────────────────────────────────────

// Import renderConstantsPanel — the function returns a pure HTML string;
// no DOM access happens during rendering, so node environment is fine.
import { renderConstantsPanel } from '../../apps/demo/src/constants-panel.ts';

describe('renderConstantsPanel()', () => {
  let html: string;

  beforeEach(() => {
    // Use a freshly rendered panel each test
    html = renderConstantsPanel();
  });

  describe('required element IDs', () => {
    it('renders the constants-search filter input', () => {
      expect(html).toContain('id="constants-search"');
    });

    it('renders the constants-reset-all button', () => {
      // The button is always rendered; visibility is controlled by display style
      expect(html).toContain('id="constants-reset-all"');
    });
  });

  describe('data attributes on constant rows', () => {
    it('renders data-const-key attributes for every constant', () => {
      const allDefs = demoConfig.getAllDefs();
      for (const def of allDefs) {
        expect(html).toContain(`data-const-key="${def.key}"`);
      }
    });

    it('renders data-const-input attributes for editable constants', () => {
      const editableDefs = demoConfig.getAllDefs().filter((d) => d.editable);
      for (const def of editableDefs) {
        expect(html).toContain(`data-const-input="${def.key}"`);
      }
    });

    it('renders data-const-slider attributes for editable constants', () => {
      const editableDefs = demoConfig.getAllDefs().filter((d) => d.editable);
      for (const def of editableDefs) {
        expect(html).toContain(`data-const-slider="${def.key}"`);
      }
    });

    it('does not render data-const-input for read-only (non-editable) constants', () => {
      const readOnlyDefs = demoConfig.getAllDefs().filter((d) => !d.editable);
      for (const def of readOnlyDefs) {
        expect(html).not.toContain(`data-const-input="${def.key}"`);
      }
    });
  });

  describe('grouping mode selector', () => {
    it('renders data-grouping-mode buttons for package, domain, and flat', () => {
      expect(html).toContain('data-grouping-mode="package"');
      expect(html).toContain('data-grouping-mode="domain"');
      expect(html).toContain('data-grouping-mode="flat"');
    });

    it('package grouping button has active class by default', () => {
      // Default mode is 'package' — the active button gets the 'active' class
      expect(html).toContain('const-grouping-btn active');
    });
  });

  describe('group headers', () => {
    it('renders const-group-header elements for package groups', () => {
      // Default mode is package — should show group headers
      expect(html).toContain('const-group-header');
    });

    it('renders group headers for core, runtime, and demo packages', () => {
      expect(html).toContain('>core<');
      expect(html).toContain('>runtime<');
      expect(html).toContain('>demo<');
    });
  });

  describe('search filtering', () => {
    it('panel renders without crashing when constants module state is default', () => {
      // Baseline: render succeeds and contains expected structure
      expect(html.length).toBeGreaterThan(100);
      expect(html).toContain('const-row');
    });

    it('search placeholder text is present in the filter input', () => {
      expect(html).toContain('placeholder="filter..."');
    });
  });
});

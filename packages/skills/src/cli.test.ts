import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderCliHelp } from './cli-help.js';
import { runCli } from './cli.js';
import { TARGETS } from './index.js';

describe('runCli', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns maintained statuses and writes through the importing process', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(runCli(['list'])).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('make-napplet'));

    expect(runCli(['--unknown'])).toBe(2);
    expect(error).toHaveBeenCalledWith('unknown option: --unknown');
  });

  it('retains print and install behavior through the callable entry point', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'napplet-skills-cli-test-'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      expect(runCli(['print', 'make-napplet'])).toBe(0);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Making A Napplet'));
      expect(runCli(['install', 'make-napplet', '--dir', root])).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('renders the complete shared help contract', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runCli(['--help'])).toBe(0);
    const help = String(log.mock.calls.at(-1)?.[0]);

    expect(help).toBe(renderCliHelp(Object.values(TARGETS)));
    expect(help).toContain('Install options:');
    expect(help).toContain('Targets (--to):');
    expect(help).toContain('Examples:');
  });
});

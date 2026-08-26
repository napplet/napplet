import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('declares every JSR package config as a root Deno workspace member', () => {
  const deno = JSON.parse(readFileSync(join(root, 'deno.json'), 'utf8'));
  const workspace = new Set(deno.workspace ?? []);
  const jsrPackageDirectories = readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, 'packages', entry.name, 'jsr.json')))
    .map((entry) => `./packages/${entry.name}`);

  assert.deepEqual(
    jsrPackageDirectories.filter((directory) => !workspace.has(directory)),
    [],
    'every package published from jsr.json must belong to the root Deno workspace',
  );
});

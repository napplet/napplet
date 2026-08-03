import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { syncJsrVersions } from './sync-jsr-versions.mjs';

function writeJson(path, value) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, value);
}

function createFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'sync-jsr-versions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function packagePath(root, packageName, file) {
  return join(root, 'packages', packageName, file);
}

test('syncs concrete exports while preserving npm-only wildcard assets', (t) => {
  const root = createFixture(t);
  const skillsPackage = {
    name: '@napplet/skills',
    version: '1.2.3',
    exports: {
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
      './cli': { types: './dist/cli.d.ts', import: './dist/cli.js' },
      './skills/*': './skills/*',
    },
  };

  writeJson(packagePath(root, 'core', 'package.json'), {
    name: '@napplet/core',
    version: '4.5.6',
  });
  writeJson(packagePath(root, 'skills', 'package.json'), skillsPackage);
  writeJson(packagePath(root, 'skills', 'jsr.json'), {
    name: '@napplet/skills',
    version: '0.0.1',
    exports: { '.': './src/stale.ts' },
    imports: { '@napplet/core': 'jsr:@napplet/core@^0.0.1' },
  });
  writeText(packagePath(root, 'skills', 'src/index.ts'), 'export {};\n');
  writeText(packagePath(root, 'skills', 'src/cli.ts'), 'export {};\n');
  writeText(packagePath(root, 'skills', 'skills/make-napplet/SKILL.md'), '# Skill\n');

  writeJson(packagePath(root, 'cli', 'package.json'), {
    name: '@napplet/cli',
    version: '7.8.9',
  });
  writeJson(packagePath(root, 'cli', 'deno.json'), {
    name: '@napplet/cli',
    version: '0.0.1',
  });

  const skillsPackageBefore = readFileSync(packagePath(root, 'skills', 'package.json'), 'utf8');
  syncJsrVersions(root);

  assert.equal(readFileSync(packagePath(root, 'skills', 'package.json'), 'utf8'), skillsPackageBefore);
  assert.deepEqual(JSON.parse(readFileSync(packagePath(root, 'skills', 'jsr.json'), 'utf8')), {
    name: '@napplet/skills',
    version: '1.2.3',
    exports: {
      '.': './src/index.ts',
      './cli': './src/cli.ts',
    },
    imports: { '@napplet/core': 'jsr:@napplet/core@^4.5.6' },
  });
  assert.equal(JSON.parse(readFileSync(packagePath(root, 'cli', 'deno.json'), 'utf8')).version, '7.8.9');
});

test('rejects a concrete export whose translated source target is missing', (t) => {
  const root = createFixture(t);
  writeJson(packagePath(root, 'broken', 'package.json'), {
    name: '@napplet/broken',
    version: '1.0.0',
    exports: { './missing': { import: './dist/missing.js' } },
  });
  writeJson(packagePath(root, 'broken', 'jsr.json'), {
    name: '@napplet/broken',
    version: '1.0.0',
    exports: {},
  });

  assert.throws(
    () => syncJsrVersions(root),
    /@napplet\/broken \.\/missing maps to missing JSR source file: \.\/src\/missing\.ts/,
  );
});

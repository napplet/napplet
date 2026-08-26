import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { syncTutorialPackageVersions } from './sync-tutorial-package-versions.mjs';

function writeJson(path, value) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'sync-tutorial-package-versions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('updates only tutorial package ranges incompatible with the workspace version', (t) => {
  const root = createFixture(t);
  writeJson(join(root, 'packages', 'sdk', 'package.json'), {
    name: '@napplet/sdk',
    version: '0.28.0',
  });
  writeJson(join(root, 'packages', 'vite-plugin', 'package.json'), {
    name: '@napplet/vite-plugin',
    version: '0.14.1',
  });
  writeJson(join(root, 'packages', 'conformance-cli', 'package.json'), {
    name: '@napplet/conformance-cli',
    version: '0.2.19',
  });

  const tutorialPath = join(root, 'apps', 'docs', 'guide', 'build-note-drafts-napplet.md');
  mkdirSync(join(tutorialPath, '..'), { recursive: true });
  writeFileSync(
    tutorialPath,
    [
      'pnpm add @napplet/sdk@^0.27.0',
      'pnpm add -D @napplet/vite-plugin@^0.14.0 @napplet/conformance-cli@^0.2.18',
      '',
      '<!-- tutorial-file: package.json -->',
      '```json',
      '{',
      '  "dependencies": { "@napplet/sdk": "^0.27.0" },',
      '  "devDependencies": {',
      '    "@napplet/vite-plugin": "^0.14.0",',
      '    "@napplet/conformance-cli": "^0.2.18"',
      '  }',
      '}',
      '```',
      '',
    ].join('\n'),
  );

  syncTutorialPackageVersions(root, tutorialPath);

  const tutorial = readFileSync(tutorialPath, 'utf8');
  assert.match(tutorial, /@napplet\/sdk@\^0\.28\.0/);
  assert.match(tutorial, /"@napplet\/sdk": "\^0\.28\.0"/);
  assert.match(tutorial, /@napplet\/vite-plugin@\^0\.14\.0/);
  assert.match(tutorial, /"@napplet\/vite-plugin": "\^0\.14\.0"/);
  assert.match(tutorial, /@napplet\/conformance-cli@\^0\.2\.18/);
  assert.match(tutorial, /"@napplet\/conformance-cli": "\^0\.2\.18"/);
});

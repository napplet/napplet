#!/usr/bin/env node
// Keep the package ranges embedded in the build-note-drafts tutorial compatible
// with the packages that Version Packages has just versioned.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { caretRangeIncludesVersion } from './tutorial-package-versions.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TUTORIAL_PATH = join(REPO_ROOT, 'apps/docs/guide/build-note-drafts-napplet.md');
const TUTORIAL_PACKAGES = [
  ['@napplet/sdk', 'packages/sdk/package.json'],
  ['@napplet/vite-plugin', 'packages/vite-plugin/package.json'],
  ['@napplet/conformance-cli', 'packages/conformance-cli/package.json'],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Update incompatible caret ranges in the tutorial's install commands and
 * embedded package manifest after workspace package versions change.
 *
 * @param {string} repoRoot - Root directory containing workspace packages.
 * @param {string} tutorialPath - Markdown tutorial containing package ranges.
 * @returns {boolean} Whether the tutorial source changed.
 */
export function syncTutorialPackageVersions(repoRoot = REPO_ROOT, tutorialPath = TUTORIAL_PATH) {
  let tutorial = readFileSync(tutorialPath, 'utf8');
  let changed = false;

  for (const [name, packagePath] of TUTORIAL_PACKAGES) {
    const { version } = JSON.parse(readFileSync(join(repoRoot, packagePath), 'utf8'));
    const commandRangePattern = new RegExp(`${escapeRegex(name)}@(\\^\\d+\\.\\d+\\.\\d+)`, 'g');
    const manifestRangePattern = new RegExp(`("${escapeRegex(name)}"\\s*:\\s*")(\\^\\d+\\.\\d+\\.\\d+)(")`, 'g');
    let commandMatched = false;
    let manifestMatched = false;

    tutorial = tutorial.replace(commandRangePattern, (declaration, range) => {
      commandMatched = true;
      if (caretRangeIncludesVersion(range, version)) return declaration;
      changed = true;
      return `${name}@^${version}`;
    });

    tutorial = tutorial.replace(manifestRangePattern, (declaration, prefix, range, suffix) => {
      manifestMatched = true;
      if (caretRangeIncludesVersion(range, version)) return declaration;
      changed = true;
      return `${prefix}^${version}${suffix}`;
    });

    if (!commandMatched || !manifestMatched) {
      throw new Error(`Tutorial does not declare ${name} in both install and manifest ranges`);
    }
  }

  if (changed) writeFileSync(tutorialPath, tutorial);
  console.log(`sync-tutorial-package-versions: ${changed ? 'updated incompatible ranges' : 'already compatible'}`);
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncTutorialPackageVersions();
}

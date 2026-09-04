/**
 * @napplet/vite-plugin — bounded retained-reference inventory and rewrites.
 *
 * This is build-private classifier plumbing. It describes only the emitted
 * forms that the generated resource loader owns; it does not add protocol
 * metadata, a browser fetch path, or a universal URL interception layer.
 */

import valueParser from 'postcss-value-parser';
import type { RetainedAsset } from './pipeline.js';

export type RetainedArtifactKind = 'html' | 'inline-css' | 'javascript' | 'stylesheet';

export interface RetainedArtifact {
  path: string;
  kind: RetainedArtifactKind;
  content: string;
}

export interface ReferenceBuild {
  assets: readonly RetainedAsset[];
  artifacts: readonly RetainedArtifact[];
}

export type ReferenceForm =
  | 'computed-url'
  | 'html-attribute'
  | 'html-srcset'
  | 'inline-css'
  | 'js-fetch-sentinel'
  | 'js-media-sentinel'
  | 'js-sentinel'
  | 'module-url'
  | 'stylesheet-url'
  | 'wasm-streaming-url'
  | 'worker-url';

export interface ArtifactReference {
  source: string;
  form: ReferenceForm;
  supported: boolean;
  location: string;
}

export interface ReferenceInventory {
  artifacts: RetainedArtifact[];
  references: ArtifactReference[];
}

export interface AssetEligibility {
  eligible: boolean;
  reasons: string[];
  references: ArtifactReference[];
}

export interface RewriteInput {
  artifact: RetainedArtifact;
  inventory: ReferenceInventory;
  replacements: ReadonlyMap<string, string>;
  fetchCallReplacements?: ReadonlyMap<string, string>;
}

export interface RewrittenArtifact {
  content: string;
  rewrittenSources: string[];
}

function normalizedPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function location(path: string, offset: number): string {
  return `${path}:${offset}`;
}

function reasonFor(form: ReferenceForm): string {
  switch (form) {
    case 'html-attribute':
      return 'html-attribute';
    case 'html-srcset':
      return 'html-srcset';
    case 'inline-css':
      return 'inline-css';
    case 'computed-url':
      return 'computed-url';
    case 'worker-url':
      return 'worker-url';
    case 'module-url':
      return 'module-url';
    case 'wasm-streaming-url':
      return 'wasm-streaming-url';
    default:
      return form;
  }
}

function pushReference(
  references: ArtifactReference[],
  source: string,
  form: ReferenceForm,
  supported: boolean,
  path: string,
  offset: number,
): void {
  references.push({ source: normalizedPath(source), form, supported, location: location(path, offset) });
}

function splitFragment(value: string): { path: string; fragment: string } {
  const hash = value.indexOf('#');
  return hash < 0 ? { path: value, fragment: '' } : { path: value.slice(0, hash), fragment: value.slice(hash) };
}

function decodeCssEscapes(value: string): string {
  return value
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');
}

function cssUrlValues(content: string): Array<{ source: string; fragment: string; offset: number }> {
  const parsed = valueParser(content);
  const values: Array<{ source: string; fragment: string; offset: number }> = [];
  parsed.walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'url' || node.unclosed) return false;
    const argument = node.nodes.filter((candidate) => candidate.type !== 'space' && candidate.type !== 'comment');
    if (argument.length !== 1) return false;
    const target = argument[0]!;
    if ((target.type !== 'word' && target.type !== 'string') || (target.type === 'string' && target.unclosed) || target.value.startsWith('data:')) return false;
    const value = splitFragment(target.value);
    values.push({ source: normalizedPath(decodeCssEscapes(value.path)), fragment: value.fragment, offset: target.sourceIndex });
    return false;
  });
  return values;
}

function hasSource(value: string, source: string): boolean {
  return value.includes(source) || value.includes(`./${source}`);
}

interface TextEdit {
  start: number;
  end: number;
  replacement: string;
  sources: readonly string[];
}

function artifactReferences(artifact: RetainedArtifact, inventory: ReferenceInventory): ArtifactReference[] {
  const prefix = `${artifact.path}:`;
  return inventory.references.filter((reference) => reference.location.startsWith(prefix));
}

function referenceOffset(reference: ArtifactReference): number {
  return Number.parseInt(reference.location.slice(reference.location.lastIndexOf(':') + 1), 10);
}

function applyTextEdits(content: string, edits: readonly TextEdit[]): RewrittenArtifact {
  let rewritten = content;
  let nextStart = content.length;
  const rewrittenSources = new Set<string>();
  for (const edit of [...edits].sort((left, right) => right.start - left.start || right.end - left.end)) {
    if (edit.start < 0 || edit.end > nextStart || edit.start >= edit.end) continue;
    rewritten = `${rewritten.slice(0, edit.start)}${edit.replacement}${rewritten.slice(edit.end)}`;
    nextStart = edit.start;
    for (const source of edit.sources) rewrittenSources.add(source);
  }
  return { content: rewritten, rewrittenSources: [...rewrittenSources].sort() };
}

function sourceValueEdit(
  artifact: RetainedArtifact,
  reference: ArtifactReference,
  replacement: string,
): TextEdit | null {
  const offset = referenceOffset(reference);
  if (reference.form === 'html-attribute' || reference.form === 'html-srcset') {
    if (artifact.content.slice(offset, offset + reference.source.length) !== reference.source) return null;
    return { start: offset, end: offset + reference.source.length, replacement, sources: [reference.source] };
  }

  const suffix = artifact.content.slice(offset);
  if (reference.form === 'computed-url') {
    const match = suffix.match(new RegExp(`^(["'])${escapePattern(reference.source)}\\1\\s*\\+`));
    const relativeStart = match?.[0].indexOf(reference.source) ?? -1;
    return relativeStart < 0
      ? null
      : { start: offset + relativeStart, end: offset + relativeStart + reference.source.length, replacement, sources: [reference.source] };
  }

  const match = suffix.match(new RegExp(`^__nappletAssetUrl\\(\\s*(["'])${escapePattern(reference.source)}\\1(?:\\s*,\\s*(["'])media\\2)?\\s*\\)`));
  const relativeStart = match?.[0].indexOf(reference.source) ?? -1;
  return relativeStart < 0
    ? null
    : { start: offset + relativeStart, end: offset + relativeStart + reference.source.length, replacement, sources: [reference.source] };
}

function fetchCallEdit(
  artifact: RetainedArtifact,
  reference: ArtifactReference,
  replacement: string,
): TextEdit | null {
  if (reference.form !== 'js-fetch-sentinel' || !reference.supported) return null;
  const offset = referenceOffset(reference);
  const before = artifact.content.slice(0, offset);
  const prefix = before.match(/fetch\(\s*$/);
  if (prefix?.index === undefined) return null;
  const suffix = artifact.content.slice(prefix.index);
  const call = suffix.match(new RegExp(`^fetch\\(\\s*__nappletAssetUrl\\(\\s*(["'])${escapePattern(reference.source)}\\1\\s*\\)\\s*\\)`));
  if (!call) return null;
  return {
    start: prefix.index,
    end: prefix.index + call[0].length,
    replacement,
    sources: [reference.source],
  };
}

function rewriteCssReferences(
  artifact: RetainedArtifact,
  references: readonly ArtifactReference[],
  replacements: ReadonlyMap<string, string>,
): RewrittenArtifact {
  const allowed = new Set(references.map((reference) => reference.source));
  const parsed = valueParser(artifact.content);
  const rewrittenSources = new Set<string>();
  parsed.walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'url' || node.unclosed) return false;
    const argument = node.nodes.filter((candidate) => candidate.type !== 'space' && candidate.type !== 'comment');
    if (argument.length !== 1) return false;
    const target = argument[0]!;
    if ((target.type !== 'word' && target.type !== 'string') || (target.type === 'string' && target.unclosed)) return false;
    const value = splitFragment(target.value);
    const source = normalizedPath(decodeCssEscapes(value.path));
    const replacement = allowed.has(source) ? replacements.get(source) : undefined;
    if (!replacement) return false;
    target.value = `${replacement}${value.fragment}`;
    rewrittenSources.add(source);
    return false;
  });
  return { content: parsed.toString(), rewrittenSources: [...rewrittenSources].sort() };
}

function htmlStyleEdits(
  artifact: RetainedArtifact,
  references: readonly ArtifactReference[],
  replacements: ReadonlyMap<string, string>,
): TextEdit[] {
  const cssReferences = references.filter((reference) => reference.form === 'inline-css' || reference.form === 'stylesheet-url');
  if (cssReferences.length === 0) return [];
  const edits: TextEdit[] = [];
  for (const match of artifact.content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    const content = match[1] ?? '';
    const start = (match.index ?? 0) + match[0].indexOf(content);
    const end = start + content.length;
    const contained = cssReferences.filter((reference) => {
      const offset = referenceOffset(reference);
      return offset >= start && offset < end;
    });
    if (contained.length === 0) continue;
    const rewritten = rewriteCssReferences(
      { path: artifact.path, kind: 'inline-css', content },
      contained,
      replacements,
    );
    if (rewritten.content === content) continue;
    edits.push({ start, end, replacement: rewritten.content, sources: rewritten.rewrittenSources });
  }
  return edits;
}

function recordJavaScriptReferences(
  artifact: RetainedArtifact,
  sources: readonly string[],
  references: ArtifactReference[],
  baseOffset = 0,
): void {
  for (const source of sources) {
    const escaped = escapePattern(source);
    const sentinel = new RegExp(`__nappletAssetUrl\\(\\s*(["'])${escaped}\\1(?:\\s*,\\s*(["'])media\\2)?\\s*\\)`, 'g');
    for (const match of artifact.content.matchAll(sentinel)) {
      const offset = match.index ?? 0;
      const before = artifact.content.slice(Math.max(0, offset - 48), offset);
      if (/new\s+(?:Shared)?Worker\(\s*$/.test(before)) {
        pushReference(references, source, 'worker-url', false, artifact.path, baseOffset + offset);
      } else if (/import\(\s*$/.test(before)) {
        pushReference(references, source, 'module-url', false, artifact.path, baseOffset + offset);
      } else if (/WebAssembly\.instantiateStreaming\(\s*fetch\(\s*$/.test(before)) {
        pushReference(references, source, 'wasm-streaming-url', false, artifact.path, baseOffset + offset);
      } else if (/fetch\(\s*$/.test(before)) {
        pushReference(references, source, 'js-fetch-sentinel', true, artifact.path, baseOffset + offset);
      } else if (/,\s*["']media["']\s*\)$/.test(match[0])) {
        pushReference(references, source, 'js-media-sentinel', false, artifact.path, baseOffset + offset);
      } else {
        pushReference(references, source, 'js-sentinel', false, artifact.path, baseOffset + offset);
      }
    }

    const computed = new RegExp(`(["'])${escaped}\\1\\s*\\+`, 'g');
    for (const match of artifact.content.matchAll(computed)) {
      pushReference(references, source, 'computed-url', false, artifact.path, baseOffset + (match.index ?? 0));
    }
  }
}

function recordHtmlReferences(
  artifact: RetainedArtifact,
  sources: readonly string[],
  stylesheetContents: ReadonlySet<string>,
  references: ArtifactReference[],
): void {
  for (const source of sources) {
    const escaped = escapePattern(source);
    for (const match of artifact.content.matchAll(new RegExp(`\\bsrcset\\s*=\\s*(["'])[^"']*${escaped}[^"']*\\1`, 'gi'))) {
      pushReference(references, source, 'html-srcset', false, artifact.path, (match.index ?? 0) + match[0].indexOf(source));
    }
    for (const match of artifact.content.matchAll(new RegExp(`\\b(?:src|href)\\s*=\\s*(["'])${escaped}\\1`, 'gi'))) {
      pushReference(references, source, 'html-attribute', false, artifact.path, (match.index ?? 0) + match[0].indexOf(source));
    }
  }

  for (const match of artifact.content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    const content = match[1] ?? '';
    const baseOffset = (match.index ?? 0) + match[0].indexOf(content);
    const external = stylesheetContents.has(content);
    for (const value of cssUrlValues(content)) {
      if (!sources.includes(value.source)) continue;
      pushReference(references, value.source, external ? 'stylesheet-url' : 'inline-css', external, artifact.path, baseOffset + value.offset);
    }
  }

  for (const match of artifact.content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    const content = match[1] ?? '';
    if (content.length === 0) continue;
    const baseOffset = (match.index ?? 0) + match[0].indexOf(content);
    recordJavaScriptReferences({ path: artifact.path, kind: 'javascript', content }, sources, references, baseOffset);
  }
}

/** Inventory exactly the build-owned static forms present in retained output. */
export function inventoryArtifactReferences(input: ReferenceBuild): ReferenceInventory {
  const artifacts = [...input.artifacts];
  const sources = input.assets.map((asset) => normalizedPath(asset.source));
  const stylesheetContents = new Set(artifacts
    .filter((artifact) => artifact.kind === 'stylesheet')
    .map((artifact) => artifact.content));
  const references: ArtifactReference[] = [];

  for (const artifact of artifacts) {
    if (artifact.kind === 'stylesheet' || artifact.kind === 'inline-css') {
      for (const value of cssUrlValues(artifact.content)) {
        if (!sources.includes(value.source)) continue;
        pushReference(references, value.source, artifact.kind === 'stylesheet' ? 'stylesheet-url' : 'inline-css', artifact.kind === 'stylesheet', artifact.path, value.offset);
      }
      continue;
    }

    if (artifact.kind === 'html') {
      recordHtmlReferences(artifact, sources, stylesheetContents, references);
      continue;
    }

    for (const source of sources) {
      if (artifact.kind === 'javascript' && hasSource(artifact.content, source)) {
        recordJavaScriptReferences(artifact, [source], references);
      }
    }
  }

  return { artifacts, references: references.sort((left, right) => left.source.localeCompare(right.source) || left.location.localeCompare(right.location) || left.form.localeCompare(right.form)) };
}

/** Classify an asset as eligible only when its complete reference set is supported. */
export function classifyAssetReferences(asset: RetainedAsset, inventory: ReferenceInventory): AssetEligibility {
  const source = normalizedPath(asset.source);
  const references = inventory.references.filter((reference) => reference.source === source);
  const reasons = [...new Set(references.filter((reference) => !reference.supported).map((reference) => reasonFor(reference.form)).filter(Boolean))].sort();
  if (references.length === 0) reasons.push('unreferenced');
  return { eligible: reasons.length === 0, reasons, references };
}

/**
 * Rewrite only reference locations and forms recorded by the artifact inventory.
 *
 * @param input - The retained artifact, its authoritative inventory, and replacement maps.
 * @returns Rewritten content plus the sources that changed.
 * @example
 * rewriteArtifactReferences({ artifact, inventory, replacements: new Map([['asset.bin', dataUri]]) });
 */
export function rewriteArtifactReferences(input: RewriteInput): RewrittenArtifact {
  const references = artifactReferences(input.artifact, input.inventory);
  if (input.artifact.kind === 'stylesheet' || input.artifact.kind === 'inline-css') {
    return rewriteCssReferences(input.artifact, references, input.replacements);
  }

  const edits = input.artifact.kind === 'html'
    ? htmlStyleEdits(input.artifact, references, input.replacements)
    : [];
  for (const reference of references) {
    if (reference.form === 'inline-css' || reference.form === 'stylesheet-url') continue;
    const callReplacement = input.fetchCallReplacements?.get(reference.source);
    const callEdit = callReplacement ? fetchCallEdit(input.artifact, reference, callReplacement) : null;
    if (callEdit) {
      edits.push(callEdit);
      continue;
    }
    const replacement = input.replacements.get(reference.source);
    if (!replacement) continue;
    const edit = sourceValueEdit(input.artifact, reference, replacement);
    if (edit) edits.push(edit);
  }
  return applyTextEdits(input.artifact.content, edits);
}

/** Rewrite only parser-proven stylesheet values; every other form remains byte-preserved. */
export function rewriteSupportedReferences(input: RewriteInput): RewrittenArtifact {
  if (input.artifact.kind !== 'stylesheet') return { content: input.artifact.content, rewrittenSources: [] };
  return rewriteCssReferences(
    input.artifact,
    artifactReferences(input.artifact, input.inventory).filter((reference) => reference.supported),
    input.replacements,
  );
}

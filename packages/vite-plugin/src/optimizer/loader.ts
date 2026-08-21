/**
 * @napplet/vite-plugin — private resource-table serialization and loader source.
 *
 * This module emits implementation metadata embedded in a built artifact. It is
 * not a NIP-5A tag, NIP-5D field, or a new NAP operation: resource retrieval
 * remains entirely on the existing `window.napplet.resource.bytes` boundary.
 */

export interface ResourceTableEntry {
  source: string;
  uri: string;
  sha256: string;
  bytes: number;
  mime: string;
}

function stableEntries(entries: readonly ResourceTableEntry[]): ResourceTableEntry[] {
  return [...entries].sort((left, right) => left.source.localeCompare(right.source));
}

/** Render the deterministic private mapping stored inside the optimized HTML. */
export function renderPrivateResourceTable(entries: readonly ResourceTableEntry[]): string {
  return JSON.stringify(stableEntries(entries));
}

/**
 * Render a private one-path loader for automatic resource substitutions.
 *
 * The generated code deliberately uses only the existing NAP-RESOURCE web
 * projection. It verifies the signed table's length and SHA-256 before exposing
 * an object URL to the napplet; it never opens a raw network path.
 */
export function renderResourceLoader(entries: readonly ResourceTableEntry[]): string {
  const table = renderPrivateResourceTable(entries).replace(/<\/script/gi, '<\\/script');
  return `(() => {\nconst table = new Map(${table}.map((entry) => [entry.source, entry]));\nasync function load(source) {\n  const entry = table.get(source);\n  if (!entry) throw new Error('unknown optimized resource: ' + source);\n  const blob = await window.napplet.resource.bytes(entry.uri);\n  if (blob.size !== entry.bytes) throw new Error('optimized resource length mismatch');\n  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))).map((byte) => byte.toString(16).padStart(2, '0')).join('');\n  if (digest !== entry.sha256) throw new Error('optimized resource digest mismatch');\n  return blob;\n}\nwindow.__nappletPrivateResourceLoader = { load };\n})();`;
}

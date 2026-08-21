import { describe, expect, it } from 'vitest';
import {
  classifyAssetReferences,
  inventoryArtifactReferences,
  rewriteSupportedReferences,
  type ReferenceBuild,
  type RetainedArtifact,
} from './references.js';
import type { RetainedAsset } from './pipeline.js';

function asset(source: string): RetainedAsset {
  return {
    source,
    reference: source,
    bytes: new Uint8Array([1]),
    mime: 'application/octet-stream',
  };
}

function build(assets: RetainedAsset[], artifacts: RetainedArtifact[]): ReferenceBuild {
  return { assets, artifacts };
}

describe('optimizer reference inventory', () => {
  it('classifies controlled JavaScript sentinels and generated media owners as eligible', () => {
    const image = asset('assets/image.png');
    const artifacts: RetainedArtifact[] = [{
      path: 'assets/entry.js',
      kind: 'javascript',
      content: [
        'const source = __nappletAssetUrl("assets/image.png");',
        'fetch(__nappletAssetUrl("assets/image.png"));',
        'const ownedMedia = __nappletAssetUrl("assets/image.png", "media");',
      ].join('\n'),
    }];
    const inventory = inventoryArtifactReferences(build([image], artifacts));

    expect(classifyAssetReferences(image, inventory)).toEqual({
      eligible: true,
      reasons: [],
      references: expect.arrayContaining([
        expect.objectContaining({ form: 'js-sentinel', supported: true }),
        expect.objectContaining({ form: 'js-fetch-sentinel', supported: true }),
        expect.objectContaining({ form: 'js-media-sentinel', supported: true }),
      ]),
    });
  });

  it('uses a CSS value parser for static url and font references without corrupting values', () => {
    const image = asset('assets/image.png');
    const font = asset('assets/font.woff2');
    const css: RetainedArtifact = {
      path: 'assets/site.css',
      kind: 'stylesheet',
      content: '@font-face { src: local("Inter"), url(  "assets/font.woff2#latin"  ) format("woff2"), url(data:font/woff2;base64,AAAA); } .hero { background: /* keep */ url(assets/image.png#cover) no-repeat, url(assets/\\69 mage.png); }',
    };
    const inventory = inventoryArtifactReferences(build([image, font], [css]));
    const rewritten = rewriteSupportedReferences({
      artifact: css,
      inventory,
      replacements: new Map([
        ['assets/font.woff2', 'blossom:sha256:font'],
        ['assets/image.png', 'blossom:sha256:image'],
      ]),
    });

    expect(classifyAssetReferences(image, inventory).eligible).toBe(true);
    expect(classifyAssetReferences(font, inventory).eligible).toBe(true);
    expect(rewritten.content).toBe('@font-face { src: local("Inter"), url(  "blossom:sha256:font#latin"  ) format("woff2"), url(data:font/woff2;base64,AAAA); } .hero { background: /* keep */ url(blossom:sha256:image#cover) no-repeat, url(blossom:sha256:image); }');
    expect(rewritten.content).toContain('/* keep */');
    expect(rewritten.content).toContain('data:font/woff2;base64,AAAA');
  });

  it.each([
    ['direct HTML', 'html', '<img src="assets/image.png">', 'html-attribute'],
    ['srcset', 'html', '<img srcset="assets/image.png 1x">', 'html-srcset'],
    ['inline CSS', 'inline-css', 'background: url(assets/image.png)', 'inline-css'],
    ['computed string', 'javascript', 'const source = "assets/image.png" + "?v=1";', 'computed-url'],
    ['worker URL', 'javascript', 'new Worker(__nappletAssetUrl("assets/image.png"));', 'worker-url'],
    ['shared worker URL', 'javascript', 'new SharedWorker(__nappletAssetUrl("assets/image.png"));', 'worker-url'],
    ['module import', 'javascript', 'import(__nappletAssetUrl("assets/image.png"));', 'module-url'],
    ['WASM streaming', 'javascript', 'WebAssembly.instantiateStreaming(fetch(__nappletAssetUrl("assets/image.png")));', 'wasm-streaming-url'],
  ] as const)('preserves and reports %s references as ineligible', (_name, kind, content, reason) => {
    const image = asset('assets/image.png');
    const artifact: RetainedArtifact = { path: 'assets/entry', kind, content };
    const inventory = inventoryArtifactReferences(build([image], [artifact]));
    const classification = classifyAssetReferences(image, inventory);
    const rewritten = rewriteSupportedReferences({
      artifact,
      inventory,
      replacements: new Map([['assets/image.png', 'blossom:sha256:replacement']]),
    });

    expect(classification.eligible).toBe(false);
    expect(classification.reasons).toContain(reason);
    expect(rewritten.content).toBe(content);
  });

  it('makes a mixed asset wholly ineligible with stable reasons and locations', () => {
    const image = asset('assets/image.png');
    const inventory = inventoryArtifactReferences(build([image], [
      { path: 'assets/entry.js', kind: 'javascript', content: 'fetch(__nappletAssetUrl("assets/image.png"));' },
      { path: 'index.html', kind: 'html', content: '<img src="assets/image.png">' },
    ]));
    const classification = classifyAssetReferences(image, inventory);

    expect(classification).toMatchObject({
      eligible: false,
      reasons: ['html-attribute'],
      references: [
        expect.objectContaining({ location: 'assets/entry.js:6', supported: true }),
        expect.objectContaining({ location: 'index.html:10', supported: false }),
      ],
    });
  });
});

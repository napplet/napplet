import { describe, expect, it } from 'vitest';
import {
  MAX_FIXTURE_ASSET_BYTES,
  buildLargeAssetFixture,
  runLargeAssetFixture,
} from './large-fixture.js';

describe('generated large-asset optimizer fixture', () => {
  it('proves the bounded 50 MiB+ end-to-end optimization contract', async () => {
    const fixture = buildLargeAssetFixture();
    const evidence = await runLargeAssetFixture(fixture);

    expect(fixture.totalCandidateBytes).toBeGreaterThan(50 * 1024 * 1024);
    expect(fixture.assets).toHaveLength(7);
    expect(Math.max(...fixture.assets.map((asset) => asset.bytes.byteLength))).toBeLessThanOrEqual(MAX_FIXTURE_ASSET_BYTES);
    expect(evidence.initialHtmlBytes).toBeGreaterThan(2 * 1024 * 1024);
    expect(evidence.finalHtmlBytes).toBeLessThan(2 * 1024 * 1024);
    expect(evidence.selected).toEqual([...evidence.selected].sort((left, right) => right.bytes - left.bytes || left.source.localeCompare(right.source)));
    expect(evidence.aggregateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.recovery.every((entry) => entry.exact)).toBe(true);
  });
});

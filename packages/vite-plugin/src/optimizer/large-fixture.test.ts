import { describe, expect, it } from 'vitest';
import expectedEvidence from './large-fixture.evidence.json';
import {
  MAX_FIXTURE_ASSET_BYTES,
  buildLargeAssetFixture,
  runLargeAssetFixture,
  runWholeBlobPortabilityFallback,
} from './large-fixture.js';

describe('generated large-asset optimizer fixture', () => {
  it('proves the bounded 50 MiB+ end-to-end optimization contract', async () => {
    const fixture = buildLargeAssetFixture();
    const evidence = await runLargeAssetFixture(fixture);

    expect(fixture.totalCandidateBytes).toBe(expectedEvidence.candidateBytes);
    expect(fixture.totalCandidateBytes).toBeGreaterThan(50 * 1024 * 1024);
    expect(fixture.assets).toHaveLength(expectedEvidence.assetCount);
    expect(Math.max(...fixture.assets.map((asset) => asset.bytes.byteLength))).toBeLessThanOrEqual(MAX_FIXTURE_ASSET_BYTES);
    expect(MAX_FIXTURE_ASSET_BYTES).toBe(expectedEvidence.maximumWholeBlobBytes);
    expect(evidence.initialHtmlBytes).toBe(expectedEvidence.initialHtmlBytes);
    expect(evidence.initialHtmlBytes).toBeGreaterThan(2 * 1024 * 1024);
    expect(evidence.finalHtmlBytes).toBeLessThan(2 * 1024 * 1024);
    expect(evidence.selected).toEqual([...evidence.selected].sort((left, right) => right.bytes - left.bytes || left.source.localeCompare(right.source)));
    expect(evidence.selected).toEqual(expectedEvidence.selected);
    expect(evidence.uploads).toHaveLength(evidence.selected.length);
    expect(evidence.uploads.every((entry) => entry.authorizationKind === 24_242 && entry.authorizationVerified && entry.descriptorVerified)).toBe(true);
    expect(evidence.manifestTags.filter((tag) => tag[0] === 'requires' && tag[1] === 'resource')).toEqual([['requires', 'resource']]);
    expect(evidence.manifestTags.flat()).not.toContain('data-napplet-private-resource-table');
    expect(evidence.manifestTags.flat().join(' ')).not.toContain('blossom:sha256:');
    expect(evidence.privateMappingCount).toBe(evidence.selected.length);
    expect(evidence.removedCandidateSources).toEqual(evidence.selected.map((entry) => entry.source));
    expect(evidence.preservedCandidateSources).toEqual([]);
    expect(evidence.discovery.writeRelays.map((relay) => relay.replace(/\/$/, ''))).toEqual(expectedEvidence.discovery.writeRelays);
    expect(evidence.discovery.servers).toEqual(expectedEvidence.discovery.servers);
    expect(evidence.discovery.ignoredForgedEvent).toBe(true);
    expect(evidence.discovery.ignoredOlderEvent).toBe(true);
    expect(evidence.secondaryUploadFailed).toBe(true);
    expect(evidence.corruptResourceRejected).toBe(true);
    expect(evidence.aggregateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.finalIndexHash).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.recovery.every((entry) => entry.exact)).toBe(true);
    expect(evidence.executedResourceCalls.sort()).toEqual(evidence.selected.map((entry) => entry.source).sort());
  });

  it('keeps an over-limit whole Blob inline without claiming streaming or ranges', async () => {
    const evidence = await runWholeBlobPortabilityFallback();

    expect(evidence.wholeBlobPreserved).toBe(true);
    expect(evidence.reason).toContain('whole-Blob portability limit');
    expect(evidence.reason).not.toContain('streaming success');
    expect(evidence.resourceRequirementPresent).toBe(false);
  });
});

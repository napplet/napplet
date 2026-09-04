#!/usr/bin/env node

import * as crypto from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import * as zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { nip19 } from 'nostr-tools';
import { verifyEvent } from 'nostr-tools/pure';
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool';

const execFile = promisify(execFileCallback);
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40}$/;
const SCREENSHOT_STATES = ['initial', 'active-35s', 'partial', 'error', 'ready', 'cancelled', 'light', 'dark', 'reduced-motion', 'keyboard-retry'];
const SESSION_NAMES = ['packaged-loader-long', 'packaged-loader-retry', 'packaged-loader-cancel', 'packaged-loader-a11y'];
const ROOT_KEYS = ['browser', 'manifest', 'resources', 'schemaVersion', 'screenshots', 'sessions', 'trace'];
const MAX_TRACE_ENTRY_BYTES = 100 * 1024 * 1024;
const MAX_TRACE_TOTAL_BYTES = 250 * 1024 * 1024;

function fail(message) {
  throw new Error(`packaged loader evidence is invalid: ${message}`);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  return value;
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(object(value, label)).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(`${label} has unknown or missing fields`);
}

function string(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} must be a non-empty string`);
  return value;
}

function integer(value, label) {
  if (!Number.isSafeInteger(value)) fail(`${label} must be a safe integer`);
  return value;
}

function hash(value, label) {
  if (typeof value !== 'string' || !SHA256.test(value)) fail(`${label} must be lowercase SHA-256`);
  return value;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sameStrings(left, right) {
  const first = [...left].sort();
  const second = [...right].sort();
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function safeFile(root, filename, label) {
  string(filename, label);
  if (path.isAbsolute(filename) || filename.includes('\\') || filename.split('/').includes('..')) fail(`${label} is unsafe`);
  const resolved = path.resolve(root, filename);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) fail(`${label} escapes the evidence directory`);
  return resolved;
}

/** Compute the canonical NIP-5A aggregate over sorted hash/path lines. */
export function computeAggregateHash(paths) {
  if (!Array.isArray(paths) || paths.length === 0) fail('manifest paths must be a non-empty array');
  const lines = paths.map((entry, index) => {
    exactKeys(entry, ['path', 'sha256'], `manifest.paths[${index}]`);
    const file = string(entry.path, `manifest.paths[${index}].path`);
    if (!file.startsWith('/') || file.endsWith('/')) fail(`manifest.paths[${index}].path must be an absolute file path`);
    return `${hash(entry.sha256, `manifest.paths[${index}].sha256`)} ${file}\n`;
  });
  return sha256(Buffer.from(lines.sort().join(''), 'utf8'));
}

function validateTimelineShape(timeline) {
  exactKeys(timeline, ROOT_KEYS, 'timeline');
  if (timeline.schemaVersion !== 1) fail('unsupported timeline schemaVersion');
  exactKeys(timeline.browser, ['name', 'version'], 'browser');
  string(timeline.browser.name, 'browser.name');
  string(timeline.browser.version, 'browser.version');

  exactKeys(timeline.manifest, ['aggregateHash', 'author', 'dTag', 'eventId', 'index', 'kind', 'naddr', 'paths', 'relays', 'servers'], 'manifest');
  string(timeline.manifest.naddr, 'manifest.naddr');
  hash(timeline.manifest.eventId, 'manifest.eventId');
  hash(timeline.manifest.author, 'manifest.author');
  integer(timeline.manifest.kind, 'manifest.kind');
  string(timeline.manifest.dTag, 'manifest.dTag');
  if (!Array.isArray(timeline.manifest.relays) || timeline.manifest.relays.length === 0 || timeline.manifest.relays.some((relay) => typeof relay !== 'string')) fail('manifest.relays must be non-empty strings');
  if (!Array.isArray(timeline.manifest.servers) || timeline.manifest.servers.length === 0 || timeline.manifest.servers.some((server) => typeof server !== 'string')) fail('manifest.servers must be non-empty strings');
  if (!Array.isArray(timeline.manifest.paths)) fail('manifest.paths must be an array');
  hash(timeline.manifest.aggregateHash, 'manifest.aggregateHash');
  exactKeys(timeline.manifest.index, ['bytes', 'endpoint', 'path', 'sha256'], 'manifest.index');
  string(timeline.manifest.index.path, 'manifest.index.path');
  string(timeline.manifest.index.endpoint, 'manifest.index.endpoint');
  if (integer(timeline.manifest.index.bytes, 'manifest.index.bytes') < 0) fail('manifest.index.bytes must not be negative');
  hash(timeline.manifest.index.sha256, 'manifest.index.sha256');

  if (!Array.isArray(timeline.resources) || timeline.resources.length === 0) fail('resources must be a non-empty array');
  for (const [index, resource] of timeline.resources.entries()) {
    exactKeys(resource, ['bytes', 'endpoint', 'sha256', 'source', 'uri'], `resources[${index}]`);
    string(resource.source, `resources[${index}].source`);
    string(resource.uri, `resources[${index}].uri`);
    string(resource.endpoint, `resources[${index}].endpoint`);
    if (integer(resource.bytes, `resources[${index}].bytes`) < 0) fail(`resources[${index}].bytes must not be negative`);
    hash(resource.sha256, `resources[${index}].sha256`);
  }

  if (!Array.isArray(timeline.screenshots)) fail('screenshots must be an array');
  for (const [index, screenshot] of timeline.screenshots.entries()) {
    exactKeys(screenshot, ['file', 'height', 'session', 'sha256', 'state', 'width'], `screenshots[${index}]`);
    string(screenshot.state, `screenshots[${index}].state`);
    string(screenshot.file, `screenshots[${index}].file`);
    string(screenshot.session, `screenshots[${index}].session`);
    if (integer(screenshot.width, `screenshots[${index}].width`) < 1 || integer(screenshot.height, `screenshots[${index}].height`) < 1) fail(`screenshots[${index}] dimensions must be positive`);
    hash(screenshot.sha256, `screenshots[${index}].sha256`);
  }
  exactKeys(timeline.trace, ['file', 'sha256'], 'trace');
  string(timeline.trace.file, 'trace.file');
  hash(timeline.trace.sha256, 'trace.sha256');
}

function eventKeys(event) {
  if (event.type === 'state') return ['at', 'state', 'type'];
  if (event.type === 'request') return ['at', 'attempt', 'source', 'type'];
  if (event.type === 'terminal') return ['at', 'attempt', 'outcome', 'source', 'type'];
  if (event.type === 'cancel' || event.type === 'retry') return ['at', 'source', 'type'];
  if (event.type === 'navigation' || event.type === 'final-app') return ['at', 'type'];
  fail('session event has an unknown type');
}

function orderedIndex(events, predicate, label) {
  const index = events.findIndex(predicate);
  if (index < 0) fail(`session is missing ${label}`);
  return index;
}

function validateSessions(timeline) {
  if (!Array.isArray(timeline.sessions)) fail('sessions must be an array');
  const names = timeline.sessions.map((session) => session.name);
  if (!sameStrings(names, SESSION_NAMES) || new Set(names).size !== SESSION_NAMES.length) fail('required sessions do not match');
  for (const [sessionIndex, session] of timeline.sessions.entries()) {
    exactKeys(session, ['closed', 'closedAt', 'events', 'name', 'openedAt'], `sessions[${sessionIndex}]`);
    string(session.name, `sessions[${sessionIndex}].name`);
    const openedAt = integer(session.openedAt, `sessions[${sessionIndex}].openedAt`);
    const closedAt = integer(session.closedAt, `sessions[${sessionIndex}].closedAt`);
    if (session.closed !== true || !Array.isArray(session.events) || session.events.length === 0) fail(`${session.name} must be closed with events`);
    let previous = openedAt - 1;
    const terminals = new Set();
    for (const [eventIndex, event] of session.events.entries()) {
      exactKeys(event, eventKeys(event), `${session.name}.events[${eventIndex}]`);
      const at = integer(event.at, `${session.name}.events[${eventIndex}].at`);
      if (at <= previous || at < openedAt || at >= closedAt) fail(`${session.name} events are not strictly monotonic within session bounds`);
      previous = at;
      if (event.type === 'state') string(event.state, `${session.name}.events[${eventIndex}].state`);
      if ('source' in event) string(event.source, `${session.name}.events[${eventIndex}].source`);
      if ('attempt' in event && integer(event.attempt, `${session.name}.events[${eventIndex}].attempt`) < 1) fail('attempt must be positive');
      if (event.type === 'terminal') {
        if (!['success', 'failure', 'cancelled'].includes(event.outcome)) fail('terminal outcome is invalid');
        const key = `${event.source}:${event.attempt}`;
        if (terminals.has(key)) fail('duplicate terminal event');
        terminals.add(key);
      }
    }
    const navigation = orderedIndex(session.events, (event) => event.type === 'navigation', 'navigation');
    const initial = orderedIndex(session.events, (event) => event.type === 'state' && event.state === 'initial', 'initial state');
    const finalApp = orderedIndex(session.events, (event) => event.type === 'final-app', 'final application');
    if (!(navigation < initial && initial < finalApp)) fail(`${session.name} has invalid navigation/final application order`);
  }

  const long = timeline.sessions.find((session) => session.name === 'packaged-loader-long');
  const request = long.events.find((event) => event.type === 'request');
  const active = long.events.find((event) => event.type === 'state' && event.state === 'active');
  const sample = long.events.find((event) => event.type === 'state' && event.state === 'active-35s');
  const terminal = long.events.find((event) => event.type === 'terminal' && event.source === request?.source && event.attempt === request?.attempt);
  if (!request || !active || !sample || !terminal || !(request.at < active.at && active.at < sample.at && sample.at < terminal.at)) fail('long session does not prove a pending active request');
  const activeDurationMs = sample.at - active.at;
  if (activeDurationMs < 35_000) fail('derived active duration is below 35 seconds');
  const partial = orderedIndex(long.events, (event) => event.type === 'state' && event.state === 'partial', 'partial state');
  const ready = orderedIndex(long.events, (event) => event.type === 'state' && event.state === 'ready', 'ready state');
  const finalApp = orderedIndex(long.events, (event) => event.type === 'final-app', 'final application');
  if (!(partial < ready && ready < finalApp)) fail('long session has invalid partial/ready/handoff order');

  const retry = timeline.sessions.find((session) => session.name === 'packaged-loader-retry');
  const retryOrder = [
    orderedIndex(retry.events, (event) => event.type === 'terminal' && event.outcome === 'failure', 'failed terminal'),
    orderedIndex(retry.events, (event) => event.type === 'state' && event.state === 'error', 'error state'),
    orderedIndex(retry.events, (event) => event.type === 'retry', 'retry'),
    orderedIndex(retry.events, (event) => event.type === 'request' && event.attempt === 2, 'retry request'),
    orderedIndex(retry.events, (event) => event.type === 'terminal' && event.attempt === 2 && event.outcome === 'success', 'retry success'),
    orderedIndex(retry.events, (event) => event.type === 'state' && event.state === 'ready', 'ready state'),
  ];
  if (retryOrder.some((value, index) => index > 0 && value <= retryOrder[index - 1])) fail('retry session order is invalid');

  const cancel = timeline.sessions.find((session) => session.name === 'packaged-loader-cancel');
  const cancelOrder = [
    orderedIndex(cancel.events, (event) => event.type === 'cancel', 'cancel'),
    orderedIndex(cancel.events, (event) => event.type === 'terminal' && event.outcome === 'cancelled', 'cancelled terminal'),
    orderedIndex(cancel.events, (event) => event.type === 'state' && event.state === 'cancelled', 'cancelled state'),
    orderedIndex(cancel.events, (event) => event.type === 'retry', 'retry'),
    orderedIndex(cancel.events, (event) => event.type === 'request' && event.attempt === 2, 'retry request'),
    orderedIndex(cancel.events, (event) => event.type === 'terminal' && event.attempt === 2 && event.outcome === 'success', 'retry success'),
  ];
  if (cancelOrder.some((value, index) => index > 0 && value <= cancelOrder[index - 1])) fail('cancel session order is invalid');
  return activeDurationMs;
}

function validatePng(value, screenshot) {
  if (value.length < 24 || value.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') fail(`screenshot ${screenshot.file} has an invalid PNG signature`);
  if (value.readUInt32BE(8) !== 13 || value.subarray(12, 16).toString('ascii') !== 'IHDR') fail(`screenshot ${screenshot.file} has an invalid IHDR`);
  const width = value.readUInt32BE(16);
  const height = value.readUInt32BE(20);
  if (width < 1 || height < 1 || width !== screenshot.width || height !== screenshot.height) fail(`screenshot ${screenshot.file} dimensions do not match`);
  if (sha256(value) !== screenshot.sha256) fail(`screenshot ${screenshot.file} hash does not match`);
}

function findEocd(value) {
  for (let index = value.length - 22; index >= Math.max(0, value.length - 65_557); index -= 1) {
    if (value.readUInt32LE(index) === 0x06054b50) return index;
  }
  return -1;
}

function safeZipName(name) {
  return name.length > 0 && !name.includes('\\') && !name.startsWith('/') && !name.split('/').includes('..') && !name.includes('\0');
}

function parseTraceZip(value) {
  const eocd = findEocd(value);
  if (eocd < 0 || eocd + 22 > value.length) fail('trace ZIP has no valid EOCD');
  const commentLength = value.readUInt16LE(eocd + 20);
  if (eocd + 22 + commentLength !== value.length || value.readUInt16LE(eocd + 4) !== 0 || value.readUInt16LE(eocd + 6) !== 0) fail('trace ZIP EOCD is invalid');
  const diskEntries = value.readUInt16LE(eocd + 8);
  const entries = value.readUInt16LE(eocd + 10);
  const centralSize = value.readUInt32LE(eocd + 12);
  const centralOffset = value.readUInt32LE(eocd + 16);
  if (entries < 1 || entries !== diskEntries || centralOffset + centralSize !== eocd) fail('trace ZIP central directory bounds are invalid');
  let cursor = centralOffset;
  let total = 0;
  const extracted = new Map();
  for (let index = 0; index < entries; index += 1) {
    if (cursor + 46 > eocd || value.readUInt32LE(cursor) !== 0x02014b50) fail('trace ZIP central directory is corrupt');
    const flags = value.readUInt16LE(cursor + 8);
    const method = value.readUInt16LE(cursor + 10);
    const compressedSize = value.readUInt32LE(cursor + 20);
    const uncompressedSize = value.readUInt32LE(cursor + 24);
    const nameLength = value.readUInt16LE(cursor + 28);
    const extraLength = value.readUInt16LE(cursor + 30);
    const entryCommentLength = value.readUInt16LE(cursor + 32);
    const localOffset = value.readUInt32LE(cursor + 42);
    const end = cursor + 46 + nameLength + extraLength + entryCommentLength;
    if (end > eocd || (flags & 1) !== 0 || ![0, 8].includes(method)) fail('trace ZIP entry metadata is invalid');
    const name = value.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    if (!safeZipName(name) || uncompressedSize > MAX_TRACE_ENTRY_BYTES) fail('trace ZIP entry is unsafe');
    if (localOffset + 30 > centralOffset || value.readUInt32LE(localOffset) !== 0x04034b50) fail('trace ZIP local header is invalid');
    const localNameLength = value.readUInt16LE(localOffset + 26);
    const localExtraLength = value.readUInt16LE(localOffset + 28);
    const localName = value.subarray(localOffset + 30, localOffset + 30 + localNameLength).toString('utf8');
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (localName !== name || dataOffset + compressedSize > centralOffset) fail('trace ZIP local entry does not match central directory');
    const compressed = value.subarray(dataOffset, dataOffset + compressedSize);
    let content;
    try {
      content = method === 0 ? Buffer.from(compressed) : zlib.inflateRawSync(compressed, { maxOutputLength: MAX_TRACE_ENTRY_BYTES });
    } catch {
      fail('trace ZIP entry cannot be inflated');
    }
    if (content.length !== uncompressedSize) fail('trace ZIP entry length does not match');
    total += content.length;
    if (total > MAX_TRACE_TOTAL_BYTES) fail('trace ZIP expands beyond the validation bound');
    extracted.set(name, content);
    cursor = end;
  }
  if (cursor !== centralOffset + centralSize) fail('trace ZIP central directory size does not match');
  const names = [...extracted.keys()];
  if (!names.some((name) => name.endsWith('trace.trace')) || !names.some((name) => name.endsWith('trace.network'))) fail('trace ZIP is missing Playwright trace entries');
  return extracted;
}

function validateScreenshots(timeline, evidenceDir) {
  const states = timeline.screenshots.map((screenshot) => screenshot.state);
  if (!sameStrings(states, SCREENSHOT_STATES) || new Set(states).size !== SCREENSHOT_STATES.length) fail('required screenshot states do not match');
  const sessionByName = new Map(timeline.sessions.map((session) => [session.name, session]));
  for (const screenshot of timeline.screenshots) {
    const session = sessionByName.get(screenshot.session);
    if (!session || !session.events.some((event) => event.type === 'state' && event.state === screenshot.state)) fail(`screenshot ${screenshot.state} is not associated with its session state`);
    const file = safeFile(evidenceDir, screenshot.file, `screenshot ${screenshot.state}`);
    validatePng(fs.readFileSync(file), screenshot);
  }
}

function canonicalEndpoint(servers, digest, endpoint) {
  return servers.some((server) => `${server.replace(/\/+$/, '')}/${digest}` === endpoint);
}

function parsePrivateTable(indexBytes) {
  const html = indexBytes.toString('utf8');
  const match = /<script type=["']application\/json["'] data-napplet-private-resource-table>([\s\S]*?)<\/script>/i.exec(html);
  if (!match) fail('deployed index is missing the private resource table');
  let table;
  try {
    table = JSON.parse(match[1]);
  } catch {
    fail('deployed private resource table is invalid JSON');
  }
  if (!Array.isArray(table) || table.length === 0) fail('deployed private resource table is empty');
  return table;
}

function eventPathTags(event) {
  const paths = event.tags.filter((tag) => tag[0] === 'path').map((tag, index) => {
    if (tag.length !== 3) fail(`manifest path tag ${index} is invalid`);
    return { path: tag[1], sha256: tag[2] };
  });
  const unique = new Set(paths.map((entry) => entry.path));
  if (unique.size !== paths.length) fail('manifest has duplicate paths');
  return paths;
}

async function validateManifestAndBytes(timeline, services) {
  if (typeof services?.queryRelay !== 'function' || typeof services?.fetchBytes !== 'function') fail('relay and fetch services are required');
  let decoded;
  try {
    decoded = nip19.decode(timeline.manifest.naddr);
  } catch {
    fail('manifest naddr cannot be decoded');
  }
  if (decoded.type !== 'naddr') fail('manifest pointer is not an naddr');
  const pointer = decoded.data;
  if (pointer.pubkey !== timeline.manifest.author || pointer.kind !== timeline.manifest.kind || pointer.identifier !== timeline.manifest.dTag || !sameStrings(pointer.relays ?? [], timeline.manifest.relays)) fail('manifest naddr identity does not match timeline');
  const events = await services.queryRelay({
    relays: timeline.manifest.relays,
    filter: { kinds: [pointer.kind], authors: [pointer.pubkey], '#d': [pointer.identifier] },
  });
  if (!Array.isArray(events)) fail('relay query did not return events');
  const event = events.find((candidate) => candidate?.id === timeline.manifest.eventId);
  if (!event || event.pubkey !== pointer.pubkey || event.kind !== pointer.kind || !verifyEvent(event)) fail('recorded manifest event is missing or invalid');
  const dTags = event.tags.filter((tag) => tag[0] === 'd');
  if (dTags.length !== 1 || dTags[0].length !== 2 || dTags[0][1] !== pointer.identifier) fail('manifest d-tag does not match naddr');
  const paths = eventPathTags(event);
  const recordedPaths = timeline.manifest.paths;
  if (paths.length !== recordedPaths.length || !sameStrings(paths.map((entry) => `${entry.sha256} ${entry.path}`), recordedPaths.map((entry) => `${entry.sha256} ${entry.path}`))) fail('recorded manifest paths do not match signed event');
  const aggregateHash = computeAggregateHash(paths);
  const xTags = event.tags.filter((tag) => tag[0] === 'x' && tag[2] === 'aggregate');
  if (xTags.length !== 1 || xTags[0].length !== 3 || xTags[0][1] !== aggregateHash || timeline.manifest.aggregateHash !== aggregateHash) fail('manifest aggregate does not match canonical path lines');
  const eventServers = event.tags.filter((tag) => tag[0] === 'server' && tag.length === 2).map((tag) => tag[1]);
  if (!sameStrings(eventServers, timeline.manifest.servers)) fail('manifest server evidence does not match signed event');
  const indexPath = paths.find((entry) => entry.path === timeline.manifest.index.path);
  if (!indexPath || indexPath.sha256 !== timeline.manifest.index.sha256 || !canonicalEndpoint(timeline.manifest.servers, indexPath.sha256, timeline.manifest.index.endpoint)) fail('deployed index association is invalid');
  let indexBytes;
  try {
    indexBytes = Buffer.from(await services.fetchBytes(timeline.manifest.index.endpoint));
  } catch {
    fail('deployed index endpoint is unavailable');
  }
  if (indexBytes.length !== timeline.manifest.index.bytes || sha256(indexBytes) !== timeline.manifest.index.sha256) fail('deployed index bytes do not match timeline and manifest');
  const table = parsePrivateTable(indexBytes);
  if (table.length !== timeline.resources.length) fail('resource evidence count does not match private table');
  for (let index = 0; index < table.length; index += 1) {
    const tableEntry = table[index];
    const resource = timeline.resources[index];
    if (!tableEntry || !resource || tableEntry.source !== resource.source || tableEntry.uri !== resource.uri || tableEntry.sha256 !== resource.sha256 || tableEntry.bytes !== resource.bytes || resource.uri !== `blossom:sha256:${resource.sha256}` || !canonicalEndpoint(timeline.manifest.servers, resource.sha256, resource.endpoint)) fail(`resource association ${index} does not match private table`);
    let value;
    try {
      value = Buffer.from(await services.fetchBytes(resource.endpoint));
    } catch {
      fail(`resource endpoint ${index} is unavailable`);
    }
    if (value.length !== resource.bytes || sha256(value) !== resource.sha256) fail(`resource bytes ${index} do not match evidence`);
  }
}

function secretVariants(secretText) {
  const raw = secretText.trim();
  if (!raw) fail('secret file is empty');
  const variants = new Set([raw]);
  const utf8 = Buffer.from(raw, 'utf8');
  variants.add(utf8.toString('hex'));
  variants.add(utf8.toString('base64'));
  variants.add(utf8.toString('base64url'));
  let keyBytes;
  if (/^[a-fA-F0-9]{64}$/.test(raw)) keyBytes = Buffer.from(raw, 'hex');
  else if (raw.startsWith('nsec1')) {
    try {
      const decoded = nip19.decode(raw);
      if (decoded.type === 'nsec') keyBytes = Buffer.from(decoded.data);
    } catch {
      fail('secret file contains an invalid nsec');
    }
  }
  if (keyBytes) {
    variants.add(keyBytes.toString('hex'));
    variants.add(keyBytes.toString('hex').toUpperCase());
    variants.add(keyBytes.toString('base64'));
    variants.add(keyBytes.toString('base64url'));
    variants.add(nip19.nsecEncode(keyBytes));
  }
  return [...variants].filter((variant) => variant.length >= 8);
}

function scanSecret(value, variants, label) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  if (variants.some((variant) => buffer.includes(Buffer.from(variant)))) fail(`secret material found in ${label}`);
}

function readMetadata(file, label) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    fail(`${label} is missing`);
  }
  const value = (key) => new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm').exec(content)?.[1];
  return { content, value };
}

async function validatePublication(publication, services, variants) {
  const git = services?.git;
  const github = services?.github;
  if (!git || !github) fail('publication git and GitHub services are required');
  const review = readMetadata(publication.reviewPath, 'review report');
  const verification = readMetadata(publication.verificationPath, 'verification report');
  const h1 = review.value('reviewed_sha');
  if (!h1 || !GIT_SHA.test(h1) || verification.value('reviewed_sha') !== h1 || review.value('status') !== 'passed') fail('H1 review provenance is invalid');
  if (verification.value('status') !== 'gaps_found' || verification.value('requirements_failed') !== '0' || verification.value('publication_pending') !== 'true') fail('H1 verification is not pending-aware');
  const h2 = await git.localHead();
  if (!GIT_SHA.test(h2) || h2 === h1 || await git.remoteHead(publication.head) !== h2) fail('local and remote H2 do not match');
  const baseHead = await git.remoteHead(publication.base);
  if (!GIT_SHA.test(baseHead) || !await git.isAncestor(baseHead, h2)) fail('publication base is not an H2 ancestor');
  const planPrefix = publication.reviewPath.replace('-REVIEW.md', '');
  const expectedPaths = [
    `${planPrefix}-PLAN.md`,
    `${planPrefix}-RESEARCH.md`,
    `${planPrefix}-VALIDATION.md`,
    publication.reviewPath,
    publication.verificationPath,
    `${planPrefix}-SUMMARY.md`,
    '.planning/STATE.md',
  ];
  const changedPaths = await git.diffPaths(h1, h2);
  if (!sameStrings(changedPaths, expectedPaths) || new Set(changedPaths).size !== expectedPaths.length) fail('H1-to-H2 diff is not metadata-only');
  if (await git.treeHash(h1, expectedPaths) !== await git.treeHash(h2, expectedPaths)) fail('source or evidence changed between H1 and H2');
  const pr = await github.pullRequest({ repo: publication.repo, head: publication.head, base: publication.base });
  if (!pr || pr.state !== 'OPEN' || pr.merged || pr.headSha !== h2 || pr.head !== publication.head || pr.base !== publication.base) fail('pull request state or refs do not match H2');
  if (!pr.body.includes(h1) || !pr.body.includes(h2)) fail('pull request body does not contain current H1/H2 evidence');
  const timeline = await github.timeline({ repo: publication.repo, number: pr.number });
  if (!Array.isArray(timeline) || timeline.some((entry) => /force/i.test(String(entry?.type ?? '')))) fail('pull request contains a force-push event');
  scanSecret(review.content, variants, 'review report');
  scanSecret(verification.content, variants, 'verification report');
  scanSecret(await git.diffText(h1, h2), variants, 'H1-to-H2 diff');
  scanSecret(pr.body, variants, 'pull request body');
  return { h1, h2, pr: pr.number };
}

/** Validate retained loader evidence against local binaries and refetched public bytes. */
export async function validateEvidence({ evidenceDir: inputDirectory, secretFile, services, publication }) {
  const evidenceDir = path.resolve(inputDirectory);
  const timelinePath = path.join(evidenceDir, 'paja-loader-timeline.json');
  let timelineBytes;
  let timeline;
  try {
    timelineBytes = fs.readFileSync(timelinePath);
    timeline = JSON.parse(timelineBytes.toString('utf8'));
  } catch {
    fail('timeline is missing or invalid JSON');
  }
  validateTimelineShape(timeline);
  const activeDurationMs = validateSessions(timeline);
  validateScreenshots(timeline, evidenceDir);
  const tracePath = safeFile(evidenceDir, timeline.trace.file, 'trace.file');
  const traceBytes = fs.readFileSync(tracePath);
  if (sha256(traceBytes) !== timeline.trace.sha256) fail('trace full-file hash does not match');
  const traceEntries = parseTraceZip(traceBytes);
  await validateManifestAndBytes(timeline, services);

  let secretText;
  try {
    secretText = fs.readFileSync(secretFile, 'utf8');
  } catch {
    fail('secret file is unavailable');
  }
  const variants = secretVariants(secretText);
  for (const filename of fs.readdirSync(evidenceDir)) scanSecret(fs.readFileSync(path.join(evidenceDir, filename)), variants, `evidence file ${filename}`);
  for (const [name, value] of traceEntries) scanSecret(value, variants, `trace entry ${name}`);
  const publicationResult = publication ? await validatePublication(publication, services, variants) : undefined;
  return {
    screenshots: timeline.screenshots.length,
    resources: timeline.resources.length,
    activeDurationMs,
    publication: Boolean(publication),
    ...(publicationResult ?? {}),
  };
}

/** Parse the retained-validator CLI contract. */
export function parseCliArgs(argv) {
  const values = [...argv];
  const evidenceDir = values.shift();
  if (!evidenceDir || evidenceDir.startsWith('-')) throw new Error('usage: validate-packaged-loader-evidence <evidence-dir> --secret-file <path> [--publication --repo <owner/name> --head <branch> --base <branch> --review <path> --verification <path>]');
  const parsed = {};
  let publication = false;
  while (values.length > 0) {
    const flag = values.shift();
    if (flag === '--publication') {
      if (publication) throw new Error('duplicate --publication');
      publication = true;
      continue;
    }
    if (!['--secret-file', '--repo', '--head', '--base', '--review', '--verification'].includes(flag)) throw new Error(`unknown option: ${flag}`);
    const value = values.shift();
    if (!value || value.startsWith('-')) throw new Error(`missing value for ${flag}`);
    const key = flag.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    if (key in parsed) throw new Error(`duplicate option: ${flag}`);
    parsed[key] = value;
  }
  if (!parsed.secretFile) throw new Error('--secret-file is required');
  if (!publication) return { evidenceDir, secretFile: parsed.secretFile };
  const required = ['repo', 'head', 'base', 'review', 'verification'];
  if (required.some((key) => !parsed[key])) throw new Error('publication mode requires --repo, --head, --base, --review, and --verification');
  return {
    evidenceDir,
    secretFile: parsed.secretFile,
    publication: {
      repo: parsed.repo,
      head: parsed.head,
      base: parsed.base,
      reviewPath: parsed.review,
      verificationPath: parsed.verification,
    },
  };
}

async function command(commandName, args) {
  const result = await execFile(commandName, args, { cwd: process.cwd(), maxBuffer: 20 * 1024 * 1024 });
  return result.stdout.trim();
}

async function productionServices() {
  if (typeof globalThis.WebSocket !== 'function') {
    const { WebSocket } = await import('ws');
    useWebSocketImplementation(WebSocket);
  }
  return {
    queryRelay: async ({ relays, filter }) => {
      const pool = new SimplePool();
      try {
        return await pool.querySync(relays, filter);
      } finally {
        pool.close(relays);
      }
    },
    fetchBytes: async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    },
    git: {
      localHead: () => command('git', ['rev-parse', 'HEAD']),
      remoteHead: (ref) => command('git', ['rev-parse', `refs/remotes/origin/${ref}`]),
      isAncestor: async (ancestor, descendant) => {
        try {
          await command('git', ['merge-base', '--is-ancestor', ancestor, descendant]);
          return true;
        } catch {
          return false;
        }
      },
      diffPaths: async (from, to) => (await command('git', ['diff', '--name-only', from, to])).split('\n').filter(Boolean),
      treeHash: async (ref, excluded) => {
        const output = await command('git', ['ls-tree', '-r', ref]);
        const retained = output.split('\n').filter((line) => line && !excluded.some((file) => line.endsWith(`\t${file}`))).join('\n');
        return sha256(Buffer.from(retained));
      },
      diffText: (from, to) => command('git', ['diff', '--binary', from, to]),
    },
    github: {
      pullRequest: async ({ repo, head }) => {
        const value = JSON.parse(await command('gh', ['pr', 'view', head, '--repo', repo, '--json', 'number,state,mergedAt,headRefOid,headRefName,baseRefName,body']));
        return { number: value.number, state: value.state, merged: value.mergedAt !== null, headSha: value.headRefOid, head: value.headRefName, base: value.baseRefName, body: value.body ?? '' };
      },
      timeline: async ({ repo, number }) => {
        const pages = JSON.parse(await command('gh', ['api', `repos/${repo}/issues/${number}/events`, '--paginate', '--slurp']));
        return pages.flat().map((event) => ({ type: event.event }));
      },
    },
  };
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const result = await validateEvidence({ ...options, services: await productionServices() });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'packaged loader evidence validation failed');
    process.exitCode = 1;
  });
}

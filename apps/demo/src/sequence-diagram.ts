/**
 * sequence-diagram.ts -- SVG swimlane renderer for protocol message flow.
 *
 * Renders a vertical sequence diagram with three lanes:
 * - Left lane: Chat napplet
 * - Center lane: Shell
 * - Right lane: Bot napplet
 *
 * Uses full container width. Lanes spaced at 20%, 50%, 80%.
 */

import type { TappedMessage } from './shell-host.js';
import { BusKind, TOPICS } from '@napplet/shell';

const VERB_COLORS: Record<string, string> = {
  AUTH: '#b388ff',
  EVENT: '#39ff14',
  REQ: '#00f0ff',
  CLOSE: '#ff3b3b',
  OK: '#888899',
  EOSE: '#ffbf00',
  NOTICE: '#ffbf00',
  CLOSED: '#ff3b3b',
  COUNT: '#00f0ff',
  SYSTEM: '#ff00ff',
};

const LANE_NAMES = ['Chat', 'Shell', 'Bot'];
const LANE_PCTS = [0.15, 0.50, 0.85]; // percentage of width

const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 28;
const ARROW_HEAD_SIZE = 7;

function getLanePct(msg: TappedMessage): { from: number; to: number } {
  if (msg.direction === 'napplet->shell') {
    if (msg.parsed.topic === 'bot:response') {
      return { from: LANE_PCTS[2], to: LANE_PCTS[1] };
    }
    return { from: LANE_PCTS[0], to: LANE_PCTS[1] };
  } else {
    if (msg.parsed.topic === 'bot:response' || msg.parsed.topic === 'chat:message') {
      if (msg.parsed.topic === 'chat:message') {
        return { from: LANE_PCTS[1], to: LANE_PCTS[2] };
      }
      return { from: LANE_PCTS[1], to: LANE_PCTS[0] };
    }
    return { from: LANE_PCTS[1], to: LANE_PCTS[0] };
  }
}

function createArrow(fromPct: number, toPct: number, y: number, color: string): string {
  const direction = toPct > fromPct ? 1 : -1;
  // Use percentage-based coordinates in viewBox
  const fromX = fromPct * 1000;
  const toX = toPct * 1000;
  const endX = toX - (ARROW_HEAD_SIZE * direction);

  let svg = `<line x1="${fromX}" y1="${y}" x2="${endX}" y2="${y}" stroke="${color}" stroke-width="2" />`;
  svg += `<polygon points="${toX},${y} ${endX},${y - ARROW_HEAD_SIZE / 2} ${endX},${y + ARROW_HEAD_SIZE / 2}" fill="${color}" />`;
  return svg;
}

export function renderSequenceDiagram(messages: TappedMessage[]): string {
  const protocolMessages = messages.filter(m => m.verb !== 'SYSTEM');
  const height = HEADER_HEIGHT + (protocolMessages.length * ROW_HEIGHT) + 20;
  const vbWidth = 1000; // virtual viewBox width — maps to 100% actual width

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${height}" viewBox="0 0 ${vbWidth} ${height}" preserveAspectRatio="xMidYMin meet">`;

  svg += `<rect width="${vbWidth}" height="${height}" fill="#0a0a0f" />`;

  // Lane headers
  for (let i = 0; i < LANE_NAMES.length; i++) {
    const x = LANE_PCTS[i] * vbWidth;
    svg += `<text x="${x}" y="16" text-anchor="middle" fill="#00f0ff" font-family="monospace" font-size="13" font-weight="bold">${LANE_NAMES[i]}</text>`;
  }

  // Lane lifelines
  for (const pct of LANE_PCTS) {
    const x = pct * vbWidth;
    svg += `<line x1="${x}" y1="${HEADER_HEIGHT - 10}" x2="${x}" y2="${height}" stroke="#2a2a3a" stroke-width="1" stroke-dasharray="4,4" />`;
  }

  svg += `<line x1="0" y1="${HEADER_HEIGHT - 5}" x2="${vbWidth}" y2="${HEADER_HEIGHT - 5}" stroke="#2a2a3a" stroke-width="1" />`;

  // Messages
  for (let i = 0; i < protocolMessages.length; i++) {
    const msg = protocolMessages[i];
    const y = HEADER_HEIGHT + (i * ROW_HEIGHT) + ROW_HEIGHT / 2;
    const color = VERB_COLORS[msg.verb] || '#555555';
    const { from, to } = getLanePct(msg);

    if (from !== to) {
      svg += createArrow(from, to, y, color);
    } else {
      const x = from * vbWidth;
      svg += `<path d="M${x},${y - 4} C${x + 40},${y - 14} ${x + 40},${y + 14} ${x},${y + 4}" stroke="${color}" stroke-width="2" fill="none" />`;
    }

    // Label centered between lanes
    const labelX = (Math.min(from, to) + Math.abs(to - from) / 2) * vbWidth;
    const label = formatLabel(msg);
    svg += `<text x="${labelX}" y="${y - 6}" text-anchor="middle" fill="${color}" font-family="monospace" font-size="10">${escapeXml(label)}</text>`;
  }

  svg += '</svg>';
  return svg;
}

function formatLabel(msg: TappedMessage): string {
  const event = msg.verb === 'EVENT'
    ? ((msg.direction === 'shell->napplet' ? msg.raw[2] : msg.raw[1]) as { kind?: number; tags?: string[][] } | undefined)
    : undefined;
  const topic = event?.tags?.find((tag) => tag[0] === 't')?.[1] ?? msg.parsed.topic;
  switch (msg.verb) {
    case 'AUTH':
      if (typeof msg.raw[1] === 'string') return 'AUTH challenge';
      return 'AUTH response';
    case 'OK':
      return msg.parsed.success ? 'OK (accepted)' : 'OK (denied)';
    case 'EVENT':
      if (event?.kind === BusKind.IPC_PEER) {
        if (topic === TOPICS.STATE_GET || topic === TOPICS.STATE_KEYS) return `state read ${topic}`;
        if (topic === TOPICS.STATE_SET || topic === TOPICS.STATE_REMOVE || topic === TOPICS.STATE_CLEAR) return `state write ${topic}`;
        if (topic === 'chat:message' || topic === 'bot:response') return `ipc ${topic}`;
        return `ipc ${topic ?? 'event'}`;
      }
      if (event?.kind === BusKind.SIGNER_REQUEST) return 'signer request';
      if (event?.kind === BusKind.SIGNER_RESPONSE) return 'signer response';
      if (msg.parsed.topic) return `relay ${msg.parsed.topic}`;
      return `EVENT k:${msg.parsed.eventKind || '?'}`;
    case 'REQ':
      return `REQ ${msg.parsed.subId || ''}`.trim();
    case 'EOSE':
      return 'EOSE';
    case 'CLOSE':
      return 'CLOSE';
    case 'CLOSED':
      return `CLOSED ${(msg.parsed.reason || '').substring(0, 20)}`;
    case 'NOTICE':
      return 'NOTICE';
    default:
      return msg.verb;
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

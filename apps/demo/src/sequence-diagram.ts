/**
 * sequence-diagram.ts -- SVG swimlane renderer for protocol message flow.
 *
 * Renders a vertical sequence diagram with three lanes:
 * - Left lane: Chat napplet (napplet->shell messages from chat)
 * - Center lane: Shell (routing layer)
 * - Right lane: Bot napplet (messages to/from bot)
 *
 * Messages are drawn as arrows between lanes, color-coded by verb type.
 * The SVG auto-extends vertically as new messages arrive.
 */

import type { TappedMessage } from './shell-host.js';

/** Verb-to-color mapping (matches debugger live log colors) */
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

/** Lane positions (x coordinates) */
const LANES = {
  chat: 80,
  shell: 220,
  bot: 360,
};

const LANE_NAMES = ['Chat', 'Shell', 'Bot'];
const LANE_XS = [LANES.chat, LANES.shell, LANES.bot];

const SVG_WIDTH = 440;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 28;
const ARROW_HEAD_SIZE = 6;

/**
 * Determine which lane a message belongs to based on direction and context.
 */
function getLanes(msg: TappedMessage): { from: number; to: number } {
  // Shell is always the center
  if (msg.direction === 'napplet->shell') {
    // Could be from chat or bot -- use topic/kind to guess
    if (msg.parsed.topic === 'bot:response') {
      return { from: LANES.bot, to: LANES.shell };
    }
    return { from: LANES.chat, to: LANES.shell };
  } else {
    // shell->napplet
    if (msg.parsed.topic === 'bot:response' || msg.parsed.topic === 'chat:message') {
      // Inter-pane delivery -- shell routes to the other napplet
      if (msg.parsed.topic === 'chat:message') {
        return { from: LANES.shell, to: LANES.bot };
      }
      return { from: LANES.shell, to: LANES.chat };
    }
    // Default: shell to chat (most responses go to the initiator)
    return { from: LANES.shell, to: LANES.chat };
  }
}

/**
 * Create an SVG arrow line with arrowhead.
 */
function createArrow(fromX: number, toX: number, y: number, color: string): string {
  const direction = toX > fromX ? 1 : -1;
  const endX = toX - (ARROW_HEAD_SIZE * direction);

  // Arrow line
  let svg = `<line x1="${fromX}" y1="${y}" x2="${endX}" y2="${y}" stroke="${color}" stroke-width="1.5" />`;

  // Arrowhead
  svg += `<polygon points="${toX},${y} ${endX},${y - ARROW_HEAD_SIZE / 2} ${endX},${y + ARROW_HEAD_SIZE / 2}" fill="${color}" />`;

  return svg;
}

/**
 * Render a sequence diagram SVG from a list of tapped messages.
 */
export function renderSequenceDiagram(messages: TappedMessage[]): string {
  // Filter out SYSTEM messages since they don't have protocol direction
  const protocolMessages = messages.filter(m => m.verb !== 'SYSTEM');
  const height = HEADER_HEIGHT + (protocolMessages.length * ROW_HEIGHT) + 20;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${height}" viewBox="0 0 ${SVG_WIDTH} ${height}">`;

  // Background
  svg += `<rect width="${SVG_WIDTH}" height="${height}" fill="#0a0a0f" />`;

  // Lane headers
  for (let i = 0; i < LANE_NAMES.length; i++) {
    svg += `<text x="${LANE_XS[i]}" y="16" text-anchor="middle" fill="#00f0ff" font-family="monospace" font-size="11" font-weight="bold">${LANE_NAMES[i]}</text>`;
  }

  // Lane lifelines (vertical dashed lines)
  for (const x of LANE_XS) {
    svg += `<line x1="${x}" y1="${HEADER_HEIGHT - 10}" x2="${x}" y2="${height}" stroke="#2a2a3a" stroke-width="1" stroke-dasharray="4,4" />`;
  }

  // Header separator
  svg += `<line x1="0" y1="${HEADER_HEIGHT - 5}" x2="${SVG_WIDTH}" y2="${HEADER_HEIGHT - 5}" stroke="#2a2a3a" stroke-width="1" />`;

  // Messages
  for (let i = 0; i < protocolMessages.length; i++) {
    const msg = protocolMessages[i];
    const y = HEADER_HEIGHT + (i * ROW_HEIGHT) + ROW_HEIGHT / 2;
    const color = VERB_COLORS[msg.verb] || '#555555';
    const { from, to } = getLanes(msg);

    // Arrow
    if (from !== to) {
      svg += createArrow(from, to, y, color);
    } else {
      // Self-arrow (rare) -- draw a small loop
      svg += `<path d="M${from},${y - 4} C${from + 30},${y - 12} ${from + 30},${y + 12} ${from},${y + 4}" stroke="${color}" stroke-width="1.5" fill="none" />`;
    }

    // Label
    const labelX = Math.min(from, to) + Math.abs(to - from) / 2;
    const label = formatLabel(msg);
    svg += `<text x="${labelX}" y="${y - 5}" text-anchor="middle" fill="${color}" font-family="monospace" font-size="9">${escapeXml(label)}</text>`;
  }

  svg += '</svg>';
  return svg;
}

/**
 * Format a short label for a message arrow.
 */
function formatLabel(msg: TappedMessage): string {
  switch (msg.verb) {
    case 'AUTH':
      if (typeof msg.raw[1] === 'string') return 'AUTH challenge';
      return 'AUTH response';
    case 'OK':
      return msg.parsed.success ? 'OK (accepted)' : 'OK (denied)';
    case 'EVENT':
      if (msg.parsed.topic) return `EVENT ${msg.parsed.topic}`;
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

/**
 * Escape XML special characters for SVG text content.
 */
function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

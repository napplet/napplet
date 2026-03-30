/**
 * flow-animator.ts -- Animates the visual protocol flow.
 *
 * Flashes node borders and SVG arrows green/red when messages flow.
 * Neutral state: thick grey border on all nodes.
 */

import type { MessageTap } from './shell-host.js';

const FLASH_DURATION = 500;

function flashClass(el: Element, cls: string): void {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), FLASH_DURATION);
}

function flashArrow(lineId: string, cls: 'active' | 'blocked'): void {
  const line = document.getElementById(lineId);
  const head = document.getElementById(`ahf-${lineId.replace('line-', '')}`);
  if (line) { flashClass(line, cls); }
  if (head) { flashClass(head, cls); }
}

function flashNode(boxId: string, cls: 'active' | 'blocked'): void {
  const box = document.getElementById(boxId);
  if (box) { flashClass(box, cls); }
}

export function initFlowAnimator(tap: MessageTap, getNappletName: (windowId: string) => string | null): void {
  const flowLog = document.getElementById('shell-flow-log');

  // Live counters grouped by verb
  const counters: Record<string, { in: number; out: number; blocked: number }> = {};
  let totalMessages = 0;

  function renderCounters(): void {
    if (!flowLog) return;
    const verbs = Object.keys(counters).sort();
    flowLog.innerHTML = `<div style="color:#666;margin-bottom:4px">${totalMessages} total messages</div>` +
      verbs.map(v => {
        const c = counters[v];
        const parts: string[] = [];
        if (c.in > 0) parts.push(`<span style="color:#39ff14">↓${c.in}</span>`);
        if (c.out > 0) parts.push(`<span style="color:#00f0ff">↑${c.out}</span>`);
        if (c.blocked > 0) parts.push(`<span style="color:#ff3b3b">✗${c.blocked}</span>`);
        return `<div><span style="color:#b388ff;font-weight:600">${v}</span> ${parts.join(' ')}</div>`;
      }).join('');
  }

  tap.onMessage((msg) => {
    const name = msg.windowId ? getNappletName(msg.windowId) : null;
    if (!name) return;

    // Detect denied messages: OK false (any reason), CLOSED with denial reason
    const isOkFalse = msg.verb === 'OK' && msg.raw?.[2] === false;
    const isClosedDenied = msg.verb === 'CLOSED' && typeof msg.raw?.[2] === 'string' &&
      (msg.raw[2].includes('denied') || msg.raw[2].startsWith('blocked:'));
    const isBlocked = isOkFalse || isClosedDenied;
    const cls = isBlocked ? 'blocked' : 'active';

    if (msg.direction === 'napplet->shell') {
      flashNode(`${name}-box`, cls);
      flashArrow(`line-${name}-out`, cls);
      flashNode('shell-box', cls);
    } else if (msg.direction === 'shell->napplet') {
      flashNode('shell-box', cls);
      flashArrow(`line-${name}-in`, cls);
      flashNode(`${name}-box`, cls);

      if (msg.verb === 'EVENT' && msg.parsed?.topic) {
        const other = name === 'chat' ? 'bot' : 'chat';
        flashArrow(`line-${other}-in`, cls);
        flashNode(`${other}-box`, cls);
      }
    }

    // Update counters
    totalMessages++;
    if (!counters[msg.verb]) counters[msg.verb] = { in: 0, out: 0, blocked: 0 };
    if (isBlocked) counters[msg.verb].blocked++;
    else if (msg.direction === 'napplet->shell') counters[msg.verb].out++;
    else counters[msg.verb].in++;
    renderCounters();
  });
}

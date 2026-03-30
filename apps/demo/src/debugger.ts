/**
 * debugger.ts -- <napplet-debugger> web component.
 *
 * Displays protocol messages in a live log with color coding by verb type.
 * Designed for extraction as @napplet/devtools in a future milestone.
 *
 * Per CONTEXT.md D-09: self-contained web component with Shadow DOM.
 * Per CONTEXT.md D-08: tabbed view (live log + sequence diagram).
 * Sequence diagram is added in Plan 05.
 */

import type { TappedMessage, MessageTap } from './shell-host.js';

/** Verb-to-color mapping for the dark terminal theme */
const VERB_COLORS: Record<string, string> = {
  AUTH: '#b388ff',     // purple
  EVENT: '#39ff14',    // neon green
  REQ: '#00f0ff',      // neon blue
  CLOSE: '#ff3b3b',    // red
  OK: '#888899',       // gray
  EOSE: '#ffbf00',     // amber
  NOTICE: '#ffbf00',   // amber
  CLOSED: '#ff3b3b',   // red
  COUNT: '#00f0ff',    // blue
  SYSTEM: '#ff00ff',   // pink (for ACL changes)
  UNKNOWN: '#555555',  // dim gray
};

const DIRECTION_ARROWS: Record<string, string> = {
  'napplet->shell': '-->',
  'shell->napplet': '<--',
};

export class NappletDebugger extends HTMLElement {
  private shadow: ShadowRoot;
  private logContainer!: HTMLElement;
  private filterVerb: string = '';
  private filterDirection: string = '';
  private autoScroll: boolean = true;
  private paused: boolean = false;
  private messageBuffer: TappedMessage[] = [];
  private allMessages: TappedMessage[] = [];
  private unsubscribe?: () => void;
  private activeTab: 'log' | 'sequence' = 'log';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }

  /**
   * Connect to a message tap for real-time updates.
   */
  connectTap(tap: MessageTap): void {
    // Render existing messages
    for (const msg of tap.messages) {
      this.addMessage(msg);
    }
    // Subscribe to new messages
    this.unsubscribe = tap.onMessage((msg) => {
      if (!this.paused) {
        this.addMessage(msg);
      } else {
        this.messageBuffer.push(msg);
      }
    });
  }

  /**
   * Add a system event to the log (e.g., ACL changes).
   */
  addSystemMessage(text: string): void {
    const msg: TappedMessage = {
      index: -1,
      timestamp: Date.now(),
      direction: 'shell->napplet',
      verb: 'SYSTEM',
      raw: ['SYSTEM', text],
      parsed: { reason: text },
    };
    this.addMessage(msg);
  }

  private render(): void {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #e0e0e0;
          background: #0a0a0f;
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid #2a2a3a;
          background: #12121a;
        }
        .tab {
          padding: 6px 16px;
          cursor: pointer;
          color: #888;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
        }
        .tab:hover { color: #ccc; }
        .tab.active {
          color: #00f0ff;
          border-bottom-color: #00f0ff;
        }
        .controls {
          display: flex;
          gap: 8px;
          padding: 6px 12px;
          background: #12121a;
          border-bottom: 1px solid #2a2a3a;
          align-items: center;
        }
        .controls select, .controls button {
          background: #1a1a28;
          color: #e0e0e0;
          border: 1px solid #2a2a3a;
          padding: 2px 8px;
          font-family: inherit;
          font-size: 11px;
          border-radius: 3px;
          cursor: pointer;
        }
        .controls select:hover, .controls button:hover {
          border-color: #00f0ff;
        }
        .controls label {
          color: #888;
          font-size: 11px;
        }
        .log-container {
          flex: 1;
          overflow-y: auto;
          padding: 4px 0;
        }
        .log-entry {
          padding: 2px 12px;
          display: flex;
          gap: 8px;
          line-height: 1.6;
          border-bottom: 1px solid #0f0f18;
        }
        .log-entry:hover {
          background: #1a1a28;
        }
        .log-time {
          color: #555;
          min-width: 80px;
          flex-shrink: 0;
        }
        .log-dir {
          min-width: 30px;
          flex-shrink: 0;
          text-align: center;
        }
        .log-verb {
          min-width: 60px;
          flex-shrink: 0;
          font-weight: 600;
        }
        .log-detail {
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .log-system {
          color: #ff00ff;
          font-style: italic;
          padding: 4px 12px;
          border-bottom: 1px solid #0f0f18;
        }
        .msg-count {
          color: #555;
          margin-left: auto;
          font-size: 11px;
        }
        .sequence-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
        }
        .tab-content { display: none; flex: 1; flex-direction: column; overflow: hidden; }
        .tab-content.active { display: flex; }
      </style>

      <div class="tabs">
        <div class="tab active" data-tab="log">Live Log</div>
        <div class="tab" data-tab="sequence">Sequence</div>
        <span class="msg-count" id="msg-count">0 messages</span>
      </div>

      <div class="tab-content active" id="tab-log">
        <div class="controls">
          <label>Verb:</label>
          <select id="filter-verb">
            <option value="">all</option>
            <option value="AUTH">AUTH</option>
            <option value="EVENT">EVENT</option>
            <option value="REQ">REQ</option>
            <option value="OK">OK</option>
            <option value="EOSE">EOSE</option>
            <option value="CLOSE">CLOSE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="NOTICE">NOTICE</option>
          </select>
          <label>Dir:</label>
          <select id="filter-dir">
            <option value="">all</option>
            <option value="napplet->shell">napplet->shell</option>
            <option value="shell->napplet">shell->napplet</option>
          </select>
          <button id="btn-clear">Clear</button>
          <button id="btn-pause">Pause</button>
        </div>
        <div class="log-container" id="log-container"></div>
      </div>

      <div class="tab-content" id="tab-sequence">
        <div class="sequence-container" id="sequence-container" style="flex:1;overflow:auto;padding:8px;"></div>
      </div>
    `;

    this.logContainer = this.shadow.getElementById('log-container')!;

    // Tab switching
    this.shadow.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab as 'log' | 'sequence';
        this.activeTab = tabName;
        this.shadow.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.shadow.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.shadow.getElementById(`tab-${tabName}`)?.classList.add('active');
        if (tabName === 'sequence') {
          this.updateSequenceDiagram();
        }
      });
    });

    // Filter controls
    this.shadow.getElementById('filter-verb')?.addEventListener('change', (e) => {
      this.filterVerb = (e.target as HTMLSelectElement).value;
      this.rerender();
    });
    this.shadow.getElementById('filter-dir')?.addEventListener('change', (e) => {
      this.filterDirection = (e.target as HTMLSelectElement).value;
      this.rerender();
    });

    // Clear button
    this.shadow.getElementById('btn-clear')?.addEventListener('click', () => {
      this.messageBuffer = [];
      this.allMessages = [];
      this.logContainer.innerHTML = '';
      const seqContainer = this.shadow.getElementById('sequence-container');
      if (seqContainer) seqContainer.innerHTML = '';
      this.updateCount(0);
    });

    // Pause/Resume button
    this.shadow.getElementById('btn-pause')?.addEventListener('click', () => {
      this.paused = !this.paused;
      const btn = this.shadow.getElementById('btn-pause')!;
      btn.textContent = this.paused ? 'Resume' : 'Pause';
      if (!this.paused) {
        // Flush buffered messages
        for (const msg of this.messageBuffer) {
          this.addMessage(msg);
        }
        this.messageBuffer = [];
      }
    });
  }

  private addMessage(msg: TappedMessage): void {
    // Always store for sequence diagram (regardless of filters)
    this.allMessages.push(msg);
    this.updateSequenceDiagram();

    // Check filters for log display
    if (this.filterVerb && msg.verb !== this.filterVerb) return;
    if (this.filterDirection && msg.direction !== this.filterDirection) return;

    if (msg.verb === 'SYSTEM') {
      const el = document.createElement('div');
      el.className = 'log-system';
      el.textContent = `[system] ${msg.parsed.reason || ''}`;
      this.logContainer.appendChild(el);
    } else {
      const el = document.createElement('div');
      el.className = 'log-entry';

      const time = new Date(msg.timestamp).toLocaleTimeString('en', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
      } as Intl.DateTimeFormatOptions);

      const color = VERB_COLORS[msg.verb] || VERB_COLORS.UNKNOWN;
      const arrow = DIRECTION_ARROWS[msg.direction] || '???';
      const detail = this.formatDetail(msg);

      el.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-dir" style="color:${color}">${arrow}</span>
        <span class="log-verb" style="color:${color}">${msg.verb}</span>
        <span class="log-detail">${detail}</span>
      `;

      this.logContainer.appendChild(el);
    }

    // Auto-scroll
    if (this.autoScroll) {
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    // Update count
    this.updateCount(this.logContainer.children.length);
  }

  private updateSequenceDiagram(): void {
    if (this.activeTab !== 'sequence') return;
    const container = this.shadow.getElementById('sequence-container');
    if (!container) return;
    // Sequence diagram rendering will be wired in Plan 05-05
    // For now, show a message count placeholder
    container.innerHTML = `<div style="color:#555;padding:20px;text-align:center;">${this.allMessages.length} messages captured -- sequence diagram loading...</div>`;
    container.scrollTop = container.scrollHeight;
  }

  private formatDetail(msg: TappedMessage): string {
    const p = msg.parsed;
    switch (msg.verb) {
      case 'AUTH':
        if (typeof msg.raw[1] === 'string') return `challenge: ${(msg.raw[1] as string).substring(0, 16)}...`;
        return `kind:${p.eventKind} pubkey:${(p.pubkey || '').substring(0, 8)}...`;
      case 'EVENT':
        return `${p.subId ? `sub:${p.subId} ` : ''}kind:${p.eventKind}${p.topic ? ` topic:${p.topic}` : ''} id:${(p.eventId || '').substring(0, 8)}...`;
      case 'REQ':
        return `sub:${p.subId} filters:${JSON.stringify(msg.raw.slice(2)).substring(0, 60)}`;
      case 'OK':
        return `${p.success ? 'accepted' : 'rejected'}${p.reason ? ` -- ${p.reason}` : ''} id:${(p.eventId || '').substring(0, 8)}...`;
      case 'EOSE':
        return `sub:${p.subId}`;
      case 'CLOSE':
        return `sub:${p.subId}`;
      case 'CLOSED':
        return `sub:${p.subId} reason:${p.reason || ''}`;
      case 'NOTICE':
        return p.reason || '';
      default:
        return JSON.stringify(msg.raw).substring(0, 80);
    }
  }

  private updateCount(count: number): void {
    const el = this.shadow.getElementById('msg-count');
    if (el) el.textContent = `${count} messages`;
  }

  private rerender(): void {
    // Clear and re-add all messages with current filters
    this.logContainer.innerHTML = '';
    for (const msg of this.allMessages) {
      if (this.filterVerb && msg.verb !== this.filterVerb) continue;
      if (this.filterDirection && msg.direction !== this.filterDirection) continue;

      if (msg.verb === 'SYSTEM') {
        const el = document.createElement('div');
        el.className = 'log-system';
        el.textContent = `[system] ${msg.parsed.reason || ''}`;
        this.logContainer.appendChild(el);
      } else {
        const el = document.createElement('div');
        el.className = 'log-entry';
        const time = new Date(msg.timestamp).toLocaleTimeString('en', {
          hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
        } as Intl.DateTimeFormatOptions);
        const color = VERB_COLORS[msg.verb] || VERB_COLORS.UNKNOWN;
        const arrow = DIRECTION_ARROWS[msg.direction] || '???';
        const detail = this.formatDetail(msg);
        el.innerHTML = `
          <span class="log-time">${time}</span>
          <span class="log-dir" style="color:${color}">${arrow}</span>
          <span class="log-verb" style="color:${color}">${msg.verb}</span>
          <span class="log-detail">${detail}</span>
        `;
        this.logContainer.appendChild(el);
      }
    }
    this.updateCount(this.logContainer.children.length);
  }
}

// Register the custom element
customElements.define('napplet-debugger', NappletDebugger);

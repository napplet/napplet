/**
 * Chat demo napplet.
 *
 * Exercises: relay:write, relay:read, sign:event, state:read, state:write, inter-pane emit.
 *
 * - Sends messages via publish() to relay (relay:write + sign:event)
 * - Subscribes to incoming messages via subscribe() (relay:read)
 * - Stores chat history via nappState (state:read + state:write)
 * - Emits messages to bot via emit('chat:message') (inter-pane)
 * - Listens for bot responses via on('bot:response') (inter-pane)
 */
import { publish, subscribe, emit, on, nappState } from '@napplet/shim';
import type { EventTemplate } from '@napplet/shim';

const statusEl = document.getElementById('status')!;
const messagesEl = document.getElementById('messages')!;
const inputEl = document.getElementById('msg-input') as HTMLInputElement;
const sendBtn = document.getElementById('send-btn')!;

let authenticated = false;
const HISTORY_KEY = 'chat-history';
const MAX_HISTORY = 50;

// --- Message Display ---

function addMessage(text: string, type: 'self' | 'other' | 'system' = 'system'): void {
  const div = document.createElement('div');
  div.className = `msg msg-${type}`;
  const time = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const prefix = type === 'self' ? '> ' : type === 'other' ? '< ' : '* ';
  div.innerHTML = `<span class="msg-time">${time}</span>${prefix}${escapeHtml(text)}`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Chat History (storage) ---

async function loadHistory(): Promise<void> {
  try {
    const raw = await nappState.getItem(HISTORY_KEY);
    if (raw) {
      const entries: string[] = JSON.parse(raw);
      for (const entry of entries.slice(-10)) {
        addMessage(entry, 'system');
      }
      addMessage(`loaded ${entries.length} history entries`, 'system');
    }
  } catch {
    addMessage('no history found', 'system');
  }
}

async function saveToHistory(text: string): Promise<void> {
  try {
    const raw = await nappState.getItem(HISTORY_KEY);
    const entries: string[] = raw ? JSON.parse(raw) : [];
    entries.push(text);
    if (entries.length > MAX_HISTORY) entries.splice(0, entries.length - MAX_HISTORY);
    await nappState.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Storage may be denied by ACL -- silently ignore
  }
}

// --- Send Message ---

async function sendMessage(): Promise<void> {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';

  addMessage(text, 'self');
  await saveToHistory(text);

  // Emit to bot via inter-pane
  emit('chat:message', [], JSON.stringify({ text, timestamp: Date.now() }));

  // Publish to relay (exercises relay:write + sign:event)
  try {
    const template: EventTemplate = {
      kind: 1,
      content: text,
      tags: [['t', 'demo-chat']],
      created_at: Math.floor(Date.now() / 1000),
    };
    await publish(template, []);
  } catch {
    addMessage('relay publish failed (check ACL)', 'system');
  }
}

// --- Event Handlers ---

sendBtn.addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// --- AUTH Handling ---

window.addEventListener('message', (event) => {
  if (!Array.isArray(event.data)) return;
  if (event.source !== window.parent) return;

  const [verb, , success] = event.data;

  if (verb === 'OK' && success === true && !authenticated) {
    authenticated = true;
    statusEl.textContent = 'authenticated';
    statusEl.style.color = '#39ff14';
    addMessage('AUTH complete -- ready to chat', 'system');

    // Load history after AUTH
    loadHistory();

    // Subscribe to relay events (exercises relay:read)
    try {
      subscribe(
        [{ kinds: [1], '#t': ['demo-chat'], limit: 10 }],
        (event) => {
          // Don't show our own messages again
          addMessage(event.content, 'other');
        },
        () => {
          addMessage('relay subscription ready', 'system');
        }
      );
    } catch {
      addMessage('relay subscribe failed (check ACL)', 'system');
    }

    // Listen for bot responses via inter-pane
    on('bot:response', (payload: unknown) => {
      const data = payload as { text?: string };
      if (data.text) {
        addMessage(`[bot] ${data.text}`, 'other');
      }
    });
  }

  if (verb === 'OK' && success === false) {
    statusEl.textContent = 'auth failed';
    statusEl.style.color = '#ff3b3b';
  }

  if (verb === 'CLOSED') {
    addMessage(`subscription closed: ${event.data[2] || 'unknown'}`, 'system');
  }

  if (verb === 'NOTICE') {
    addMessage(`notice: ${event.data[1]}`, 'system');
  }
});

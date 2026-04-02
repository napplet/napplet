/**
 * Chat demo napplet.
 *
 * Exercises: relay:write, relay:read, sign:event, state:read, state:write, ipc emit.
 *
 * - Sends messages via publish() to relay (relay:write + sign:event)
 * - Subscribes to incoming messages via subscribe() (relay:read)
 * - Stores chat history via nappState (state:read + state:write)
 * - Emits messages to bot via emit('chat:message') (ipc)
 * - Listens for bot responses via on('bot:response') (ipc)
 */
import { publish, subscribe, emit, on, nappState } from '@napplet/shim';
import type { EventTemplate } from '@napplet/shim';

// ─── Notification Helpers ─────────────────────────────────────────────────────

/**
 * Emit a notifications:create event through the real napplet→service path.
 * The shell routes this INTER_PANE event to the notification service handler.
 */
function notifyCreate(title: string, body: string): void {
  try {
    emit('notifications:create', [], JSON.stringify({ title, body }));
  } catch {
    /* best-effort — don't break the main flow if notifications are denied */
  }
}

const statusEl = document.getElementById('status')!;
const messagesEl = document.getElementById('messages')!;
const inputEl = document.getElementById('msg-input') as HTMLInputElement;
const sendBtn = document.getElementById('send-btn')!;

let authenticated = false;
const HISTORY_KEY = 'chat-history';
const MAX_HISTORY = 50;
const pendingAcks: string[] = [];

function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.length > 0) return error;
  return fallback;
}

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
  } catch (error) {
    addMessage(`state history load failed -- ${formatError(error, 'denied: state:read')}`, 'system');
  }
}

async function saveToHistory(text: string): Promise<void> {
  try {
    const raw = await nappState.getItem(HISTORY_KEY);
    const entries: string[] = raw ? JSON.parse(raw) : [];
    entries.push(text);
    if (entries.length > MAX_HISTORY) entries.splice(0, entries.length - MAX_HISTORY);
    await nappState.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (error) {
    addMessage(`state history save failed -- ${formatError(error, 'denied: state:write')}`, 'system');
  }
}

// --- Send Message ---

async function sendMessage(): Promise<void> {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';

  addMessage(text, 'self');
  await saveToHistory(text);

  try {
    pendingAcks.push('ipc send');
    emit('chat:message', [], JSON.stringify({ text, timestamp: Date.now() }));
    addMessage('ipc send attempted -- chat:message', 'system');
    // Emit notification so the host can surface this message send as a toast
    notifyCreate('Chat message sent', text.length > 60 ? text.slice(0, 60) + '…' : text);
  } catch (error) {
    addMessage(`ipc send failed -- ${formatError(error, 'denied: relay:write')}`, 'system');
  }

  // Publish to relay (exercises relay:write + sign:event)
  try {
    pendingAcks.push('signer request');
    const template: EventTemplate = {
      kind: 1,
      content: text,
      tags: [['t', 'demo-chat']],
      created_at: Math.floor(Date.now() / 1000),
    };
    await publish(template, []);
    pendingAcks.push('relay publish');
  } catch (error) {
    addMessage(`relay publish failed -- ${formatError(error, 'denied: relay:write')}`, 'system');
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
          addMessage('relay subscribe ready', 'system');
        }
      );
    } catch (error) {
      addMessage(`relay subscribe failed -- ${formatError(error, 'denied: relay:read')}`, 'system');
    }

    // Listen for bot responses via ipc
    on('bot:response', (payload: unknown) => {
      const data = payload as { text?: string };
      if (data.text) {
        addMessage('ipc receive -- bot:response', 'system');
        addMessage(`[bot] ${data.text}`, 'other');
      }
    });
  }

  if (verb === 'OK' && authenticated) {
    const op = pendingAcks.shift();
    if (success === false && op) {
      addMessage(`${op} denied -- ${event.data[3] || 'unknown error'}`, 'system');
    }
  }

  if (verb === 'OK' && success === false && !authenticated) {
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

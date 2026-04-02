/**
 * Bot demo napplet -- teachable auto-responder.
 *
 * Exercises: sign:event (for response signing), state:read, state:write, ipc on/emit.
 *
 * - Listens via on('chat:message') for messages from chat napplet
 * - Auto-responds based on learned rules or default personality
 * - Supports /teach command: "/teach hello Hi there!"
 * - Stores learned rules in storage
 * - Emits responses via ipc.emit('bot:response')
 */
import '@napplet/shim';
import { ipc, storage } from '@napplet/sdk';

// ─── Notification Helpers ─────────────────────────────────────────────────────

/**
 * Emit a notifications:create event through the real napplet→service path.
 * The shell routes this IPC_PEER event to the notification service handler.
 */
function notifyCreate(title: string, body: string): void {
  try {
    ipc.emit('notifications:create', [], JSON.stringify({ title, body }));
  } catch {
    /* best-effort — don't break the main flow if notifications are denied */
  }
}

const statusEl = document.getElementById('status-text')!;
const ruleCountEl = document.getElementById('rule-count')!;
const logEl = document.getElementById('log')!;
const rulesEl = document.getElementById('rules')!;

let authenticated = false;
const RULES_KEY = 'bot-rules';

function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.length > 0) return error;
  return fallback;
}

// Rule storage: trigger -> response
let rules: Record<string, string> = {};

// Default responses for when no rule matches
const DEFAULT_RESPONSES = [
  'interesting... tell me more',
  'hmm, I see',
  'roger that',
  'noted!',
  '*beep boop*',
  'processing...',
  'acknowledged',
  'fascinating',
];

// --- Logging ---

function log(text: string, type: 'heard' | 'replied' | 'learned' | 'error' | 'info' = 'info'): void {
  const div = document.createElement('div');
  div.className = `log-entry log-${type}`;
  const time = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const prefix = {
    heard: '[heard]',
    replied: '[reply]',
    learned: '[learn]',
    error: '[error]',
    info: '[info]',
  }[type];
  div.textContent = `${time} ${prefix} ${text}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

// --- Rules Management ---

async function loadRules(): Promise<void> {
  try {
    const raw = await storage.getItem(RULES_KEY);
    if (raw) {
      rules = JSON.parse(raw);
      log(`loaded ${Object.keys(rules).length} rules from storage`, 'info');
    }
  } catch (error) {
    log(`state read failed -- ${formatError(error, 'denied: state:read')}`, 'error');
  }
  updateRulesDisplay();
}

async function saveRules(): Promise<void> {
  try {
    await storage.setItem(RULES_KEY, JSON.stringify(rules));
  } catch (error) {
    log(`state write failed -- ${formatError(error, 'denied: state:write')}`, 'error');
  }
}

function updateRulesDisplay(): void {
  const count = Object.keys(rules).length;
  ruleCountEl.textContent = `${count} rule${count === 1 ? '' : 's'}`;

  rulesEl.innerHTML = '';
  for (const [trigger, response] of Object.entries(rules)) {
    const div = document.createElement('div');
    div.textContent = `"${trigger}" -> "${response}"`;
    rulesEl.appendChild(div);
  }
}

// --- Message Handling ---

function handleTeachCommand(text: string): boolean {
  // Format: /teach <trigger> <response>
  const match = text.match(/^\/teach\s+(\S+)\s+(.+)$/);
  if (!match) return false;

  const [, trigger, response] = match;
  rules[trigger.toLowerCase()] = response;
  log(`learned: "${trigger}" -> "${response}"`, 'learned');
  saveRules();
  updateRulesDisplay();

  // Emit a notification so the host can surface this rule learn event
  notifyCreate('Bot activity', `learned: "${trigger}" → "${response}"`);

  // Acknowledge the teach command
  ipc.emit('bot:response', [], JSON.stringify({
    text: `learned! I'll respond "${response}" when I hear "${trigger}"`,
    timestamp: Date.now(),
  }));

  return true;
}

function findResponse(text: string): string {
  const lower = text.toLowerCase();

  // Check learned rules (substring match)
  for (const [trigger, response] of Object.entries(rules)) {
    if (lower.includes(trigger)) {
      return response;
    }
  }

  // Built-in responses
  if (lower.includes('hello') || lower.includes('hi')) return 'hey there!';
  if (lower.includes('help')) return 'try /teach <trigger> <response> to teach me!';
  if (lower.includes('ping')) return 'pong!';
  if (lower.includes('name')) return "I'm napplet-bot, a demo auto-responder";

  // Random default
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
}

function handleChatMessage(payload: unknown): void {
  const data = payload as { text?: string; timestamp?: number };
  const text = data.text || '';
  if (!text) return;

  log(`ipc chat:message received -- ${text}`, 'heard');

  // Check for teach command first
  if (handleTeachCommand(text)) return;

  // Find and send response
  const response = findResponse(text);
  log(response, 'replied');

  // Emit response to chat via ipc (exercises sign:event for the emit)
  try {
    ipc.emit('bot:response', [], JSON.stringify({
      text: response,
      timestamp: Date.now(),
    }));
    log('ipc bot:response sent', 'info');
    // Emit a notification so the host can surface this bot reply
    notifyCreate('Bot activity', response.length > 60 ? response.slice(0, 60) + '…' : response);
  } catch (error) {
    log(`ipc response failed -- ${formatError(error, 'denied: relay:write')}`, 'error');
  }
}

// --- AUTH Handling ---

window.addEventListener('message', (event) => {
  if (!Array.isArray(event.data)) return;
  if (event.source !== window.parent) return;

  const [verb, , success] = event.data;

  if (verb === 'OK' && success === true && !authenticated) {
    authenticated = true;
    statusEl.textContent = 'listening';
    statusEl.style.color = '#39ff14';
    log('AUTH complete -- listening for ipc chat:message input', 'info');

    // Load rules from storage
    loadRules();

    // Listen for chat messages via ipc
    ipc.on('chat:message', handleChatMessage);

    log('subscribed to ipc chat:message topic', 'info');
  }

  if (verb === 'OK' && success === false) {
    statusEl.textContent = 'auth failed';
    statusEl.style.color = '#ff3b3b';
    log('AUTH failed', 'error');
  }
});

/**
 * signer-modal.ts — Connect modal for NIP-07 and NIP-46 signer flows.
 *
 * Presents NIP-07 browser extension and NIP-46 bunker as equal first-class
 * connection options. Hosts the editable NIP-46 relay field (modal-only).
 * Generates a nostrconnect:// QR code for mobile bunker scanning.
 */

import {
  connectNip07,
  connectNip46,
  onStateChange,
  getSignerConnectionState,
} from './signer-connection.js';
import {
  parseBunkerUri,
  buildNostrConnectUri,
  createNip46Client,
} from './nip46-client.js';
import { getPublicKey, generateSecretKey } from 'nostr-tools/pure';
import QRCode from 'qrcode';

// ─── Module State ─────────────────────────────────────────────────────────────

/** Ephemeral requester keypair for displaying the nostrconnect:// QR. */
const _qrSecretKey = generateSecretKey();
const _qrLocalPubkey = getPublicKey(_qrSecretKey);

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

function getModal(): HTMLElement | null {
  return document.getElementById('signer-connect-modal');
}

function getNip07StatusEl(): HTMLElement | null {
  return document.getElementById('nip07-status');
}

function getNip46StatusEl(): HTMLElement | null {
  return document.getElementById('nip46-status');
}

function getNip07ConnectBtn(): HTMLButtonElement | null {
  return document.getElementById('nip07-connect-btn') as HTMLButtonElement | null;
}

function getNip46ConnectBtn(): HTMLButtonElement | null {
  return document.getElementById('nip46-connect-btn') as HTMLButtonElement | null;
}

function getRelayInput(): HTMLInputElement | null {
  return document.getElementById('nip46-relay-input') as HTMLInputElement | null;
}

function getBunkerUriInput(): HTMLInputElement | null {
  return document.getElementById('nip46-bunker-uri-input') as HTMLInputElement | null;
}

function getQrContainer(): HTMLElement | null {
  return document.getElementById('nip46-qr-container');
}

function getQrRelayNote(): HTMLElement | null {
  return document.getElementById('nip46-qr-relay-note');
}

function setStatus(el: HTMLElement | null, text: string, type: 'error' | 'success' | 'connecting' | ''): void {
  if (!el) return;
  el.textContent = text;
  el.className = 'signer-option-status' + (type ? ` ${type}` : '');
}

// ─── QR Code Generation ───────────────────────────────────────────────────────

async function renderQrCode(relayUrl: string): Promise<void> {
  const container = getQrContainer();
  const relayNote = getQrRelayNote();
  if (!container) return;

  const uri = buildNostrConnectUri(relayUrl, _qrLocalPubkey);

  if (relayNote) {
    relayNote.textContent = `relay: ${relayUrl}`;
  }

  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, uri, {
      width: 160,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    container.innerHTML = '';
    container.appendChild(canvas);
  } catch {
    // Fallback: display URI as text
    container.innerHTML = `<div class="signer-qr-fallback">${uri}</div>`;
  }
}

// ─── Modal Open / Close ───────────────────────────────────────────────────────

/**
 * Open the signer connect modal.
 */
export function openSignerModal(): void {
  const modal = getModal();
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'false');

  // Reset status fields
  setStatus(getNip07StatusEl(), '', '');
  setStatus(getNip46StatusEl(), '', '');

  // Re-enable buttons
  const nip07Btn = getNip07ConnectBtn();
  if (nip07Btn) nip07Btn.disabled = false;
  const nip46Btn = getNip46ConnectBtn();
  if (nip46Btn) nip46Btn.disabled = false;

  // Render QR on open
  const relayInput = getRelayInput();
  const relayUrl = relayInput?.value.trim() || 'wss://relay.nsec.app';
  renderQrCode(relayUrl).catch(() => { /* best-effort */ });
}

/**
 * Close the signer connect modal.
 */
export function closeSignerModal(): void {
  const modal = getModal();
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
}

// ─── NIP-07 Connect ───────────────────────────────────────────────────────────

async function handleNip07Connect(): Promise<void> {
  const btn = getNip07ConnectBtn();
  const statusEl = getNip07StatusEl();

  if (btn) btn.disabled = true;
  setStatus(statusEl, 'Connecting...', 'connecting');

  await connectNip07();

  const state = getSignerConnectionState();
  if (state.error) {
    setStatus(statusEl, state.error, 'error');
    if (btn) btn.disabled = false;
  } else if (state.method === 'nip07' && state.pubkey) {
    setStatus(statusEl, `Connected: ${state.pubkey.substring(0, 12)}...`, 'success');
    setTimeout(() => closeSignerModal(), 1500);
  }
}

// ─── NIP-46 Connect ───────────────────────────────────────────────────────────

async function handleNip46Connect(): Promise<void> {
  const btn = getNip46ConnectBtn();
  const statusEl = getNip46StatusEl();
  const relayInput = getRelayInput();
  const bunkerUriInput = getBunkerUriInput();

  const bunkerUriRaw = bunkerUriInput?.value.trim() ?? '';
  const relayOverride = relayInput?.value.trim() ?? '';

  // Validate bunker URI
  const parsed = parseBunkerUri(bunkerUriRaw);
  if (!parsed) {
    setStatus(statusEl, 'Invalid bunker URI — expected bunker://<pubkey>?relay=...', 'error');
    return;
  }

  // Relay field takes precedence over URI relay
  const relayUrl = relayOverride || parsed.relay;

  if (btn) btn.disabled = true;
  setStatus(statusEl, 'Connecting to relay...', 'connecting');

  await connectNip46({
    relayUrl,
    bunkerPubkey: parsed.pubkey,
    secret: parsed.secret,
  });

  const state = getSignerConnectionState();
  if (state.error) {
    setStatus(statusEl, state.error, 'error');
    if (btn) btn.disabled = false;
  } else if (state.method === 'nip46' && state.pubkey) {
    const relayNote = state.relay ? ` via ${state.relay}` : '';
    setStatus(statusEl, `Connected: ${state.pubkey.substring(0, 12)}...${relayNote}`, 'success');
    setTimeout(() => closeSignerModal(), 1500);
  }
}

// ─── Public Init ──────────────────────────────────────────────────────────────

/**
 * Initialize the signer connect modal.
 * Attaches event handlers for open, close, NIP-07 connect, and NIP-46 connect.
 * Subscribe to state changes to keep the modal in sync.
 * Call once after the DOM is ready.
 */
export function initSignerModal(): void {
  const modal = getModal();
  if (!modal) return;

  // Close on backdrop click (click outside the panel)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSignerModal();
  });

  // Close on X button
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="close-signer-modal"]')) {
      closeSignerModal();
    }
  });

  // NIP-07 connect
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="connect-nip07"]')) {
      handleNip07Connect().catch(() => { /* best-effort */ });
    }
  });

  // NIP-46 connect
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="connect-nip46"]')) {
      handleNip46Connect().catch(() => { /* best-effort */ });
    }
  });

  // Update QR when relay field changes
  const relayInput = getRelayInput();
  if (relayInput) {
    relayInput.addEventListener('input', () => {
      const relayUrl = relayInput.value.trim() || 'wss://relay.nsec.app';
      renderQrCode(relayUrl).catch(() => { /* best-effort */ });
    });
  }

  // Subscribe to state changes to sync UI
  onStateChange((state) => {
    // If connected and modal is open, close it
    if (
      modal.getAttribute('aria-hidden') === 'false' &&
      state.method !== 'none' &&
      !state.isConnecting &&
      !state.error
    ) {
      // Modal close is handled in the connect handlers with a delay
    }
  });
}

// Re-export parseBunkerUri and createNip46Client for test access
export { parseBunkerUri, buildNostrConnectUri, createNip46Client };

// @napplet/shim -- Napplet window installer
// Side-effect-only module: importing this file installs window.napplet and window.nostr globals.
// No named exports. No allow-same-origin required.
//
// Domain logic lives in NUB packages. This file orchestrates installation.

import { installKeysShim, handleKeysMessage, registerAction, unregisterAction, onAction } from '@napplet/nub-keys';
import { installMediaShim, handleMediaMessage, createSession, updateSession, destroySession, reportState, reportCapabilities, onCommand, onControls } from '@napplet/nub-media';
import {
  installNotifyShim,
  handleNotifyMessage,
  send as notifySend,
  dismiss as notifyDismiss,
  badge as notifyBadge,
  registerChannel as notifyRegisterChannel,
  requestPermission as notifyRequestPermission,
  onAction as notifyOnAction,
  onClicked as notifyOnClicked,
  onDismissed as notifyOnDismissed,
  onControls as notifyOnControls,
} from '@napplet/nub-notify';
import { installNostrDb } from './nipdb-shim.js';
import { installStorageShim, nappletStorage } from '@napplet/nub-storage';
import { subscribe, publish, query } from '@napplet/nub-relay';
import { installSignerShim, handleSignerResponse } from '@napplet/nub-signer';
import { installIfcShim, emit, on, handleIfcEvent } from '@napplet/nub-ifc';
import type { NappletGlobal } from '@napplet/core';
import type { IfcEventMessage } from '@napplet/nub-ifc';

// ─── Global type augmentation ────────────────────────────────────────────────
// Activates window.napplet TypeScript types on `import '@napplet/shim'`.

declare global {
  interface Window {
    napplet: NappletGlobal;
  }
}

// ─── Central envelope message handler ───────────────────────────────────────

/**
 * Central message handler for JSON envelope messages from the shell.
 * Routes messages to appropriate handlers based on type prefix.
 */
function handleEnvelopeMessage(event: MessageEvent): void {
  if (event.source !== window.parent) return;
  const msg = event.data;
  if (typeof msg !== 'object' || msg === null || typeof msg.type !== 'string') return;

  const type = msg.type as string;

  // Route signer result messages
  if (type.startsWith('signer.') && type.endsWith('.result')) {
    handleSignerResponse(msg as { type: string; id: string; error?: string; [key: string]: unknown });
    return;
  }

  // Route keys.* messages to keys shim
  if (type.startsWith('keys.')) {
    handleKeysMessage(msg as { type: string; [key: string]: unknown });
    return;
  }

  // Route media.* messages to media shim
  if (type.startsWith('media.')) {
    handleMediaMessage(msg as { type: string; [key: string]: unknown });
    return;
  }

  // Route notify.* messages to notify shim
  if (type.startsWith('notify.')) {
    handleNotifyMessage(msg as { type: string; [key: string]: unknown });
    return;
  }

  // Route IFC event messages to topic handlers
  if (type === 'ifc.event') {
    handleIfcEvent(msg as IfcEventMessage);
    return;
  }
}

// ─── Install NUB shims ────────────────────────────────────────────────────────

// Install signer shim (window.nostr NIP-07 proxy)
installSignerShim();

// Install IFC shim
installIfcShim();

// ─── window.napplet global installation ──────────────────────────────────────

(window as unknown as { napplet: NappletGlobal }).napplet = {
  relay: {
    subscribe,
    publish,
    query,
  },
  ipc: {
    emit,
    on,
  },
  storage: {
    getItem: nappletStorage.getItem.bind(nappletStorage),
    setItem: nappletStorage.setItem.bind(nappletStorage),
    removeItem: nappletStorage.removeItem.bind(nappletStorage),
    keys: nappletStorage.keys.bind(nappletStorage),
  },
  keys: {
    registerAction,
    unregisterAction,
    onAction,
  },
  media: {
    createSession,
    updateSession,
    destroySession,
    reportState,
    reportCapabilities,
    onCommand,
    onControls,
  },
  notify: {
    send: notifySend,
    dismiss: notifyDismiss,
    badge: notifyBadge,
    registerChannel: notifyRegisterChannel,
    requestPermission: notifyRequestPermission,
    onAction: notifyOnAction,
    onClicked: notifyOnClicked,
    onDismissed: notifyOnDismissed,
    onControls: notifyOnControls,
  },
  shell: {
    supports(_capability: string): boolean {
      // TODO: Shell populates supported capabilities at iframe creation
      return false;
    },
  },
};

// ─── Initialize ───────────────────────────────────────────────────────────────

// Install central envelope message listener
window.addEventListener('message', handleEnvelopeMessage);

// Install window.nostrdb NIP-DB proxy
installNostrDb();

// Install keys shim (smart forwarding + action keybindings)
installKeysShim();

// Install media shim (session management + command handlers)
installMediaShim();

// Install notify shim (notification sending + interaction handlers)
installNotifyShim();

// Install napplet-side storage proxy
installStorageShim();

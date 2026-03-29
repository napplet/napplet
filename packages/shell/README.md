# @napplet/shell

Shell runtime for hosting Nostr-native napplet iframes. Framework-agnostic.

## Install

```bash
npm install @napplet/shell
```

## Usage

```ts
import { createPseudoRelay } from '@napplet/shell';
import type { ShellHooks } from '@napplet/shell';

const hooks: ShellHooks = {
  relayPool: { /* your relay pool implementation */ },
  relayConfig: { /* your relay config */ },
  windowManager: { createWindow: (opts) => { /* create iframe */ return 'window-id'; } },
  auth: { getUserPubkey: () => pubkey, getSigner: () => signer },
  config: { getNappUpdateBehavior: () => 'auto-grant' },
  hotkeys: { executeHotkeyFromForward: (e) => { /* handle */ } },
  workerRelay: { getWorkerRelay: () => null },
  crypto: { verifyEvent: async (e) => verify(e) },
};

const relay = createPseudoRelay(hooks);

// Wire up iframe message handling
window.addEventListener('message', (event) => {
  relay.handleMessage(event);
});

// Send AUTH challenge when iframe loads
relay.sendChallenge(windowId);

// Inject shell-created events
relay.injectEvent('auth:identity-changed', { pubkey: '...' });
```

## License

MIT

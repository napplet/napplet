# @napplet/shell

Shell runtime for hosting Nostr-native napplet iframes. Framework-agnostic.

## Install

```bash
npm install @napplet/shell
```

## Usage

```ts
import { createPseudoRelay, originRegistry } from '@napplet/shell';
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

const relay = createPseudoRelay(hooks, (consent) => {
  // Show consent dialog for destructive signing kinds
  consent.resolve(true);
});

// Register an iframe window
originRegistry.register(iframe.contentWindow, 'window-1');

// Wire up iframe message handling
window.addEventListener('message', relay.handleMessage);

// Send AUTH challenge to start the handshake
relay.sendChallenge('window-1');
```

## License

MIT

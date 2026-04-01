/**
 * auth-napplet -- Minimal test napplet that only does AUTH handshake.
 *
 * Importing @napplet/shim automatically triggers:
 * 1. Read nappletType from <meta name="napplet-napp-type">
 * 2. Load/create ephemeral session keypair
 * 3. Install window.nostr NIP-07 proxy
 * 4. Attach message listener for relay responses
 * 5. Wait for AUTH challenge from shell, sign and respond
 *
 * After AUTH completes, signals test harness via __TEST_DONE__.
 */
import '@napplet/shim';

// Signal to test harness that the napplet has loaded and shim initialized.
// AUTH handshake is handled internally by the shim.
// The test harness detects AUTH completion via the message tap (OK response).
window.addEventListener('message', (event) => {
  if (!Array.isArray(event.data)) return;
  if (event.source !== window.parent) return;

  const [verb, , success] = event.data;

  // When shell sends OK with success=true, AUTH is complete
  if (verb === 'OK' && success === true) {
    window.parent.postMessage(['__TEST_DONE__', 'auth'], '*');
    const app = document.getElementById('app');
    if (app) app.textContent = 'AUTH complete';
  }
});

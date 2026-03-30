/**
 * publish-napplet -- Test napplet that publishes an event after AUTH.
 *
 * Reads configuration from URL query parameters:
 * - kind: Event kind to publish (default: 1)
 * - content: Event content (default: 'test message from publish-napplet')
 *
 * After AUTH completes, publishes one event and signals __TEST_DONE__.
 */
import { publish } from '@napplet/shim';

const params = new URLSearchParams(location.search);
const kind = parseInt(params.get('kind') ?? '1', 10);
const content = params.get('content') ?? 'test message from publish-napplet';

let authComplete = false;

// Wait for AUTH to complete before publishing
window.addEventListener('message', async (event) => {
  if (!Array.isArray(event.data)) return;
  if (event.source !== window.parent) return;

  const [verb, , success] = event.data;

  if (verb === 'OK' && success === true && !authComplete) {
    authComplete = true;

    try {
      // Publish the test event
      await publish({
        kind,
        content,
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
      });

      window.parent.postMessage(['__TEST_DONE__', 'publish', 'success'], '*');
      const app = document.getElementById('app');
      if (app) app.textContent = `Published kind ${kind}`;
    } catch (err) {
      window.parent.postMessage(['__TEST_DONE__', 'publish', 'error', String(err)], '*');
      const app = document.getElementById('app');
      if (app) app.textContent = `Publish failed: ${err}`;
    }
  }
});

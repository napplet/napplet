/**
 * Bot demo napplet -- placeholder.
 * Full implementation in Plan 03.
 */
import '@napplet/shim';

const app = document.getElementById('app');
if (app) app.textContent = 'bot napplet loaded';

// Signal AUTH completion to parent
window.addEventListener('message', (event) => {
  if (!Array.isArray(event.data)) return;
  if (event.source !== window.parent) return;
  const [verb, , success] = event.data;
  if (verb === 'OK' && success === true) {
    if (app) app.textContent = 'bot ready (AUTH ok)';
  }
});

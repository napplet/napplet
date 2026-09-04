/**
 * Private, self-contained presentation for optimized packaged-resource loading.
 *
 * This screen describes only local application state. It adds no protocol
 * fields, transport behavior, remote assets, or dependency on packaged bytes.
 */

export type LoaderScreenPhase = 'initial' | 'active' | 'success' | 'error' | 'cancelled';

export interface LoaderScreenState {
  phase: LoaderScreenPhase;
  active: boolean;
  cohortClosed: boolean;
  completed: number;
  total: number;
  source?: string;
}

export interface LoaderScreenElement {
  hidden: boolean;
  textContent: string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  focus?(): void;
}

export interface LoaderScreenDocument {
  getElementById(id: string): LoaderScreenElement | null;
}

const INITIAL_STATUS = 'Getting everything ready.';
const ACTIVE_STATUS = 'Loading packaged resources.';
const SUCCESS_STATUS = 'Resources ready. Opening application…';
const ERROR_STATUS = 'A packaged resource could not be loaded safely.';
const CANCELLED_STATUS = 'Loading cancelled.';

/**
 * Replace C0/C1 controls before an untrusted resource name is displayed.
 *
 * @param source Original table source retained as the runtime identity.
 * @returns A display-only label with every control replaced.
 * @example
 * ```ts
 * sanitizeResourceLabel('assets/a\\0.bin');
 * ```
 */
export function sanitizeResourceLabel(source: string): string {
  return source.replace(/[\u0000-\u001f\u007f-\u009f]/g, '�');
}

function titleFor(phase: LoaderScreenPhase): string {
  if (phase === 'success') return 'Resources ready';
  if (phase === 'error') return 'Resource loading failed';
  if (phase === 'cancelled') return 'Loading cancelled';
  if (phase === 'active') return 'Loading packaged resources';
  return 'Preparing packaged application';
}

function statusFor(state: LoaderScreenState): string {
  if (state.phase === 'success') return SUCCESS_STATUS;
  if (state.phase === 'error') return ERROR_STATUS;
  if (state.phase === 'cancelled') return CANCELLED_STATUS;
  if (state.phase === 'active' && state.cohortClosed && state.total > 0) {
    return `Loading resources ${state.completed} of ${state.total}`;
  }
  return state.phase === 'active' ? ACTIVE_STATUS : INITIAL_STATUS;
}

/**
 * Project one runtime snapshot onto the persistent loader nodes.
 *
 * Resource identity is never interpolated into markup: the display-only label
 * reaches the document solely through `textContent`.
 *
 * @param document Loader document or a structurally compatible test document.
 * @param state Honest whole-resource state derived after integrity checks.
 * @returns Nothing.
 * @example
 * ```ts
 * applyLoaderScreenState(document, { phase: 'active', active: true, cohortClosed: true, completed: 1, total: 2 });
 * ```
 */
export function applyLoaderScreenState(document: LoaderScreenDocument, state: LoaderScreenState): void {
  const root = document.getElementById('napplet-loader');
  if (!root) return;
  const title = document.getElementById('napplet-loader-title');
  const status = document.getElementById('napplet-loader-status');
  const progress = document.getElementById('napplet-loader-progress');
  const resource = document.getElementById('napplet-loader-resource');
  const retry = document.getElementById('napplet-loader-retry');
  const cancel = document.getElementById('napplet-loader-cancel');
  const error = state.phase === 'error' || state.phase === 'cancelled';

  root.setAttribute('aria-busy', String(state.active));
  root.setAttribute('data-state', state.phase);
  if (title) title.textContent = titleFor(state.phase);
  if (status) status.textContent = statusFor(state);
  if (progress) {
    progress.hidden = !state.active;
    progress.removeAttribute('value');
  }
  if (resource) {
    resource.hidden = !error;
    resource.textContent = error && state.source ? sanitizeResourceLabel(state.source) : '';
  }
  if (retry) retry.hidden = !error;
  if (cancel) cancel.hidden = !state.active;
  if (error) retry?.focus?.();
}

/**
 * Render display-ready loader markup for immediate insertion after `<body>`.
 *
 * @returns Inline markup with one persistent live region and one native
 * indeterminate progress element.
 * @example
 * ```ts
 * const markup = renderLoaderScreenMarkup();
 * ```
 */
export function renderLoaderScreenMarkup(): string {
  return `<main id="napplet-loader" class="napplet-loader" data-state="initial" aria-busy="false" aria-labelledby="napplet-loader-title">
  <section class="napplet-loader-card">
    <p class="napplet-loader-eyebrow" aria-hidden="true">Packaged application</p>
    <h1 id="napplet-loader-title">Preparing packaged application</h1>
    <p id="napplet-loader-status" class="napplet-loader-status" role="status" aria-live="polite" aria-atomic="true">${INITIAL_STATUS}</p>
    <progress id="napplet-loader-progress" class="napplet-loader-progress" aria-label="Packaged resources loading" hidden></progress>
    <p id="napplet-loader-resource" class="napplet-loader-resource" dir="auto" hidden></p>
    <div class="napplet-loader-actions">
      <button id="napplet-loader-retry" class="napplet-loader-primary" type="button" hidden>Retry</button>
      <button id="napplet-loader-cancel" type="button" hidden>Cancel</button>
    </div>
  </section>
</main>`;
}

/**
 * Render the loader's dependency-free light, dark, responsive, and motion-safe CSS.
 *
 * @returns A complete inline stylesheet body without remote references.
 * @example
 * ```ts
 * const css = renderLoaderScreenStyle();
 * ```
 */
export function renderLoaderScreenStyle(): string {
  return `:root {
  color-scheme: light dark;
  --napplet-loader-canvas: #f5f7f2;
  --napplet-loader-panel: #ffffff;
  --napplet-loader-panel-strong: #eef3ed;
  --napplet-loader-text: #16211c;
  --napplet-loader-muted: #5a6761;
  --napplet-loader-border: #d6dfd7;
  --napplet-loader-accent: #2f6f58;
  --napplet-loader-accent-ink: #ffffff;
  --napplet-loader-error: #b42318;
  --napplet-loader-error-soft: #fce8e6;
}
.napplet-loader, .napplet-loader * { box-sizing: border-box; }
.napplet-loader {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  min-width: 0;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: clamp(16px, 4vw, 32px);
  overflow: auto;
  background: var(--napplet-loader-canvas);
  color: var(--napplet-loader-text);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.napplet-loader-card {
  width: min(640px, 100%);
  padding: clamp(22px, 4vw, 32px);
  border: 1px solid var(--napplet-loader-border);
  border-radius: 28px;
  background: var(--napplet-loader-panel);
  box-shadow: 0 28px 70px rgba(11, 22, 16, 0.14);
}
.napplet-loader-eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  margin: 0;
  padding: 0 12px;
  border: 1px solid var(--napplet-loader-border);
  border-radius: 999px;
  background: var(--napplet-loader-panel-strong);
  color: var(--napplet-loader-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.napplet-loader-eyebrow::before {
  content: "";
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--napplet-loader-accent);
}
.napplet-loader h1 {
  margin: 16px 0 0;
  color: var(--napplet-loader-text);
  font-size: clamp(28px, 6vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.04em;
}
.napplet-loader-status {
  margin: 12px 0 0;
  color: var(--napplet-loader-muted);
  font-size: 16px;
  line-height: 1.55;
  font-variant-numeric: tabular-nums;
}
.napplet-loader-progress {
  width: 100%;
  height: 14px;
  margin: 22px 0 0;
  overflow: hidden;
  border: 1px solid var(--napplet-loader-border);
  border-radius: 999px;
  background: var(--napplet-loader-panel-strong);
  color: var(--napplet-loader-accent);
  accent-color: var(--napplet-loader-accent);
  animation: napplet-loader-activity 1.15s ease-in-out infinite alternate;
}
.napplet-loader-progress[hidden] { display: none; }
.napplet-loader-progress::-webkit-progress-bar {
  border-radius: inherit;
  background: var(--napplet-loader-panel-strong);
}
.napplet-loader-progress::-webkit-progress-value {
  border-radius: inherit;
  background: var(--napplet-loader-accent);
}
.napplet-loader-progress::-moz-progress-bar {
  border-radius: inherit;
  background: var(--napplet-loader-accent);
}
.napplet-loader-resource {
  margin: 20px 0 0;
  padding: 14px 16px;
  overflow-wrap: anywhere;
  border: 1px solid var(--napplet-loader-error);
  border-radius: 16px;
  background: var(--napplet-loader-error-soft);
  color: var(--napplet-loader-error);
  font-size: 14px;
  line-height: 1.5;
}
.napplet-loader-resource[hidden] { display: none; }
.napplet-loader-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}
.napplet-loader-actions:has(button:not([hidden])) { min-height: 44px; }
.napplet-loader button {
  min-width: 88px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--napplet-loader-border);
  border-radius: 14px;
  background: var(--napplet-loader-panel);
  color: var(--napplet-loader-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}
.napplet-loader button[hidden] { display: none; }
.napplet-loader button:hover { transform: translateY(-1px); }
.napplet-loader button:active { transform: translateY(0) scale(0.98); }
.napplet-loader button:focus-visible {
  outline: 3px solid var(--napplet-loader-accent);
  outline-offset: 3px;
  box-shadow: 0 0 0 2px var(--napplet-loader-panel);
}
.napplet-loader .napplet-loader-primary {
  border-color: var(--napplet-loader-accent);
  background: var(--napplet-loader-accent);
  color: var(--napplet-loader-accent-ink);
}
@keyframes napplet-loader-activity {
  from { box-shadow: inset 0 0 0 1px var(--napplet-loader-accent); }
  to { box-shadow: inset 0 0 0 5px var(--napplet-loader-accent); }
}
@media (prefers-color-scheme: dark) {
  :root {
    --napplet-loader-canvas: #0f1412;
    --napplet-loader-panel: #171d1a;
    --napplet-loader-panel-strong: #1d241f;
    --napplet-loader-text: #f1f5f2;
    --napplet-loader-muted: #a8b6af;
    --napplet-loader-border: #3d4842;
    --napplet-loader-accent: #70d6aa;
    --napplet-loader-accent-ink: #0f1412;
    --napplet-loader-error: #ff8b82;
    --napplet-loader-error-soft: #361916;
  }
  .napplet-loader-card { box-shadow: 0 28px 70px rgba(0, 0, 0, 0.38); }
}
@media (prefers-reduced-motion: reduce) {
  .napplet-loader-progress { animation: none; box-shadow: inset 0 0 0 3px var(--napplet-loader-accent); }
  .napplet-loader button { transition-duration: 0ms; }
}
@media (max-width: 640px) {
  .napplet-loader-card { border-radius: 22px; }
  .napplet-loader-actions, .napplet-loader button { width: 100%; }
}`;
}

/**
 * Render the emitted loader's DOM projection helpers.
 *
 * @returns Dependency-free JavaScript defining `applyLoaderScreenState`.
 * @example
 * ```ts
 * const source = renderLoaderScreenRuntime();
 * ```
 */
export function renderLoaderScreenRuntime(): string {
  return `function sanitizeScreenResource(source) { return source.replace(/[\\u0000-\\u001f\\u007f-\\u009f]/g, '�'); }
function applyLoaderScreenState(state) {
  const root = document.getElementById('napplet-loader');
  if (!root) return;
  const title = document.getElementById('napplet-loader-title');
  const status = document.getElementById('napplet-loader-status');
  const progress = document.getElementById('napplet-loader-progress');
  const resourceName = document.getElementById('napplet-loader-resource');
  const retryButton = document.getElementById('napplet-loader-retry');
  const cancelButton = document.getElementById('napplet-loader-cancel');
  const isError = state.phase === 'error' || state.phase === 'cancelled';
  root.setAttribute('aria-busy', String(state.active));
  root.setAttribute('data-state', state.phase);
  if (title) title.textContent = state.phase === 'success' ? 'Resources ready' : state.phase === 'error' ? 'Resource loading failed' : state.phase === 'cancelled' ? 'Loading cancelled' : state.phase === 'active' ? 'Loading packaged resources' : 'Preparing packaged application';
  if (status) status.textContent = state.phase === 'success' ? '${SUCCESS_STATUS}' : state.phase === 'error' ? '${ERROR_STATUS}' : state.phase === 'cancelled' ? '${CANCELLED_STATUS}' : state.phase === 'active' && state.cohortClosed && state.total > 0 ? 'Loading resources ' + state.completed + ' of ' + state.total : state.phase === 'active' ? '${ACTIVE_STATUS}' : '${INITIAL_STATUS}';
  if (progress) { progress.hidden = !state.active; progress.removeAttribute('value'); }
  if (resourceName) { resourceName.hidden = !isError; resourceName.textContent = isError && state.source ? sanitizeScreenResource(state.source) : ''; }
  if (retryButton) retryButton.hidden = !isError;
  if (cancelButton) cancelButton.hidden = !state.active;
  if (isError && retryButton) retryButton.focus();
}`;
}

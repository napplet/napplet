import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEMO_URL = 'http://127.0.0.1:4174';
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let demoServer: ChildProcessWithoutNullStreams | null = null;

function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if ((res.statusCode ?? 500) < 500) { resolve(); return; }
        retry(new Error(`unexpected status ${res.statusCode}`));
      });
      req.on('error', retry);
    };
    const retry = (error: Error) => {
      if (Date.now() >= deadline) { reject(error); return; }
      setTimeout(attempt, 250);
    };
    attempt();
  });
}

async function openDemo(page: Page): Promise<void> {
  await page.goto(DEMO_URL);
  await expect(page.locator('#chat-status')).toHaveText('authenticated', { timeout: 30_000 });
  await expect(page.locator('#bot-status')).toHaveText('authenticated', { timeout: 30_000 });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  demoServer = spawn(
    'pnpm',
    ['--filter', '@napplet/demo', 'exec', 'vite', '--host', '127.0.0.1', '--port', '4174', '--strictPort'],
    { cwd: PROJECT_ROOT, stdio: 'pipe' },
  );
  demoServer.stderr.on('data', () => { /* drain */ });
  demoServer.stdout.on('data', () => { /* drain */ });
  await waitForServer(DEMO_URL, 30_000);
});

test.afterAll(async () => {
  if (demoServer && !demoServer.killed) {
    demoServer.kill('SIGTERM');
  }
});

test('notification node is visible in the topology', async ({ page }) => {
  await openDemo(page);
  // The notifications service node should be rendered by buildDemoTopology
  const notifNode = page.locator('#topology-node-service-notifications');
  await expect(notifNode).toBeVisible();
});

test('node-control path: create toast and verify summary increments', async ({ page }) => {
  await openDemo(page);

  // Get initial total count
  const totalEl = page.locator('#notif-total');
  const initialText = await totalEl.textContent() ?? '0';
  const initialCount = parseInt(initialText, 10);

  // Click the create button in the notification node
  const createBtn = page.locator('#notification-node-create');
  await expect(createBtn).toBeVisible({ timeout: 5_000 });
  await createBtn.click();

  // Toast should appear
  await expect(page.locator('#notification-toast-layer .notif-toast')).toBeVisible({ timeout: 3_000 });

  // Toast should contain the service cue
  await expect(page.locator('#notification-toast-layer .notif-toast .notif-toast-cue')).toContainText('notifications:create via service');

  // Summary total should increment
  await expect(totalEl).toHaveText(String(initialCount + 1), { timeout: 3_000 });

  // Debugger should show the topic
  await expect(page.locator('napplet-debugger')).toContainText('notifications:create', { timeout: 3_000 });
});

test('list state opens inspector and shows notifications', async ({ page }) => {
  await openDemo(page);

  // Create a notification first
  await page.locator('#notification-node-create').click();
  await expect(page.locator('#notification-toast-layer .notif-toast')).toBeVisible({ timeout: 3_000 });

  // Click list — should open inspector
  await page.locator('#notification-node-list').click();

  // Inspector should be visible
  const inspector = page.locator('#notification-inspector');
  await expect(inspector).toBeVisible({ timeout: 2_000 });

  // Inspector list should contain notification entries
  await expect(page.locator('#notification-list')).not.toContainText('no notifications yet', { timeout: 2_000 });
  await expect(page.locator('#notification-list .notif-item')).toHaveCount(1, { timeout: 2_000 });
});

test('mark latest read decrements unread count', async ({ page }) => {
  await openDemo(page);

  // Create a notification
  await page.locator('#notification-node-create').click();
  await expect(page.locator('#notification-toast-layer .notif-toast')).toBeVisible({ timeout: 3_000 });

  // Get unread count before marking
  const unreadEl = page.locator('#notif-unread');
  const beforeText = await unreadEl.textContent() ?? '0';
  const beforeCount = parseInt(beforeText, 10);
  expect(beforeCount).toBeGreaterThan(0);

  // Click mark latest read
  await page.locator('#notification-node-mark-read').click();

  // Unread count should decrement
  await expect(unreadEl).toHaveText(String(beforeCount - 1), { timeout: 3_000 });
});

test('dismiss latest removes notification from inspector', async ({ page }) => {
  await openDemo(page);

  // Create a notification
  await page.locator('#notification-node-create').click();
  await expect(page.locator('#notification-toast-layer .notif-toast')).toBeVisible({ timeout: 3_000 });

  // Open inspector
  await page.locator('#notification-node-list').click();
  await expect(page.locator('#notification-inspector')).toBeVisible({ timeout: 2_000 });
  const beforeItems = await page.locator('#notification-list .notif-item').count();

  // Dismiss
  await page.locator('#notification-node-dismiss').click();

  // Inspector item count should decrease
  await expect(page.locator('#notification-list .notif-item')).toHaveCount(beforeItems - 1, { timeout: 3_000 });
});

test('napplet-driven path: chat message triggers notification toast', async ({ page }) => {
  await openDemo(page);

  const initialToastCount = await page.locator('#notification-toast-layer .notif-toast').count();

  // Send a chat message — the chat napplet emits notifications:create
  const chatFrame = page.frameLocator('#chat-frame-container iframe');
  await chatFrame.locator('#msg-input').fill('notification test message');
  await chatFrame.locator('#send-btn').click();

  // A toast should appear from the napplet-driven path
  await expect(page.locator('#notification-toast-layer .notif-toast')).toHaveCount(initialToastCount + 1, { timeout: 5_000 });

  // The toast should show the service cue, confirming it went through the real service path
  await expect(page.locator('#notification-toast-layer .notif-toast').last()).toContainText('notifications:create via service');
});

test('inspector per-item dismiss control removes notification from list', async ({ page }) => {
  await openDemo(page);

  // Create a notification via node control
  await page.locator('#notification-node-create').click();
  await expect(page.locator('#notification-toast-layer .notif-toast')).toBeVisible({ timeout: 3_000 });

  // Open inspector
  await page.locator('#notification-node-list').click();
  await expect(page.locator('#notification-inspector')).toBeVisible({ timeout: 2_000 });

  // Wait for list item to appear
  await expect(page.locator('#notification-list .notif-item')).toHaveCount(1, { timeout: 2_000 });

  // Click dismiss on the item
  await page.locator('#notification-list .dismiss-btn').first().click();

  // Item should be removed
  await expect(page.locator('#notification-list .notif-item')).toHaveCount(0, { timeout: 3_000 });
  await expect(page.locator('#notification-list')).toContainText('no notifications yet', { timeout: 2_000 });
});

test('inspector per-item read control updates item appearance', async ({ page }) => {
  await openDemo(page);

  // Create a notification
  await page.locator('#notification-node-create').click();
  await expect(page.locator('#notification-toast-layer .notif-toast')).toBeVisible({ timeout: 3_000 });

  // Open inspector
  await page.locator('#notification-node-list').click();
  await expect(page.locator('#notification-inspector')).toBeVisible({ timeout: 2_000 });
  await expect(page.locator('#notification-list .notif-item')).toHaveCount(1, { timeout: 2_000 });

  // Item should initially be unread (has read-btn)
  await expect(page.locator('#notification-list .read-btn')).toHaveCount(1);

  // Click mark read
  await page.locator('#notification-list .read-btn').first().click();

  // After mark-read, the read-btn should disappear (item is read) and class becomes 'read'
  await expect(page.locator('#notification-list .notif-item.read')).toHaveCount(1, { timeout: 3_000 });
  await expect(page.locator('#notification-list .read-btn')).toHaveCount(0, { timeout: 2_000 });
});

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
        if ((res.statusCode ?? 500) < 500) {
          resolve();
          return;
        }
        retry(new Error(`unexpected status ${res.statusCode}`));
      });
      req.on('error', retry);
    };

    const retry = (error: Error) => {
      if (Date.now() >= deadline) {
        reject(error);
        return;
      }
      setTimeout(attempt, 250);
    };

    attempt();
  });
}

async function openDemo(page: Page): Promise<void> {
  await page.goto(DEMO_URL);
  await expect(page.locator('#chat-status')).toHaveText('authenticated');
  await expect(page.locator('#bot-status')).toHaveText('authenticated');
  await expect(page.locator('#chat-acl button')).toContainText(['Relay Publish / Inter-Pane Send']);
}

async function revokeChatCapability(page: Page, label: string): Promise<void> {
  await page.locator('#chat-acl button', { hasText: label }).click();
}

async function sendChatMessage(page: Page, text: string): Promise<void> {
  const chatFrame = page.frameLocator('#chat-frame-container iframe');
  await chatFrame.locator('#msg-input').fill(text);
  await chatFrame.locator('#send-btn').click();
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  demoServer = spawn(
    'pnpm',
    ['--filter', '@napplet/demo', 'exec', 'vite', '--host', '127.0.0.1', '--port', '4174', '--strictPort'],
    { cwd: PROJECT_ROOT, stdio: 'pipe' },
  );

  demoServer.stderr.on('data', () => {
    // Keep stderr drained so the server process cannot block.
  });
  demoServer.stdout.on('data', () => {
    // Keep stdout drained so the server process cannot block.
  });

  await waitForServer(DEMO_URL, 30_000);
});

test.afterAll(async () => {
  if (demoServer && !demoServer.killed) {
    demoServer.kill('SIGTERM');
  }
});

test('revoke chat relay:write and keep debugger paths legible', async ({ page }) => {
  await openDemo(page);
  await revokeChatCapability(page, 'Relay Publish / Inter-Pane Send');
  await sendChatMessage(page, 'relay write revoked');

  await expect(page.locator('napplet-debugger')).toContainText('path:inter-pane-send');
  await expect(page.locator('napplet-debugger')).toContainText('path:relay-publish');
  await expect(page.locator('napplet-debugger')).toContainText('denied: relay:write');
});

test('revoke chat state:write and preserve the exact denial string', async ({ page }) => {
  await openDemo(page);
  await revokeChatCapability(page, 'State Write');
  await sendChatMessage(page, 'state write revoked');

  await expect(page.locator('napplet-debugger')).toContainText('denied: state:write');
});

test('revoke chat sign:event and separate inter-pane success from signer denial', async ({ page }) => {
  await openDemo(page);
  await revokeChatCapability(page, 'Signer Requests');
  await sendChatMessage(page, 'signer revoked');

  const chatFrame = page.frameLocator('#chat-frame-container iframe');
  const botFrame = page.frameLocator('#bot-frame-container iframe');

  await expect(botFrame.locator('#log')).toContainText('signer revoked');
  await expect(chatFrame.locator('#messages')).toContainText('[bot]');
  await expect(page.locator('napplet-debugger')).toContainText('path:inter-pane-send');
  await expect(page.locator('napplet-debugger')).toContainText('denied: sign:event');
});

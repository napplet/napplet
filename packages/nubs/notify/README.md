> ⚠️ **DEPRECATED** — This package is a re-export shim for backwards compatibility.
> **Migrate to `@napplet/nub/notify`** — all types, shim installers, and SDK
> helpers are now exported from there. This package will be removed in a future
> milestone.

# @napplet/nub-notify

> TypeScript message types, shim, and SDK helpers for the notify NUB domain (shell-rendered notifications).

## Installation

```bash
npm install @napplet/nub-notify
```

## Overview

NUB-NOTIFY provides notification delivery between napplets and the shell. Napplets that need to alert users send notification requests to the shell, which renders them using its own UI (toasts, system notifications, badge counts) and routes user interaction back to the napplet.

Key features:

1. **Shell-rendered** -- napplets never render notifications directly
2. **Priority levels** -- low, normal, high, urgent
3. **Action buttons** -- up to 3 per notification with callback routing
4. **Channels** -- per-category user control (mute "promotions" but keep "messages")
5. **Permission flow** -- explicit request/grant before sending
6. **Badge counts** -- set/clear badge on the napplet's tile or tab
7. **Interaction callbacks** -- action clicks, body clicks, dismissals with reason

## Message Types

All messages use the NIP-5D JSON envelope wire format (`{ type: "notify.<action>", ...payload }`).

### Napplet -> Shell

| Type | Payload | Description |
|------|---------|-------------|
| `notify.send` | `id`, `title`, `body?`, `icon?`, `actions?`, `channel?`, `priority?` | Send a notification (correlated by `id`) |
| `notify.dismiss` | `notificationId` | Dismiss a notification (fire-and-forget) |
| `notify.badge` | `count` | Set badge count, 0 to clear (fire-and-forget) |
| `notify.channel.register` | `channelId`, `label`, `description?`, `defaultPriority?` | Register a channel (fire-and-forget) |
| `notify.permission.request` | `id`, `channel?` | Request permission (correlated by `id`) |

### Shell -> Napplet

| Type | Payload | Description |
|------|---------|-------------|
| `notify.send.result` | `id`, `notificationId?`, `error?` | Result of notification send |
| `notify.permission.result` | `id`, `granted` | Result of permission request |
| `notify.action` | `notificationId`, `actionId` | User clicked an action button |
| `notify.clicked` | `notificationId` | User clicked notification body |
| `notify.dismissed` | `notificationId`, `reason?` | Notification dismissed (user/timeout/replaced) |
| `notify.controls` | `controls[]` | Shell pushes supported capabilities |

## Usage

```ts
import type {
  NotifySendMessage,
  NotifyActionMessage,
  NotifyNubMessage,
  NotificationAction,
  NotificationPriority,
} from '@napplet/nub-notify';

import { DOMAIN } from '@napplet/nub-notify';
// DOMAIN === 'notify'
```

### Shim API

```ts
import {
  send,
  dismiss,
  badge,
  registerChannel,
  requestPermission,
  onAction,
  onClicked,
  onDismissed,
  onControls,
} from '@napplet/nub-notify';

// Request permission first
const { granted } = await requestPermission();
if (!granted) return;

// Register a channel
registerChannel({
  channelId: 'messages',
  label: 'Messages',
  description: 'Direct messages and mentions',
  defaultPriority: 'normal',
});

// Send a notification
const { notificationId } = await send({
  title: 'New message',
  body: 'Alice: hey!',
  channel: 'messages',
  priority: 'normal',
  actions: [
    { id: 'reply', label: 'Reply' },
    { id: 'dismiss', label: 'Dismiss' },
  ],
});

// Set badge count
badge(3);

// Listen for action clicks
const actionSub = onAction((notifId, actionId) => {
  if (actionId === 'reply') openReplyDialog(notifId);
});

// Listen for body clicks
const clickSub = onClicked((notifId) => {
  focusConversation(notifId);
});

// Listen for dismissals
const dismissSub = onDismissed((notifId, reason) => {
  if (reason === 'user') markAsRead(notifId);
});

// Listen for shell capabilities
const ctrlSub = onControls((controls) => {
  canUseBadges = controls.includes('badges');
});

// Clean up
actionSub.close();
clickSub.close();
dismissSub.close();
ctrlSub.close();
dismiss(notificationId);
badge(0);
```

### SDK Helpers

```ts
import {
  notifySend,
  notifyDismiss,
  notifyBadge,
  notifyRegisterChannel,
  notifyRequestPermission,
  notifyOnAction,
  notifyOnClicked,
  notifyOnDismissed,
  notifyOnControls,
} from '@napplet/nub-notify';
```

### Supporting Types

```ts
interface NotificationAction {
  id: string;
  label: string;
}

interface NotificationChannel {
  channelId: string;
  label: string;
  description?: string;
  defaultPriority?: NotificationPriority;
}

type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

type NotifyControl = 'toasts' | 'badges' | 'actions' | 'channels' | 'system';
```

## Domain Registration

Importing `@napplet/nub-notify` automatically registers the `'notify'` domain with the core dispatch singleton via `registerNub()`. This ensures `dispatch.getRegisteredDomains()` includes `'notify'`.

## Protocol Reference

- [NUB-NOTIFY spec](https://github.com/napplet/nubs/pull/11)
- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification

## License

MIT

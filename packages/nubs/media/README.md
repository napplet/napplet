> ⚠️ **DEPRECATED** — This package is a re-export shim for backwards compatibility.
> **Migrate to `@napplet/nub/media`** — all types, shim installers, and SDK
> helpers are now exported from there. This package will be removed in a future
> milestone.

# @napplet/nub-media

> TypeScript message types, shim, and SDK helpers for the media NUB domain (media session control and playback).

## Installation

```bash
npm install @napplet/nub-media
```

## Overview

NUB-MEDIA provides media session management between napplets and the shell. Napplets that play audio or video create media sessions to expose playback state and metadata to the shell, which displays media controls and enforces audio policy.

Key features:

1. **Explicit session lifecycle** -- create, update, and destroy sessions
2. **Multiple sessions per napplet** -- each identified by a unique sessionId
3. **Dynamic capabilities** -- napplets declare which actions they support, can change mid-session
4. **Dual volume** -- napplet reports its volume, shell can adjust via command
5. **Shell control list** -- shell tells napplet which controls it supports
6. **Rich metadata** -- title, artist, album, artwork (URL or Blossom hash), duration, mediaType -- all optional

## Message Types

All messages use the NIP-5D JSON envelope wire format (`{ type: "media.<action>", ...payload }`).

### Napplet -> Shell

| Type | Payload | Description |
|------|---------|-------------|
| `media.session.create` | `id`, `sessionId`, `metadata?` | Create a new media session (correlated by `id`) |
| `media.session.update` | `sessionId`, `metadata` | Update session metadata (fire-and-forget) |
| `media.session.destroy` | `sessionId` | Destroy a session (fire-and-forget) |
| `media.state` | `sessionId`, `status`, `position?`, `duration?`, `volume?` | Report playback state (fire-and-forget) |
| `media.capabilities` | `sessionId`, `actions[]` | Declare supported actions (fire-and-forget) |

### Shell -> Napplet

| Type | Payload | Description |
|------|---------|-------------|
| `media.session.create.result` | `id`, `sessionId`, `error?` | Result of session creation |
| `media.command` | `sessionId`, `action`, `value?` | Shell sends playback command |
| `media.controls` | `controls[]` | Shell pushes its supported control list |

## Usage

```ts
import type {
  MediaSessionCreateMessage,
  MediaCommandMessage,
  MediaNubMessage,
  MediaMetadata,
  MediaAction,
} from '@napplet/nub-media';

import { DOMAIN } from '@napplet/nub-media';
// DOMAIN === 'media'
```

### Shim API

```ts
import {
  createSession,
  updateSession,
  destroySession,
  reportState,
  reportCapabilities,
  onCommand,
  onControls,
} from '@napplet/nub-media';

// Create a session
const { sessionId } = await createSession({
  title: 'My Song',
  artist: 'The Artist',
  artwork: { hash: 'abc123...' },
});

// Report playback state
reportState(sessionId, {
  status: 'playing',
  position: 42.5,
  duration: 240,
  volume: 0.8,
});

// Declare capabilities
reportCapabilities(sessionId, ['play', 'pause', 'seek', 'volume']);

// Listen for shell commands
const sub = onCommand(sessionId, (action, value) => {
  if (action === 'pause') player.pause();
  if (action === 'seek') player.seekTo(value);
  if (action === 'volume') player.setVolume(value);
});

// Listen for shell control list
const ctrlSub = onControls(sessionId, (controls) => {
  showNextButton = controls.includes('next');
});

// Clean up
sub.close();
ctrlSub.close();
destroySession(sessionId);
```

### SDK Helpers

```ts
import {
  mediaCreateSession,
  mediaReportState,
  mediaReportCapabilities,
  mediaOnCommand,
  mediaDestroySession,
} from '@napplet/nub-media';
```

### Supporting Types

```ts
interface MediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: { url?: string; hash?: string };
  duration?: number;
  mediaType?: 'audio' | 'video';
}

type MediaAction = 'play' | 'pause' | 'stop' | 'next' | 'prev' | 'seek' | 'volume';
```

### Artwork

The `artwork` field supports two forms:

- `url` -- A direct URL to the artwork image
- `hash` -- A Blossom hash (SHA-256) the shell can resolve via its Blossom servers

If both are provided, the shell MAY prefer either.

## Domain Registration

Importing `@napplet/nub-media` automatically registers the `'media'` domain with the core dispatch singleton via `registerNub()`. This ensures `dispatch.getRegisteredDomains()` includes `'media'`.

## Protocol Reference

- [NUB-MEDIA spec](https://github.com/napplet/nubs/blob/main/NUB-MEDIA.md)
- [NIP-5D](../../specs/NIP-5D.md) -- Napplet-shell protocol specification

## License

MIT

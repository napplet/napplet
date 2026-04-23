# Phase 5: Demo Playground - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 5-Demo Playground
**Areas discussed:** Demo layout & design, Message debugger, Napplet content

---

## Demo Layout & Design

### Page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Three-column | Napp1 | Controls | Napp2, debugger below | |
| Two-column + bottom | Both napplets left, debugger right, controls top | ✓ |

### ACL controls

| Option | Description | Selected |
|--------|-------------|----------|
| Per-napplet capability toggles | Toggle switches per capability | ✓ |
| Command palette style | Text input for ACL commands | |

### CSS framework

| Option | Description | Selected |
|--------|-------------|----------|
| Plain CSS | No dependencies | |
| Minimal utility CSS | Pico CSS or similar | |
| UnoCSS | Tailwind-compatible, Vite plugin | ✓ |

**User's notes:** "there is a derivative of tailwindcss that is more performant" → identified as UnoCSS. Important for later milestones.

### Dev server

| Option | Description | Selected |
|--------|-------------|----------|
| Own Vite dev server | Shell at localhost, napplets from NIP-5A gateway | ✓ |
| Reuse test gateway | Everything through gateway | |

**User's notes:** "locally yes, but the actual demo will be deployed in a production scenario: blossom, relay, NIP-5A gateway"

### Aesthetics

| Option | Description | Selected |
|--------|-------------|----------|
| Dark terminal/hacker | Dark bg, monospace, neon accents | ✓ |
| Clean modern SaaS | Light/dark, rounded cards | |
| Nostr-native purple | Purple accents | |

---

## Message Debugger

### Display format

| Option | Description | Selected |
|--------|-------------|----------|
| Live log with color coding | Scrolling log, type colors, filtering | |
| Sequence diagram | Mermaid-style swimlane | |
| Both (log + diagram) | Tabbed view | ✓ |

### Diagram renderer

| Option | Description | Selected |
|--------|-------------|----------|
| Mermaid.js | Text-based notation, SVG output | |
| Custom SVG renderer | Hand-built swimlane, animation control | ✓ |

### Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Web component | <napplet-debugger>, self-contained, extractable | ✓ |
| Built into demo | Part of demo page code | |

### ACL in log

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — as system events | ACL changes appear in log with distinct styling | ✓ |
| No — separate panel | | |

---

## Napplet Content

### Brainstorming (user-driven)

User requirements: "two napps that inherently work together" + must demonstrate napp↔ACL↔napp AND napp↔ACL↔remoteRelays

Options brainstormed:
- Feed Reader + Composer (clean read/write split)
- Profile Editor + Social Feed (destructive signing consent)
- Chat + Bot (most interactive, delegated signing)
- Music production sync (eye-catching but complex)
- Stream + Chat (from hyprgate, practical but less novel)

**User's choice:** Chat + Bot

### Bot behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Scripted responses | Pre-defined keyword responses | |
| Echo + transform | Echo with modifications | |
| Prompt-triggered scenarios | Commands trigger protocol demos | |
| Interactive + teachable | Fun to play with, /teach command | ✓ |

**User's notes:** "should be somewhat interesting and interactive. so something simple that people can play with and tweak" + "should be aesthetically interesting as well"

### Bot teachability

| Option | Description | Selected |
|--------|-------------|----------|
| Rule editor panel | UI panel for editing rules | |
| Via chat commands | /teach trigger response | ✓ |
| Fixed but fun | Built-in responses only | |

---

## Claude's Discretion

- Accent color palette
- Debugger filter UI
- SVG swimlane implementation
- Chat UI within iframe
- Bot default personality
- Additional chat commands

## Deferred Ideas

- @napplet/devtools package extraction
- Music production demo napplets
- Stream + Chat napplets (hyprgate)

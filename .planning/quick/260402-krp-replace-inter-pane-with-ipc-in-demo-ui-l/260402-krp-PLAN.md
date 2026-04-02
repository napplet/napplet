---
phase: quick
plan: 260402-krp
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/demo/napplets/chat/src/main.ts
  - apps/demo/napplets/bot/src/main.ts
  - apps/demo/src/main.ts
  - apps/demo/src/acl-panel.ts
  - apps/demo/src/sequence-diagram.ts
  - apps/demo/src/debugger.ts
  - apps/demo/src/shell-host.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "No occurrences of 'inter-pane' (case-insensitive) remain in apps/demo/"
    - "All replaced strings use 'ipc' or 'IPC' as context-appropriate equivalent"
    - "No code logic, imports, or wire protocol constants are changed"
  artifacts:
    - path: "apps/demo/napplets/chat/src/main.ts"
      provides: "Chat napplet with ipc terminology in comments, logs, and pending ack strings"
    - path: "apps/demo/napplets/bot/src/main.ts"
      provides: "Bot napplet with ipc terminology in comments and log messages"
    - path: "apps/demo/src/main.ts"
      provides: "Demo shell main with ipc log label"
    - path: "apps/demo/src/acl-panel.ts"
      provides: "ACL panel with ipc capability descriptions"
    - path: "apps/demo/src/sequence-diagram.ts"
      provides: "Sequence diagram with ipc labels"
    - path: "apps/demo/src/debugger.ts"
      provides: "Debugger with ipc category names"
    - path: "apps/demo/src/shell-host.ts"
      provides: "Shell host with ipc path names and explanations"
  key_links: []
---

<objective>
Replace all "inter-pane" terminology in demo UI with "ipc" equivalents.

Purpose: The wire protocol constant BusKind.IPC_PEER was already renamed in Phase 35. The demo UI labels, log messages, comments, debugger categories, ACL descriptions, and sequence diagram labels still use the old "inter-pane" terminology. This quick task brings demo text in line with the protocol rename.

Output: 7 files updated with consistent "ipc" terminology. Zero logic changes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace inter-pane with ipc in napplet demo sources (chat + bot)</name>
  <files>apps/demo/napplets/chat/src/main.ts, apps/demo/napplets/bot/src/main.ts</files>
  <action>
In apps/demo/napplets/chat/src/main.ts, make these string/comment replacements (preserve surrounding context exactly):

- Line 4 comment: "inter-pane emit" -> "ipc emit"
- Line 9 comment: "(inter-pane)" -> "(ipc)"
- Line 10 comment: "(inter-pane)" -> "(ipc)"
- Line 19 comment: leave "INTER_PANE" alone (it refers to the BusKind constant name), but no change needed since it is a code identifier reference
- Line 101: `'inter-pane send'` -> `'ipc send'`
- Line 103: `'inter-pane send attempted -- chat:message'` -> `'ipc send attempted -- chat:message'`
- Line 107: `'inter-pane send failed --` -> `'ipc send failed --`
- Line 166 comment: "inter-pane" -> "ipc"
- Line 170: `'inter-pane receive -- bot:response'` -> `'ipc receive -- bot:response'`

In apps/demo/napplets/bot/src/main.ts, make these replacements:

- Line 4 comment: "inter-pane on/emit" -> "ipc on/emit"
- Line 19 comment: leave "INTER_PANE" alone (code identifier reference)
- Line 161: `'inter-pane chat:message received --` -> `'ipc chat:message received --`
- Line 170 comment: "inter-pane" -> "ipc"
- Line 176: `'inter-pane bot:response sent'` -> `'ipc bot:response sent'`
- Line 180: `'inter-pane response failed --` -> `'ipc response failed --`
- Line 196: `'listening for inter-pane chat:message input'` -> `'listening for ipc chat:message input'`
- Line 201 comment: "inter-pane" -> "ipc"
- Line 204: `'subscribed to inter-pane chat:message topic'` -> `'subscribed to ipc chat:message topic'`

IMPORTANT: Do NOT change any line that references `INTER_PANE` as a code constant/enum value. Only change user-facing strings and comments that use the lowercase hyphenated "inter-pane" form.
  </action>
  <verify>
    <automated>cd /home/sandwich/Develop/napplet && grep -ci 'inter-pane' apps/demo/napplets/chat/src/main.ts apps/demo/napplets/bot/src/main.ts | grep -v ':0$' | grep -v 'INTER_PANE' ; test $? -ne 0 && echo "PASS: no inter-pane occurrences remain (excluding INTER_PANE constants)" || echo "FAIL: inter-pane still found"</automated>
  </verify>
  <done>Zero occurrences of lowercase "inter-pane" in chat/main.ts and bot/main.ts. All log messages and comments use "ipc" instead.</done>
</task>

<task type="auto">
  <name>Task 2: Replace inter-pane with ipc in demo shell UI modules</name>
  <files>apps/demo/src/main.ts, apps/demo/src/acl-panel.ts, apps/demo/src/sequence-diagram.ts, apps/demo/src/debugger.ts, apps/demo/src/shell-host.ts</files>
  <action>
In apps/demo/src/main.ts:

- Line 587 comment: "inter-pane" -> "ipc"
- Line 590: template literal `inter-pane: ${msg.parsed.topic}` -> `ipc: ${msg.parsed.topic}`

In apps/demo/src/acl-panel.ts:

- Line 14: `'Relay Publish / Inter-Pane Send'` -> `'Relay Publish / IPC Send'`
- Line 26: `'relay subscribe / inter-pane receive'` -> `'relay subscribe / ipc receive'`
- Line 27: `'relay publish / inter-pane send'` -> `'relay publish / ipc send'`

In apps/demo/src/sequence-diagram.ts:

- Line 126: `` return `inter-pane ${topic}` `` -> `` return `ipc ${topic}` ``
- Line 127: `` return `inter-pane ${topic ?? 'event'}` `` -> `` return `ipc ${topic ?? 'event'}` ``

In apps/demo/src/debugger.ts:

- Line 40: `'inter-pane-send'` -> `'ipc-send'`
- Line 41: `'inter-pane-receive'` -> `'ipc-receive'`
- Line 87: `'inter-pane-send' : 'inter-pane-receive'` -> `'ipc-send' : 'ipc-receive'`

In apps/demo/src/shell-host.ts:

- Line 69: `'inter-pane-send'` -> `'ipc-send'`
- Line 70: `'inter-pane-receive'` -> `'ipc-receive'`
- Line 124: `path: 'inter-pane-send'` -> `path: 'ipc-send'`
- Line 127: `'Non-state inter-pane events reuse the relay write sender gate before delivery.'` -> `'Non-state ipc events reuse the relay write sender gate before delivery.'`
- Line 130: `path: 'inter-pane-receive'` -> `path: 'ipc-receive'`
- Line 133: `'Recipients need relay read permission to receive non-state inter-pane events.'` -> `'Recipients need relay read permission to receive non-state ipc events.'`

IMPORTANT: These are all string literals and comments. Do NOT change any imports, type references to BusKind.IPC_PEER, or any code logic.
  </action>
  <verify>
    <automated>cd /home/sandwich/Develop/napplet && grep -rci 'inter-pane' apps/demo/src/main.ts apps/demo/src/acl-panel.ts apps/demo/src/sequence-diagram.ts apps/demo/src/debugger.ts apps/demo/src/shell-host.ts | grep -v ':0$' ; test $? -ne 0 && echo "PASS: no inter-pane occurrences remain in shell UI modules" || echo "FAIL: inter-pane still found"</automated>
  </verify>
  <done>Zero occurrences of "inter-pane" (any case) in the 5 shell UI modules. All labels, categories, descriptions, and diagram text use "ipc" / "IPC" as appropriate.</done>
</task>

</tasks>

<verification>
Final check across entire demo directory:

```bash
grep -rci 'inter-pane' apps/demo/ | grep -v ':0$'
```

Expected: no output (zero matches). Note: `INTER_PANE` (underscore, not hyphen) references to BusKind constants are fine and should NOT be changed.

Build verification:

```bash
pnpm build
```

Expected: clean build with no errors (string-only changes should not affect types or compilation).
</verification>

<success_criteria>
- Zero occurrences of "inter-pane" (hyphenated, any case) in apps/demo/
- All replacements use contextually appropriate form: "ipc" in lowercase contexts, "IPC" in title-case contexts
- `pnpm build` passes cleanly
- No code logic, imports, or wire protocol constants were modified
</success_criteria>

<output>
After completion, create `.planning/quick/260402-krp-replace-inter-pane-with-ipc-in-demo-ui-l/260402-krp-SUMMARY.md`
</output>

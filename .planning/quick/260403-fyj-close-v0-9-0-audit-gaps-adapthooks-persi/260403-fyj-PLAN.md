---
phase: quick
plan: 260403-fyj
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/shell/src/types.ts
  - packages/shell/src/hooks-adapter.ts
  - SPEC.md
  - packages/runtime/src/runtime.ts
  - tests/e2e/auth-handshake.spec.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "adaptHooks() uses ShellAdapter-provided shellSecretPersistence/guidPersistence when present"
    - "SPEC.md no longer references legacy AUTH fallback"
    - "E2E auth test asserts REGISTER and IDENTITY messages"
    - "Runtime NOTICE string uses double-dash (--) matching SPEC"
  artifacts:
    - path: "packages/shell/src/types.ts"
      provides: "ShellAdapter with optional shellSecretPersistence and guidPersistence fields"
      contains: "shellSecretPersistence"
    - path: "packages/shell/src/hooks-adapter.ts"
      provides: "adaptHooks using caller-provided persistence when available"
      contains: "shellHooks.shellSecretPersistence"
    - path: "SPEC.md"
      provides: "Spec without legacy fallback language"
    - path: "tests/e2e/auth-handshake.spec.ts"
      provides: "E2E assertions for REGISTER and IDENTITY verbs"
      contains: "REGISTER"
  key_links:
    - from: "packages/shell/src/hooks-adapter.ts"
      to: "packages/shell/src/types.ts"
      via: "ShellAdapter.shellSecretPersistence / guidPersistence"
      pattern: "shellHooks\\.shellSecretPersistence"
---

<objective>
Close 4 tech debt items from the v0.9.0 milestone audit.

Purpose: Clean up spec/implementation gaps and dead-field issues identified in the milestone audit before closing v0.9.0.
Output: Fixed adaptHooks persistence passthrough, cleaned SPEC.md, expanded e2e assertions, fixed NOTICE string.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/shell/src/types.ts (ShellAdapter interface -- add optional persistence fields)
@packages/shell/src/hooks-adapter.ts (adaptHooks -- use caller persistence when provided)
@packages/runtime/src/runtime.ts (line 246 -- em-dash in NOTICE)
@SPEC.md (line 272 -- legacy fallback language)
@tests/e2e/auth-handshake.spec.ts (add REGISTER/IDENTITY assertions)
</context>

<tasks>

<task type="auto">
  <name>Task 1: adaptHooks persistence passthrough and NOTICE fix</name>
  <files>packages/shell/src/types.ts, packages/shell/src/hooks-adapter.ts, packages/runtime/src/runtime.ts</files>
  <action>
1. In `packages/shell/src/types.ts`, add two optional fields to the `ShellAdapter` interface (after the `onHashMismatch?` field, before `services?`):
   ```ts
   /** Optional shell secret persistence. If omitted, adaptHooks() uses localStorage. */
   shellSecretPersistence?: import('@napplet/runtime').ShellSecretPersistence;
   /** Optional GUID persistence. If omitted, adaptHooks() uses localStorage. */
   guidPersistence?: import('@napplet/runtime').GuidPersistence;
   ```
   Import the types inline (as shown) to avoid adding a top-level import from @napplet/runtime in @napplet/shell's public types file. Alternatively, use `import type` at the top if cleaner -- the important thing is the two optional fields exist on ShellAdapter.

2. In `packages/shell/src/hooks-adapter.ts` function `adaptHooks()`:
   - For `shellSecretPersistence`: Check if `shellHooks.shellSecretPersistence` exists. If so, use it directly. Otherwise, fall back to the existing localStorage-backed implementation (lines 326-339).
   - For `guidPersistence`: Check if `shellHooks.guidPersistence` exists. If so, use it directly. Otherwise, fall back to the existing localStorage-backed implementation (lines 343-359).
   - Simplest approach: replace the `const shellSecretPersistence: ShellSecretPersistence = { ... }` block with:
     ```ts
     const shellSecretPersistence: ShellSecretPersistence = shellHooks.shellSecretPersistence ?? {
       get(): Uint8Array | null { ... existing localStorage impl ... },
       set(secret: Uint8Array): void { ... existing localStorage impl ... },
     };
     ```
   - Same pattern for `guidPersistence`.

3. In `packages/runtime/src/runtime.ts` line 246, change the em-dash to double-dash:
   - Before: `'shell secret not available — cannot derive keypair'`
   - After: `'shell secret not available -- cannot derive keypair'`
   - Only change this one protocol string. Do not modify comments or other strings.
  </action>
  <verify>
    <automated>cd /home/sandwich/Develop/napplet && pnpm build && pnpm type-check</automated>
  </verify>
  <done>
    - ShellAdapter interface has optional shellSecretPersistence and guidPersistence fields
    - adaptHooks() uses ShellAdapter-provided persistence when present, falls back to localStorage
    - Runtime NOTICE string uses double-dash (--) matching SPEC.md
    - Build and type-check pass
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove legacy fallback from SPEC and add REGISTER/IDENTITY e2e assertions</name>
  <files>SPEC.md, tests/e2e/auth-handshake.spec.ts</files>
  <action>
1. In `SPEC.md` line 272, remove the legacy AUTH fallback clause. Change:
   ```
   If the shell cannot derive a keypair (e.g., no shell secret persistence available), it MUST send `["NOTICE", "shell secret not available -- cannot derive keypair"]` and proceed with the legacy AUTH flow (napplet generates its own ephemeral key).
   ```
   To:
   ```
   If the shell cannot derive a keypair (e.g., no shell secret persistence available), it MUST send `["NOTICE", "shell secret not available -- cannot derive keypair"]` and abort the handshake. The napplet will not be registered.
   ```

2. In `tests/e2e/auth-handshake.spec.ts`, in the first test ('auth-napplet completes AUTH handshake'), add assertions for REGISTER and IDENTITY messages BEFORE the existing AUTH assertions:

   After retrieving messages but before the "Find AUTH challenge" comment, add:
   ```ts
   // Find REGISTER (napplet->shell)
   const register = messages.find(
     m => m.verb === 'REGISTER' && m.direction === 'napplet->shell'
   );
   expect(register).toBeTruthy();
   expect(register!.raw[1]).toEqual(expect.objectContaining({ dTag: expect.any(String) }));

   // Find IDENTITY (shell->napplet)
   const identity = messages.find(
     m => m.verb === 'IDENTITY' && m.direction === 'shell->napplet'
   );
   expect(identity).toBeTruthy();
   expect(identity!.raw[1]).toEqual(expect.objectContaining({
     pubkey: expect.any(String),
     privkey: expect.any(String),
     dTag: expect.any(String),
     aggregateHash: expect.any(String),
   }));
   ```

   Update the ordering assertions at the end to include REGISTER and IDENTITY:
   ```ts
   // Verify message ordering: REGISTER -> IDENTITY -> AUTH challenge -> AUTH response -> OK
   expect(register!.index).toBeLessThan(identity!.index);
   expect(identity!.index).toBeLessThan(challenge!.index);
   expect(challenge!.index).toBeLessThan(response!.index);
   expect(response!.index).toBeLessThan(ok!.index);
   ```

   Also update the second test ('message tap captures all protocol messages') to expect at least 5 messages (REGISTER, IDENTITY, AUTH challenge, AUTH response, OK) instead of 3.
  </action>
  <verify>
    <automated>cd /home/sandwich/Develop/napplet && pnpm exec playwright test tests/e2e/auth-handshake.spec.ts --reporter=list 2>&1 | tail -20</automated>
  </verify>
  <done>
    - SPEC.md no longer mentions "legacy AUTH flow" -- says handshake aborts
    - E2E test asserts REGISTER (napplet->shell) and IDENTITY (shell->napplet) with payload shape
    - E2E test verifies full 5-message ordering: REGISTER -> IDENTITY -> AUTH -> AUTH -> OK
    - All e2e auth tests pass
  </done>
</task>

</tasks>

<verification>
- `pnpm build` succeeds (no TypeScript errors from new optional fields)
- `pnpm type-check` succeeds
- E2E auth handshake tests pass with REGISTER/IDENTITY assertions
- `grep 'legacy AUTH' SPEC.md` returns no results
- `grep '—' packages/runtime/src/runtime.ts` shows no em-dash in the NOTICE string (may appear in comments, that's fine)
</verification>

<success_criteria>
- adaptHooks() honors caller-provided shellSecretPersistence and guidPersistence (demo's fields are no longer dead)
- SPEC.md accurately describes behavior: no-shellSecret = abort, not legacy fallback
- E2E tests explicitly prove REGISTER and IDENTITY messages are exchanged
- Runtime NOTICE string matches SPEC.md notation
</success_criteria>

<output>
After completion, create `.planning/quick/260403-fyj-close-v0-9-0-audit-gaps-adapthooks-persi/260403-fyj-SUMMARY.md`
</output>

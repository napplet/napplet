---
phase: 46
plan: 3
title: "Instance GUID assignment"
status: complete
---

# Summary: 46-03 Instance GUID Assignment

## What was built
Added persistent per-iframe GUID support: instanceId field on SessionEntry, getInstanceId() method on SessionRegistry, GuidPersistence adapter interface. Default instanceId generated via crypto.randomUUID() in handleAuth. Also added randomBytes() to CryptoAdapter and shell's crypto hooks adapter.

## Key files
- `packages/runtime/src/types.ts` — SessionEntry.instanceId, GuidPersistence interface
- `packages/runtime/src/session-registry.ts` — getInstanceId() method
- `packages/runtime/src/runtime.ts` — instanceId in SessionEntry construction
- `packages/shell/src/types.ts` — SessionEntry.instanceId (shell copy)
- `packages/shell/src/hooks-adapter.ts` — randomBytes() on crypto adapter

## Decisions
- instanceId is a required field on SessionEntry (not optional)
- GuidPersistence is optional on RuntimeAdapter (in-memory fallback)
- Shell SessionEntry type mirrors runtime SessionEntry (both updated)

## Self-Check: PASSED

---
phase: 04-capability-tests
plan: 01
status: complete
started: 2026-03-30T17:00:00.000Z
completed: 2026-03-30T17:10:00.000Z
---

## Summary

Extended the test harness with 20 new window globals across 4 capability areas (ACL, identity, signer, storage) and fixed the storage quota calculation to use TextEncoder instead of Blob.

## What was built

1. **ACL manipulation globals** — 9 functions: `__aclRevoke__`, `__aclGrant__`, `__aclBlock__`, `__aclUnblock__`, `__aclPersist__`, `__aclLoad__`, `__aclClear__`, `__aclCheck__`, `__aclGetEntry__`
2. **Napplet identity globals** — `__getNappPubkey__`, `__getNappEntry__` returning `{ pubkey, dTag, aggregateHash }`
3. **Signer and consent globals** — `__setSigner__`, `__setConsentHandler__` (auto-approve/auto-deny modes)
4. **Shell event injection** — `__injectShellEvent__` calling `relay.injectEvent()`
5. **localStorage access** — `__getLocalStorageKeys__`, `__getLocalStorageItem__`, `__setLocalStorageItem__`, `__clearLocalStorage__`
6. **Storage quota fix (D-02)** — Replaced `new Blob([key, value]).size` with `new TextEncoder().encode(key + value).length` in both `calculateNappStorageBytes` and `handleStorageRequest` storage-set case

## Key files

- `tests/e2e/harness/harness.ts` — Extended with all new globals
- `packages/shell/src/storage-proxy.ts` — Fixed quota calculation

## Self-Check: PASSED

- [x] All 9 ACL functions declared in Window interface and implemented
- [x] Identity globals exposed via nappKeyRegistry
- [x] Signer/consent globals wired to mockResult and relay
- [x] localStorage access globals implemented
- [x] TextEncoder replaces Blob in storage-proxy.ts (both locations)
- [x] Shell package already exports aclStore, nappKeyRegistry, Capability
- [x] `pnpm build` succeeds
- [x] `pnpm test:e2e` — all 35 existing tests pass, zero regressions

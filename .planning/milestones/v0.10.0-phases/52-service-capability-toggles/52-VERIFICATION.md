---
phase: 52
name: service-capability-toggles
status: passed
verified: 2026-04-03
requirements: [TOGL-01, TOGL-02, TOGL-03]
---

# Phase 52: Service & Capability Toggles — Verification

## Requirement Coverage

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| TOGL-01 | User can enable/disable any service via demo UI | PASS | toggleService() in shell-host.ts; service toggle switches in ACL modal; toggle icon overlay on topology service nodes |
| TOGL-02 | User can toggle individual ACL capabilities per napplet | PASS | Clickable capability grid cells in ACL modal; inline ACL panel buttons in acl-panel.ts |
| TOGL-03 | Changes take effect live on next message without re-register | PASS | toggleService() calls runtime.registerService/unregisterService directly; toggleCapability() calls aclState.grant/revoke directly — both take immediate effect |

## Must-Have Verification

### Plan 52-01: Service Toggle Infrastructure
- [x] Service handler references are permanently stored for re-registration (serviceHandlerStore Map)
- [x] toggleService() can disable (unregister) and enable (re-register) any named service
- [x] Disabled services still appear in demoServiceNames for topology display
- [x] isServiceEnabled() reflects current enabled/disabled state

### Plan 52-02: ACL Modal Interactive Controls
- [x] Capability grid cells are clickable and toggle grant/revoke state
- [x] Services section displays all registered services with toggle switches
- [x] Service toggles call toggleService() and update visuals immediately
- [x] refreshPolicyModal() allows external callers to sync modal state

### Plan 52-03: Topology Service Node Toggle Overlay
- [x] Each service node in the topology has a toggle icon overlay
- [x] Clicking the toggle icon does not open the inspector (stopPropagation)
- [x] Disabled service nodes appear dimmed (reduced opacity + grayscale)
- [x] Toggle icon color reflects enabled (green) / disabled (red) state
- [x] updateServiceNodeVisual() is exported for external callers to sync

### Plan 52-04: Integration Wiring and Cross-View Sync
- [x] Topology service toggle icons call toggleService() via the wired callback
- [x] Modal service toggles update topology node visuals via updateServiceNodeVisual()
- [x] Inline ACL panel toggles refresh the modal if it is open
- [x] All toggle paths produce consistent state across all views
- [x] Build and type-check pass with all wiring in place

## Build Verification

```
pnpm build — 15 tasks successful
pnpm type-check — 16 tasks successful (FULL TURBO)
```

## Regression Gate

Unit tests: 98/101 passed. 3 pre-existing failures in demo-host-audit.test.ts (from prior inter-pane -> ipc rename, unrelated to phase 52).

## Code Quality

- All changes follow ESM-only, TypeScript strict patterns
- No circular imports introduced (topology uses callback pattern for shell-host delegation)
- All exported functions have JSDoc comments
- Inline styles follow existing demo codebase conventions

## Human Verification Items

1. **Visual toggle behavior**: Service toggle switches in ACL modal should show green (enabled) / gray (disabled) with smooth knob animation
2. **Topology dimming**: Disabled service nodes should appear at 0.4 opacity with grayscale filter
3. **Cross-view sync**: Toggling a service from the modal should immediately update the topology node, and vice versa
4. **Capability cell clicks**: Clicking a capability cell in the modal should toggle between checkmark (granted) and cross (revoked)

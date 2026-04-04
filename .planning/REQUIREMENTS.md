# Requirements: Napplet Protocol SDK

**Defined:** 2026-04-04
**Core Value:** Prove that sandboxed Nostr apps can securely delegate to a host shell over a simple, standardized protocol — and ship the spec + SDK so others can build on it.

## v0.11.0 Requirements

Requirements for Clean up Side Panel milestone. Each maps to roadmap phases.

### Data Layer

- [x] **DATA-01**: Each ConstantDef has a relevantRoles field mapping it to topology node roles
- [x] **DATA-02**: DemoConfig exposes query methods for filtering by role, editability, and category

### Tab Reorganization

- [ ] **TAB-01**: Kinds tab displays all protocol kind numbers as read-only reference cards
- [ ] **TAB-02**: Constants tab displays only editable behavioral values with live-edit controls
- [ ] **TAB-03**: Active tab persists when the selected node changes (no reset to 'node')

### Contextual Filtering

- [ ] **FILT-01**: Constants tab filters to show only constants relevant to the currently selected node
- [ ] **FILT-02**: When no node is selected, all constants are shown (show-all fallback)
- [ ] **FILT-03**: User can toggle a "show all" override to see all constants regardless of selection

## Future Requirements

(None deferred for this milestone)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Virtual scrolling for constants list | Only 23 constants — not enough to justify complexity |
| Fuzzy search within constants | Small dataset, contextual filtering sufficient |
| Drag-to-reorder tabs | 3 fixed tabs, no user customization needed |
| Contextual filtering on Kinds tab | 9 kinds are few enough to always show all |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 54 | Complete |
| DATA-02 | Phase 54 | Complete |
| TAB-01 | Phase 55 | Pending |
| TAB-02 | Phase 55 | Pending |
| TAB-03 | Phase 55 | Pending |
| FILT-01 | Phase 56 | Pending |
| FILT-02 | Phase 56 | Pending |
| FILT-03 | Phase 56 | Pending |

**Coverage:**
- v0.11.0 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after roadmap creation*

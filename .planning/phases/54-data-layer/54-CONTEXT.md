# Phase 54: Data Layer - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a `relevantRoles` field to each `ConstantDef` entry and expose query methods on `DemoConfig` so downstream phases (55, 56) can filter constants by topology node role, editability, and category. Pure data/model changes — no UI changes.

</domain>

<decisions>
## Implementation Decisions

### Role Mapping
- **D-01:** Each `ConstantDef` gets an explicit `relevantRoles: TopologyNodeRole[]` field. Empty array means global (shown for all nodes / no-node-selected).
- **D-02:** Constants can appear under multiple roles (e.g., `REPLAY_WINDOW_SECONDS` is relevant to both `runtime` and `acl`).
- **D-03:** The 5 roles are: `'napplet' | 'shell' | 'acl' | 'runtime' | 'service'` (from `topology.ts`).

### Mapping Assignments
- **D-04:** Protocol kind constants (`core.AUTH_KIND`, `core.BusKind.*`) → `['runtime']` (runtime dispatches by kind)
- **D-05:** `runtime.RING_BUFFER_SIZE`, `runtime.SECRET_LENGTH` → `['runtime']`
- **D-06:** `acl.DEFAULT_QUOTA` → `['acl']`
- **D-07:** `services.*` constants → `['service']`
- **D-08:** `core.REPLAY_WINDOW_SECONDS` → `['runtime', 'acl']` (cross-cutting)
- **D-09:** `shim.REQUEST_TIMEOUT_MS` → `['napplet']` (shim runs inside napplet iframe)
- **D-10:** `demo.*` constants (UI timing, sizes, animation) → `[]` (global — affects demo chrome, not a specific protocol node)

### Query Methods
- **D-11:** `getEditableDefs(): ConstantDef[]` — returns only `editable: true` entries
- **D-12:** `getReadOnlyDefs(): ConstantDef[]` — returns only `editable: false` entries
- **D-13:** `getByRole(role: TopologyNodeRole): ConstantDef[]` — returns entries whose `relevantRoles` includes the given role, plus globals (empty `relevantRoles`)

### Claude's Discretion
- Whether to add a `getKindsDefs()` convenience method (vs letting callers filter `getReadOnlyDefs()` by `domain === 'protocol'`)
- Sort order within query results
- Whether to export `TopologyNodeRole` from demo-config or import from topology

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Model
- `apps/demo/src/demo-config.ts` — ConstantDef interface, CONSTANT_DEFS array, DemoConfig class with existing get/set/reset/subscribe methods
- `apps/demo/src/topology.ts:6` — TopologyNodeRole type definition

### Phase 49 Context
- `.planning/phases/49-constants-panel/49-CONTEXT.md` — Original constants panel decisions (D-03 grouping, D-05 editable vs read-only, D-11 mutable config)

### Research
- `.planning/research/ARCHITECTURE.md` — Integration points and build order analysis
- `.planning/research/PITFALLS.md` — DOM re-render and cross-cutting constant pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DemoConfig` class already has `getByPackage()` and `getByDomain()` grouping methods — new query methods follow the same pattern
- `ConstantDef` interface has `pkg`, `domain`, `editable` fields — `relevantRoles` is the only addition needed
- `TopologyNodeRole` type already exported from `topology.ts`

### Established Patterns
- Grouping methods return `Map<string, ConstantDef[]>` — new methods can return `ConstantDef[]` since they filter, not group
- CONSTANT_DEFS is a module-level array of object literals — adding `relevantRoles` is one field per entry
- DemoConfig constructor copies defs via spread — new field automatically included

### Integration Points
- `constants-panel.ts` — currently calls `demoConfig.getAllDefs()` and `getByPackage()`; Phase 55 will switch to `getEditableDefs()` / `getReadOnlyDefs()`
- `node-inspector.ts` — will use `getByRole()` in Phase 56 for contextual filtering

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward data model extension following existing patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 54-data-layer*
*Context gathered: 2026-04-04*

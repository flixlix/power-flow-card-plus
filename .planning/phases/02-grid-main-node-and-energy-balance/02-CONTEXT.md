# Phase 2: Grid Main Node and Energy Balance - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a `grid_main` node (Messkonzept 8 second/main meter) that sits to the left of `grid_house` in the middle row, connected by animated bidirectional flow lines. Move the non-fossil percentage bubble to appear above `grid_main` when both meters are configured. Update home consumption balance to use `grid_house` power only. Non-MK8 users (no `entities.grid.main`) see zero visual or behavioral change.

</domain>

<decisions>
## Implementation Decisions

### grid_main node appearance
- Same visual structure as `grid_house`: two-way display (import + export), with `display_state` config controlling visibility of each direction
- Same icon as grid_house (`mdi:transmission-tower`) — no visual distinction between the two meter nodes
- Full config surface matching grid_house: `secondary_info`, `tap_action`, `display_state`, `decimals`, `name`, `icon`

### Flow line between grid_main and grid_house
- Same visual style as all other flow lines: color driven by existing theme/config variables, animated dots, same line weight
- No special styling to distinguish it as an "internal" meter link — consistent with the rest of the card

### Non-fossil bubble placement
- When both `entities.grid.main` and `entities.grid.house` are configured: non-fossil bubble shifts left to appear above `grid_main` (same top-row slot, but aligned with the new leftmost node)
- When only `entities.grid.house` is configured (existing non-MK8 users): non-fossil bubble stays exactly in its current position — zero regression

### Layout structure
- `grid_main` slots into the existing middle row as a new column to the LEFT of `grid_house`
- No new rows or structural changes — the existing two-row layout expands horizontally

### State value naming (backward compatibility)
- `grid_house` state continues to expose `fromGrid` and `toGrid` — no renaming, no breaking changes
- `grid_main` state exposes `fromGridMain` and `toGridMain` as new parallel values
- Home consumption balance formula uses `grid_house` values (`fromGrid`) only — `fromGridMain` is display-only on the node

### grid_main entity config shape
- Same structure as `grid_house`: string entity (bidirectional) OR `{ consumption, production }` object — mirrors the existing `Grid` interface exactly

### Claude's Discretion
- CSS class naming for the new grid_main circle-container
- Exact SVG path for the grid_main ↔ grid_house flow line
- File naming for the new flow component (e.g., `gridMainToGridHouse.ts`)
- How `nonFossil.state.power` is recalculated when referencing grid_main vs grid_house

</decisions>

<specifics>
## Specific Ideas

- The `fromGrid` / `toGrid` naming on grid_house is intentionally preserved — this is an explicit backward-compat requirement, not just convention
- `fromGridMain` / `toGridMain` suffix pattern is the user's preferred naming for grid_main state values

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/grid.ts` (`gridElement`): Direct template to reuse/fork for `gridMainElement` — same structure, two-way display, full config surface
- `src/components/flows/gridToHome.ts`: Pattern to follow for the new `gridMainToGridHouse.ts` flow line — same SVG animateMotion approach
- `src/components/nonFossil.ts` (`nonFossilElement`): Already takes `grid` state as a prop — needs to receive grid_main state when both meters configured
- `src/states/raw/grid.ts`: Already updated in Phase 1 to read from `.house` sub-key — `grid_main` state resolver will follow the same pattern reading from `.main`

### Established Patterns
- All node components are pure functions: `(main: PowerFlowCardPlus, config, { entities, stateObj, ... }) => html\`...\``
- Flow lines live in `src/components/flows/` as individual files, exported from `index.ts`
- Middle row template in `power-flow-card-plus.ts` render(): `${grid.has ? gridElement(...) : spacer}` — same conditional pattern for grid_main
- State values are computed in the `render()` method before being passed to components — `fromGridMain`/`toGridMain` computed there

### Integration Points
- `src/power-flow-card-plus.ts` render(): Middle row needs a new slot to the left of `gridElement` for `gridMainElement`
- `src/power-flow-card-plus.ts` render(): Top row `nonFossilElement` placement — conditional on whether grid_main is configured
- `src/components/flows/index.ts`: New flow function exported here
- `src/states/raw/grid.ts`: New `getGridMainConsumptionState` / `getGridMainProductionState` functions needed
- `src/power-flow-card-plus-config.ts`: `GridEntities.main` already typed as `Grid | undefined` from Phase 1

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-grid-main-node-and-energy-balance*
*Context gathered: 2026-03-02*

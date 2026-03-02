---
phase: 02-grid-main-node-and-energy-balance
plan: "03"
subsystem: ui
tags: [lit, home-assistant, web-components, grid-main, energy-balance]

# Dependency graph
requires:
  - phase: 02-01
    provides: getGridMainConsumptionState, getGridMainProductionState, getGridMainSecondaryState, NewDur type with gridMainToGridHouse
  - phase: 02-02
    provides: gridMainElement component, gridMainToGridHouse flow component, CSS, Flows interface with gridMain? optional field
provides:
  - gridMain object construction in render() gated on entities.grid.main.entity
  - gridMain slot in middle row (LEFT of grid_house); spacer when absent (GRID-05 zero regression)
  - gridMainToGridHouse computed via computeFlowRate in newDur
  - flowElement receives gridMain parameter for flow animation
  - grid object fixed to use gridHouseConfig (.house sub-key)
  - gridElement fixed to use gridConfig?.house sub-key
  - totalHomeConsumption unchanged (BAL-01 satisfied)
affects:
  - 03-grid-main-flow-animation
  - 05-polish-and-edge-cases

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "gridHouseConfig = (entities.grid as any)?.house — pattern for reading house meter config in render()"
    - "gridMainConfig = (entities.grid as any)?.main — pattern for reading grid_main config in render()"
    - "gridMain.has gates middle-row slot; spacer renders when false — zero regression for non-MK8 users"

key-files:
  created: []
  modified:
    - src/power-flow-card-plus.ts
    - src/components/grid.ts

key-decisions:
  - "grid object in render() changed from gridConfig (flat) to gridHouseConfig (.house sub-key) — completes Phase 1 cast pattern resolution"
  - "gridElement in grid.ts also fixed to read from (entities.grid as any)?.house — components must read from sub-keys directly"
  - "nonFossilElement call unchanged — flex layout alignment of non-fossil bubble shifts automatically when middle row gains leftmost slot"
  - "totalHomeConsumption formula unchanged — grid.state.toHome comes from grid_house only (BAL-01)"
  - "gridMainToGridHouse uses Math.max(fromGridMain, toGridMain) — bidirectional meter, animate at the dominant flow rate"

patterns-established:
  - "Per-field gridHouseConfig / gridMainConfig pattern: always cast via (entities.grid as any)?.<subkey> at the top of the function/block"
  - "gridMain.has gate: all new grid_main UI is gated on this boolean — spacer replaces it for non-MK8 users"

requirements-completed: [GRID-01, GRID-02, GRID-03, GRID-04, GRID-05, CONN-01, CONN-02, BAL-01]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 2 Plan 03: Wire grid_main into render() Summary

**grid_main node wired into card render() with house sub-key fixes, bidirectional state, middle-row slot, newDur flow rate, and flowElement pass-through**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T14:29:24Z
- **Completed:** 2026-03-02T14:31:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed grid object in render() and gridElement to read from `.house` sub-key (resolves Phase 1 cast pattern)
- Built gridMain object in render() with full state, powerOutage, icon, name, color, secondary fields
- Added gridMain slot (gridMainElement or spacer) to LEFT of grid_house in middle row — GRID-05 zero regression
- Replaced newDur.gridMainToGridHouse placeholder with computed computeFlowRate value
- Passed gridMain to flowElement to enable flow animation from Plan 02-02 component

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix grid object, fix gridElement, build gridMain object, update newDur** - `2a6b5c8` (feat)
2. **Task 2: Update middle row, top row nonFossil, and flowElement in render()** - `c5a496c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/power-flow-card-plus.ts` - grid object uses gridHouseConfig; gridMain object added; newDur.gridMainToGridHouse computed; middle row + flowElement updated
- `src/components/grid.ts` - gridConfig reads from (entities.grid as any)?.house sub-key

## Decisions Made
- grid object in render() changed from `gridConfig` (flat entities.grid cast) to `gridHouseConfig` (.house sub-key) — completes the Phase 1 cast-pattern resolution
- gridElement in grid.ts also fixed to read from the house sub-key — the component itself must resolve sub-keys, not the caller
- nonFossilElement call is unchanged — flex layout handles positioning automatically when a new leftmost slot is added to the middle row
- totalHomeConsumption formula is unchanged: `grid.state.toHome + solar.state.toHome + battery.state.toHome` — gridMain state values are display-only (BAL-01)
- gridMainToGridHouse uses `Math.max(fromGridMain ?? 0, toGridMain ?? 0)` — bidirectional meter, animate at the dominant direction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete: all three plans executed, grid_main fully wired end-to-end
- Phase 3 (flow animation SVG path coordinates) can proceed — gridMain is passed to flowElement
- Potential concern: SVG path coordinates for gridMainToGridHouse flow line are MEDIUM confidence per research — expect visual iteration in Phase 3

## Self-Check: PASSED

All files present. All commits verified.

---
*Phase: 02-grid-main-node-and-energy-balance*
*Completed: 2026-03-02*

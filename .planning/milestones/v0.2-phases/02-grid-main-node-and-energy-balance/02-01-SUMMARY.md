---
phase: 02-grid-main-node-and-energy-balance
plan: 01
subsystem: state-layer
tags: [typescript, state-resolvers, grid, invert_state, NewDur]

# Dependency graph
requires:
  - phase: 01-type-foundation-and-config-migration
    provides: GridEntities{house?:Grid, main?:Grid} nested type shape and (config.entities.grid as any) cast pattern
provides:
  - NewDur type extended with gridMainToGridHouse field
  - getGridMainConsumptionState, getGridMainProductionState, getGridMainSecondaryState state resolvers
  - grid_house invert_state bug fixed (direct read instead of broken isEntityInverted)
affects:
  - 02-02-grid-main-component-and-flow-line
  - 02-03-energy-balance-correction
  - 03-ui-rendering

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Read invert_state directly from sub-config object (gridHouseConfig?.invert_state) rather than via isEntityInverted helper — helper reads GridEntities top-level which has no invert_state"
    - "grid_main resolvers mirror grid_house resolvers 1:1, reading from (config.entities.grid as any)?.main"
    - "New NewDur fields initialized with 0 placeholder when the computation is deferred to a later plan"

key-files:
  created: []
  modified:
    - src/type.ts
    - src/states/raw/grid.ts
    - src/power-flow-card-plus.ts

key-decisions:
  - "isEntityInverted removed from grid.ts entirely — confirmed always returns undefined for field='grid' since GridEntities has no top-level invert_state"
  - "gridMainToGridHouse initialized to 0 in newDur placeholder in power-flow-card-plus.ts — Plan 02-03 will assign the real computed value"
  - "All three grid_main resolvers (consumption, production, secondary) mirror the grid_house resolver pattern for consistency"

patterns-established:
  - "State resolver pattern: read sub-config object once, check entity, check invert_state directly on sub-config"
  - "New required NewDur fields must have a 0 placeholder in power-flow-card-plus.ts until the consuming plan wires up the real value"

requirements-completed: [GRID-02, GRID-04, GRID-05, BAL-01]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 2, Plan 01: Grid Main State Resolvers and NewDur Extension Summary

**Three grid_main state resolvers added to src/states/raw/grid.ts, isEntityInverted latent bug fixed in grid_house resolvers, and NewDur.gridMainToGridHouse field added to src/type.ts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T14:20:56Z
- **Completed:** 2026-03-02T14:22:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `gridMainToGridHouse: number` to the `NewDur` type in `src/type.ts` — required by Plan 02-03 to wire flow rate computation
- Added `getGridMainConsumptionState`, `getGridMainProductionState`, `getGridMainSecondaryState` to `src/states/raw/grid.ts` — reading from `(config.entities.grid as any)?.main`
- Fixed latent `isEntityInverted` bug in `getGridConsumptionState` and `getGridProductionState`: both now read `!!gridHouseConfig?.invert_state` directly, removing the broken `isEntityInverted(config, "grid")` call
- Removed `isEntityInverted` import from `grid.ts` entirely (no longer used)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add gridMainToGridHouse to NewDur type** - `0955dda` (feat)
2. **Task 2: Add grid_main state resolvers and fix grid_house invert_state bug** - `e91fb44` (feat)

## Files Created/Modified
- `src/type.ts` - Added `gridMainToGridHouse: number` to `NewDur` type
- `src/states/raw/grid.ts` - Added three grid_main resolvers, fixed invert_state bug, removed isEntityInverted import
- `src/power-flow-card-plus.ts` - Added `gridMainToGridHouse: 0` placeholder to `newDur` object literal (required to satisfy TypeScript after NewDur type extension)

## Decisions Made
- `isEntityInverted` removed from `grid.ts`: confirmed to always return `undefined` for `field="grid"` because `config.entities.grid` is `GridEntities` (no top-level `invert_state`). Direct read is correct.
- `gridMainToGridHouse: 0` placeholder added in `power-flow-card-plus.ts`: adding the field to `NewDur` caused a TS2741 error at the existing `newDur` literal. Plan 02-03 will replace the placeholder with the real computed value.
- All three grid_main resolvers mirror the grid_house resolver pattern 1:1 for consistency and predictability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TS2741 missing required property in newDur literal**
- **Found during:** Task 2 (Add grid_main state resolvers)
- **Issue:** After adding `gridMainToGridHouse: number` to `NewDur` in Task 1, `pnpm typecheck` reported `TS2741: Property 'gridMainToGridHouse' is missing in type...` at line 493 of `power-flow-card-plus.ts`
- **Fix:** Added `gridMainToGridHouse: 0` placeholder to the `newDur` object literal in `power-flow-card-plus.ts`; Plan 02-03 will assign the real computed value
- **Files modified:** `src/power-flow-card-plus.ts`
- **Verification:** `pnpm typecheck` exits 0; `pnpm test` exits 0
- **Committed in:** `e91fb44` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix essential for TypeScript correctness. No scope creep — placeholder is explicitly a deferred computation noted in the commit.

## Issues Encountered
None beyond the TS2741 blocking issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `NewDur.gridMainToGridHouse` field exists and is type-safe — Plan 02-03 can assign the real value
- `getGridMainConsumptionState` and `getGridMainProductionState` available for Plan 02-02 (component state) and Plan 02-03 (energy balance)
- `getGridMainSecondaryState` available for Plan 02-02 (secondary info display)
- grid_house `invert_state` bug resolved — no regression risk in existing configurations
- Blocker `[01-01]` in STATE.md (`isEntityInverted` for grid) is now resolved

## Self-Check
- [x] `src/type.ts` contains `gridMainToGridHouse: number` in `NewDur`
- [x] `src/states/raw/grid.ts` exports `getGridMainConsumptionState`, `getGridMainProductionState`, `getGridMainSecondaryState`
- [x] `src/states/raw/grid.ts` has no `isEntityInverted` import
- [x] `src/states/raw/grid.ts` uses `gridHouseConfig?.invert_state` directly
- [x] `pnpm typecheck` exits 0
- [x] `pnpm test` exits 0 (21 tests pass)
- [x] Commits `0955dda` and `e91fb44` exist

---
*Phase: 02-grid-main-node-and-energy-balance*
*Completed: 2026-03-02*

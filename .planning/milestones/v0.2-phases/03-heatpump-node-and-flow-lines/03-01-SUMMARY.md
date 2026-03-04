---
phase: 03-heatpump-node-and-flow-lines
plan: "01"
subsystem: ui
tags: [typescript, lit, heatpump, state-resolvers, css]

# Dependency graph
requires:
  - phase: 01-type-foundation-and-config-migration
    provides: NewDur type, HeatpumpEntity config interface, getEntityState/getEntityStateWatts utilities
  - phase: 02-grid-main-node-and-energy-balance
    provides: newDur object construction pattern in power-flow-card-plus.ts
provides:
  - NewDur type extended with heatpumpFromGridHouse and heatpumpFromGridMain fields
  - Four heatpump state resolver functions in src/states/raw/heatpump.ts
  - heatpumpElement component with COP span null guard in src/components/heatpump.ts
  - CSS rules for .heatpump .circle and .circle-container.heatpump in src/style.ts
affects:
  - 03-02 (flow lines depend on heatpumpFromGridHouse/Main in NewDur)
  - 03-03 (render wiring imports heatpumpElement and calls state resolvers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - getEntityStateWatts for power sensors, getEntityState for dimensionless ratios (COP)
    - Null guard pattern (cop.state !== null) controls COP span DOM presence
    - heatpumpFromGridHouse/Main initialized to 0 as placeholder until Plan 03 wires real values

key-files:
  created:
    - src/states/raw/heatpump.ts
    - src/components/heatpump.ts
  modified:
    - src/type.ts
    - src/style.ts
    - src/power-flow-card-plus.ts
    - src/power-flow-card-plus-config.ts

key-decisions:
  - "heatpumpFromGridHouse/Main initialized to 0 in newDur placeholder — Plan 03-03 will compute real flow rates"
  - "tap_action added to HeatpumpEntity interface (Rule 2 auto-fix) — required for openDetails click handler"
  - "ActionConfig imported from custom-card-helpers in power-flow-card-plus-config.ts to support tap_action"

patterns-established:
  - "COP null guard: heatpump.cop.state !== null (not !== undefined) controls DOM presence of COP span"
  - "State resolver file pattern: getHeatpumpState (watts), getHeatpumpCopState (dimensionless null-able)"

requirements-completed: [HP-01, HP-02, HP-03, HP-04, BAL-02]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 3 Plan 01: Type Foundation and Heatpump Node Element Summary

**NewDur extended with heatpump flow fields, four state resolvers created using watts/dimensionless pattern, and heatpumpElement component with COP null guard and CSS delivered**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T19:34:17Z
- **Completed:** 2026-03-02T19:38:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Extended `NewDur` type with `heatpumpFromGridHouse` and `heatpumpFromGridMain` fields, enabling Plan 02 flow files and Plan 03 render wiring to import the full type
- Created `src/states/raw/heatpump.ts` with four state resolver functions: `getHeatpumpState` (watts), `getHeatpumpCopState` (dimensionless, nullable), `getHeatpumpFlowFromGridHouseState` (watts), `getHeatpumpFlowFromGridMainState` (watts)
- Created `src/components/heatpump.ts` with `heatpumpElement` using `heatpump.cop.state !== null` DOM guard and `displayValue` with `unit: "", decimals: 1` for COP display
- Added `.heatpump .circle` and `.circle-container.heatpump` CSS rules to `src/style.ts` with `--energy-grid-consumption-color` border

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend NewDur type and create heatpump state resolvers** - `22c2ec8` (feat)
2. **Task 2: Create heatpumpElement component and CSS** - `fea493d` (feat)

## Files Created/Modified
- `src/type.ts` - Added `heatpumpFromGridHouse: number` and `heatpumpFromGridMain: number` to NewDur
- `src/states/raw/heatpump.ts` - New file: four state resolver exports
- `src/components/heatpump.ts` - New file: heatpumpElement function with COP null guard
- `src/style.ts` - Added `.circle-container.heatpump`, `.heatpump .circle`, `.heatpump ha-icon:not(.small)` CSS
- `src/power-flow-card-plus.ts` - Added `heatpumpFromGridHouse: 0` and `heatpumpFromGridMain: 0` to newDur object
- `src/power-flow-card-plus-config.ts` - Added `tap_action?: ActionConfig` to HeatpumpEntity; added ActionConfig import

## Decisions Made
- `heatpumpFromGridHouse` and `heatpumpFromGridMain` initialized to `0` in the `newDur` placeholder in `power-flow-card-plus.ts` — Plan 03-03 will wire the real computed values using the state resolvers
- `tap_action` added to `HeatpumpEntity` interface in config (Rule 2 auto-fix) because `heatpumpElement` references `entities.heatpump?.tap_action` and TypeScript would not compile without it
- `ActionConfig` import added to `power-flow-card-plus-config.ts` from `custom-card-helpers` to support the new field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added tap_action to HeatpumpEntity interface**
- **Found during:** Task 2 (heatpumpElement component creation)
- **Issue:** `HeatpumpEntity` interface lacked `tap_action?: ActionConfig` field; heatpumpElement references `entities.heatpump?.tap_action` causing 6 TypeScript errors (TS2339)
- **Fix:** Added `tap_action?: ActionConfig` to `HeatpumpEntity` in `power-flow-card-plus-config.ts` and imported `ActionConfig` from `custom-card-helpers`
- **Files modified:** `src/power-flow-card-plus-config.ts`
- **Verification:** `pnpm typecheck` passes with no errors
- **Committed in:** `fea493d` (Task 2 commit)

**2. [Rule 3 - Blocking] Initialized heatpumpFromGridHouse/Main in newDur literal**
- **Found during:** Task 1 (after extending NewDur type)
- **Issue:** Existing `newDur` object in `power-flow-card-plus.ts` missing the two new required fields (TS2739 error)
- **Fix:** Added `heatpumpFromGridHouse: 0` and `heatpumpFromGridMain: 0` as placeholders; Plan 03-03 will compute real values
- **Files modified:** `src/power-flow-card-plus.ts`
- **Verification:** `pnpm typecheck` passes
- **Committed in:** `22c2ec8` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for TypeScript compilation. No scope creep — tap_action follows existing node pattern, placeholder 0 is explicitly the expected interim state per plan context.

## Issues Encountered
None — both deviations were clean fixes following established patterns in the codebase.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/states/raw/heatpump.ts` exports are ready for import by Plan 03-02 (flow line files) and Plan 03-03 (render wiring)
- `heatpumpElement` is ready for import by Plan 03-03
- `NewDur` type is complete — no further type changes expected in Phase 3
- Blocker from STATE.md: `mdiHeatPump` icon constant name unverified — Plan 03-03 should check at implementation time

---
*Phase: 03-heatpump-node-and-flow-lines*
*Completed: 2026-03-02*

## Self-Check: PASSED
- src/states/raw/heatpump.ts: FOUND
- src/components/heatpump.ts: FOUND
- 03-01-SUMMARY.md: FOUND
- commit 22c2ec8: FOUND
- commit fea493d: FOUND

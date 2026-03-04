---
phase: 02-grid-main-node-and-energy-balance
plan: "02"
subsystem: ui
tags: [lit, svg, animateMotion, bidirectional-flow, css]

# Dependency graph
requires:
  - phase: 02-grid-main-node-and-energy-balance
    provides: "02-01 grid_main state resolvers (fromGridMain/toGridMain) and NewDur.gridMainToGridHouse"

provides:
  - "gridMainElement component — visual node for the main meter (fork of gridElement)"
  - "flowGridMainToGridHouse — bidirectional animated SVG flow line (import left-to-right, export right-to-left via keyPoints='1;0')"
  - "Flows interface extended with gridMain?: any — optional to avoid breaking existing callers"
  - "CSS rules: .grid-main .circle and .grid-main ha-icon:not(.small) mirroring .grid styles"

affects:
  - "02-03-render-wiring — integrates gridMainElement and flowElement(gridMain) into card render()"
  - "03-energy-balance — may reference gridMain flows"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fork-and-rename component pattern: copy grid.ts, rename all identifiers, change CSS class suffix"
    - "FlowsWithGridMain intersection type: Flows & { gridMain: any } for local extension without modifying shared interface"
    - "Bidirectional SVG animateMotion: fromGridMain uses default direction, toGridMain uses keyPoints='1;0' for reverse"

key-files:
  created:
    - src/components/gridMain.ts
    - src/components/flows/gridMainToGridHouse.ts
  modified:
    - src/components/flows/index.ts
    - src/style.ts

key-decisions:
  - "gridMain?: any added as optional field to Flows interface — avoids breaking existing flowElement callers in power-flow-card-plus.ts until Plan 02-03 wires it in"
  - "FlowsWithGridMain intersection type used in gridMainToGridHouse.ts to extend Flows locally — cleaner than a second interface parameter"
  - "flowGridMainToGridHouse guarded with 'gridMain ?' check in flowElement — safe no-op when gridMain is not yet passed"

patterns-established:
  - "Optional flow params pattern: add new state as optional (?) to Flows, guard call with truthy check in flowElement"
  - "CSS mirror rule: .grid-main rules placed immediately after corresponding .grid rules for discoverability"

requirements-completed:
  - GRID-01
  - GRID-03
  - CONN-01
  - CONN-02

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 2 Plan 02: Grid Main Node and Energy Balance — Component and Flow Summary

**gridMainElement component (fork of gridElement) and bidirectional flowGridMainToGridHouse SVG animation with CSS for the grid-main node**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T14:25:01Z
- **Completed:** 2026-03-02T14:26:47Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Created `gridMainElement` as a minimal fork of `gridElement`, swapping CSS class to `grid-main`, config accessor to `(entities.grid as any)?.main`, and all state fields to `fromGridMain`/`toGridMain`
- Created `flowGridMainToGridHouse` with full bidirectional SVG `animateMotion` — default direction for import (fromGridMain), `keyPoints="1;0"` reversal for export (toGridMain)
- Extended `Flows` interface with optional `gridMain?: any` and updated `flowElement` to import and call `flowGridMainToGridHouse` safely when `gridMain` is provided

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gridMainElement component** - `5c63e29` (feat)
2. **Task 2: Create gridMainToGridHouse flow + update flows index + add CSS** - `ba2f47f` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/gridMain.ts` - Visual node component for main meter; fork of grid.ts with grid-main CSS class and fromGridMain/toGridMain state fields
- `src/components/flows/gridMainToGridHouse.ts` - Bidirectional animated SVG flow line; import uses default motion, export uses keyPoints="1;0" reverse
- `src/components/flows/index.ts` - Flows interface extended with `gridMain?: any`; flowElement imports and conditionally calls flowGridMainToGridHouse
- `src/style.ts` - Added `.grid-main .circle` and `.grid-main ha-icon:not(.small)` rules mirroring `.grid` styles

## Decisions Made

- Added `gridMain?: any` as optional to `Flows` interface rather than required — prevents breaking all existing `flowElement` callers in `power-flow-card-plus.ts` until Plan 02-03 wires the real value in
- Used `FlowsWithGridMain = Flows & { gridMain: any }` intersection type locally in `gridMainToGridHouse.ts` — keeps the shared interface optional while requiring gridMain within the flow file's scope
- Guarded `flowGridMainToGridHouse` call in `flowElement` with `gridMain ? ... : ""` — safe no-op until 02-03 passes gridMain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- gridMainElement and flowGridMainToGridHouse are complete and type-safe (typecheck passes)
- Plan 02-03 can now wire `gridMainElement` into `render()` and pass `gridMain` to `flowElement`
- No blockers

---
*Phase: 02-grid-main-node-and-energy-balance*
*Completed: 2026-03-02*

## Self-Check: PASSED

- FOUND: src/components/gridMain.ts
- FOUND: src/components/flows/gridMainToGridHouse.ts
- FOUND: .planning/phases/02-grid-main-node-and-energy-balance/02-02-SUMMARY.md
- FOUND: commit 5c63e29 (Task 1)
- FOUND: commit ba2f47f (Task 2)

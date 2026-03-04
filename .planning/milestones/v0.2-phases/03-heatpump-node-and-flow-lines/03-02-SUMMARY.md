---
phase: 03-heatpump-node-and-flow-lines
plan: "02"
subsystem: ui
tags: [lit, svg, animateMotion, flow-lines, heatpump]

# Dependency graph
requires:
  - phase: 03-01
    provides: heatpumpFromGridHouse and heatpumpFromGridMain fields in NewDur type
  - phase: 02-02
    provides: Flows interface and flowElement pattern (gridMain optional field pattern)

provides:
  - flowGridHouseToHeatpump: curved SVG monodirectional flow from grid_house to heatpump
  - flowGridMainToHeatpump: curved SVG monodirectional flow from grid_main to heatpump
  - Flows interface extended with heatpump?: any optional field
  - flowElement conditionally calls both heatpump flow functions via heatpump ? guard

affects:
  - 03-03-render-wiring

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FlowsWithHeatpump intersection type (Flows & { heatpump: any }) used locally in each flow file for type safety without polluting shared Flows interface"
    - "Monodirectional animateMotion (no keyPoints reversal) — heatpump flows are consume-only, always draw from source to heatpump"
    - "Optional heatpump guard (heatpump ? ... : '') in flowElement mirrors gridMain pattern from phase 02-02"

key-files:
  created:
    - src/components/flows/gridHouseToHeatpump.ts
    - src/components/flows/gridMainToHeatpump.ts
  modified:
    - src/components/flows/index.ts

key-decisions:
  - "FlowsWithHeatpump intersection type used locally (same pattern as FlowsWithGridMain) — keeps Flows interface clean while providing strict typing inside each flow module"
  - "heatpump?: any added as optional field to Flows interface — existing flowElement callers unchanged until Plan 03-03 passes heatpump"
  - "Unused parameters (solar, grid) removed from flow function destructuring to satisfy noUnusedLocals — callers still pass them for interface compatibility"

patterns-established:
  - "Curved SVG flow files: import showLine/styleLine/checkShouldShowDots/classMap/html/svg, define local FlowsWithX intersection type, return '' (not html``) when show condition false"
  - "SVG path coordinates for heatpump flows are LOW confidence — flagged in code comment referencing RESEARCH.md Pitfall 2"

requirements-completed: [HP-05, HP-06, HP-07]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 3 Plan 02: Heatpump Flow Lines Summary

**Two curved SVG monodirectional flow lines (grid_house->heatpump, grid_main->heatpump) created and wired into flowElement with optional heatpump guard**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T19:41:58Z
- **Completed:** 2026-03-02T19:43:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `flowGridHouseToHeatpump` — curved SVG from grid_house (right, mid) to heatpump (center, bottom), monodirectional animateMotion using `newDur.heatpumpFromGridHouse`
- Created `flowGridMainToHeatpump` — curved SVG from grid_main (left, mid) to heatpump (center, bottom), monodirectional animateMotion using `newDur.heatpumpFromGridMain`, guarded by `gridMain?.has`
- Extended `Flows` interface with `heatpump?: any` and wired both functions into `flowElement` with `heatpump ?` conditional guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gridHouseToHeatpump and gridMainToHeatpump flow files** - `7685a88` (feat)
2. **Task 2: Extend Flows interface and wire both new flows into flowElement** - `45ef18f` (feat)

## Files Created/Modified

- `src/components/flows/gridHouseToHeatpump.ts` - Curved SVG flow grid_house → heatpump, showLine/styleLine/checkShouldShowDots, no flat-line class
- `src/components/flows/gridMainToHeatpump.ts` - Curved SVG flow grid_main → heatpump, guarded by gridMain?.has, no flat-line class
- `src/components/flows/index.ts` - Flows interface extended with heatpump?: any, flowElement wired with both new flow functions

## Decisions Made

- `FlowsWithHeatpump` intersection type defined locally in each flow file (not exported) — mirrors `FlowsWithGridMain` pattern from Phase 02-02, avoids polluting the shared `Flows` interface
- Unused parameters (`solar` in both files, `grid` in `gridMainToHeatpump`) removed from function destructuring to satisfy TypeScript `noUnusedLocals` — callers still pass full Flows object for interface compatibility
- SVG path coordinates flagged with comment "may need visual tuning, see RESEARCH.md Pitfall 2" — coordinates are LOW confidence per research

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused parameters from flow function signatures**
- **Found during:** Task 1 verification (pnpm typecheck)
- **Issue:** TypeScript `noUnusedLocals` errors: `solar` declared but never read in both files; `grid` declared but never read in `gridMainToHeatpump`
- **Fix:** Removed `solar` from `flowGridHouseToHeatpump` destructuring; removed `grid` and `solar` from `flowGridMainToHeatpump` destructuring. Callers still pass full object for type compatibility.
- **Files modified:** src/components/flows/gridHouseToHeatpump.ts, src/components/flows/gridMainToHeatpump.ts
- **Verification:** pnpm typecheck passes, pnpm test 21/21 pass
- **Committed in:** 7685a88 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — unused variable compiler error)
**Impact on plan:** Fix required for compilation. No scope creep. Function signatures still accept all planned parameters via the FlowsWithHeatpump type.

## Issues Encountered

None beyond the unused variable fix above.

## Next Phase Readiness

- Both flow functions ready for wiring in Plan 03-03 (render wiring)
- Plan 03-03 needs to pass `heatpump` object to `flowElement` — flows will activate automatically
- SVG paths may need visual tuning after first render (RESEARCH.md Pitfall 2 concern remains open)

---
*Phase: 03-heatpump-node-and-flow-lines*
*Completed: 2026-03-02*

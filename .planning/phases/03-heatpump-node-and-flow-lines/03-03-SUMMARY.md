---
phase: 03-heatpump-node-and-flow-lines
plan: "03"
subsystem: heatpump-visual-fixes
tags: [heatpump, layout, css, svg, cop, flow-values]
dependency_graph:
  requires: [03-01, 03-02, 03-03-initial]
  provides: [correct-heatpump-layout, cop-display-fixed, flow-values-in-bubble, updated-svg-paths]
  affects: [src/power-flow-card-plus.ts, src/style.ts, src/components/heatpump.ts, src/components/flows/gridHouseToHeatpump.ts, src/components/flows/gridMainToHeatpump.ts]
tech_stack:
  added: []
  patterns: [flex-end alignment, toFixed formatting, lit html conditional spans, SVG cubic bezier]
key_files:
  created: []
  modified:
    - src/power-flow-card-plus.ts
    - src/style.ts
    - src/components/heatpump.ts
    - src/components/flows/gridHouseToHeatpump.ts
    - src/components/flows/gridMainToHeatpump.ts
decisions:
  - "Remove leading spacer from bottom row — heatpump at col-1 (below gridMain), battery returns to col-2"
  - "COP formatted with Number.toFixed(1) — bypasses displayValue which appends W for empty-string unit"
  - "Flow value spans render conditionally (truthy check) — mirrors battery-in/battery-out pattern"
  - "gridMainToHeatpump SVG path is vertical M20,50 v50 — same x column, straight drop"
  - "gridHouseToHeatpump SVG path uses cubic bezier M80,50 v8 c0,42 -60,42 -60,42 — S-curve to (20,100)"
metrics:
  duration: 15 min
  completed: "2026-03-02"
  tasks: 4
  files_changed: 5
---

# Phase 3 Plan 03: Heatpump Visual Fixes Summary

**One-liner:** Fixed 6 visual regressions in heatpump card — layout alignment, COP unit suffix, missing flow value display, and SVG path geometry for col-1 position.

## What Was Built

Post-visual-inspection fixes for the Phase 3 heatpump node implementation. Six issues reported by the user were resolved across 4 atomic commits.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Layout + CSS: heatpump col-1, battery col-2, flex-end pin | 5e7c73c | power-flow-card-plus.ts, style.ts |
| 2 | COP unit fix: toFixed(1) instead of displayValue | a2097ac | heatpump.ts |
| 3 | Flow values in bubble: flowFromGridHouse + flowFromGridMain spans | d8d3a66 | heatpump.ts |
| 4 | SVG paths: updated for heatpump at col-1 (x≈20) position | 30d2222 | gridHouseToHeatpump.ts, gridMainToHeatpump.ts |

## Deviations from Plan

### Auto-fixed Issues (all 6 user-reported bugs)

**1. [Rule 1 - Bug] Battery alignment regression (Issue 1 + Issue 4)**
- **Found during:** User visual inspection after 03-03 initial implementation
- **Issue:** Extra leading `<div class="spacer"></div>` before heatpump in bottom row pushed battery to col-3 instead of col-2, breaking solar/battery column alignment
- **Fix:** Removed the unconditional leading spacer; heatpump's `has ? element : spacer` conditional now occupies col-1
- **Files modified:** `src/power-flow-card-plus.ts`
- **Commit:** 5e7c73c

**2. [Rule 1 - Bug] Heatpump vertical alignment (Issue 2)**
- **Found during:** User visual inspection
- **Issue:** `.circle-container.heatpump {}` rule was empty — heatpump circle floated to top of its row slot while battery had `height: 110px; justify-content: flex-end` to pin it to bottom
- **Fix:** Added `height: 110px; justify-content: flex-end` to `.circle-container.heatpump`
- **Files modified:** `src/style.ts`
- **Commit:** 5e7c73c

**3. [Rule 1 - Bug] COP unit shows "W" (Issue 5)**
- **Found during:** User visual inspection
- **Issue:** `displayValue(hass, config, cop.state, { unit: "", ... })` — empty string is falsy in JS, triggering the `|| "W"` fallback inside displayValue
- **Fix:** Replaced with `Number(heatpump.cop.state).toFixed(1)` — COP is dimensionless, no unit suffix needed
- **Files modified:** `src/components/heatpump.ts`
- **Commit:** a2097ac

**4. [Rule 2 - Missing functionality] Flow values not shown in bubble (Issue 6)**
- **Found during:** User visual inspection
- **Issue:** `heatpump.flowFromGridHouse` and `heatpump.flowFromGridMain` were computed and passed to heatpumpElement but never rendered inside the circle
- **Fix:** Added two conditional `<span>` elements (with arrow icon + displayValue) rendered when flow is truthy; follows battery-in/battery-out pattern
- **Files modified:** `src/components/heatpump.ts`
- **Commit:** d8d3a66

**5. [Rule 1 - Bug] SVG paths pointed to old heatpump position (Issue 3)**
- **Found during:** Layout position change (follows from fix 1)
- **Issue:** Old paths targeted heatpump at col-2 (x≈40–60). After fix 1, heatpump is at col-1 (x≈20)
- **Fix:**
  - `gridMainToHeatpump`: `M20,50 v15 c0,20 20,20 35,20 h5` → `M20,50 v50` (vertical drop, same column)
  - `gridHouseToHeatpump`: `M80,50 v15 c0,20 -20,20 -35,20 h-5` → `M80,50 v8 c0,42 -60,42 -60,42` (S-curve from 80→20)
- **Files modified:** `src/components/flows/gridMainToHeatpump.ts`, `src/components/flows/gridHouseToHeatpump.ts`
- **Commit:** 30d2222
- **Note:** SVG coordinates are empirically derived; one visual tuning iteration may still be needed

## Decisions Made

- Heatpump occupies col-1 of bottom row (below gridMain). This is the correct position per the user's intent — "between grid_main and grid_house" means directly below gridMain.
- Battery at col-2 (aligned with solar at col-2 of the top row) — restored from pre-heatpump layout.
- COP uses `toFixed(1)` directly, not `displayValue`. This is correct for dimensionless ratios and avoids the W/kW threshold logic entirely.
- Flow spans follow the battery-in/battery-out visual pattern (arrow icon + value, conditional on truthy check).
- SVG path for gridMainToHeatpump is a pure vertical line — most natural since they share the same x-column.
- SVG path for gridHouseToHeatpump uses a cubic bezier S-curve spanning 60 SVG units horizontally — coordinate-verified mathematically but may need one visual iteration.

## Self-Check

### Files Exist
- `src/power-flow-card-plus.ts` — modified (leading spacer removed)
- `src/style.ts` — modified (.circle-container.heatpump rule filled)
- `src/components/heatpump.ts` — modified (COP toFixed, flow value spans)
- `src/components/flows/gridMainToHeatpump.ts` — modified (M20,50 v50)
- `src/components/flows/gridHouseToHeatpump.ts` — modified (S-curve bezier)

### Commits Exist
- 5e7c73c: layout + CSS
- a2097ac: COP fix
- d8d3a66: flow value spans
- 30d2222: SVG paths

## Self-Check: PASSED

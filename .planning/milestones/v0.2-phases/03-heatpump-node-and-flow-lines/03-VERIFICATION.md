---
phase: 03-heatpump-node-and-flow-lines
verified: 2026-03-02T00:00:00Z
status: human_needed
score: 13/14 must-haves verified
re_verification: false
human_verification:
  - test: "Verify heatpump node visual position in the card layout"
    expected: "Heatpump node appears in the bottom row, clearly positioned in proximity to both grid nodes (grid_main and grid_house) — either centered between them visually or in the column directly below one of them. HP-01 says 'below grid_house' but implementation places it in col-1 (below gridMain) per the visual inspection fix in 03-03. User confirmed this position during plan 03-03 checkpoint; verify it matches intended MK8 layout."
    why_human: "The column placement was changed from the original plan during a visual inspection step (03-03 fix 1). REQUIREMENTS.md HP-01 says 'below grid_house' but the actual col-1 position is below gridMain. This was an accepted design decision during human review, but the requirement text differs from implementation. A human must confirm the current position satisfies the layout intent."
  - test: "Verify COP display format and absence when unavailable"
    expected: "When COP entity is configured and available, the circle shows 'COP 3.2' (1 decimal, no unit suffix). When COP entity is missing or unavailable, the COP text is completely absent from the circle (not showing '--' or 'COP W')."
    why_human: "COP uses Number.toFixed(1) directly (bypassing displayValue) to avoid the W unit fallback. Visual confirmation needed that the output format looks correct in the browser."
  - test: "Verify animated flow lines connect to correct node positions"
    expected: "The gridHouseToHeatpump S-curve (M80,50 v8 c0,42 -60,42 -60,42) visually connects grid_house to the heatpump node. The gridMainToHeatpump vertical line (M20,50 v50) visually connects gridMain to heatpump. SVG path coordinates are empirically derived and may need one more visual iteration."
    why_human: "SVG path geometry is flagged as 'LOW confidence' in RESEARCH.md Pitfall 2 and in the 03-03 summary. The paths were updated once during visual inspection but may need further tuning. Cannot verify SVG rendering accuracy programmatically."
---

# Phase 3: Heatpump Node and Flow Lines — Verification Report

**Phase Goal:** Users see a heatpump consumption node with COP display and animated flow lines from both meters, without double-counting in home consumption
**Verified:** 2026-03-02
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NewDur type has heatpumpFromGridHouse and heatpumpFromGridMain fields | VERIFIED | `src/type.ts` lines 101-102: `heatpumpFromGridHouse: number; heatpumpFromGridMain: number;` |
| 2 | State resolvers return 0 for heatpump power/flow sensors when entity not configured | VERIFIED | `src/states/raw/heatpump.ts` lines 9, 24, 31: `if (!entity) return 0;` for all three watts resolvers |
| 3 | State resolver returns null for COP when entity unavailable — no crash | VERIFIED | `src/states/raw/heatpump.ts` line 17: `if (!entity) return null;`; `getEntityState` returns null when entity unavailable per `getEntityState.ts` line 8-11 |
| 4 | heatpumpElement renders a circle-container with COP span and consumption span | VERIFIED | `src/components/heatpump.ts` lines 17-83: full circle-container with conditional COP span and consumption span |
| 5 | COP span is absent from DOM when cop.state is null | VERIFIED | `src/components/heatpump.ts` line 29: `heatpump.cop.state !== null ? html... : null` |
| 6 | CSS rules exist for .heatpump .circle and .circle-container.heatpump | VERIFIED | `src/style.ts` lines 442-452: `.circle-container.heatpump { height: 110px; justify-content: flex-end; }` and `.heatpump .circle { border-color: ... }` |
| 7 | flowGridHouseToHeatpump renders curved SVG with animateMotion when conditions truthy | VERIFIED | `src/components/flows/gridHouseToHeatpump.ts` lines 13-46: ternary on `heatpump.has && grid.has && showLine(...)`, SVG with path and animateMotion |
| 8 | flowGridMainToHeatpump renders curved SVG when heatpump.has and gridMain.has truthy | VERIFIED | `src/components/flows/gridMainToHeatpump.ts` line 13: `heatpump.has && gridMain?.has && showLine(...)` |
| 9 | Both flow lines hide entirely when sensor returns 0W (showLine returns false) | VERIFIED | Both flow files return `""` (not `html`) when show condition false (lines 46, 46); `showLine()` controls this |
| 10 | Both flow lines respect display_zero_lines config via showLine() and styleLine() | VERIFIED | Both files import and call `showLine()` and `styleLine()` — verified lines 3-8 in each file |
| 11 | Flows interface has heatpump? optional field and flowElement calls both heatpump flows | VERIFIED | `src/components/flows/index.ts` line 19: `heatpump?: any;`; lines 34-35: conditional calls with `heatpump ?` guard |
| 12 | heatpump object constructed in render() and passed to flowElement | VERIFIED | `src/power-flow-card-plus.ts` lines 268-281: full heatpump object; lines 757-765: flowElement receives `heatpump` |
| 13 | heatpumpFromGridHouse/Main computed via computeFlowRate in newDur | VERIFIED | `src/power-flow-card-plus.ts` lines 573-574: `heatpumpFromGridHouse: computeFlowRate(...)` and `heatpumpFromGridMain: computeFlowRate(...)` |
| 14 | BAL-02: totalHomeConsumption formula is unchanged — no heatpump subtraction | VERIFIED | `src/power-flow-card-plus.ts` line 493: `Math.max(grid.state.toHome + (solar.state.toHome ?? 0) + (battery.state.toHome ?? 0), 0)` — heatpump absent |

**Score:** 14/14 truths verified (automated)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/type.ts` | NewDur with heatpumpFromGridHouse + heatpumpFromGridMain | VERIFIED | Lines 101-102 present |
| `src/states/raw/heatpump.ts` | 4 exported state resolver functions | VERIFIED | All 4 exported: getHeatpumpState, getHeatpumpCopState, getHeatpumpFlowFromGridHouseState, getHeatpumpFlowFromGridMainState |
| `src/components/heatpump.ts` | heatpumpElement function with COP null guard | VERIFIED | Exports heatpumpElement; `cop.state !== null` guard present; COP uses `Number.toFixed(1)` (not displayValue) |
| `src/style.ts` | CSS for .heatpump circle and container | VERIFIED | `.circle-container.heatpump { height: 110px; justify-content: flex-end; }`, `.heatpump .circle`, `.heatpump ha-icon:not(.small)` all present |
| `src/components/flows/gridHouseToHeatpump.ts` | Curved SVG flow from grid_house to heatpump | VERIFIED | Exports flowGridHouseToHeatpump; curved SVG (no flat-line class); uses showLine, styleLine, checkShouldShowDots |
| `src/components/flows/gridMainToHeatpump.ts` | Curved SVG flow from grid_main to heatpump | VERIFIED | Exports flowGridMainToHeatpump; curved SVG (no flat-line class); guarded by gridMain?.has |
| `src/components/flows/index.ts` | Flows interface with heatpump?, flowElement wired | VERIFIED | `heatpump?: any` in interface; both flow functions imported and conditionally called |
| `src/power-flow-card-plus.ts` | heatpump object, bottom row slot, newDur entries, flowElement pass | VERIFIED | All four integration points present |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/heatpump.ts` | `src/states/raw/heatpump.ts` | `heatpump.cop.state` access | WIRED | heatpump object passed as parameter with cop.state; pattern `heatpump.cop.state` present at line 29 |
| `src/components/heatpump.ts` | COP display | `Number.toFixed(1)` | WIRED | Line 42: `Number(heatpump.cop.state).toFixed(1)` — COP formatted correctly without unit suffix |
| `src/components/flows/index.ts` | `gridHouseToHeatpump.ts` | `heatpump ? flowGridHouseToHeatpump(...)` | WIRED | Line 34: conditional call present |
| `src/components/flows/gridHouseToHeatpump.ts` | `showLine.ts` | `showLine(config, heatpump.flowFromGridHouse)` | WIRED | Line 13: used in show condition |
| `src/components/flows/gridHouseToHeatpump.ts` | `newDur.heatpumpFromGridHouse` | animateMotion dur attribute | WIRED | Line 36: `dur="${newDur.heatpumpFromGridHouse}s"` |
| `src/power-flow-card-plus.ts` | `src/components/heatpump.ts` | `heatpumpElement(this, this._config, { heatpump, entities })` | WIRED | Line 735: conditional call in bottom row |
| `src/power-flow-card-plus.ts` | `src/states/raw/heatpump.ts` | heatpump object construction | WIRED | Lines 272-277: all 4 state resolvers called |
| `src/power-flow-card-plus.ts` | `flowElement` | heatpump parameter passed | WIRED | Line 761: `heatpump,` in flowElement call |
| `heatpump.has gate` | bottom row condition | `battery.has \|\| heatpump.has \|\| checkHasBottomIndividual(...)` | WIRED | Line 733: condition includes `heatpump.has` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HP-01 | 03-01, 03-03 | Heatpump node renders below grid_house | HUMAN NEEDED | Node renders in col-1 of bottom row (below gridMain), not col-2 (below grid_house). Layout was changed during visual inspection (03-03 fix 1). User accepted this position during checkpoint. Requirement text says "below grid_house" but implementation is "below gridMain". Needs human confirmation that the accepted layout satisfies intent. |
| HP-02 | 03-01, 03-03 | Heatpump displays power consumption from HA entity | VERIFIED | `heatpumpElement` renders consumption span with `displayValue(main.hass, config, heatpump.state, {...})` |
| HP-03 | 03-01, 03-03 | COP displayed as "COP [value]" label | VERIFIED | `heatpump.ts` line 41-43: `COP ${Number(heatpump.cop.state).toFixed(1)}` |
| HP-04 | 03-01, 03-03 | COP label hidden when COP entity unavailable — no crash | VERIFIED | `cop.state !== null` guard hides span; `getEntityState` returns null when entity unavailable or not configured |
| HP-05 | 03-02 | Animated monodirectional flow line grid_house → heatpump | VERIFIED | `flowGridHouseToHeatpump` exists, imported, wired in flowElement, uses animateMotion |
| HP-06 | 03-02 | Animated monodirectional flow line grid_main → heatpump | VERIFIED | `flowGridMainToHeatpump` exists; guarded by `gridMain?.has` (flow absent when gridMain not configured) |
| HP-07 | 03-02 | Each flow line hides when sensor = 0W; respects display_zero_lines | VERIFIED | Both flow files use `showLine()` for show condition and `styleLine()` for CSS class (zero-line behavior) |
| BAL-02 | 03-03 | Heatpump consumption does not double-count in home total | VERIFIED | `totalHomeConsumption` formula at line 493 unchanged: `grid.state.toHome + solar.state.toHome + battery.state.toHome` — no heatpump term |

**Orphaned requirements check:** No requirements in REQUIREMENTS.md are mapped to Phase 3 beyond HP-01 through HP-07 and BAL-02. Coverage complete.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/heatpump.ts` | 73-78 | `displayValue` for consumption span uses `heatpump.unit`, `heatpump.unit_white_space`, `heatpump.decimals` | Info | These fields are not set on the heatpump object in `power-flow-card-plus.ts` — the object only has `state`, `cop`, `flowFromGridHouse`, `flowFromGridMain`, `icon`, `name`, `tap_action`. This means `unit`, `unit_white_space`, and `decimals` will be `undefined`. `displayValue` with `unit: undefined` triggers the kW/W threshold logic (correct for watts sensor), so this is benign for now but worth noting. |

No blocker anti-patterns found. No TODO/FIXME/PLACEHOLDER comments in any phase-3 files. No empty stub returns (the `return null` in `getHeatpumpCopState` is intentional null-signaling, not a stub).

---

## Human Verification Required

### 1. Heatpump Node Position (HP-01)

**Test:** Configure `entities.heatpump.entity` and observe where the node appears in the bottom row.
**Expected:** Node appears in the bottom row clearly associated with the grid meters. The current implementation places it in col-1 (directly below gridMain), with battery in col-2. The SVG flow lines connect both grid meters to this position. Confirm the position satisfies the intended "below grid_house" layout from HP-01 or that col-1 is the accepted final position.
**Why human:** HP-01 states "below grid_house" but the visual inspection in 03-03 moved heatpump to col-1 (below gridMain). The user approved this during the checkpoint, but the requirement text diverges from implementation. Need to confirm the accepted position is intentional and HP-01 should be updated or the position is correct as is.

### 2. COP Display Format

**Test:** Configure a COP sensor entity. Verify the circle shows "COP 3.2" (or similar). Remove the entity and confirm COP text disappears entirely.
**Expected:** "COP X.X" label appears when entity is available, completely absent when not. No "W" suffix, no "--" placeholder.
**Why human:** COP formatting uses `Number.toFixed(1)` directly (bypassing `displayValue`) to avoid the W fallback. Visual confirmation needed that the output is correct and matches the "COP 3.2" format described in HP-03.

### 3. SVG Flow Line Geometry

**Test:** Configure both flow sensors and verify the animated lines visually connect to the heatpump node.
**Expected:** gridMainToHeatpump uses a vertical drop (M20,50 v50). gridHouseToHeatpump uses an S-curve (M80,50 v8 c0,42 -60,42 -60,42). Both lines should terminate at the heatpump node in col-1.
**Why human:** SVG path coordinates are flagged LOW confidence in RESEARCH.md Pitfall 2 and in the 03-03 summary. The paths were updated once during visual inspection but may need one more iteration to line up precisely with node centers.

---

## Gaps Summary

No automated gaps found. All 14 must-have truths verified, all 8 artifacts pass all three levels (exists, substantive, wired), all 9 key links verified as wired.

The `human_needed` status is driven by three visual concerns that cannot be verified programmatically:
1. HP-01 position discrepancy (requirement says "below grid_house", implementation is "below gridMain" — user approved during checkpoint but text diverges)
2. COP display format correctness in browser
3. SVG path geometry alignment with node positions

These were acknowledged risks during phase execution (see 03-CONTEXT.md "Claude's Discretion" and RESEARCH.md Pitfall 2). Automated compilation (TypeScript) and regression tests (21/21) both pass cleanly.

---

_Verified: 2026-03-02_
_Verifier: Claude (gsd-verifier)_

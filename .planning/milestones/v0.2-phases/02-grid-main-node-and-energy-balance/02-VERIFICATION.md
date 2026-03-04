---
phase: 02-grid-main-node-and-energy-balance
verified: 2026-03-02T16:00:00Z
status: human_needed
score: 11/12 must-haves verified
re_verification: false
human_verification:
  - test: "Open the card with entities.grid.main configured (MK8 setup). Confirm the non-fossil percentage bubble appears above grid_main (leftmost slot), not above grid_house."
    expected: "Non-fossil bubble is horizontally aligned with the grid_main circle, not the grid_house circle."
    why_human: "Both rows use display:flex;justify-content:space-between. The top row (nonFossil, solar, individual) and the middle row (gridMain, grid, spacer, home) may have different item counts, causing different horizontal spacing. Automatic alignment is claimed in Plan 02-03 but cannot be confirmed programmatically."
---

# Phase 2: Grid Main Node and Energy Balance — Verification Report

**Phase Goal:** Users with Messkonzept 8 see a grid_main node with animated bidirectional flow to grid_house, and the home consumption balance is correct
**Verified:** 2026-03-02T16:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | grid_main node renders to the LEFT of grid_house in middle row | VERIFIED | Lines 685-694 of power-flow-card-plus.ts: `${gridMain.has ? gridMainElement(...) : spacer}` immediately before `${grid.has ? gridElement(...) : spacer}` |
| 2 | grid_main displays power value from its configured HA entity | VERIFIED | gridMainElement renders `fromGridMain` / `toGridMain` from `gridMain.state`; state resolvers `getGridMainConsumptionState` / `getGridMainProductionState` exist and read from `(config.entities.grid as any)?.main` |
| 3 | Non-fossil percentage bubble attaches to grid_main when MK8 is configured | UNCERTAIN | `nonFossilElement` receives `grid` (not `gridMain`) — positioning relies on automatic flex alignment between the top row and middle row. Both rows use `display:flex;justify-content:space-between` with potentially different item counts. Cannot verify visual alignment programmatically. |
| 4 | grid_main supports power outage detection independently | VERIFIED | gridMain object includes `powerOutage: { has, isOutage, icon, name, entityGenerator }` reading from `gridMainConfig?.power_outage` — identical structure to grid_house power outage handling |
| 5 | Non-MK8 users see zero visual regression | VERIFIED | When `gridMainConfig?.entity === undefined`, `gridMain.has = false` → `html\`<div class="spacer"></div>\`` renders in the slot. Middle row layout identical to current behavior. |
| 6 | Bidirectional animated flow line gridMain ↔ gridHouse | VERIFIED | `flowGridMainToGridHouse` in `src/components/flows/gridMainToGridHouse.ts`: default direction for import (`fromGridMain`), `keyPoints="1;0"` reversal for export (`toGridMain`). Called from `flowElement` when `gridMain` is truthy. |
| 7 | Flow line animation direction and speed reflect actual power | VERIFIED | `newDur.gridMainToGridHouse = computeFlowRate(config, Math.max(fromGridMain ?? 0, toGridMain ?? 0), totalLines)` — passed to `flowGridMainToGridHouse` as `newDur.gridMainToGridHouse` |
| 8 | Home consumption uses grid_house only (BAL-01) | VERIFIED | Line 476: `totalHomeConsumption = Math.max(grid.state.toHome + solar.state.toHome + battery.state.toHome, 0)`. `gridMain` state values appear nowhere in this formula. |
| 9 | grid object reads from .house sub-key | VERIFIED | Line 169: `const gridHouseConfig = (entities.grid as any)?.house;` — all grid object fields reference `gridHouseConfig`. grid.ts component: `const gridConfig = (entities.grid as any)?.house;` |
| 10 | isEntityInverted bug fixed for grid_house resolvers | VERIFIED | `src/states/raw/grid.ts` line 18: `if (!!gridHouseConfig?.invert_state)` — no `isEntityInverted` import present. Same fix applied to `getGridProductionState`. |
| 11 | pnpm typecheck exits 0 | VERIFIED | `pnpm typecheck` output: 0 errors |
| 12 | pnpm test exits 0 | VERIFIED | `pnpm test` output: 21 tests pass, 0 failures |

**Score:** 11/12 truths verified (1 uncertain — requires human)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/type.ts` | NewDur type extended with gridMainToGridHouse field | VERIFIED | Line 100: `gridMainToGridHouse: number;` present in NewDur type |
| `src/states/raw/grid.ts` | grid_main state resolvers + fixed grid_house invert_state | VERIFIED | Exports `getGridMainConsumptionState`, `getGridMainProductionState`, `getGridMainSecondaryState`. No `isEntityInverted` import. Direct `gridHouseConfig?.invert_state` access. |
| `src/components/gridMain.ts` | gridMainElement component — visual node for main meter | VERIFIED | Exports `gridMainElement`. CSS class `circle-container grid-main`. Reads `gridMain.state.fromGridMain` / `toGridMain`. 105 lines — substantive implementation. |
| `src/components/flows/gridMainToGridHouse.ts` | flowGridMainToGridHouse — bidirectional animated flow line | VERIFIED | Exports `flowGridMainToGridHouse`. Bidirectional `animateMotion`: default for `fromGridMain`, `keyPoints="1;0"` for `toGridMain`. 71 lines — substantive implementation. |
| `src/components/flows/index.ts` | Updated Flows interface with gridMain?, flowElement calls it | VERIFIED | `Flows` interface has `gridMain?: any`. `flowElement` destructures `gridMain` and calls `gridMain ? flowGridMainToGridHouse(...) : ""`. |
| `src/style.ts` | CSS for .grid-main circle and icon styling | VERIFIED | Lines 439-441: `.grid-main .circle { border-color: var(--circle-grid-color); }`. Lines 461-463: `.grid-main ha-icon:not(.small) { color: var(--icon-grid-color); }`. |
| `src/power-flow-card-plus.ts` | gridMain object construction + middle row slot + newDur extension + flowElement update | VERIFIED | gridMain object at line 219; middle row at 685; `newDur.gridMainToGridHouse` at 551; `flowElement` receives `gridMain` at line 741. |
| `src/components/grid.ts` | gridConfig reads from .house sub-key | VERIFIED | Line 14: `const gridConfig = (entities.grid as any)?.house;` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/power-flow-card-plus.ts` | `src/states/raw/grid.ts` | `getGridMainConsumptionState` / `getGridMainProductionState` calls in render() | WIRED | Line 20 import: `getGridMainConsumptionState, getGridMainProductionState, getGridMainSecondaryState`. Lines 224-225: called to populate `gridMain.state`. |
| `src/power-flow-card-plus.ts` | `src/components/gridMain.ts` | `gridMainElement` called in middle row | WIRED | Line 21 import: `gridMainElement`. Line 686: `gridMainElement(this, this._config, { entities, gridMain, templatesObj })`. |
| `src/power-flow-card-plus.ts` | `src/components/flows/index.ts` | `flowElement` receives `gridMain` parameter | WIRED | Line 741: `gridMain,` inside `flowElement(this._config, { battery, grid, gridMain, individual, newDur, solar })`. |
| `src/components/flows/index.ts` | `src/components/flows/gridMainToGridHouse.ts` | `flowGridMainToGridHouse` called in flowElement | WIRED | Line 11 import. Line 27: `${gridMain ? flowGridMainToGridHouse(config, { battery, grid, gridMain, individual, solar, newDur }) : ""}`. |
| `src/components/gridMain.ts` | `src/states/raw/grid.ts` | `fromGridMain`/`toGridMain` values consumed from `gridMain.state` (built in render via getGridMain* functions) | WIRED | gridMainElement reads `gridMain.state.fromGridMain` (line 46) and `gridMain.state.toGridMain` (line 44). These are populated by `getGridMainConsumptionState` / `getGridMainProductionState` in render(). |
| `src/type.ts` (NewDur) | `src/power-flow-card-plus.ts` | `gridMainToGridHouse` field consumed in newDur | WIRED | `NewDur.gridMainToGridHouse` defined at type.ts:100. Assigned via `computeFlowRate` at power-flow-card-plus.ts:551. Passed to `flowGridMainToGridHouse` via `newDur.gridMainToGridHouse` at gridMainToGridHouse.ts:43. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GRID-01 | 02-02, 02-03 | grid_main node renders left of grid_house | SATISFIED | Middle row: `gridMainElement` (or spacer) at position 1, `gridElement` at position 2. Lines 685-694 of power-flow-card-plus.ts. |
| GRID-02 | 02-01, 02-03 | grid_main displays power from configured HA entity | SATISFIED | `getGridMainConsumptionState` / `getGridMainProductionState` read from `(config.entities.grid as any)?.main`; values passed to gridMainElement as `gridMain.state.fromGridMain` / `toGridMain`. |
| GRID-03 | 02-02, 02-03 | non_fossil bubble attaches to grid_main (not grid_house) | NEEDS HUMAN | Plan 02-03 claims flex layout auto-aligns top row items when middle row gains a slot. nonFossilElement is first item in the top row div. Alignment with gridMain (leftmost in middle row) depends on both rows having the same effective column count — cannot verify visually without rendering. |
| GRID-04 | 02-01, 02-03 | grid_main supports independent power outage detection | SATISFIED | `gridMain.powerOutage` object in render(): reads `gridMainConfig?.power_outage?.entity`, `state_alert`, `icon_alert`, `label_alert`, `entity_generator`. Rendered in gridMainElement at line 101. |
| GRID-05 | 02-01, 02-03 | No visual regression when entities.grid.main absent | SATISFIED | `gridMain.has = gridMainConfig?.entity !== undefined` → false when absent → `html\`<div class="spacer"></div>\`` in middle row slot. |
| CONN-01 | 02-02 | Two animated flow lines connect grid_main and grid_house | SATISFIED | `flowGridMainToGridHouse` renders a bidirectional SVG path with two separate animateMotion circles (one per direction), gated on `showImport` / `showExport`. ComboEntity pattern also supported via `getGridMain*` resolver branching. |
| CONN-02 | 02-02 | Animation direction/speed reflects actual power | SATISFIED | Import (`fromGridMain`): left-to-right default motion. Export (`toGridMain`): `keyPoints="1;0"` reversal. Both use `newDur.gridMainToGridHouse` duration = `computeFlowRate(Math.max(fromGridMain, toGridMain))`. |
| BAL-01 | 02-01, 02-03 | Home consumption uses grid_house only | SATISFIED | `totalHomeConsumption = Math.max(grid.state.toHome + solar.state.toHome + battery.state.toHome, 0)` — line 476. `gridMain.state.fromGridMain` / `toGridMain` absent from this formula. |

**No orphaned Phase 2 requirements found.** REQUIREMENTS.md maps GRID-01 through GRID-05, CONN-01, CONN-02, BAL-01 to Phase 2 — all accounted for in the plans above.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/ui-editor/components/individual-row-editor.ts` | 184-191 | `placeholder` property (DOM sort utility) | Info | Unrelated to Phase 2 — drag-and-drop sort artifact, not a stub. No impact. |

No Phase 2 files contain TODO/FIXME, empty implementations, or stub return values. The `gridMainToGridHouse: 0` placeholder from Plan 02-01 was correctly replaced with `computeFlowRate(...)` in Plan 02-03 (confirmed at line 551 of power-flow-card-plus.ts).

---

### Human Verification Required

#### 1. Non-fossil bubble alignment with grid_main (GRID-03)

**Test:** Configure the card with `entities.grid.main` (any entity) and `entities.fossil_fuel_percentage` (any entity). Load the card in a browser.
**Expected:** The non-fossil percentage bubble (low-carbon circle) in the top row should be visually aligned with the grid_main circle in the middle row — i.e., both appear at the leftmost column position.
**Why human:** Both rows use `display: flex; justify-content: space-between`. The top row has up to 4 items (`nonFossil`, `solar/spacer`, `individual-top-left/spacer`, `individual-top-right?`), while the middle row now has 4–5 items (`gridMain`, `grid`, `spacer`, `home`, `right-individual?`). With `space-between`, item positions depend on the count and width of all siblings in each row. Plan 02-03 asserts alignment is automatic, but this can only be confirmed visually. If the item counts differ between rows, the non-fossil bubble will NOT align above grid_main.

---

### Gaps Summary

No automated gaps detected. All 8 required artifacts exist, are substantive (not stubs), and are wired into the card's render() and component pipeline. All 6 phase commits confirmed present (`0955dda`, `e91fb44`, `5c63e29`, `ba2f47f`, `2a6b5c8`, `c5a496c`). TypeScript check and test suite both pass cleanly.

The single open item (GRID-03 non-fossil alignment) is a visual/layout question that cannot be resolved via static code analysis. The implementation strategy (flex auto-alignment) is plausible but unverifiable without rendering the component.

---

_Verified: 2026-03-02T16:00:00Z_
_Verifier: Claude (gsd-verifier)_

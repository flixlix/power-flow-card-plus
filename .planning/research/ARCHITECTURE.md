# Architecture Research

**Domain:** Home Assistant Lovelace custom card -- SVG power flow visualization (Messkonzept 8 extension)
**Researched:** 2026-03-02
**Confidence:** HIGH (based on direct source code analysis of the existing codebase)

## Current Architecture: System Overview

### HTML/CSS Layout Grid (Flexbox Rows)

The card renders as a series of **three flexbox rows** inside `.card-content`, with absolutely-positioned SVG flow lines overlaid on top. Each row uses `justify-content: space-between` and `max-width: 500px`.

```
 Row 1 (top):       [nonFossil/spacer]  [solar/spacer]  [individual-left-top/spacer]  [individual-right-top?]
 Row 2 (middle):    [grid/spacer]       [spacer]        [home/spacer]                 [spacer?]
 Row 3 (bottom):    [spacer]            [battery/spacer] [individual-left-bottom/spacer] [individual-right-bottom?]
 Overlay:           <flowElement> -- absolutely-positioned SVG lines connecting the circles
```

Each cell is a `div.circle-container` (80px wide circle + label) or a `div.spacer` (width: `var(--size-circle-entity)` = 79.99px). The right column (4th) only appears when `checkHasRightIndividual` is true.

### SVG Flow Line Coordinate System

All flow lines share the **same overlay model**: each flow is a `<div class="lines">` absolutely positioned over the card content. Inside each div is an `<svg viewBox="0 0 100 100">` with `preserveAspectRatio="xMidYMid slice"`. The SVG viewport is **100x100 unitless**, mapped to the div's pixel dimensions via CSS.

**Critical dimensions of the `.lines` container:**
- `position: absolute; bottom: 0` (or `bottom: 100px` when `.high`)
- `left: var(--size-circle-entity)` (80px -- to the right of the grid circle column)
- `width: 100%` (of `.card-content`)
- `height: 146px` (or `156px` when `.high`)
- The SVG inside is sized by CSS vars: `--lines-svg-flat-width: calc(100% - 160px)` for straight lines

**Flow path geometries in SVG 0-100 space:**

| Flow | Path `d` attribute | Notes |
|------|-------------------|-------|
| **gridToHome** | `M0,{50\|56\|53} H100` | Horizontal line, Y varies: 50 if battery, 56 if solar (no battery), 53 otherwise. Class `flat-line`. |
| **solarToHome** | `M{55\|53},0 v{15\|17} c0,{30\|35} 10,{30\|35} 30,{30\|35} h25` | Starts top-center, curves right to home. `55,0` if battery, `53,0` otherwise. |
| **solarToGrid** | `M{45\|47},0 v15 c0,{30\|35} -10,{30\|35} -30,{30\|35} h-20` | Starts top-center, curves left to grid. `45,0` if battery, `47,0` otherwise. |
| **solarToBattery** | `M50,0 V100` | Straight vertical center line. Class `flat-line`. |
| **batteryToHome** | `M55,100 v-{15\|17} c0,-30 10,-30 30,-30 h20` | Starts bottom-center, curves right to home. `v-15` if grid, `v-17` otherwise. |
| **batteryGrid** | `M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20` | Starts bottom-center, curves left to grid. Bidirectional (dot direction flips). |

**Key coordinates in SVG 0-100 space:**
- `x=0`: Left edge = grid circle center (horizontally)
- `x=100`: Right edge = home circle center (horizontally)
- `x=45-55`: Center = solar (top) / battery (bottom) column
- `y=0`: Top edge = solar row
- `y=50-56`: Middle = grid/home row
- `y=100`: Bottom edge = battery row

### Component Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| `PowerFlowCardPlus` | `src/power-flow-card-plus.ts` | Main card class. Computes all energy balance state, builds object models (`grid`, `solar`, `battery`, `home`, `nonFossil`, `individualObjs`), renders 3-row layout, computes flow durations. |
| `gridElement` | `src/components/grid.ts` | Renders grid circle with icon, consumption/return values, power outage display, secondary info. |
| `solarElement` | `src/components/solar.ts` | Renders solar circle with icon and total production value. |
| `batteryElement` | `src/components/battery.ts` | Renders battery circle with SoC, charge/discharge values. |
| `homeElement` | `src/components/home.ts` | Renders home circle with multi-source color ring (SVG circles with stroke-dasharray). |
| `nonFossilElement` | `src/components/nonFossil.ts` | Renders non-fossil bubble above grid in Row 1, with its own short vertical SVG flow line (80x30 viewBox). |
| `flowElement` | `src/components/flows/index.ts` | Aggregates all 6 flow line components into a single template. |
| `flowGridToHome` | `src/components/flows/gridToHome.ts` | Horizontal SVG line from grid to home. |
| `flowSolarToHome` | `src/components/flows/solarToHome.ts` | Curved SVG line from solar down-right to home. |
| `flowSolarToGrid` | `src/components/flows/solarToGrid.ts` | Curved SVG line from solar down-left to grid. |
| `flowSolarToBattery` | `src/components/flows/solarToBattery.ts` | Vertical SVG line from solar to battery. |
| `flowBatteryToHome` | `src/components/flows/batteryToHome.ts` | Curved SVG line from battery up-right to home. |
| `flowBatteryGrid` | `src/components/flows/batteryGrid.ts` | Curved SVG line from battery up-left to grid (bidirectional). |
| `allDynamicStyles` | `src/style/all.ts` | Sets CSS custom properties for colors, line dimensions at runtime. |
| `styles` | `src/style.ts` | Static CSS for circle sizing, line positioning, colors, animations. |
| `GridObject` type | `src/type.ts:102-144` | Type definition for grid state: `fromGrid`, `toGrid`, `toBattery`, `toHome`, plus `powerOutage`, `secondary`, `color`, `tap_action`. |
| `ConfigEntities` | `src/power-flow-card-plus-config.ts:94-101` | Config shape: `battery`, `grid`, `solar`, `home`, `fossil_fuel_percentage`, `individual[]`. |
| Grid state resolution | `src/states/raw/grid.ts` | Delegates to `getFieldOutState`/`getFieldInState` for consumption/production. |

## Recommended Architecture for Messkonzept 8 Extension

### Extended Layout Grid

The key challenge is adding **two new nodes** -- `grid_main` (left of `grid_house`) and `heatpump` (below `grid_house`) -- without breaking the existing 3-4 column flexbox layout.

**Approach: Widen Row 2 to accommodate grid_main as a new leftmost column.**

```
 Row 1 (top):       [spacer?]        [nonFossil/spacer]  [solar/spacer]   [indiv-LT/spacer]  [indiv-RT?]
 Row 2 (middle):    [grid_main]      [grid_house]        [spacer]         [home/spacer]       [spacer?]
 Row 3 (bottom):    [spacer]         [heatpump/battery]  [battery/spacer] [indiv-LB/spacer]   [indiv-RB?]
```

**However**, the simpler and less disruptive approach, given the existing layout's strict dependence on 3 columns mapped to SVG 0-100 viewBox coordinates, is:

**Recommended approach: Extend only when Messkonzept 8 is active, by conditionally inserting grid_main before grid_house in Row 2, and heatpump below grid_house in Row 3.**

When `entities.grid.main` is configured (Messkonzept 8 mode):

```
 Row 1 (top):       [nonFossil/spacer]  [solar/spacer]   [indiv-LT/spacer]  [indiv-RT?]
 Row 2 (middle):    [grid_main]         [grid_house]     [home/spacer]       [spacer?]
 Row 3 (bottom):    [spacer]            [heatpump]       [battery/spacer]    [indiv-LB/spacer]  [indiv-RB?]
 Overlay:           Extended flow lines covering the wider layout
```

When `entities.grid.main` is NOT configured (backward-compatible mode):

```
 (Identical to current layout -- no changes)
```

### New Node Positions in SVG Space

The existing flow SVG overlay is anchored with `left: var(--size-circle-entity)` (80px) and spans from the grid column to the home column. For Messkonzept 8, grid_main is further left, so we need to either:

**Option A (Recommended): Use separate SVG containers for the new flows.**

The new grid_main-to-grid_house and grid_main/grid_house-to-heatpump connections operate in a different geometric region (left of the existing SVG overlay). Rather than reworking the existing flow overlay's coordinate system, add **new dedicated SVG flow containers** for:

1. `flowGridMainToGridHouse` -- between the two grid nodes (horizontal, in Row 2)
2. `flowGridHouseToHeatpump` -- from grid_house down to heatpump (vertical/curved)
3. `flowGridMainToHeatpump` -- from grid_main down-right to heatpump (curved)

This mirrors the existing pattern where `nonFossilElement` has its own small inline SVG (`<svg width="80" height="30">`) rather than using the main flow overlay.

**Option B: Widen the existing SVG overlay leftward.**

This would require changing `--lines-svg-flat-left`, the `left` anchor, and remapping all existing `d` paths to a wider coordinate space. High risk of breaking existing line positions.

**Option A is strongly recommended** because it avoids modifying any existing SVG path geometry.

### New Node Coordinate Positions

In the HTML flexbox layout:

| Node | Row | Column Position | CSS Class | Circle Size |
|------|-----|-----------------|-----------|-------------|
| `grid_main` | Row 2 | 1st (leftmost) | `.circle-container.grid-main` | 80x80px (same as all circles) |
| `grid_house` | Row 2 | 2nd (was 1st -- the existing grid position) | `.circle-container.grid` (reused) | 80x80px |
| `heatpump` | Row 3 | 2nd (below grid_house, to the left of battery) | `.circle-container.heatpump` | 80x80px |

### New Flow Line Paths

#### Flow 1: grid_main <-> grid_house (Bidirectional)

**Type:** Horizontal line between two adjacent circles in Row 2.
**Implementation:** Inline SVG between grid_main and grid_house circle-containers, or an absolutely-positioned overlay.

**Recommended approach:** Use an inline SVG similar to how `nonFossil` draws its vertical line. Place it between the two grid circles. Since both circles are adjacent in the same row, a simple horizontal connector works:

```
SVG viewBox="0 0 80 30" (or similar small inline SVG)
Path: M0,15 H80
```

Two animated dots: one traveling left-to-right (import: main->house), one right-to-left (export: house->main), similar to `batteryGrid` bidirectional handling.

**Direction logic:**
- Import dot (main->house): `keyPoints="0;1"` when `gridMain.state.toHouse > 0`
- Export dot (house->main): `keyPoints="1;0"` when `gridHouse.state.toMain > 0`

#### Flow 2: grid_house -> heatpump (Monodirectional, downward)

**Type:** Vertical or curved line from grid_house (Row 2, column 2) to heatpump (Row 3, column 2). Since they are in the same column, this is a straight vertical line.

**Implementation:** Similar to `solarToBattery` (which is `M50,0 V100` -- a straight vertical).

```
SVG viewBox within a .lines-style container positioned to align with grid_house column
Path: M50,0 V100
```

Or as an inline SVG on the heatpump element (like nonFossil's vertical line):
```
<svg width="80" height="30">
  <path d="M40 -10 v40" />
</svg>
```

**Dot direction:** Always downward (grid_house -> heatpump).

#### Flow 3: grid_main -> heatpump (Monodirectional, curved down-right)

**Type:** Curved line from grid_main (Row 2, column 1) to heatpump (Row 3, column 2). This requires a diagonal line going down and to the right.

**Implementation:** Absolutely-positioned SVG overlay, similar to `batteryGrid` but going from top-left to bottom-right.

```
SVG viewBox="0 0 100 100"
Path: M15,0 v15 c0,30 10,30 30,30 h20
```

This mirrors the shape of `batteryToHome` (`M55,100 v-15 c0,-30 10,-30 30,-30 h20`) but going the opposite direction. The exact coordinates will need tuning based on the pixel distance between grid_main and heatpump.

**Dot direction:** Always from grid_main toward heatpump (top to bottom).

### Non-Fossil Bubble Migration

Currently, `nonFossilElement` renders in **Row 1, column 1** (leftmost position in the top row). Its short vertical SVG line connects it downward to the grid circle below.

For Messkonzept 8: The non-fossil bubble must visually attach to `grid_main` instead of `grid_house`. Since `grid_main` is now in Row 2 column 1, the nonFossil bubble stays in Row 1 column 1 (directly above grid_main). **No positional change needed** -- the bubble naturally aligns above grid_main when grid_main takes the leftmost position in Row 2.

The data binding changes: `nonFossil.state.power` should be computed from `gridMain.state.fromGrid` instead of `grid.state.fromGrid` (the value displayed becomes the non-fossil share of the main meter import, not the house meter).

## Patterns to Follow

### Pattern 1: Component Function Pattern

**What:** Each visual node is a pure function `(main, config, props) => TemplateResult` exported from its own file.
**When to use:** For all new node components (grid_main, heatpump).
**Trade-offs:** Simple, testable, but all state computation happens in the main class.

**Example (existing):**
```typescript
// src/components/grid.ts
export const gridElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { entities, grid, templatesObj }: { entities: ConfigEntities; grid: any; templatesObj: TemplatesObj }
) => {
  return html`<div class="circle-container grid">...</div>`;
};
```

**For grid_main:** Create `src/components/gridMain.ts` following this exact pattern.
**For heatpump:** Create `src/components/heatpump.ts` following this exact pattern.

### Pattern 2: Flow Line SVG Pattern

**What:** Each flow line is a pure function `(config, flows) => TemplateResult` with an SVG `<path>` and optional animated `<circle>` dots.
**When to use:** For all new flow connections.

**Example (existing):**
```typescript
// src/components/flows/gridToHome.ts
export const flowGridToHome = (config, { battery, grid, individual, solar, newDur }) => {
  return grid.has && showLine(config, grid.state.fromGrid) && !config.entities.home?.hide
    ? html`<div class="lines ...">
        <svg viewBox="0 0 100 100" ...>
          <path class="grid ..." d="M0,50 H100" ... />
          ${/* animated dot */}
        </svg>
      </div>`
    : "";
};
```

**For new flows:** Create `src/components/flows/gridMainToGridHouse.ts`, `src/components/flows/gridHouseToHeatpump.ts`, `src/components/flows/gridMainToHeatpump.ts`.

### Pattern 3: Inline Short Flow Line (Non-Fossil Style)

**What:** For short connections between adjacent elements (e.g., non-fossil bubble to grid below it), use a small inline `<svg width="80" height="30">` directly in the node component rather than the main flow overlay.
**When to use:** For the grid_main<->grid_house horizontal connector and grid_house->heatpump vertical connector, if they are between adjacent elements.

**Example (existing -- nonFossil.ts):**
```typescript
html`<svg width="80" height="30">
  <path d="M40 -10 v40" class="low-carbon ${styleLine(...)}" id="low-carbon" />
  ${/* animated dot */}
</svg>`
```

## Data Flow

### Current Energy Balance Computation

```
Config (entities.grid.entity)
    |
    v
getGridConsumptionState() / getGridProductionState()
    |
    v
GridObject { state: { fromGrid, toGrid, toBattery, toHome } }
    |
    v
Energy balance logic in render():
  - solar.toHome = solar.total - grid.toGrid - battery.toBattery
  - grid.toBattery = (computed from remaining)
  - grid.toHome = grid.fromGrid - grid.toBattery
  - battery.toHome = battery.fromBattery - battery.toGrid
    |
    v
computeFlowRate() for each line -> NewDur
    |
    v
Component render functions + flow SVG lines
```

### Extended Energy Balance for Messkonzept 8

```
Config: entities.grid.main.entity + entities.grid.house.entity + entities.heatpump.entity
    |
    v
gridMain state: { fromGridMain, toGridMain }  (total grid import/export)
gridHouse state: { fromGridHouse, toGridHouse } (house-only import/export)
heatpump state: { power }  (heatpump consumption)
    |
    v
New derived values:
  - gridMainToHouse = gridHouse.fromGrid   (import flowing through to house meter)
  - gridHouseToMain = gridHouse.toGrid     (export flowing from house through main)
  - gridMainToHeatpump = gridMain.fromGrid - gridHouse.fromGrid  (or from heatpump entity directly)
  - gridHouseToHeatpump = (config-dependent, may be 0 in standard MK8)
    |
    v
Existing solar/battery/home balance logic uses gridHouse values (unchanged)
New heatpump balance computed separately
```

### Key Data Flows

1. **Backward-compatible migration:** If `entities.grid.entity` is a flat string/ComboEntity (no `.house`/`.main` sub-keys), auto-remap to `entities.grid.house.entity` at config load time. Log deprecation warning.
2. **Non-fossil rebinding:** When Messkonzept 8 is active, `nonFossil.state.power` is derived from `gridMain.state.fromGrid * nonFossilFuelDecimal` instead of `grid.state.fromGrid * nonFossilFuelDecimal`.
3. **Home consumption:** Unchanged -- still based on `grid.state.toHome` (now meaning grid_house.toHome) + solar.toHome + battery.toHome.

## Component Modification vs Creation Summary

### Existing Components to Modify

| File | Change |
|------|--------|
| `src/power-flow-card-plus.ts` | Add `gridMain` and `heatpump` object construction in `render()`. Add Messkonzept 8 conditional layout in template. Add new flow durations to `NewDur`. |
| `src/power-flow-card-plus-config.ts` | Extend `ConfigEntities.grid` to accept nested `{ house: Grid, main: Grid }` shape. Add `heatpump` to `ConfigEntities`. |
| `src/type.ts` | Add `GridMainObject`, `HeatpumpObject` types. Extend `NewDur` with new flow durations. |
| `src/states/raw/grid.ts` | Support reading from `entities.grid.house.entity` and `entities.grid.main.entity` in addition to flat `entities.grid.entity`. |
| `src/components/flows/index.ts` | Import and render new flow components. |
| `src/components/nonFossil.ts` | When Messkonzept 8 active, bind to `gridMain.state.fromGrid` for power calculation. |
| `src/style.ts` | Add CSS for `.circle-container.grid-main`, `.circle-container.heatpump`, new flow line colors. |
| `src/style/all.ts` | Add dynamic style setters for grid_main and heatpump colors. |

### New Components to Create

| File | Purpose |
|------|---------|
| `src/components/gridMain.ts` | Renders grid_main circle (icon, consumption/production values, secondary info). Clone of `grid.ts` adapted for grid_main data. |
| `src/components/heatpump.ts` | Renders heatpump circle (icon, power value, COP display). |
| `src/components/flows/gridMainToGridHouse.ts` | Bidirectional horizontal flow line between grid_main and grid_house. |
| `src/components/flows/gridHouseToHeatpump.ts` | Monodirectional vertical flow line from grid_house to heatpump. |
| `src/components/flows/gridMainToHeatpump.ts` | Monodirectional curved flow line from grid_main to heatpump. |
| `src/states/raw/gridMain.ts` | State resolution for grid_main entity. |
| `src/states/raw/heatpump.ts` | State resolution for heatpump entity. |

### New Editor Components to Create

| File | Purpose |
|------|---------|
| `src/ui-editor/schema/grid-main.ts` | Editor schema for grid_main configuration. |
| `src/ui-editor/schema/grid-house.ts` | Editor schema for grid_house configuration (replaces/extends current grid schema). |
| `src/ui-editor/schema/heatpump.ts` | Editor schema for heatpump configuration. |

## Anti-Patterns to Avoid

### Anti-Pattern 1: Modifying Existing SVG Path Geometry

**What people do:** Rework the existing `d` attribute strings in `gridToHome.ts`, `solarToGrid.ts`, etc., to accommodate the wider layout.
**Why it's wrong:** Every existing flow path is carefully tuned with pixel-precise CSS variable calculations. Changing them risks breaking all existing layouts for users who do not use Messkonzept 8.
**Do this instead:** Add new SVG containers for new flows. The existing six flow paths should remain untouched.

### Anti-Pattern 2: Making grid_main Always Present in the DOM

**What people do:** Always render grid_main and heatpump nodes (hidden when unconfigured) to simplify conditional logic.
**Why it's wrong:** Extra DOM elements affect the flexbox layout even when hidden (unless `display:none`, which then requires conditional CSS). More importantly, users not using Messkonzept 8 should see zero visual difference.
**Do this instead:** Conditionally render grid_main and heatpump only when `entities.grid.main` is configured. Use a boolean flag like `const isMK8 = !!entities.grid?.main` to gate all Messkonzept 8 rendering.

### Anti-Pattern 3: Sharing the GridObject Type for Both Meters

**What people do:** Reuse the single `GridObject` for both grid_main and grid_house, adding fields to it.
**Why it's wrong:** `GridObject` has semantically specific fields (`toBattery`, `toHome`) that only apply to grid_house. Grid_main has different derived flows (`toHouse`, `toHeatpump`).
**Do this instead:** Keep the existing `GridObject` for grid_house (it remains the "grid" from the perspective of solar/battery/home balance). Create a separate `GridMainObject` type for grid_main with its own specific state fields.

## Build Order (Dependency Chain)

Each phase depends on the previous one. Within a phase, items can be done in parallel.

### Phase 1: Type Foundation + Config Migration (No visual changes)

1. **Extend config types** (`power-flow-card-plus-config.ts`, `type.ts`): Define nested grid config shape (`entities.grid.house` / `entities.grid.main`), `HeatpumpConfig`, `GridMainObject`, `HeatpumpObject`.
2. **Backward-compatible config migration** (`power-flow-card-plus.ts:setConfig`): Detect flat `entities.grid.entity` and remap to `entities.grid.house`. Log deprecation warning.
3. **Extend state resolution** (`states/raw/grid.ts`, new `states/raw/gridMain.ts`, new `states/raw/heatpump.ts`): Read from nested config paths. Grid house state = existing logic. Grid main state = new resolution.
4. **Tests**: Unit tests for config migration logic and state resolution.

*Rationale: Everything downstream depends on correct types and state. This phase has zero visual impact and can be validated purely through tests.*

### Phase 2: Grid House Rename + Grid Main Node (First visible changes)

1. **Render grid_main node** (new `src/components/gridMain.ts`): Clone grid.ts, bind to `gridMain` object.
2. **Modify main render layout** (`power-flow-card-plus.ts`): Conditionally insert `gridMainElement` before `gridElement` in Row 2 when Messkonzept 8 is active.
3. **Add grid_main<->grid_house flow line** (new `src/components/flows/gridMainToGridHouse.ts`): Bidirectional horizontal animated line.
4. **Add CSS for grid_main** (`style.ts`, `style/all.ts`): Circle colors, icon colors, line colors.
5. **Migrate nonFossil data binding**: When MK8 active, nonFossil uses gridMain.fromGrid.

*Rationale: Grid_main is the most prominent new visual element. Proving it works validates the layout extension approach before adding heatpump.*

*Depends on: Phase 1 (types, config migration, state resolution)*

### Phase 3: Heatpump Node + Flow Lines

1. **Render heatpump node** (new `src/components/heatpump.ts`): Circle with icon, power value, COP display.
2. **Modify main render layout**: Add heatpump to Row 3 (before battery when MK8 active).
3. **Add grid_house->heatpump flow line** (new `src/components/flows/gridHouseToHeatpump.ts`).
4. **Add grid_main->heatpump flow line** (new `src/components/flows/gridMainToHeatpump.ts`).
5. **Add CSS for heatpump** (`style.ts`, `style/all.ts`).
6. **Integrate into flowElement** (`flows/index.ts`): Register new flows.
7. **Extend NewDur**: Add flow rate durations for new lines.

*Depends on: Phase 2 (grid_main node must exist for grid_main->heatpump line)*

### Phase 4: Visual Editor

1. **Grid house editor schema** (new or modified `src/ui-editor/schema/grid-house.ts`).
2. **Grid main editor schema** (new `src/ui-editor/schema/grid-main.ts`).
3. **Heatpump editor schema** (new `src/ui-editor/schema/heatpump.ts`).
4. **Editor routing** (`src/ui-editor/ui-editor.ts`): Add navigation to new schema pages.
5. **Migration prompt**: Detect flat grid config in editor, offer one-click migration.

*Depends on: Phases 1-3 (editor must configure what already exists)*

### Phase 5: Polish + Testing

1. **display_zero_lines integration**: New flow lines respect `show`, `grey_out`, `transparency`, `hide`, `custom` modes.
2. **Responsive layout tuning**: Ensure the wider layout works at different card widths (the `isCardWideEnough` > 420px check may need adjustment).
3. **End-to-end visual testing**: Compare screenshots of standard layout (no MK8) before/after to verify zero regression.
4. **Edge cases**: MK8 with no battery, MK8 with no solar, MK8 with individual devices.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Config types <-> State resolution | Direct property access | The nested `entities.grid.house` / `entities.grid.main` must be understood by both config validation and state readers |
| State resolution <-> Energy balance | Via object fields | `gridMain.state` and `gridHouse.state` feed the balance math in `render()`. The existing solar/battery/home balance uses gridHouse only. |
| Energy balance <-> Flow components | Via `Flows` interface | New flows need `gridMain` and `heatpump` added to the `Flows` interface |
| Node components <-> Style system | Via CSS custom properties | New nodes need their own `--icon-grid-main-color`, `--circle-grid-main-color`, `--energy-heatpump-color`, etc. |
| Main layout <-> Flow overlay positioning | Via CSS vars and class toggling | When MK8 adds a column, the `.lines` overlay `left` position and width may need a MK8-specific variant |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Home Assistant state API | `this.hass.states[entity_id]` | Same pattern for grid_main and heatpump entities as existing nodes |
| HA template subscriptions | `subscribeRenderTemplate()` | Need new template topics for `gridMainSecondary`, `heatpumpSecondary` |

## Sources

- Direct source code analysis of `power-flow-card-plus` v0.2.6 (all paths under `/home/groot/projects/power-flow-card-plus/src/`)
- `src/power-flow-card-plus.ts` -- main card class, layout template, energy balance logic
- `src/components/flows/*.ts` -- all 6 existing flow line SVG implementations
- `src/components/grid.ts`, `solar.ts`, `battery.ts`, `home.ts`, `nonFossil.ts` -- node circle components
- `src/style.ts` -- static CSS with all layout dimensions
- `src/style/all.ts` -- dynamic CSS property computation
- `src/type.ts` -- GridObject, NewDur, and related type definitions
- `src/power-flow-card-plus-config.ts` -- ConfigEntities and related config types
- `src/states/raw/grid.ts` -- grid state resolution

---
*Architecture research for: power-flow-card-plus Messkonzept 8 extension*
*Researched: 2026-03-02*

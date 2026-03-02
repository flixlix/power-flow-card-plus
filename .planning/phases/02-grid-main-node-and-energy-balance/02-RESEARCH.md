# Phase 2: Grid Main Node and Energy Balance - Research

**Researched:** 2026-03-02
**Domain:** LitElement custom card — new node rendering, SVG flow line, conditional layout, state resolution
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### grid_main node appearance
- Same visual structure as `grid_house`: two-way display (import + export), with `display_state` config controlling visibility of each direction
- Same icon as grid_house (`mdi:transmission-tower`) — no visual distinction between the two meter nodes
- Full config surface matching grid_house: `secondary_info`, `tap_action`, `display_state`, `decimals`, `name`, `icon`

#### Flow line between grid_main and grid_house
- Same visual style as all other flow lines: color driven by existing theme/config variables, animated dots, same line weight
- No special styling to distinguish it as an "internal" meter link — consistent with the rest of the card

#### Non-fossil bubble placement
- When both `entities.grid.main` and `entities.grid.house` are configured: non-fossil bubble shifts left to appear above `grid_main` (same top-row slot, but aligned with the new leftmost node)
- When only `entities.grid.house` is configured (existing non-MK8 users): non-fossil bubble stays exactly in its current position — zero regression

#### Layout structure
- `grid_main` slots into the existing middle row as a new column to the LEFT of `grid_house`
- No new rows or structural changes — the existing two-row layout expands horizontally

#### State value naming (backward compatibility)
- `grid_house` state continues to expose `fromGrid` and `toGrid` — no renaming, no breaking changes
- `grid_main` state exposes `fromGridMain` and `toGridMain` as new parallel values
- Home consumption balance formula uses `grid_house` values (`fromGrid`) only — `fromGridMain` is display-only on the node

#### grid_main entity config shape
- Same structure as `grid_house`: string entity (bidirectional) OR `{ consumption, production }` object — mirrors the existing `Grid` interface exactly

### Claude's Discretion
- CSS class naming for the new grid_main circle-container
- Exact SVG path for the grid_main ↔ grid_house flow line
- File naming for the new flow component (e.g., `gridMainToGridHouse.ts`)
- How `nonFossil.state.power` is recalculated when referencing grid_main vs grid_house

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRID-01 | `grid_main` node renders to the left of `grid_house` in the card layout | Middle-row `.row` uses `display: flex; justify-content: space-between`. Inserting a new `circle-container` element before `gridElement` places it at left. CSS spacer pattern handles absent case. |
| GRID-02 | `grid_main` displays power value from its configured HA entity | New state resolver functions `getGridMainConsumptionState` / `getGridMainProductionState` in `src/states/raw/grid.ts` read from `(config.entities.grid as any)?.main`. Reuse `getEntityStateWatts`, `onlyPositive`, `onlyNegative` — identical to grid_house pattern. |
| GRID-03 | `non_fossil` percentage bubble attaches to `grid_main` (not `grid_house`) when both meters configured | `nonFossilElement` already accepts `grid` state as a prop and renders a vertical SVG connector downward from the bubble. Phase 2 changes the render() call-site: pass `gridMain` as the reference when `gridMain.has` is true, no changes to the component internals needed. `nonFossil.state.power` is currently `grid.state.toHome * nonFossilFuelDecimal` — when grid_main is present, the bubble is display-only positioned above grid_main, but power computation stays on `grid_house.state.toHome` (locked decision). |
| GRID-04 | `grid_main` supports power outage detection (independently configurable) | `Grid` interface already has `power_outage: GridPowerOutage`. Since `entities.grid.main` is typed as `Grid`, the `power_outage` field is present with zero extra typing work. The `gridMainElement` component handles outage rendering the same way `gridElement` does. |
| GRID-05 | When `entities.grid.main` is absent, card renders identically to current behavior | Guard: `gridMain.has = (config.entities.grid as any)?.main?.entity !== undefined`. When false, render a `<div class="spacer"></div>` in the slot — same existing pattern used for absent battery, absent solar, etc. The top-row non-fossil bubble position logic also checks `gridMain.has` before shifting left. |
| CONN-01 | Two animated flow lines connect `grid_main` and `grid_house`, each direction configurable | New file `src/components/flows/gridMainToGridHouse.ts`. Follows `gridToHome.ts` pattern: `showLine` guard, SVG with `<path>` + `<animateMotion>` circle. Bidirectional: one circle per direction using `keyPoints="1;0"` for reverse (mirroring `flowBatteryGrid` pattern). The entity for each direction comes from config per CONN-01 spec — ComboEntity OR single bidirectional entity. |
| CONN-02 | Each line's animation direction and speed reflects actual power from its configured entity/value | `newDur.gridMainToGridHouse` added to `NewDur` type. `computeFlowRate` called in `render()` with `gridMain.state.fromGridMain` (or `toGridMain`). Animation direction: `keyPoints="1;0"` for main→house flow, default for house→main flow — mirrors how `flowBatteryGrid` handles two directions on one path. |
| BAL-01 | Home consumption calculation uses `grid_house` (not `grid_main`) to preserve existing solar/battery/home balance | `totalHomeConsumption = grid.state.toHome + solar.state.toHome + battery.state.toHome`. `grid.state.toHome` derives from `grid.state.fromGrid` which is `getGridConsumptionState` reading `entities.grid.house`. No change to this formula — the locked decision that `fromGridMain` is display-only means BAL-01 is satisfied by not touching the balance math, only by confirming `grid_house` resolver stays in place. |
</phase_requirements>

---

## Summary

Phase 2 adds a `grid_main` node (Messkonzept 8 second meter) to the left of `grid_house` in the middle row and wires it to an animated bidirectional flow line. The codebase was purpose-built for exactly this extension: the `GridEntities { house?, main? }` shape from Phase 1 is already in the type system, and the Phase 1 state resolvers already read from `.house`. Phase 2 simply adds the symmetric `.main` resolvers and a new component that is a near-exact copy of `gridElement`.

The energy balance (BAL-01) is satisfied without any formula changes. The existing `totalHomeConsumption` math already uses `grid.state.fromGrid`, which reads from `entities.grid.house` as of Phase 1. Phase 2 introduces a parallel `gridMain` object whose state values are used only for display — they never feed into the balance formula.

The most discretion-requiring work is the SVG path for the grid_main ↔ grid_house flow line. The existing flow lines operate on a shared coordinate space (0–100 viewBox, placed absolutely over the card). The new line must connect two horizontally-adjacent circles in the middle row. A horizontal straight line (`M0,50 H100`) is the correct approach, matching `gridToHome.ts` which also connects two middle-row nodes (`M0,... H100`). The exact Y coordinate depends on whether battery or solar is present — the same `battery.has` conditional that `gridToHome.ts` uses applies here.

**Primary recommendation:** Fork `gridElement` into `gridMainElement`, fork `src/states/raw/grid.ts` getters into new `getGridMainConsumptionState` / `getGridMainProductionState` functions, create `gridMainToGridHouse.ts` flow file following `batteryGrid.ts` for bidirectionality and `gridToHome.ts` for horizontal placement, then wire everything into `render()` with `gridMain.has` guards everywhere.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | Already in project | LitElement base, `html`, `svg` tagged templates | Entire card is Lit; all components use `html\`...\`` |
| lit/directives/class-map.js | Already in project | Conditional CSS classes on elements | All flow files use `classMap` for `.high`, `.multi-individual` etc. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| custom-card-helpers | Already in project | `HomeAssistant` type | State resolvers need hass to read entity state |
| @/power-flow-card-plus-config | internal | Config types | Every component receives typed config |

**No new npm packages are needed for this phase.**

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase:

```
src/
├── components/
│   ├── gridMain.ts              # new — gridMainElement (fork of grid.ts)
│   └── flows/
│       ├── gridMainToGridHouse.ts  # new — bidirectional flow line
│       └── index.ts             # update — export gridMainToGridHouseFlow
├── states/
│   └── raw/
│       └── grid.ts              # update — add getGridMainConsumptionState, getGridMainProductionState, getGridMainSecondaryState
├── type.ts                      # update — add gridMainToGridHouse to NewDur
└── power-flow-card-plus.ts      # update — gridMain object, render() row changes, top-row nonFossil placement
```

### Pattern 1: State Resolver (read from .main sub-key)

Directly mirrors the Phase 1 pattern in `src/states/raw/grid.ts`.

```typescript
// src/states/raw/grid.ts — add below existing grid_house functions
export const getGridMainConsumptionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridMain = (config.entities.grid as any)?.main;
  const entity = gridMain?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    // Note: isEntityInverted reads config.entities["grid"]?.invert_state which is now GridEntities
    // (has no invert_state). For grid_main, invert_state lives on gridMain itself.
    // Must access directly: !!gridMain?.invert_state
    if (!!gridMain?.invert_state) return onlyPositive(state);
    return onlyNegative(state);
  }
  return getEntityStateWatts(hass, (entity as { production: string }).production);
};

export const getGridMainProductionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridMain = (config.entities.grid as any)?.main;
  const entity = gridMain?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    if (!!gridMain?.invert_state) return onlyNegative(state);
    return onlyPositive(state);
  }
  return getEntityStateWatts(hass, (entity as { consumption: string }).consumption);
};
```

**Confidence:** HIGH — direct read of existing Phase 1 pattern.

### Pattern 2: gridMainElement Component

Fork `src/components/grid.ts` into `src/components/gridMain.ts`. The function signature and internal structure are identical. Change:
- CSS class on the outer div: `grid-main` instead of `grid`
- Reference `entities.grid.main` via `(entities.grid as any)?.main` instead of `(entities.grid as any)` flat
- State fields: `grid.state.fromGridMain` / `grid.state.toGridMain` instead of `fromGrid` / `toGrid`

```typescript
// src/components/gridMain.ts
export const gridMainElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { entities, gridMain, templatesObj }: { entities: ConfigEntities; gridMain: any; templatesObj: TemplatesObj }
) => {
  const gridMainConfig = (entities.grid as any)?.main;
  return html`<div class="circle-container grid-main">
    // ... identical structure to gridElement, but using gridMain.state.fromGridMain / toGridMain
    // and gridMainConfig instead of gridConfig
  </div>`;
};
```

**Confidence:** HIGH — mechanical fork of grid.ts.

### Pattern 3: Bidirectional Flow Line (gridMainToGridHouse)

Combines:
- `gridToHome.ts`: horizontal path `M0,Y H100` between two middle-row nodes
- `batteryGrid.ts`: two separate `<animateMotion>` circles, one per direction, with `keyPoints="1;0"` for reverse

```typescript
// src/components/flows/gridMainToGridHouse.ts
export const flowGridMainToGridHouse = (config: PowerFlowCardPlusConfig, { battery, grid, gridMain, solar, newDur }: FlowsWithGridMain) => {
  const showImport = showLine(config, gridMain.state.fromGridMain);
  const showExport = showLine(config, gridMain.state.toGridMain);
  return gridMain.has && grid.has && (showImport || showExport)
    ? html`<div class="lines ${classMap({ high: battery.has, ... })}">
        <svg viewBox="0 0 100 100" ... id="grid-main-house-flow" class="flat-line">
          <path
            class="grid ${styleLine(gridMain.state.fromGridMain || 0, config)}"
            id="grid-main-house"
            d="M0,${battery.has ? 50 : solar.has ? 56 : 53} H100"
            vector-effect="non-scaling-stroke"
          />
          ${checkShouldShowDots(config) && gridMain.state.fromGridMain
            ? svg\`<circle r="1" class="grid" vector-effect="non-scaling-stroke">
                <animateMotion dur="${newDur.gridMainToGridHouse}s" repeatCount="indefinite" calcMode="linear">
                  <mpath xlink:href="#grid-main-house" />
                </animateMotion>
              </circle>\`
            : ""}
          ${checkShouldShowDots(config) && gridMain.state.toGridMain
            ? svg\`<circle r="1" class="return" vector-effect="non-scaling-stroke">
                <animateMotion dur="${newDur.gridMainToGridHouse}s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                  <mpath xlink:href="#grid-main-house" />
                </animateMotion>
              </circle>\`
            : ""}
        </svg>
      </div>`
    : "";
};
```

**Confidence:** HIGH — directly derived from existing flow file patterns.

### Pattern 4: gridMain Object in render()

Mirrors the `grid` object construction in `power-flow-card-plus.ts`. The `gridMain` object is built after `grid` using the same field pattern.

```typescript
const gridMainConfig = (entities.grid as any)?.main;

const gridMain = {
  entity: gridMainConfig?.entity,
  has: gridMainConfig?.entity !== undefined,
  hasReturnToGrid: typeof gridMainConfig?.entity === "string" || !!gridMainConfig?.entity?.production,
  state: {
    fromGridMain: getGridMainConsumptionState(this.hass, this._config),
    toGridMain: getGridMainProductionState(this.hass, this._config),
  },
  powerOutage: {
    has: gridMainConfig?.power_outage?.entity !== undefined,
    isOutage:
      (gridMainConfig && this.hass.states[gridMainConfig.power_outage?.entity]?.state) ===
      (gridMainConfig?.power_outage?.state_alert ?? "on"),
    icon: gridMainConfig?.power_outage?.icon_alert || "mdi:transmission-tower-off",
    name: gridMainConfig?.power_outage?.label_alert ?? html`Power<br />Outage`,
    entityGenerator: gridMainConfig?.power_outage?.entity_generator,
  },
  icon: computeFieldIcon(this.hass, gridMainConfig, "mdi:transmission-tower"),
  name: computeFieldName(this.hass, gridMainConfig, "Grid Main"),
  // ... color, secondary, tap_action same pattern as grid
};
```

**Confidence:** HIGH — mechanical parallel of grid object.

### Pattern 5: Middle Row Rendering with gridMain slot

The existing middle row:
```typescript
<div class="row">
  ${grid.has ? gridElement(...) : html`<div class="spacer"></div>`}
  <div class="spacer"></div>
  ${!entities.home?.hide ? homeElement(...) : html`<div class="spacer"></div>`}
</div>
```

With grid_main added to the left:
```typescript
<div class="row">
  ${gridMain.has ? gridMainElement(...) : html`<div class="spacer"></div>`}
  ${grid.has ? gridElement(...) : html`<div class="spacer"></div>`}
  <div class="spacer"></div>
  ${!entities.home?.hide ? homeElement(...) : html`<div class="spacer"></div>`}
</div>
```

The `spacer` div uses `width: var(--size-circle-entity)` (80px) which matches a circle-container's width. When `gridMain.has` is false, the spacer keeps layout identical to today — GRID-05 is satisfied automatically.

**Note:** Adding a 4th column to the row may push the `max-width: 470px` (on `.row`) into overflow for narrow cards. This is flagged as a known concern in STATE.md (the `isCardWideEnough` 420px threshold). At Phase 2 scope, no layout width adjustment is required — Phase 5 handles polish. However the planner should be aware that very narrow cards may look crowded.

**Confidence:** HIGH for the logic pattern; MEDIUM for the visual outcome at narrow widths (Phase 5 concern per STATE.md).

### Pattern 6: Top Row nonFossil Placement

Current top row:
```typescript
${nonFossilElement(this, this._config, { entities, grid, newDur, nonFossil, templatesObj })}
${solar.has ? solarElement(...) : ...}
${individualFieldLeftTop ? ... : html`<div class="spacer"></div>`}
```

When `gridMain.has`, the non-fossil bubble must shift left to align with grid_main (which is left of grid_house in the middle row). The existing `nonFossilElement` renders at the leftmost slot of the top row because it is the first element. When grid_main is added to the middle row, the top row left slot already corresponds to the position above grid_main — so the nonFossilElement stays first in the top row and shifts left implicitly via flex layout.

The key question: does the existing flex layout keep the non-fossil bubble aligned with grid_main when a 4th column exists in the middle row?

**Finding (HIGH confidence):** The top row and middle row are sibling `.row` divs with `display: flex; justify-content: space-between`. When both rows have the same number of items, the columns align automatically. Today: top row has [nonFossil | solar | indivLeft | (indivRight?)] and middle row has [grid | spacer | home | (spacer?)]. When grid_main is added, middle row gains one slot on the left — top row's nonFossil element is already in the leftmost position, so it will align with grid_main without any extra HTML changes. No new wrapper or positioning needed.

The downward SVG connector in `nonFossilElement` (`M40 -10 v40`) points straight down from the bubble to the node below. Since the nonFossil bubble is already rendered in the leftmost top-row slot, when grid_main occupies the leftmost middle-row slot, the connector points to grid_main correctly.

**Confidence:** HIGH — pure flex alignment, no positioning hacks needed.

### Anti-Patterns to Avoid

- **Do not add grid_main state to the energy balance formula.** `totalHomeConsumption` must stay as `grid.state.toHome + solar.state.toHome + battery.state.toHome`. Adding `gridMain.state.fromGridMain` here would double-count (BAL-01).
- **Do not use `isEntityInverted(config, "grid")` for grid_main.** That function does `config.entities["grid"]?.invert_state`, which on `GridEntities` (no top-level `invert_state`) returns `undefined` → `false`. The grid_main resolvers must read `!!gridMainConfig?.invert_state` directly.
- **Do not change `GridObject` type for grid_main.** Grid_main uses its own plain object shape with `fromGridMain`/`toGridMain` keys. Reusing `GridObject` would require adding the new keys to the type, which is unnecessary.
- **Do not add `gridMainToGridHouse` flow to the `flowElement` aggregate.** The flow sits between two middle-row nodes; it uses the same `.lines` positioning as other flows. It must be added to `flowElement`'s index.ts export and called from `flowElement`.
- **Do not skip the `gridMain.has` guard in every conditional.** The flow line, the component slot, the `newDur.gridMainToGridHouse` computation, and the `nonFossil` positioning shift must all be gated on `gridMain.has`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bidirectional animation direction | Custom animation logic | `keyPoints="1;0" keyTimes="0;1"` on `<animateMotion>` | Already used in `batteryGrid.ts` for reverse direction |
| Conditional dot display | Custom visibility logic | `checkShouldShowDots(config)` + state value truthy check | Already abstracted; handles `disable_dots` config |
| Watts display formatting | Custom number formatting | `displayValue(hass, config, value, {...})` | Handles kW threshold, unit, decimals, whitespace |
| Line visibility | Custom display check | `showLine(config, power)` | Handles `display_zero_lines.mode` |
| Line styling (grey/transparent) | Custom CSS class logic | `styleLine(power, config)` | Handles all zero-line modes |
| Icon resolution | Direct icon string | `computeFieldIcon(hass, gridMainConfig, fallback)` | Handles `use_metadata`, custom icon, fallback |
| Name resolution | Direct name string | `computeFieldName(hass, gridMainConfig, fallback)` | Handles `use_metadata`, custom name, fallback |

---

## Common Pitfalls

### Pitfall 1: isEntityInverted breaks for grid_main

**What goes wrong:** Calling `isEntityInverted(config, "grid")` inside the new `getGridMainConsumptionState` returns `false` always because `config.entities["grid"]` is now `GridEntities` (no `invert_state` field).
**Why it happens:** `isEntityInverted` indexes into `config.entities` by `EntityType` string, then reads `.invert_state`. `GridEntities` has no `.invert_state` — it has `.house` and `.main`.
**How to avoid:** In grid_main state resolvers, read `!!((config.entities.grid as any)?.main?.invert_state)` directly instead of calling `isEntityInverted(config, "grid")`.
**Warning signs:** `invert_state: true` on grid_main config has no effect — grid consumption shows as negative.
**Note from STATE.md:** This same bug already exists for grid_house (logged as blocker `[01-01]`). Phase 2 should fix it for grid_main at least by using direct access. Grid_house fix is also in scope — the existing `getGridConsumptionState` calls `isEntityInverted(config, "grid")` which has the same bug.

### Pitfall 2: NewDur type missing gridMainToGridHouse field

**What goes wrong:** TypeScript error when assigning `newDur.gridMainToGridHouse` in `render()`.
**Why it happens:** `NewDur` in `type.ts` does not yet have the new key.
**How to avoid:** Add `gridMainToGridHouse: number` to the `NewDur` type before any other code references it.
**Warning signs:** TypeScript compile error on the `newDur` object literal.

### Pitfall 3: Flows interface missing gridMain

**What goes wrong:** `flowGridMainToGridHouse` receives `gridMain` but the `Flows` interface in `flows/index.ts` doesn't include it, causing TypeScript errors.
**Why it happens:** The `Flows` interface is shared across all flow functions. Adding a new required field would break existing callers.
**How to avoid:** Define a local `FlowsWithGridMain` type in `gridMainToGridHouse.ts` that extends `Flows` with `gridMain: any`. Do not modify the shared `Flows` interface. The `flowElement` function passes `gridMain` only to this specific flow.

### Pitfall 4: SVG path Y coordinate mismatch

**What goes wrong:** The animated dot on the grid_main ↔ grid_house flow line appears misaligned with the circles.
**Why it happens:** `gridToHome.ts` uses `battery.has ? 50 : solar.has ? 56 : 53` for the Y coordinate. The grid_main ↔ grid_house line connects two nodes in the same row at the same Y — the path must use the same Y formula as `gridToHome.ts`.
**How to avoid:** Use `M0,${battery.has ? 50 : solar.has ? 56 : 53} H100` — identical to `gridToHome.ts`. These are middle-row nodes at the same height.
**Warning signs:** Dot appears above or below the connecting circles.

### Pitfall 5: Non-fossil bubble misalignment at narrow card widths

**What goes wrong:** When grid_main is present, the non-fossil bubble (leftmost top-row slot) does not align with grid_main (leftmost middle-row slot) because the rows have different item counts.
**Why it happens:** `justify-content: space-between` distributes items evenly. If top row has 3 items and middle row has 4 items, the spacing differs.
**How to avoid:** Ensure the top row and middle row have the same number of flex items. Use `<div class="spacer"></div>` in the top row for absent items. When `gridMain.has` is false, the middle row has one more spacer — the top row must match.
**Warning signs:** Non-fossil bubble is horizontally misaligned with the grid_house node below it in the MK8 case.

### Pitfall 6: flowElement render order

**What goes wrong:** The `gridMainToGridHouse` flow line renders on top of (or behind) other flow lines unexpectedly.
**Why it happens:** Flow lines use `position: absolute` and z-index is not explicitly managed.
**How to avoid:** Add the call to `flowGridMainToGridHouse` first in `flowElement` (before `flowGridToHome`) so it is visually behind the main grid-to-home line if they overlap.

---

## Code Examples

### Verified: Existing grid_house state resolver (source to fork from)

```typescript
// src/states/raw/grid.ts (as of Phase 1)
export const getGridConsumptionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridHouse = (config.entities.grid as any)?.house;
  const entity = gridHouse?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    if (isEntityInverted(config, "grid")) return onlyPositive(state);  // NOTE: bug for GridEntities
    return onlyNegative(state);
  }
  return getEntityStateWatts(hass, (entity as { production: string }).production);
};
```

### Verified: animateMotion reverse direction pattern (from batteryGrid.ts)

```typescript
// keyPoints="1;0" keyTimes="0;1" reverses the animation direction along the path
svg`<circle r="1" class="battery-from-grid" vector-effect="non-scaling-stroke">
  <animateMotion
    dur="${newDur.batteryGrid}s"
    repeatCount="indefinite"
    keyPoints="1;0" keyTimes="0;1"
    calcMode="linear"
  >
    <mpath xlink:href="#battery-grid" />
  </animateMotion>
</circle>`
```

### Verified: Horizontal middle-row flow line path (from gridToHome.ts)

```typescript
// Y coordinate formula for middle-row horizontal connection
d="M0,${battery.has ? 50 : solar.has ? 56 : 53} H100"
```

### Verified: Middle row rendering with conditional slot (from power-flow-card-plus.ts)

```typescript
<div class="row">
  ${grid.has
    ? gridElement(this, this._config, { entities, grid, templatesObj })
    : html`<div class="spacer"></div>`}
  <div class="spacer"></div>
  ${!entities.home?.hide
    ? homeElement(...)
    : html`<div class="spacer"></div>`}
</div>
```

### Verified: NewDur type (from type.ts — must extend)

```typescript
export type NewDur = {
  batteryGrid: number;
  batteryToHome: number;
  gridToHome: number;
  solarToBattery: number;
  solarToGrid: number;
  solarToHome: number;
  individual: number[];
  nonFossil: number;
  // ADD: gridMainToGridHouse: number;
};
```

### Verified: flowElement aggregate (from flows/index.ts — must update)

```typescript
export const flowElement = (config, { battery, grid, individual, solar, newDur }) => {
  return html`
    ${flowSolarToHome(...)}
    ${flowSolarToGrid(...)}
    ${flowSolarToBattery(...)}
    ${flowGridToHome(...)}
    ${flowBatteryToHome(...)}
    ${flowBatteryGrid(...)}
    // ADD: ${flowGridMainToGridHouse(config, { battery, grid, gridMain, individual, solar, newDur })}
  `;
};
// Also: flowElement signature needs gridMain added
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `entities.grid` flat object | `entities.grid = GridEntities { house?, main? }` | Phase 1 | Grid state now reads from `.house` sub-key; Phase 2 adds `.main` readers |
| `isEntityInverted(config, "grid")` for grid | Direct `gridConfig?.invert_state` access | Phase 1 identified bug; Phase 2 should fix | `invert_state` on Grid instances must be read from the instance, not through the GridEntities wrapper |

**Note:** `isEntityInverted` is generic and indexes `config.entities[entityType]`. For `entityType = "grid"`, this now returns a `GridEntities` object, not a `Grid` object. The `invert_state` field lives on `Grid` (inside `.house` or `.main`), not on `GridEntities`. This bug was logged in STATE.md `[01-01]` as a Phase 2 concern. The fix in Phase 2 grid_main resolvers is to read `gridMainConfig?.invert_state` directly. The grid_house resolvers have the same latent bug — Phase 2 is the right time to fix both.

---

## Open Questions

1. **nonFossil top-row slot count alignment**
   - What we know: Top row uses `display: flex; justify-content: space-between`. Current items: [nonFossil | solar | indivLeft | (indivRight?)]. Middle row: [grid | spacer | home | (rightIndivSpacer?)].
   - What's unclear: When grid_main is added to the middle row (making 4–5 items), does the top row need an explicit extra spacer to stay aligned with middle row? The rendered HTML shows the top row has a conditional `nonFossil or spacer` first item and conditional individual items. The middle row will have `gridMain or spacer` first item.
   - Recommendation: The non-fossil bubble is already the leftmost item in both cases. When `gridMain.has` is false, the spacer in that slot keeps the middle row left-aligned the same as today. When `gridMain.has` is true, both rows' leftmost slots are occupied. The visual alignment depends on total item counts matching. **The planner should include a task to verify flex alignment with a dev build before marking this complete.**

2. **invert_state fix scope in Phase 2**
   - What we know: `isEntityInverted(config, "grid")` is broken for `GridEntities`. Phase 2 must use direct access for grid_main. The same bug exists in grid_house resolvers.
   - What's unclear: Should Phase 2 fix the grid_house resolvers too (correct but slightly out of stated scope) or leave them for Phase 5?
   - Recommendation: Fix both in Phase 2. The grid_house resolvers are in the same file (`src/states/raw/grid.ts`), the fix is one-line per function, and leaving a known bug in touched code is poor practice.

3. **CSS class for grid-main circle-container**
   - What we know: Claude's Discretion. Current `.grid .circle` has `border-color: var(--circle-grid-color)`. Both grid_house and grid_main should share the same grid color styling.
   - Recommendation: Use class `grid-main` on the outer `circle-container`. Add `.grid-main .circle { border-color: var(--circle-grid-color); }` and `.grid-main ha-icon:not(.small) { color: var(--icon-grid-color); }` to `style.ts` — mirroring the existing `.grid` rules. This keeps the two nodes visually identical while preserving distinct CSS selectors for potential future differentiation.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `src/components/grid.ts` — gridElement component structure
- Direct codebase inspection: `src/components/flows/gridToHome.ts` — horizontal flow line pattern
- Direct codebase inspection: `src/components/flows/batteryGrid.ts` — bidirectional animateMotion pattern
- Direct codebase inspection: `src/components/nonFossil.ts` — non-fossil bubble component
- Direct codebase inspection: `src/states/raw/grid.ts` — Phase 1 state resolver pattern
- Direct codebase inspection: `src/power-flow-card-plus.ts` — render() structure, object construction, row layout
- Direct codebase inspection: `src/style.ts` — CSS layout rules for `.row`, `.circle-container`, `.spacer`
- Direct codebase inspection: `src/type.ts` — `NewDur`, `GridObject`, `ComboEntity` types
- Direct codebase inspection: `src/power-flow-card-plus-config.ts` — `GridEntities`, `Grid` interface

### Secondary (MEDIUM confidence)

- STATE.md blocker `[01-01]` — `isEntityInverted` bug with `GridEntities` confirmed by code inspection
- STATE.md blocker `[Research]` — SVG path coordinates for flow lines noted as MEDIUM confidence (verified pattern exists but Y-coordinate needs runtime validation)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all patterns verified from existing codebase
- Architecture: HIGH — patterns directly copied from 6 verified existing files
- Pitfalls: HIGH — 4 of 6 pitfalls confirmed by reading actual source code; 2 flagged as MEDIUM (visual alignment, SVG Y coordinate)

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable internal codebase; only invalidated by further upstream changes to the files listed above)

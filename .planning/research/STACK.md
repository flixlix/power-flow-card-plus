# Stack Research

**Domain:** Home Assistant Lovelace custom card extension (Lit/TypeScript)
**Researched:** 2026-03-02
**Confidence:** HIGH (based on full codebase analysis of power-flow-card-plus v0.2.6)

## Existing Stack (Already In Use - Do Not Change)

These are the existing technologies in the project. They are not recommendations; they are facts. New code **must** follow these exact versions and patterns.

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| TypeScript | ^4.9.5 | Type safety | `tsc --noEmit` for checking; no runtime dependency |
| Lit | ^2.2.2 | Web component framework | Uses `html` and `svg` tagged template literals |
| lit-element | ^2.4.0 | Component base class | Main card extends `LitElement` |
| Rollup | ^2.70.2 | Bundler | Single-file output; configured in `rollup.config.js` |
| superstruct | ^1.0.3 | Config validation | `cardConfigStruct` validates editor input via `assert()` |
| custom-card-helpers | ^1.9.0 | HA integration glue | `HomeAssistant`, `ActionConfig`, `fireEvent` |
| @mdi/js | ^7.2.96 | Icon paths | MDI icon constants used in editor schema |
| memoize-one | ^6.0.0 | Schema memoization | Editor schemas wrapped in `memoizeOne()` |
| Jest | ^29.7.0 | Testing | Minimal test suite (only `__tests__/i18n.test.ts`) |
| pnpm | 10.6.3 | Package manager | Enforced via `packageManager` field |

**No new runtime dependencies should be added.** The features described in PROJECT.md are achievable entirely within the existing stack.

## Patterns to Follow (Codebase-Specific)

### Pattern 1: Node State Object Construction
**Confidence:** HIGH (observed in every node in `power-flow-card-plus.ts`)
**What:** Each node (grid, solar, battery, home, nonFossil) is constructed as a plain object literal inside `render()` of the main card (lines 164-322 of `power-flow-card-plus.ts`). The object has a fixed shape with `has`, `state`, `icon`, `name`, `color`, `secondary`, `tap_action` etc.
**Why it matters for Messkonzept 8:** The new `grid_house`, `grid_main`, and `heatpump` nodes must each be constructed as similar plain objects within `render()`. Do NOT create new classes or state management abstractions -- follow the existing pattern of inline object literals with state getter functions.

```typescript
// Existing pattern (grid object, abbreviated):
const grid: GridObject = {
  entity: entities.grid?.entity,
  has: entities?.grid?.entity !== undefined,
  state: {
    fromGrid: getGridConsumptionState(this.hass, this._config),
    toGrid: getGridProductionState(this.hass, this._config),
    toBattery: initialNumericState,
    toHome: initialNumericState,
  },
  powerOutage: { /* ... */ },
  icon: computeFieldIcon(this.hass, entities.grid, "mdi:transmission-tower"),
  name: computeFieldName(this.hass, entities.grid, /* fallback */),
  // ...
};
```

**For new nodes:** Create `GridHouseObject`, `GridMainObject`, and `HeatpumpObject` types in `type.ts` following `GridObject`'s structure. Construct them in `render()` right after the existing grid object construction.

### Pattern 2: Component Element Functions (Not Classes)
**Confidence:** HIGH (all existing components follow this)
**What:** Node components are exported as plain functions returning `html` tagged template results, NOT as separate LitElement subclasses. Example: `gridElement()`, `solarElement()`, `batteryElement()`.
**Why it matters:** New `gridHouseElement()`, `gridMainElement()`, and `heatpumpElement()` must be plain exported functions, not `@customElement` classes. They receive the main card instance, config, and a destructured props object.

```typescript
// Pattern from src/components/grid.ts:
export const gridElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { entities, grid, templatesObj }: { entities: ConfigEntities; grid: any; templatesObj: TemplatesObj }
) => {
  return html`<div class="circle-container grid">...</div>`;
};
```

### Pattern 3: SVG Flow Lines with Animated Dots
**Confidence:** HIGH (6 existing flow components follow identical pattern)
**What:** Each flow line is an SVG `<path>` inside a `<div class="lines">` container. Animated dots are `<circle>` elements with `<animateMotion>` referencing the path via `<mpath>`. Visibility controlled by `showLine()`, styling by `styleLine()`, dot visibility by `checkShouldShowDots()`.

Key anatomy of a flow line:
```typescript
// From src/components/flows/gridToHome.ts:
html`<div class="lines ${classMap({ high: battery.has || checkHasBottomIndividual(individual) })}">
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
       preserveAspectRatio="xMidYMid slice" id="grid-home-flow" class="flat-line">
    <path class="grid ${styleLine(grid.state.toHome || 0, config)}"
          id="grid" d="M0,${battery.has ? 50 : solar.has ? 56 : 53} H100"
          vector-effect="non-scaling-stroke" />
    ${checkShouldShowDots(config) && grid.state.toHome
      ? svg`<circle r="1" class="grid" vector-effect="non-scaling-stroke">
          <animateMotion dur="${newDur.gridToHome}s" repeatCount="indefinite" calcMode="linear">
            <mpath xlink:href="#grid" />
          </animateMotion>
        </circle>` : ""}
  </svg>
</div>`
```

**Critical details for new flow lines:**
- **Bidirectional lines** (grid_main <-> grid_house): Use the `batteryGrid.ts` pattern which renders TWO separate `<circle>` elements on the SAME `<path>`, with opposite `keyPoints` directions (`"1;0"` vs default forward)
- **Monodirectional lines** (grid_house -> heatpump, grid_main -> heatpump): Use the simpler `gridToHome.ts` pattern with single dot
- **Duration**: Compute via `computeFlowRate()` and add new keys to `NewDur` type
- **`class="flat-line"`**: Use on horizontal paths (they get different CSS sizing); curved paths omit this class
- **`classMap` for `.lines`**: Height adjustments via `high`, `individual1-individual2`, `multi-individual` classes

### Pattern 4: State Resolution via `base.ts` Generic Functions
**Confidence:** HIGH (grid, solar, battery all use `getFieldInState`/`getFieldOutState`)
**What:** `src/states/raw/base.ts` provides `getFieldInState()` and `getFieldOutState()` that take an `EntityType` string and read `config.entities[field]`. Each node's state file (e.g. `src/states/raw/grid.ts`) is a thin wrapper calling these base functions.

**For new nodes:** The existing `EntityType` union (`"battery" | "grid" | "solar" | ...`) must be extended to include `"grid_house" | "grid_main" | "heatpump"`. However, note that `getFieldInState`/`getFieldOutState` index into `config.entities[field]`, so the new entity keys must be added to `ConfigEntities`. The heatpump is consumption-only (no production/return), so it only needs `getFieldOutState`.

### Pattern 5: Editor Schema + CONFIG_PAGES Routing
**Confidence:** HIGH (directly observed in `ui-editor.ts`)
**What:** The visual editor uses a page-per-entity pattern:
1. `CONFIG_PAGES` array maps `ConfigPage` keys to schema arrays and icons
2. `ConfigPage` type is derived from `keyof ConfigEntities | "advanced" | null`
3. Each page's schema (e.g. `gridSchema`) is an array of HA form descriptors
4. `_valueChanged()` writes entity-scoped changes as `config.entities[currentPage]`
5. `setConfig()` calls `assert(config, cardConfigStruct)` for validation

**For new editor pages:**
- Add `grid_house`, `grid_main`, `heatpump` to `ConfigEntities` type -> automatically extends `ConfigPage`
- Add entries to `CONFIG_PAGES` array with their schemas
- Create `src/ui-editor/schema/grid_house.ts`, `grid_main.ts`, `heatpump.ts`
- **Reuse** `getBaseMainConfigSchema("grid")` for grid_house/grid_main schemas (they share the battery/grid config pattern)
- Add localization keys to `en.json` and other language files

### Pattern 6: CSS Custom Properties for Dynamic Colors
**Confidence:** HIGH (observed in `style/all.ts`)
**What:** `allDynamicStyles()` sets CSS custom properties on the main element (`main.style.setProperty(...)`) for every color-related dynamic value. Static CSS in `style.ts` references these variables.

**For new nodes:** Add CSS custom properties following the naming convention:
- `--icon-grid-house-color`, `--icon-grid-main-color`, `--icon-heatpump-color`
- `--circle-grid-house-color`, `--circle-grid-main-color`, `--circle-heatpump-color`
- `--energy-heatpump-color` (new CSS variable, defaults to something like `#ff5722`)
- Add corresponding sections to `allDynamicStyles()`

### Pattern 7: Card Layout via CSS Grid Rows
**Confidence:** HIGH (observed in `render()`)
**What:** The card renders as 3 rows of `.row` divs:
1. **Top row:** nonFossil | solar | individual-left-top | individual-right-top
2. **Middle row:** grid | spacer | home | (spacer if right-individual)
3. **Bottom row:** spacer | battery | individual-left-bottom | individual-right-bottom

Flow lines are absolutely positioned SVGs overlaid on the layout. `flowElement()` renders all flow lines after the grid layout.

**For Messkonzept 8 layout:**
The grid position in middle row must split into `grid_main` and `grid_house`, or the layout must accommodate two grid nodes. Options:
- **Recommended:** Render `grid_main` in the grid's current left position and `grid_house` adjacent (possibly between grid_main and home). The heatpump renders below `grid_house` (in the bottom row, similar position to battery).
- **Flow lines overlay:** New flow SVG components added to `flowElement()` return in `src/components/flows/index.ts`

## Config Migration Strategy

### Flat `entities.grid` -> Nested `entities.grid.house` Migration
**Confidence:** HIGH (concrete pattern based on codebase analysis)

**Where to implement:** In `setConfig()` of `power-flow-card-plus.ts` (line 73-95), BEFORE the config is stored to `this._config`.

**Pattern:**
```typescript
// In setConfig(), before this._config = { ... }:
if (config.entities?.grid && !isNestedGridConfig(config.entities.grid)) {
  // Flat config detected: migrate to nested structure
  console.warn(
    "power-flow-card-plus: Flat entities.grid config is deprecated. " +
    "Please migrate to entities.grid.house. See docs for details."
  );
  config = {
    ...config,
    entities: {
      ...config.entities,
      grid: {
        house: config.entities.grid,
      },
    },
  };
}
```

**Detection heuristic:** A flat `entities.grid` has `entity` at the top level (string or ComboEntity). A nested config has `house` and/or `main` sub-keys. The discriminator:
```typescript
function isNestedGridConfig(grid: any): grid is { house?: Grid; main?: Grid } {
  return grid !== undefined && ('house' in grid || 'main' in grid);
}
```

**Superstruct validation:** The `cardConfigStruct` in `_schema-all.ts` currently uses `grid: optional(any())` for the entities.grid field. Since it's already `any()`, the nested structure will pass validation without changes. This is intentional -- the existing codebase uses `any()` for all entity sub-configs, avoiding strict struct validation at that level. **Do not tighten this to a specific struct** for grid; it would break the migration path where both flat and nested configs must pass.

**Editor migration prompt:** In `ui-editor.ts`, the editor should detect flat config and show a migration button. When clicked, fire a `config-changed` event with the restructured config. This is a UI-only concern (the card itself always auto-migrates at runtime).

### New Config Types

```typescript
// In power-flow-card-plus-config.ts:
export type ConfigEntities = {
  battery?: Battery;
  grid?: Grid | NestedGridConfig;  // Union for backward compat
  solar?: Solar;
  home?: Home;
  fossil_fuel_percentage?: FossilFuelPercentage;
  individual?: IndividualField;
  heatpump?: Heatpump;
};

interface NestedGridConfig {
  house?: Grid;
  main?: Grid;
}

interface Heatpump extends BaseConfigEntity {
  entity: string;
  cop_entity?: string;      // Entity providing COP value
  color?: string;
  color_icon?: boolean;
  color_value?: boolean;
  secondary_info?: SecondaryInfoType;
}
```

## SVG Layout Extension Approach

### New Flow Lines Required

| Flow | Direction | SVG Type | Pattern to Follow |
|------|-----------|----------|-------------------|
| grid_main <-> grid_house | Bidirectional | Curved path | `batteryGrid.ts` (two circles, one path, opposite keyPoints) |
| grid_house -> heatpump | Monodirectional (down) | Vertical path | `individualLeftTopElement.ts` inline SVG (vertical M40 path) |
| grid_main -> heatpump | Monodirectional (diagonal) | Curved path | `solarToGrid.ts` (curved M/v/c/h path) |

### SVG Path Geometry

**Confidence:** MEDIUM (geometry requires visual iteration; these are starting points)

For grid_main <-> grid_house (horizontal between two circles in the same row):
```
d="M0,50 H100"  // Straight horizontal, class="flat-line"
```

For grid_house -> heatpump (vertical downward, similar to nonFossil/individual inline):
```
d="M40 -10 v50"  // Vertical, rendered as inline SVG below the circle
```

For grid_main -> heatpump (diagonal, from left circle to lower-right circle):
```
d="M45,0 v15 c0,30 10,30 30,30 h20"  // Curved path (mirror of batteryGrid)
```

### Duration/Animation Keys to Add to `NewDur`

```typescript
export type NewDur = {
  // ... existing keys ...
  gridMainToHouse: number;   // Duration for bidirectional grid_main<->grid_house flow
  gridHouseToHeatpump: number;  // Duration for grid_house->heatpump flow
  gridMainToHeatpump: number;   // Duration for grid_main->heatpump flow
};
```

Compute these via `computeFlowRate(config, power, totalLines)` just like existing durations.

### Rendering Order

**Confidence:** HIGH

The `flowElement()` function in `src/components/flows/index.ts` renders all flow lines in a single `html` template. New flow lines MUST be added AFTER the existing 6 flows to avoid breaking z-index stacking:

```typescript
export const flowElement = (config, flows) => {
  return html`
    ${flowSolarToHome(config, flows)}
    ${flowSolarToGrid(config, flows)}
    ${flowSolarToBattery(config, flows)}
    ${flowGridToHome(config, flows)}
    ${flowBatteryToHome(config, flows)}
    ${flowBatteryGrid(config, flows)}
    <!-- NEW: Add after existing flows -->
    ${flowGridMainToHouse(config, flows)}
    ${flowGridHouseToHeatpump(config, flows)}
    ${flowGridMainToHeatpump(config, flows)}
  `;
};
```

## What NOT to Do

| Avoid | Why | Do Instead |
|-------|-----|------------|
| Creating LitElement subclasses for new nodes | Existing nodes are plain functions, not custom elements; mixing patterns causes rendering inconsistencies | Export plain functions from `src/components/` |
| Tightening superstruct validation for `entities.grid` | The `any()` validator allows both flat and nested configs to pass; strictifying breaks migration | Keep `grid: optional(any())` in `cardConfigStruct` |
| Modifying the existing `GridObject` type to hold both meters | `GridObject` is deeply coupled to existing flows, styles, and energy balance calculations | Create separate `GridHouseObject` and `GridMainObject` types |
| Adding new npm dependencies for SVG animation | SVG `<animateMotion>` is natively supported and already used throughout | Use the same SVG animation pattern |
| Changing the energy balance calculation order | The grid/solar/battery balance logic (lines 344-408 of main card) is fragile and carefully ordered | Add heatpump energy calculations AFTER the existing balance, treating heatpump consumption as a known value read from its entity |
| Breaking `ConfigPage` type derivation | `ConfigPage` is `keyof ConfigEntities | "advanced" | null` -- adding to `ConfigEntities` auto-extends it | Just add new keys to `ConfigEntities`; no manual `ConfigPage` changes needed |
| Rendering flow lines before node circles | Flow lines are absolutely positioned; they must render AFTER the layout rows to overlay correctly | Append new flows in `flowElement()` after existing ones |
| Using a separate CSS file for new node styles | All styles live in `src/style.ts` as a single `css` tagged template | Add new CSS rules to the existing `styles` constant |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Lit ^2.2.2 | TypeScript ^4.9.5 | Lit 2 works with TS 4.x; do not upgrade to Lit 3 (breaking changes) |
| superstruct ^1.0.3 | Custom-card-helpers ^1.9.0 | Both use superstruct v1 API; `assert()`, `optional()`, `any()` |
| @mdi/js ^7.2.96 | Any | Check for `mdiHeatPump` icon availability; fallback `mdi:heat-pump` |

## Localization Keys to Add

Add to `src/localize/languages/en.json` (and mirror to all 16 language files):

```json
{
  "editor": {
    "grid_house": "Grid (House)",
    "grid_main": "Grid (Main)",
    "heatpump": "Heat Pump",
    "cop_entity": "COP Entity",
    "migrate_grid": "Migrate Grid Config"
  }
}
```

## Testing Strategy

**Confidence:** MEDIUM (existing test coverage is minimal -- only i18n)

The existing test suite has a single test file (`__tests__/i18n.test.ts`). The precommit script runs `pnpm typecheck && pnpm format:write && pnpm test`. Priority for new tests:

1. **Config migration logic** (highest priority): Unit test that flat `entities.grid` config is correctly transformed to `entities.grid.house`
2. **State resolution**: Test that `getGridHouseConsumptionState` and `getGridMainConsumptionState` correctly read from nested config paths
3. **`isNestedGridConfig` discriminator**: Edge cases -- empty grid, grid with unexpected keys, grid with both flat and nested

These are pure-function tests (no DOM needed), runnable with the existing Jest setup.

## Sources

- Direct codebase analysis of `power-flow-card-plus` v0.2.6 (all files read and cross-referenced) -- HIGH confidence
- `package.json` for exact dependency versions -- HIGH confidence
- SVG path geometry is estimated (not visually tested) -- MEDIUM confidence
- Heatpump icon availability (`mdi:heat-pump`) -- MEDIUM confidence (exists in MDI 7.x)

---
*Stack research for: power-flow-card-plus Messkonzept 8 extension*
*Researched: 2026-03-02*

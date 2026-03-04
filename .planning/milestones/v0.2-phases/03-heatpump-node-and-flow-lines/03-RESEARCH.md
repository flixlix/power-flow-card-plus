# Phase 3: Heatpump Node and Flow Lines - Research

**Researched:** 2026-03-02
**Domain:** Lit HTML custom card component extension (heatpump node + SVG flow lines)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Layout position**
- Heatpump node goes in the **existing bottom row**, positioned visually centered between the grid_main and grid_house columns
- The bottom row becomes: `[spacer] | [heatpump] | [battery] | [individual-left-bottom]`
- Heatpump is inserted between the spacer and battery — no new row needed, battery stays in its current slot
- When only heatpump is present (no battery), heatpump occupies the same slot pattern

**Flow line geometry and style**
- Both flow lines use the **curved SVG style** (like existing battery/solar lines) — not the flat-line style used by gridMain→gridHouse
- `grid_house → heatpump`: curved line arcing down from grid_house to the centered heatpump below
- `grid_main → heatpump`: curved line arcing down-right from grid_main to the centered heatpump (diagonal)
- The visual arrangement forms a triangle: grid_main and grid_house at top, heatpump at the apex below between them

**Home balance (BAL-02)**
- **No auto-subtraction** — the home entity is expected to already exclude heatpump consumption
- No card logic change to the home calculation; heatpump is treated like any external consumer
- This matches Option B from discussion: user configures their home entity accordingly

**COP display format**
- COP displayed as a `<span>` inside the heatpump circle — same pattern as `state_of_charge` in battery element
- **1 decimal place** (e.g. "COP 3.2")
- **Hidden entirely** when COP entity is unavailable or unknown (not "--", just hidden)
- The COP label is prefixed with "COP " (e.g. "COP 3.2")
- Click behavior: fully configurable `tap_action` like all other entities; defaults to opening the COP entity if no tap_action configured

**Flow line visibility**
- Follows existing `showLine` util + `display_zero_lines` config (HP-07)
- Each line independently hides/greys based on its sensor value (0W = hidden or greyed per config)
- `flow_from_grid_house` and `flow_from_grid_main` are separate optional sensors — if an entity is not configured, no line is drawn for that direction

**NewDur entries**
- Two new duration fields added to `NewDur`: `heatpumpFromGridHouse` and `heatpumpFromGridMain`
- Flow rates computed from the respective sensor values

### Claude's Discretion
- Exact SVG path geometry for the two curved lines (shape of arcs, control points)
- CSS class names for heatpump element and flow lines
- Exact positioning of heatpump node within the bottom row to achieve visual centering between grid columns
- Default icon for heatpump node (`mdi:heat-pump` or similar)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HP-01 | Heatpump node renders below `grid_house` | Bottom row layout pattern confirmed in render(); heatpump slots between spacer and battery |
| HP-02 | Heatpump displays power consumption from configured HA entity | `getEntityStateWatts` pattern from grid/battery state resolvers; `HeatpumpEntity.entity` field already defined |
| HP-03 | COP displayed as "COP [value]" label, using dedicated configurable HA sensor | `getBatteryStateOfCharge` + `displayValue` pattern; `HeatpumpEntity.cop` field already defined; `getEntityState` returns null when unavailable |
| HP-04 | COP label hidden when COP entity is unavailable/unknown — no crash | `getEntityState` returns null on unavailable; conditional render `!== null` prevents crash; no `--` needed, just omit |
| HP-05 | Animated monodirectional flow line from `grid_house` → heatpump | New flow file; `showLine()` + `styleLine()` + `checkShouldShowDots()` utils reused; `HeatpumpEntity.flow_from_grid_house` entity field available |
| HP-06 | Animated monodirectional flow line from `grid_main` → heatpump | Same pattern as HP-05; `HeatpumpEntity.flow_from_grid_main` entity field available |
| HP-07 | Each heatpump flow line hides when sensor = 0W; respects `display_zero_lines` | `showLine(config, power)` already handles this; `styleLine(power, config)` handles grey/transparency modes |
| BAL-02 | Heatpump consumption does not double-count in home node total | No card logic change needed — user's home entity is already configured to exclude heatpump; BAL-01 formula (grid.state.toHome + solar + battery) stays unchanged |
</phase_requirements>

---

## Summary

Phase 3 adds a heatpump node to the card's bottom row with two curved animated flow lines (from grid_house and from grid_main). The codebase is well-structured with clear precedents for everything needed: battery.ts provides the COP-display template, gridMainToGridHouse.ts provides the flow-line template, and the render() function in power-flow-card-plus.ts shows exactly how to construct objects and slot elements into the bottom row.

The key implementation work is: (1) a new `heatpumpElement` component mirroring battery.ts with a COP span instead of state-of-charge, (2) two new flow files (`gridHouseToHeatpump.ts` and `gridMainToHeatpump.ts`) using curved SVG paths, (3) a state resolver at `src/states/raw/heatpump.ts` following the battery/grid pattern, (4) two new `NewDur` fields in `src/type.ts`, and (5) wiring everything into render() and flowElement(). BAL-02 requires zero code change — the home balance formula is untouched because the user's home entity already excludes heatpump consumption.

The only discretionary area is the exact SVG path geometry for the two new curved lines. The existing curved paths (`batteryToHome`, `batteryGrid`, `solarToHome`) all use cubic bezier curves in a 100x100 viewBox with the SVG coordinate system where Y=0 is top. The heatpump lines will need paths that arc downward from the grid nodes (positioned in the middle row) to the heatpump node (positioned in the bottom row below and between them).

**Primary recommendation:** Build heatpump.ts as a direct clone of battery.ts with COP replacing state_of_charge, then build flow files cloning batteryGrid.ts curved-path pattern, then wire into render() following the gridMain pattern from Phase 2.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | (project dep) | HTML template rendering via `html`, `svg` tagged templates | All components use Lit; no alternative |
| lit/directives/class-map.js | (project dep) | Conditional CSS class assignment on elements | Used by every flow file for `.high`, `.multi-individual` classes |
| custom-card-helpers | (project dep) | `HomeAssistant` type, `ActionConfig` type | All state resolvers use these types |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mdi/js | 7.x | Icon constants | `mdiHeatPump` constant verified to exist; MDI string is `mdi:heat-pump` |
| superstruct | (project dep) | Config validation in `_schema-all.ts` | Already includes `heatpump` in cardConfigStruct — no changes needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Curved SVG paths (cubic bezier) | Straight line (flat-line style) | CONTEXT.md locks curved style; flat-line is for the horizontal meter-to-meter connection only |
| `getEntityState` for COP (returns numeric or null) | `getEntityStateWatts` | COP is dimensionless ratio, not watts — use `getEntityState` not `getEntityStateWatts` |

**Installation:** No new packages needed. All required libraries are already in the project.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── heatpump.ts               # NEW: heatpump node element (mirrors battery.ts)
│   └── flows/
│       ├── gridHouseToHeatpump.ts  # NEW: curved flow line, grid_house → heatpump
│       ├── gridMainToHeatpump.ts   # NEW: curved flow line, grid_main → heatpump
│       └── index.ts              # MODIFY: add imports + calls for new flows, add heatpump? to Flows interface
├── states/raw/
│   └── heatpump.ts               # NEW: state resolvers for heatpump power, COP, flow sensors
├── type.ts                       # MODIFY: add heatpumpFromGridHouse + heatpumpFromGridMain to NewDur
└── power-flow-card-plus.ts       # MODIFY: construct heatpump object, slot into bottom row, compute NewDur entries
```

### Pattern 1: Node Element Component (follows battery.ts)

**What:** A function `(main, config, { heatpump, entities }) => html\`...\`` that renders the circle-container div.
**When to use:** All node elements follow this pattern — no classes, just plain functions.
**Example:**
```typescript
// Source: src/components/battery.ts (verified in codebase)
export const heatpumpElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { heatpump, entities }: { heatpump: any; entities: ConfigEntities }
) => {
  return html`<div class="circle-container heatpump">
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, entities.heatpump?.tap_action, entities.heatpump?.entity);
      }}
    >
      ${heatpump.cop.state !== null
        ? html`<span id="heatpump-cop-text">
            COP ${displayValue(main.hass, config, heatpump.cop.state, {
              unit: "",
              unitWhiteSpace: false,
              decimals: 1,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : null}
      <ha-icon id="heatpump-icon" .icon=${heatpump.icon} />
      <span class="consumption">
        ${displayValue(main.hass, config, heatpump.state, { ... })}
      </span>
    </div>
    <span class="label">${heatpump.name}</span>
  </div>`;
};
```

**Key detail for COP:** `displayValue` for COP should use `unit: ""` and `unitWhiteSpace: false` (or `unit: undefined` and pass the raw decimal value pre-formatted) — COP is a ratio like 3.2, not watts. The `decimals: 1` override forces one decimal.

**Key detail for COP hide:** The COP span is wrapped in `heatpump.cop.state !== null` conditional — `getEntityState` returns `null` when the entity is unavailable/unknown, so this naturally hides the span with no extra logic.

### Pattern 2: Curved Flow Line (follows batteryGrid.ts / batteryToHome.ts)

**What:** A flow function that renders a `<div class="lines">` with an SVG containing a curved `<path>` and an `<animateMotion>` dot.
**When to use:** Any flow that connects nodes not on the same horizontal level (non-flat).
**Example:**
```typescript
// Source: src/components/flows/batteryGrid.ts (verified in codebase)
// SVG viewBox is always "0 0 100 100" — coordinates are in that space.
// batteryGrid path: "M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20"
// batteryToHome path: "M55,100 v-${grid.has ? 15 : 17} c0,-30 10,-30 30,-30 h20"
// solarToHome path: "M${battery.has ? 55 : 53},0 v15 c0,30 10,30 30,30 h25"
```

**For heatpump flow lines:** The heatpump node is in the bottom row (Y ≈ 100 in SVG space). Grid nodes are in the middle row (Y ≈ 50). Grid house is to the right; grid main is to the left.
- `gridHouseToHeatpump`: starts at grid_house position (right side, Y ≈ 50) and arcs down-left to heatpump (center-ish, Y ≈ 100). Approximate path: `"M100,50 v15 c0,20 -20,20 -40,20 h-15"` — exact values need visual tuning.
- `gridMainToHeatpump`: starts at grid_main position (left side, Y ≈ 50) and arcs down-right to heatpump. Approximate path: `"M0,50 v15 c0,20 20,20 40,20 h15"` — exact values need visual tuning.

**Monodirectional:** Only one animated dot per line (no reverse dot). `keyPoints` / `keyTimes` reversal only used for bidirectional flows.

### Pattern 3: State Resolver Module (follows src/states/raw/battery.ts)

**What:** A standalone module in `src/states/raw/` that exports individual getter functions. Each function takes `(hass, config)` and returns `number | null`.
**When to use:** All state resolution lives in these files, not inline in render().
**Example:**
```typescript
// Source: src/states/raw/battery.ts (verified in codebase)
// For heatpump power (watts):
export const getHeatpumpState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number => {
  const entity = config.entities.heatpump?.entity;
  if (!entity) return 0;
  return getEntityStateWatts(hass, entity);
};

// For COP (dimensionless ratio — use getEntityState, not getEntityStateWatts):
export const getHeatpumpCopState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number | null => {
  const entity = config.entities.heatpump?.cop;
  if (!entity) return null;
  return getEntityState(hass, entity); // returns null when unavailable
};

// For flow sensors (watts, same as power):
export const getHeatpumpFlowFromGridHouseState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number => {
  const entity = config.entities.heatpump?.flow_from_grid_house;
  if (!entity) return 0;
  return getEntityStateWatts(hass, entity);
};

export const getHeatpumpFlowFromGridMainState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number => {
  const entity = config.entities.heatpump?.flow_from_grid_main;
  if (!entity) return 0;
  return getEntityStateWatts(hass, entity);
};
```

### Pattern 4: Bottom Row Condition in render()

**What:** The bottom row only renders when `battery.has || checkHasBottomIndividual(individualObjs)`. Adding the heatpump requires extending this condition.
**When to use:** The bottom row div wraps in a conditional — the condition must include `heatpump.has`.
**Example:**
```typescript
// Source: src/power-flow-card-plus.ts lines 714-737 (verified in codebase)
// Current condition:
${battery.has || checkHasBottomIndividual(individualObjs)
  ? html`<div class="row">
      <div class="spacer"></div>
      ${battery.has ? batteryElement(...) : html`<div class="spacer"></div>`}
      ...
    </div>`
  : html`<div class="spacer"></div>`}

// Modified condition (heatpump triggers bottom row too):
${battery.has || heatpump.has || checkHasBottomIndividual(individualObjs)
  ? html`<div class="row">
      <div class="spacer"></div>
      ${heatpump.has ? heatpumpElement(...) : html`<div class="spacer"></div>`}
      ${battery.has ? batteryElement(...) : html`<div class="spacer"></div>`}
      ...
    </div>`
  : html`<div class="spacer"></div>`}
```

### Pattern 5: Flows Interface Extension (follows gridMain pattern)

**What:** The `Flows` interface in `flows/index.ts` uses optional field `gridMain?: any`. New `heatpump` can be added the same way.
**Example:**
```typescript
// Source: src/components/flows/index.ts (verified in codebase)
export interface Flows {
  battery: any;
  grid: any;
  gridMain?: any;
  heatpump?: any;   // ADD THIS
  individual: IndividualObject[];
  solar: any;
  newDur: NewDur;
}
```

### Pattern 6: NewDur Type Extension

**What:** Add two new fields to the `NewDur` type in `src/type.ts` and compute them in render().
**Example:**
```typescript
// Source: src/type.ts lines 91-101 (verified in codebase)
export type NewDur = {
  batteryGrid: number;
  batteryToHome: number;
  gridToHome: number;
  solarToBattery: number;
  solarToGrid: number;
  solarToHome: number;
  individual: number[];
  nonFossil: number;
  gridMainToGridHouse: number;
  heatpumpFromGridHouse: number;   // ADD
  heatpumpFromGridMain: number;    // ADD
};
```

### Anti-Patterns to Avoid

- **Using `getEntityStateWatts` for COP:** COP is a unitless ratio (e.g. 3.5), not a watt measurement. `getEntityStateWatts` applies unit conversion (kW→W, MW→W etc.) which would corrupt the COP value. Use `getEntityState` instead.
- **Adding a new CSS row for heatpump:** CONTEXT.md locks the bottom row. No new row. Heatpump goes between spacer and battery in the existing bottom row.
- **Using flat-line SVG style for heatpump flows:** CONTEXT.md locks curved style. Do not add `class="flat-line"` to heatpump flow SVGs.
- **Double-rendering heatpump in totalHomeConsumption:** BAL-02 is a no-op. Do NOT subtract heatpump from totalHomeConsumption. The formula `grid.state.toHome + solar + battery` stays unchanged.
- **Rendering COP as "--" when unavailable:** CONTEXT.md locks "hidden entirely" when unavailable. The `getEntityState` null return + conditional render achieves this without any special string.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flow line visibility / zero handling | Custom zero-check logic | `showLine(config, power)` in `src/utils/showLine.ts` | Already handles all three `display_zero_lines` modes: hide, grey_out, transparency |
| Flow line grey/transparency CSS class | Custom class logic | `styleLine(power, config)` in `src/utils/styleLine.ts` | Returns correct CSS class string for current display mode |
| Animated dot presence check | `config.disable_dots !== true` inline | `checkShouldShowDots(config)` in `src/utils/checkShouldShowDots.ts` | Centralised config flag |
| Flow rate computation | Custom formula | `computeFlowRate(config, value, totalLines)` in `src/utils/computeFlowRate.ts` | Handles old/new flow rate model selection transparently |
| Entity state in watts | `hass.states[id].state` inline | `getEntityStateWatts(hass, entity)` in `src/states/utils/getEntityStateWatts.ts` | Handles kW/MW/GW unit conversion; returns 0 on null |
| Entity state as number | `Number(hass.states[id].state)` | `getEntityState(hass, entity)` in `src/states/utils/getEntityState.ts` | Returns null on unavailable; handles multi-entity syntax |
| Icon/name resolution | `config.entities.heatpump?.icon ?? fallback` | `computeFieldIcon(hass, field, fallback)` / `computeFieldName(...)` in `src/utils/computeFieldAttributes.ts` | Handles `use_metadata` flag (reads HA entity attributes) |
| COP decimal formatting | Custom `toFixed(1)` call | `displayValue(main.hass, config, value, { decimals: 1, unit: "", unitWhiteSpace: false })` | Localised number formatting via HA locale; consistent with rest of card |

**Key insight:** Every utility needed for heatpump already exists and is battle-tested in the project. The implementation is primarily assembly work, not new logic.

---

## Common Pitfalls

### Pitfall 1: COP entity returns null — crash if not guarded

**What goes wrong:** COP entity may be unavailable/unknown at any time. If the span renders without null guard, the template tries to format `null` through `displayValue` which returns `"0"` rather than hiding — or calling code crashes with undefined.
**Why it happens:** `getEntityState` returns `null` for unavailable entities (by design). Battery's `state_of_charge.state !== null` guard is the pattern.
**How to avoid:** In heatpump.ts, wrap the COP span: `${heatpump.cop.state !== null ? html\`<span>...\` : null}`. Exactly mirrors line 39 of battery.ts.
**Warning signs:** COP showing "0" or "0 " instead of being hidden — the `null` guard is missing or wrong.

### Pitfall 2: SVG path geometry for heatpump flow lines needs visual iteration

**What goes wrong:** The SVG 100x100 viewBox coordinates depend on the relative positions of nodes. Grid nodes are in the middle row; heatpump is in the bottom row. The exact Y-coordinates and curve control points affect whether lines connect visually correctly.
**Why it happens:** Node positions in the rendered HTML don't map 1:1 to SVG coordinates — the `.lines` div is `position: absolute` and sized/positioned relative to the card layout. Existing paths were tuned empirically.
**How to avoid:** Start with paths derived from `batteryToHome` (which also goes from middle-row to bottom-row) as a reference: `"M55,100 v-15 c0,-30 10,-30 30,-30 h20"`. Adapt the horizontal starting points and arc directions. Expect one visual iteration pass.
**Warning signs:** Lines don't visually connect to nodes, or arcs look asymmetric.

### Pitfall 3: Bottom row condition not updated for heatpump-only case

**What goes wrong:** If only heatpump is configured (no battery, no bottom individual), the bottom row never renders because the current condition is `battery.has || checkHasBottomIndividual(...)`.
**Why it happens:** The bottom row condition must be extended to include `heatpump.has`.
**How to avoid:** Change the condition to `battery.has || heatpump.has || checkHasBottomIndividual(individualObjs)`.
**Warning signs:** Heatpump node never appears in the card even when `entities.heatpump.entity` is configured.

### Pitfall 4: Flows interface type mismatch if `heatpump` not optional

**What goes wrong:** `flowElement` is called from many places; adding a required `heatpump` field to `Flows` would break all existing call sites.
**Why it happens:** TypeScript strict checks catch this, but it's easy to forget the `?` optional marker.
**How to avoid:** Add `heatpump?: any` (optional) to the `Flows` interface, then guard in `flowElement` body: `${heatpump ? flowGridHouseToHeatpump(...) : ""}`. Mirrors the existing `gridMain` pattern exactly.
**Warning signs:** TypeScript errors at flowElement call sites after adding heatpump.

### Pitfall 5: Using wrong getEntityState variant for flow sensors

**What goes wrong:** Using `getEntityState` (returns dimensionless number) for heatpump power/flow sensors instead of `getEntityStateWatts` — would mishandle kW-unit sensors (e.g. if HA entity reports in kW, the value would be 1000x too small).
**Why it happens:** COP uses `getEntityState` (COP is dimensionless); power sensors must use `getEntityStateWatts`.
**How to avoid:** `heatpump.state` (power) and flow sensor states → `getEntityStateWatts`. `heatpump.cop.state` → `getEntityState`. The distinction matches the battery pattern: `getBatteryStateOfCharge` uses `getEntityState`, `getBatteryInState` uses `getEntityStateWatts`.
**Warning signs:** Heatpump power displaying 1000x too small when entity unit is kW.

---

## Code Examples

Verified patterns from official codebase sources:

### COP Span Pattern (from battery.ts state_of_charge)

```typescript
// Source: src/components/battery.ts lines 39-58 (verified)
// Adapt for COP: replace state_of_charge entity/state/unit with cop entity/state
${battery.state_of_charge.state !== null && entities.battery?.show_state_of_charge !== false
  ? html` <span
      @click=${(e) => { main.openDetails(e, entities.battery?.tap_action, entities.battery?.state_of_charge!); }}
      id="battery-state-of-charge-text"
    >
      ${displayValue(main.hass, config, battery.state_of_charge.state, {
        unit: battery.state_of_charge.unit ?? "%",
        unitWhiteSpace: battery.state_of_charge.unit_white_space,
        decimals: battery.state_of_charge.decimals,
        accept_negative: true,
        watt_threshold: config.watt_threshold,
      })}
    </span>`
  : null}
```

**For heatpump COP, the unit is empty string `""` or a custom unit — never `%`. The COP prefix "COP " must be added in the template, not through `displayValue` unit parameter:**
```typescript
html`<span id="heatpump-cop-text">COP ${displayValue(main.hass, config, heatpump.cop.state, {
  unit: "",
  unitWhiteSpace: false,
  decimals: 1,
  watt_threshold: config.watt_threshold,
})}</span>`
```

### Curved Flow Line Structure (from batteryGrid.ts)

```typescript
// Source: src/components/flows/batteryGrid.ts (verified)
// batteryGrid path (bottom-left arc): "M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20"
// batteryToHome path (bottom-right arc): "M55,100 v-${grid.has ? 15 : 17} c0,-30 10,-30 30,-30 h20"
// These are CURVED (non-flat). The flow SVG does NOT have class="flat-line".

export const flowGridHouseToHeatpump = (config, { battery, grid, heatpump, individual, solar, newDur }) => {
  const showHpLine = showLine(config, heatpump.flowFromGridHouse);
  return heatpump.has && grid.has && showHpLine
    ? html`<div class="lines ${classMap({ high: battery.has || checkHasBottomIndividual(individual), ... })}">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="grid-house-heatpump-flow">
          <path
            id="grid-house-heatpump"
            class="heatpump ${styleLine(heatpump.flowFromGridHouse || 0, config)}"
            d="M...,... ..."    <!-- visual tuning required -->
            vector-effect="non-scaling-stroke"
          ></path>
          ${checkShouldShowDots(config) && heatpump.flowFromGridHouse
            ? svg`<circle r="1" class="heatpump" vector-effect="non-scaling-stroke">
                <animateMotion dur="${newDur.heatpumpFromGridHouse}s" repeatCount="indefinite" calcMode="linear">
                  <mpath xlink:href="#grid-house-heatpump" />
                </animateMotion>
              </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};
```

### NewDur Computation in render()

```typescript
// Source: src/power-flow-card-plus.ts lines 542-556 (verified)
// Existing pattern:
gridMainToGridHouse: computeFlowRate(
  this._config,
  Math.max(gridMain.state.fromGridMain ?? 0, gridMain.state.toGridMain ?? 0),
  totalLines
),

// New heatpump entries (monodirectional — no Math.max needed):
heatpumpFromGridHouse: computeFlowRate(this._config, heatpump.flowFromGridHouse ?? 0, totalLines),
heatpumpFromGridMain: computeFlowRate(this._config, heatpump.flowFromGridMain ?? 0, totalLines),
```

### Heatpump Object Construction in render()

```typescript
// Source pattern: src/power-flow-card-plus.ts gridMain object construction (verified, lines 217-264)
const heatpumpConfig = entities.heatpump;
const heatpump = {
  entity: heatpumpConfig?.entity,
  has: heatpumpConfig?.entity !== undefined,
  state: getHeatpumpState(this.hass, this._config),      // watts via getEntityStateWatts
  cop: {
    state: getHeatpumpCopState(this.hass, this._config), // null when unavailable
  },
  flowFromGridHouse: getHeatpumpFlowFromGridHouseState(this.hass, this._config), // watts
  flowFromGridMain: getHeatpumpFlowFromGridMainState(this.hass, this._config),   // watts
  icon: computeFieldIcon(this.hass, heatpumpConfig, "mdi:heat-pump"),
  name: computeFieldName(this.hass, heatpumpConfig, "Heat Pump"),
  tap_action: heatpumpConfig?.tap_action,
};
```

### flowElement Integration

```typescript
// Source: src/components/flows/index.ts (verified)
// Current pattern for optional gridMain:
${gridMain ? flowGridMainToGridHouse(config, { battery, grid, gridMain, individual, solar, newDur }) : ""}

// New heatpump lines (both optional, each independently guarded):
${heatpump ? flowGridHouseToHeatpump(config, { battery, grid, heatpump, individual, solar, newDur }) : ""}
${heatpump ? flowGridMainToHeatpump(config, { battery, grid, heatpump, individual, solar, newDur }) : ""}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `isEntityInverted(config, "grid")` | Read `invert_state` directly from sub-config | Phase 2 (02-01) | Phase 3 must NOT use the removed helper; read from `heatpumpConfig?.invert_state` if needed |
| Flat `entities.grid.entity` | Nested `entities.grid.house.entity` | Phase 1 | All grid access must use `.house` sub-key |
| `power-flow-card-plus` component name | `power-flow-card-cascade` | Pre-project | The custom element is registered as `power-flow-card-cascade`; logging says "Power Flow Card Cascade" |

**Confirmed working (Phase 2 complete):**
- `gridMain` object is constructed in render() and passed to `flowElement` — proven pattern for Phase 3
- `Flows` interface optional field `gridMain?: any` works without breaking existing callers
- `NewDur` extension with `gridMainToGridHouse` field works — same pattern for two new fields

---

## Open Questions

1. **SVG path geometry for heatpump flow lines**
   - What we know: Lines must be curved (non-flat), connecting middle-row grid nodes to bottom-row heatpump. The `.lines` div is absolutely positioned. Existing curved paths (batteryToHome, batteryGrid, solarToHome) are the reference.
   - What's unclear: Exact X/Y coordinates in the 100x100 viewBox that produce visually correct connections given the heatpump's position "centered between grid columns" in the bottom row. This depends on the actual rendered pixel layout.
   - Recommendation: Derive initial paths by analogy from `batteryToHome` (d="M55,100 v-15 c0,-30 10,-30 30,-30 h20") as a starting point for `gridHouseToHeatpump`, and mirror it for `gridMainToHeatpump`. Flag for one visual iteration pass in the plan.

2. **CSS styling for heatpump node circle border color**
   - What we know: Battery circle color uses `--circle-battery-color`. Grid circle uses `--cirlce-grid-color`. These are set via `allDynamicStyles`.
   - What's unclear: Whether heatpump needs a new CSS custom property for its circle border color, or whether a hardcoded default (like `var(--energy-grid-consumption-color)` in an orange/heat variant) is sufficient for Phase 3.
   - Recommendation: For Phase 3, use a CSS class `.heatpump .circle { border-color: var(--energy-grid-consumption-color, #ff9800); }` as a simple default. No dynamic style customization needed until Phase 5 polish.

3. **`checkShouldShowDots` flag context for heatpump flow elements**
   - What we know: `config.disable_dots` is a global setting. Both new flow files should use `checkShouldShowDots(config)` before rendering dot circles.
   - What's unclear: Nothing — this is definitively resolved. Both new flow files MUST call `checkShouldShowDots(config)` before each SVG circle block (confirmed from all other flow files).
   - Recommendation: No open question — confirmed pattern.

---

## Sources

### Primary (HIGH confidence)

All findings are from direct source code inspection of the project repository.

- `src/components/battery.ts` — COP span pattern (mirrors state_of_charge)
- `src/components/gridMain.ts` — Node element structure (circle-container pattern)
- `src/components/flows/batteryGrid.ts` — Curved SVG flow line template
- `src/components/flows/batteryToHome.ts` — Curved SVG flow line template
- `src/components/flows/gridMainToGridHouse.ts` — Flow file structure, flat-line vs curved distinction
- `src/components/flows/index.ts` — Flows interface, flowElement composition pattern, optional field handling
- `src/type.ts` — NewDur type definition
- `src/power-flow-card-plus-config.ts` — HeatpumpEntity interface (all four fields confirmed)
- `src/power-flow-card-plus.ts` — render() bottom row, object construction patterns, NewDur computation
- `src/states/raw/grid.ts` — State resolver pattern (getEntityStateWatts vs getEntityState distinction)
- `src/states/raw/battery.ts` — getBatteryStateOfCharge using getEntityState (null on unavailable)
- `src/states/utils/getEntityState.ts` — Returns null when entity unavailable
- `src/states/utils/getEntityStateWatts.ts` — Handles unit conversion (kW, MW, etc.)
- `src/utils/showLine.ts` — display_zero_lines hide mode
- `src/utils/styleLine.ts` — grey_out / transparency CSS class selection
- `src/utils/computeFlowRate.ts` — Flow rate computation
- `src/utils/checkShouldShowDots.ts` — disable_dots config flag
- `src/utils/displayValue.ts` — Localized value formatting; decimals override
- `src/utils/computeFieldAttributes.ts` — computeFieldIcon / computeFieldName
- `src/ui-editor/schema/_schema-all.ts` — cardConfigStruct with heatpump already validated
- `src/style.ts` — CSS for `.lines`, `.circle-container.battery`, `.row`, `.spacer`

### Secondary (MEDIUM confidence)

- `@mdi/js` node module inspection: `mdiHeatPump` constant exists → MDI icon string `mdi:heat-pump` (confirmed via `node -e "require('@mdi/js')"` in project)

### Tertiary (LOW confidence)

- SVG path coordinate values for heatpump flow lines: derived by analogy from existing paths; exact values require visual iteration.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are existing project dependencies, source-verified
- Architecture: HIGH — all patterns are direct extractions from existing source files
- Pitfalls: HIGH — derived from actual Phase 2 decisions recorded in STATE.md + direct code inspection
- SVG path geometry: LOW — exact coordinates require visual iteration; starting estimate only

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable codebase; no external library churn expected)

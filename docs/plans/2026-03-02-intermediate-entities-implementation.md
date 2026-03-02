# Intermediate Entities & 6-Column Layout — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the heatpump-specific entity with a generic `entities.intermediate[]` array (max 2) and redesign the card layout from 4 columns to an adaptive 4–6 column grid.

**Architecture:** The new `IntermediateEntity` interface (with `flowFromGridHouse`/`flowFromGridMain`/`secondary_info`) slots into col 1 of the layout — `intermediate[0]` at bottom, `intermediate[1]` at top. Column count collapses automatically based on which entities are configured. All heatpump-specific code is deleted (hard break — no migration).

**Tech Stack:** TypeScript, Lit (LitElement), SVG for flow lines, Jest for tests. Build: `pnpm build`. Test: `pnpm test`. TypeCheck: `pnpm typecheck`.

---

## Key facts for every task

- **Build:** `pnpm build` — must pass with zero TS errors before each commit.
- **Tests:** `pnpm test` — Jest, test files in `__tests__/`.
- **Path aliases:** `@/` maps to `src/` (configured in tsconfig).
- **The lines SVG** (`src/components/flows/`) uses `preserveAspectRatio="xMidYMid slice"` with `viewBox="0 0 100 100"`. Coordinates are approximate percentages — exact values need visual tuning in HA.
- **Column layout rule (new):** col 0+1 appear when `gridMain.has || intermediate[].some(.has)`; col 5 appears when `checkHasRightIndividual(individualObjs)`.

---

## Task 1: Update `src/type.ts`

**Files:**
- Modify: `src/type.ts`

**Step 1: Replace heatpump entries in `NewDur` with intermediate arrays**

Find and replace in `src/type.ts`:

OLD:
```ts
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
  heatpumpFromGridHouse: number;
  heatpumpFromGridMain: number;
};
```

NEW:
```ts
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
  intermediateFromGridHouse: number[];
  intermediateFromGridMain: number[];
};
```

**Step 2: Update `EntityType`**

OLD:
```ts
export type EntityType = "battery" | "grid" | "solar" | "individual1" | "individual2" | "home" | "fossil_fuel_percentage" | "heatpump";
```

NEW:
```ts
export type EntityType = "battery" | "grid" | "solar" | "individual1" | "individual2" | "home" | "fossil_fuel_percentage" | "intermediate";
```

**Step 3: Build to check**

```bash
pnpm build 2>&1 | head -40
```

Expected: many TS errors (other files still reference heatpump). That's fine — we'll fix them in subsequent tasks.

**Step 4: Commit**

```bash
git add src/type.ts
git commit -m "refactor: update NewDur — replace heatpump with intermediate[] arrays"
```

---

## Task 2: Update `src/power-flow-card-plus-config.ts`

**Files:**
- Modify: `src/power-flow-card-plus-config.ts`

**Step 1: Replace `HeatpumpEntity` with `IntermediateEntity`, update `ConfigEntities`**

Replace the entire file content:

```ts
import { ActionConfig } from "custom-card-helpers";
import { BaseConfigEntity, ComboEntity, GridPowerOutage, IndividualDeviceType, SecondaryInfoType, type LovelaceCardConfig } from "./type.js";

export type DisplayZeroLinesMode = "show" | "grey_out" | "transparency" | "hide" | "custom";

interface mainConfigOptions {
  dashboard_link?: string;
  dashboard_link_label?: string;
  second_dashboard_link?: string;
  second_dashboard_link_label?: string;
  kw_decimals: number;
  min_flow_rate: number;
  max_flow_rate: number;
  w_decimals: number;
  watt_threshold: number;
  clickable_entities: boolean;
  max_expected_power: number;
  min_expected_power: number;
  use_new_flow_rate_model?: boolean;
  full_size?: boolean;
  style_ha_card?: any;
  style_card_content?: any;
  disable_dots?: boolean;
  display_zero_lines?: {
    mode?: DisplayZeroLinesMode;
    transparency?: number;
    grey_color?: string | number[];
  };
  sort_individual_devices?: boolean;
}

export interface PowerFlowCardPlusConfig extends LovelaceCardConfig, mainConfigOptions {
  entities: ConfigEntities;
}

export type IndividualField = IndividualDeviceType[];

interface Battery extends BaseConfigEntity {
  state_of_charge?: string;
  state_of_charge_unit?: string;
  state_of_charge_unit_white_space?: boolean;
  state_of_charge_decimals?: number;
  show_state_of_charge?: boolean;
  color_state_of_charge_value?: boolean | "production" | "consumption";
  color_circle: boolean | "production" | "consumption";
  color_value?: boolean;
  color?: ComboEntity;
}

interface Grid extends BaseConfigEntity {
  power_outage: GridPowerOutage;
  secondary_info?: SecondaryInfoType;
  color_circle: boolean | "production" | "consumption";
  color_value?: boolean;
  color?: ComboEntity;
}

interface GridEntities {
  house?: Grid;
  main?: Grid;
}

export interface IntermediateEntity {
  entity?: string;
  name?: string;
  icon?: string;
  color?: { consumption?: string; production?: string };
  color_circle?: string;
  tap_action?: ActionConfig;
  secondary_info?: SecondaryInfoType;
  flowFromGridHouse?: string;
  flowFromGridMain?: string;
}

interface Solar extends BaseConfigEntity {
  entity: string;
  color?: any;
  color_icon?: boolean;
  color_value?: boolean;
  color_label?: boolean;
  secondary_info?: SecondaryInfoType;
  display_zero?: boolean;
  display_zero_state?: boolean;
}

interface Home extends BaseConfigEntity {
  entity: string;
  override_state?: boolean;
  color_icon?: boolean | "solar" | "grid" | "battery";
  color_value?: boolean | "solar" | "grid" | "battery";
  subtract_individual?: boolean;
  secondary_info?: SecondaryInfoType;
  circle_animation?: boolean;
  hide?: boolean;
}

interface FossilFuelPercentage extends BaseConfigEntity {
  entity: string;
  color?: string;
  state_type?: "percentage" | "power";
  color_icon?: boolean;
  display_zero?: boolean;
  display_zero_state?: boolean;
  display_zero_tolerance?: number;
  color_value?: boolean;
  color_label?: boolean;
  unit_white_space?: boolean;
  calculate_flow_rate?: boolean | number;
  secondary_info: SecondaryInfoType;
}

export type ConfigEntities = {
  battery?: Battery;
  grid?: GridEntities;
  solar?: Solar;
  home?: Home;
  fossil_fuel_percentage?: FossilFuelPercentage;
  individual?: IndividualField;
  intermediate?: IntermediateEntity[];
};

export type ConfigEntity = Battery | Grid | Solar | Home | FossilFuelPercentage | IndividualDeviceType | IntermediateEntity;
```

**Step 2: Build check**

```bash
pnpm build 2>&1 | head -40
```

Expected: TS errors in files still importing heatpump types. Fine — still in progress.

**Step 3: Commit**

```bash
git add src/power-flow-card-plus-config.ts
git commit -m "refactor: replace HeatpumpEntity with IntermediateEntity in config types"
```

---

## Task 3: Update `__tests__/migrate-config.test.ts`

**Files:**
- Modify: `__tests__/migrate-config.test.ts`

**Step 1: Remove the heatpump-preservation test**

The test "preserves heatpump fields when migrating grid" (lines 69–89) tests behavior that no longer exists. Delete that test block entirely.

The final test file should have exactly 6 tests (remove the 7th heatpump one). Verify by counting `test(` occurrences:

```bash
grep -c "^  test(" __tests__/migrate-config.test.ts
```

Expected: `6`

**Step 2: Run tests**

```bash
pnpm test
```

Expected: 6 tests pass.

**Step 3: Commit**

```bash
git add __tests__/migrate-config.test.ts
git commit -m "test: remove heatpump migration test (hard break — no migration)"
```

---

## Task 4: Create `src/states/raw/intermediate.ts`

**Files:**
- Create: `src/states/raw/intermediate.ts`
- Delete: `src/states/raw/heatpump.ts`

**Step 1: Create the new file**

```ts
import { HomeAssistant } from "custom-card-helpers";
import { IntermediateEntity } from "@/power-flow-card-plus-config";
import { getEntityState } from "../utils/getEntityState";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";

export const getIntermediateState = (hass: HomeAssistant, cfg: IntermediateEntity): number => {
  if (!cfg.entity) return 0;
  return getEntityStateWatts(hass, cfg.entity) ?? 0;
};

export const getIntermediateFlowFromGridHouseState = (hass: HomeAssistant, cfg: IntermediateEntity): number => {
  if (!cfg.flowFromGridHouse) return 0;
  return getEntityStateWatts(hass, cfg.flowFromGridHouse) ?? 0;
};

export const getIntermediateFlowFromGridMainState = (hass: HomeAssistant, cfg: IntermediateEntity): number => {
  if (!cfg.flowFromGridMain) return 0;
  return getEntityStateWatts(hass, cfg.flowFromGridMain) ?? 0;
};

export const getIntermediateSecondaryState = (hass: HomeAssistant, cfg: IntermediateEntity): string | number | null => {
  if (!cfg.secondary_info?.entity) return null;
  return getEntityState(hass, cfg.secondary_info.entity);
};
```

**Step 2: Delete the old heatpump state file**

```bash
rm src/states/raw/heatpump.ts
```

**Step 3: Commit**

```bash
git add src/states/raw/intermediate.ts src/states/raw/heatpump.ts
git commit -m "refactor: add intermediate state reader, delete heatpump state reader"
```

---

## Task 5: Create `src/components/intermediate.ts`

**Files:**
- Create: `src/components/intermediate.ts`
- Delete: `src/components/heatpump.ts`

**Step 1: Create the intermediate component**

The intermediate bubble is similar to heatpump but:
- Uses `secondary_info` instead of COP
- Takes an `index` (0 = bottom slot, 1 = top slot) to apply correct CSS class
- `position: 'top' | 'bottom'` controls the circle-container height variant

```ts
import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { displayValue } from "../utils/displayValue";

export const intermediateElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  {
    intermediateObj,
    entities,
    index,
  }: {
    intermediateObj: any;
    entities: ConfigEntities;
    index: number; // 0 = bottom slot (col 1 bottom row), 1 = top slot (col 1 top row)
  }
) => {
  const cfg = entities.intermediate?.[index];
  const positionClass = index === 0 ? "intermediate-bottom" : "intermediate-top";

  return html`<div class="circle-container intermediate ${positionClass}">
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, cfg?.tap_action, cfg?.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, cfg?.tap_action, cfg?.entity);
        }
      }}
    >
      ${intermediateObj.secondary?.has
        ? html`<span
            class="secondary-info intermediate"
            @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
              main.openDetails(e, cfg?.secondary_info?.tap_action, cfg?.secondary_info?.entity);
            }}
          >
            ${displayValue(main.hass, config, intermediateObj.secondary.state, {
              decimals: intermediateObj.secondary.decimals,
              unit: intermediateObj.secondary.unit,
              unitWhiteSpace: intermediateObj.secondary.unit_white_space,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : null}
      <ha-icon id="intermediate-${index}-icon" .icon=${intermediateObj.icon} />
      ${intermediateObj.flowFromGridHouse
        ? html`<span class="flow-from-grid-house">
            <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
            ${displayValue(main.hass, config, intermediateObj.flowFromGridHouse, {
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : null}
      ${intermediateObj.flowFromGridMain
        ? html`<span class="flow-from-grid-main">
            <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
            ${displayValue(main.hass, config, intermediateObj.flowFromGridMain, {
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : null}
      <span
        class="consumption"
        @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
          main.openDetails(e, cfg?.tap_action, cfg?.entity);
        }}
      >
        ${displayValue(main.hass, config, intermediateObj.state, {
          watt_threshold: config.watt_threshold,
        })}
      </span>
    </div>
    <span class="label">${intermediateObj.name}</span>
  </div>`;
};
```

**Step 2: Delete the old heatpump component**

```bash
rm src/components/heatpump.ts
```

**Step 3: Build check**

```bash
pnpm build 2>&1 | head -40
```

Expected: still errors in main card and flows files — OK.

**Step 4: Commit**

```bash
git add src/components/intermediate.ts src/components/heatpump.ts
git commit -m "refactor: add intermediate component, delete heatpump component"
```

---

## Task 6: Create `src/components/flows/gridHouseToIntermediate.ts`

**Files:**
- Create: `src/components/flows/gridHouseToIntermediate.ts`
- Delete: `src/components/flows/gridHouseToHeatpump.ts`

**Step 1: Create the new flow file**

The flow handles BOTH intermediate[0] (bottom) and intermediate[1] (top). The `index` parameter selects which.

SVG path notes (approximate — needs visual tuning in HA):
- For index=0 (bottom): curve from gridHouse (mid row) down-left to intermediate[0] (bottom row). Based on old heatpump path `M80,50 v8 c0,42 -60,42 -60,42` adjusted for new positions.
- For index=1 (top): mirror curve going up-left from gridHouse (mid row) to intermediate[1] (top row).

```ts
import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowsWithIntermediate = Flows & { intermediateObjs: any[] };

// index 0 = intermediate[0] (bottom slot), index 1 = intermediate[1] (top slot)
export const flowGridHouseToIntermediate = (
  config: PowerFlowCardPlusConfig,
  { battery, grid, intermediateObjs, individual, newDur }: FlowsWithIntermediate,
  index: number
) => {
  const intermediateObj = intermediateObjs[index];
  if (!intermediateObj?.has || !grid.has || !showLine(config, intermediateObj.flowFromGridHouse)) return "";

  const pathId = `grid-house-intermediate-${index}`;
  const divId = `grid-house-intermediate-${index}-flow`;

  // index=0: curve from gridHouse mid down-left to intermediate[0] bottom
  // index=1: curve from gridHouse mid up-left to intermediate[1] top
  // These coordinates are approximate — tune visually in HA after build.
  const d = index === 0
    ? "M55,50 v8 c0,42 -43,42 -43,42"
    : "M55,50 v-8 c0,-42 -43,-42 -43,-42";

  return html`<div
      class="lines ${classMap({
        high: battery.has || checkHasBottomIndividual(individual),
        "individual1-individual2": !battery.has && individual.every((i: any) => i?.has),
        "multi-individual": checkHasRightIndividual(individual),
      })}"
      id="${divId}"
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <path
          id="${pathId}"
          class="intermediate ${styleLine(intermediateObj.flowFromGridHouse || 0, config)}"
          d="${d}"
          vector-effect="non-scaling-stroke"
        ></path>
        ${checkShouldShowDots(config) && intermediateObj.flowFromGridHouse
          ? svg`<circle
              r="1"
              class="intermediate"
              vector-effect="non-scaling-stroke"
            >
              <animateMotion
                dur="${newDur.intermediateFromGridHouse[index]}s"
                repeatCount="indefinite"
                calcMode="linear"
              >
                <mpath xlink:href="#${pathId}" />
              </animateMotion>
            </circle>`
          : ""}
      </svg>
    </div>`;
};
```

**Step 2: Delete the old file**

```bash
rm src/components/flows/gridHouseToHeatpump.ts
```

**Step 3: Commit**

```bash
git add src/components/flows/gridHouseToIntermediate.ts src/components/flows/gridHouseToHeatpump.ts
git commit -m "refactor: add gridHouseToIntermediate flow, delete gridHouseToHeatpump"
```

---

## Task 7: Create `src/components/flows/gridMainToIntermediate.ts`

**Files:**
- Create: `src/components/flows/gridMainToIntermediate.ts`
- Delete: `src/components/flows/gridMainToHeatpump.ts`

**Step 1: Create the new flow file**

```ts
import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowsWithIntermediate = Flows & { intermediateObjs: any[]; gridMain?: any };

// index 0 = intermediate[0] (bottom slot), index 1 = intermediate[1] (top slot)
export const flowGridMainToIntermediate = (
  config: PowerFlowCardPlusConfig,
  { battery, gridMain, intermediateObjs, individual, newDur }: FlowsWithIntermediate,
  index: number
) => {
  const intermediateObj = intermediateObjs[index];
  if (!intermediateObj?.has || !gridMain?.has || !showLine(config, intermediateObj.flowFromGridMain)) return "";

  const pathId = `grid-main-intermediate-${index}`;
  const divId = `grid-main-intermediate-${index}-flow`;

  // index=0: gridMain (col 0 mid) → intermediate[0] (col 1 bottom): right then down
  // index=1: gridMain (col 0 mid) → intermediate[1] (col 1 top): right then up
  // gridMain is to the LEFT of the lines SVG viewport (col 0), so start at x=0 left edge.
  // Intermediate col 1 is at approximately x=12. Approximate paths — tune visually.
  const d = index === 0
    ? "M0,50 H12 V100"
    : "M0,50 H12 V0";

  return html`<div
      class="lines ${classMap({
        high: battery.has || checkHasBottomIndividual(individual),
        "individual1-individual2": !battery.has && individual.every((i: any) => i?.has),
        "multi-individual": checkHasRightIndividual(individual),
      })}"
      id="${divId}"
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <path
          id="${pathId}"
          class="intermediate ${styleLine(intermediateObj.flowFromGridMain || 0, config)}"
          d="${d}"
          vector-effect="non-scaling-stroke"
        ></path>
        ${checkShouldShowDots(config) && intermediateObj.flowFromGridMain
          ? svg`<circle
              r="1"
              class="intermediate"
              vector-effect="non-scaling-stroke"
            >
              <animateMotion
                dur="${newDur.intermediateFromGridMain[index]}s"
                repeatCount="indefinite"
                calcMode="linear"
              >
                <mpath xlink:href="#${pathId}" />
              </animateMotion>
            </circle>`
          : ""}
      </svg>
    </div>`;
};
```

**Step 2: Delete the old file**

```bash
rm src/components/flows/gridMainToHeatpump.ts
```

**Step 3: Commit**

```bash
git add src/components/flows/gridMainToIntermediate.ts src/components/flows/gridMainToHeatpump.ts
git commit -m "refactor: add gridMainToIntermediate flow, delete gridMainToHeatpump"
```

---

## Task 8: Update `src/components/flows/index.ts`

**Files:**
- Modify: `src/components/flows/index.ts`

**Step 1: Replace heatpump imports/exports with intermediate**

```ts
import { html } from "lit";
import { NewDur } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { IndividualObject } from "@/states/raw/individual/getIndividualObject";
import { flowSolarToHome } from "./solarToHome";
import { flowSolarToGrid } from "./solarToGrid";
import { flowSolarToBattery } from "./solarToBattery";
import { flowGridToHome } from "./gridToHome";
import { flowBatteryToHome } from "./batteryToHome";
import { flowBatteryGrid } from "./batteryGrid";
import { flowGridMainToGridHouse } from "./gridMainToGridHouse";
import { flowGridHouseToIntermediate } from "./gridHouseToIntermediate";
import { flowGridMainToIntermediate } from "./gridMainToIntermediate";

export interface Flows {
  battery: any;
  grid: any;
  gridMain?: any;
  intermediateObjs?: any[];
  individual: IndividualObject[];
  solar: any;
  newDur: NewDur;
}

export const flowElement = (
  config: PowerFlowCardPlusConfig,
  { battery, grid, gridMain, intermediateObjs = [], individual, solar, newDur }: Flows
) => {
  return html`
  ${flowSolarToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToGrid(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToBattery(config, { battery, individual, solar, newDur })}
  ${gridMain ? flowGridMainToGridHouse(config, { battery, grid, gridMain, individual, solar, newDur }) : ""}
  ${flowGridToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowBatteryToHome(config, { battery, grid, individual, newDur })}
  ${flowBatteryGrid(config, { battery, grid, individual, newDur })}
  ${intermediateObjs.length > 0 ? flowGridHouseToIntermediate(config, { battery, grid, intermediateObjs, individual, newDur }, 0) : ""}
  ${intermediateObjs.length > 1 ? flowGridHouseToIntermediate(config, { battery, grid, intermediateObjs, individual, newDur }, 1) : ""}
  ${gridMain && intermediateObjs.length > 0 ? flowGridMainToIntermediate(config, { battery, gridMain, intermediateObjs, individual, newDur }, 0) : ""}
  ${gridMain && intermediateObjs.length > 1 ? flowGridMainToIntermediate(config, { battery, gridMain, intermediateObjs, individual, newDur }, 1) : ""}
</div>`;
};
```

**Step 2: Build check**

```bash
pnpm build 2>&1 | head -40
```

Expected: errors only in `power-flow-card-plus.ts` now.

**Step 3: Commit**

```bash
git add src/components/flows/index.ts
git commit -m "refactor: update flows/index — swap heatpump for intermediate flows"
```

---

## Task 9: Update `src/style.ts`

**Files:**
- Modify: `src/style.ts`

**Step 1: Replace `.heatpump` CSS block with `.intermediate` and increase `.row` max-width**

Find and replace the heatpump block:

OLD:
```css
  .circle-container.heatpump {
    height: 110px;
    justify-content: flex-end;
  }
  .heatpump .circle {
    border-color: var(--energy-grid-consumption-color, #ff9800);
  }
  .heatpump ha-icon:not(.small) {
    padding-bottom: 0;
    position: relative;
  }
```

NEW:
```css
  .circle-container.intermediate-bottom {
    height: 110px;
    justify-content: flex-end;
  }
  .circle-container.intermediate-top {
    height: 130px;
  }
  .intermediate .circle {
    border-color: var(--energy-grid-consumption-color, #488fc2);
  }
  .intermediate ha-icon:not(.small) {
    padding-bottom: 0;
    position: relative;
  }
  circle.intermediate,
  path.intermediate {
    stroke: var(--energy-grid-consumption-color);
  }
```

**Step 2: Increase `.row` max-width to accommodate up to 6 columns**

OLD:
```css
  .row {
    display: flex;
    justify-content: space-between;
    max-width: 500px;
    margin: 0 auto;
  }
```

NEW:
```css
  .row {
    display: flex;
    justify-content: space-between;
    max-width: 640px;
    margin: 0 auto;
  }
```

**Step 3: Also update `.card-content, .row` max-width**

OLD:
```css
  .card-content,
  .row {
    max-width: 470px;
  }
```

NEW:
```css
  .card-content,
  .row {
    max-width: 640px;
  }
```

**Step 4: Commit**

```bash
git add src/style.ts
git commit -m "style: replace heatpump CSS with intermediate, increase row max-width for 6-col"
```

---

## Task 10: Rewrite `src/power-flow-card-plus.ts`

**Files:**
- Modify: `src/power-flow-card-plus.ts`

This is the largest task. Make changes section by section.

**Step 1: Replace heatpump imports with intermediate**

Find the import block at the top and make these changes:

Remove:
```ts
import { heatpumpElement } from "./components/heatpump";
```
Add:
```ts
import { intermediateElement } from "./components/intermediate";
```

Remove:
```ts
import { getGridConsumptionState, getGridProductionState, getGridSecondaryState, getGridMainConsumptionState, getGridMainProductionState, getGridMainSecondaryState } from "./states/raw/grid";
import { getHeatpumpState, getHeatpumpCopState, getHeatpumpFlowFromGridHouseState, getHeatpumpFlowFromGridMainState } from "./states/raw/heatpump";
```
Add:
```ts
import { getGridConsumptionState, getGridProductionState, getGridSecondaryState, getGridMainConsumptionState, getGridMainProductionState, getGridMainSecondaryState } from "./states/raw/grid";
import { getIntermediateState, getIntermediateFlowFromGridHouseState, getIntermediateFlowFromGridMainState, getIntermediateSecondaryState } from "./states/raw/intermediate";
```

**Step 2: Replace heatpump object construction with intermediateObjs array**

In `render()`, find and remove the entire heatpump block:
```ts
const heatpumpConfig = entities.heatpump;
const heatpump = {
  entity: heatpumpConfig?.entity,
  has: heatpumpConfig?.entity !== undefined,
  state: getHeatpumpState(this.hass, this._config),
  cop: {
    state: getHeatpumpCopState(this.hass, this._config),
  },
  flowFromGridHouse: getHeatpumpFlowFromGridHouseState(this.hass, this._config),
  flowFromGridMain: getHeatpumpFlowFromGridMainState(this.hass, this._config),
  icon: computeFieldIcon(this.hass, heatpumpConfig, "mdi:heat-pump"),
  name: computeFieldName(this.hass, heatpumpConfig, "Heat Pump"),
  tap_action: heatpumpConfig?.tap_action,
};
```

Replace with:
```ts
const intermediateObjs = (entities.intermediate || []).slice(0, 2).map((cfg) => ({
  entity: cfg.entity,
  has: cfg.entity !== undefined,
  state: getIntermediateState(this.hass, cfg),
  flowFromGridHouse: getIntermediateFlowFromGridHouseState(this.hass, cfg),
  flowFromGridMain: getIntermediateFlowFromGridMainState(this.hass, cfg),
  icon: computeFieldIcon(this.hass, cfg, "mdi:lightning-bolt"),
  name: computeFieldName(this.hass, cfg, "Device"),
  tap_action: cfg.tap_action,
  secondary: {
    entity: cfg.secondary_info?.entity,
    has: cfg.secondary_info?.entity !== undefined,
    state: getIntermediateSecondaryState(this.hass, cfg),
    decimals: cfg.secondary_info?.decimals,
    unit: cfg.secondary_info?.unit_of_measurement,
    unit_white_space: cfg.secondary_info?.unit_white_space,
    icon: cfg.secondary_info?.icon,
    accept_negative: cfg.secondary_info?.accept_negative || false,
    tap_action: cfg.secondary_info?.tap_action,
  },
}));
```

**Step 3: Update `newDur` construction**

Find:
```ts
heatpumpFromGridHouse: computeFlowRate(this._config, heatpump.flowFromGridHouse ?? 0, totalLines),
heatpumpFromGridMain: computeFlowRate(this._config, heatpump.flowFromGridMain ?? 0, totalLines),
```

Replace with:
```ts
intermediateFromGridHouse: intermediateObjs.map((obj) => computeFlowRate(this._config, obj.flowFromGridHouse ?? 0, totalLines)),
intermediateFromGridMain: intermediateObjs.map((obj) => computeFlowRate(this._config, obj.flowFromGridMain ?? 0, totalLines)),
```

**Step 4: Rewrite the three HTML rows in `render()`**

Replace the existing 3-row HTML block with the new adaptive 4–6 col layout.

Determine column presence before the HTML:
```ts
const hasLeftSection = gridMain.has || intermediateObjs.some((o) => o.has);
const hasRightSection = checkHasRightIndividual(individualObjs);
```

**Top row** (replace existing top row html):
```ts
${solar.has || individualObjs?.some((i) => i?.has) || nonFossil.hasPercentage || intermediateObjs[1]?.has
  ? html`<div class="row">
      ${hasLeftSection
        ? gridMain.has
          ? nonFossilElement(this, this._config, { entities, grid, newDur, nonFossil, templatesObj })
          : html`<div class="spacer"></div>`
        : ""}
      ${hasLeftSection
        ? intermediateObjs[1]?.has
          ? intermediateElement(this, this._config, { intermediateObj: intermediateObjs[1], entities, index: 1 })
          : html`<div class="spacer"></div>`
        : ""}
      ${!gridMain.has && (nonFossil.hasPercentage || nonFossil.has)
        ? nonFossilElement(this, this._config, { entities, grid, newDur, nonFossil, templatesObj })
        : html`<div class="spacer"></div>`}
      ${solar.has
        ? solarElement(this, this._config, { entities, solar, templatesObj })
        : individualObjs?.some((i) => i?.has)
        ? html`<div class="spacer"></div>`
        : ""}
      ${individualFieldRightTop
        ? individualRightTopElement(this, this._config, {
            displayState: getIndividualDisplayState(individualFieldRightTop),
            individualObj: individualFieldRightTop,
            newDur,
            templatesObj,
            battery,
            individualObjs,
          })
        : html`<div class="spacer"></div>`}
      ${hasRightSection
        ? individualFieldLeftTop
          ? individualLeftTopElement(this, this._config, {
              individualObj: individualFieldLeftTop,
              displayState: getIndividualDisplayState(individualFieldLeftTop),
              newDur,
              templatesObj,
            })
          : html`<div class="spacer"></div>`
        : ""}
    </div>`
  : html``}
```

**Mid row** (replace existing mid row):
```ts
<div class="row">
  ${hasLeftSection
    ? gridMain.has
      ? gridMainElement(this, this._config, { entities, gridMain, templatesObj })
      : html`<div class="spacer"></div>`
    : ""}
  ${hasLeftSection ? html`<div class="spacer"></div>` : ""}
  ${grid.has
    ? gridElement(this, this._config, { entities, grid, templatesObj })
    : html`<div class="spacer"></div>`}
  <div class="spacer"></div>
  ${!entities.home?.hide
    ? homeElement(this, this._config, {
        circleCircumference,
        entities,
        grid,
        home,
        homeBatteryCircumference,
        homeGridCircumference,
        homeNonFossilCircumference,
        homeSolarCircumference,
        newDur,
        templatesObj,
        homeUsageToDisplay,
        individual: individualObjs,
      })
    : html`<div class="spacer"></div>`}
  ${hasRightSection ? html`<div class="spacer"></div>` : ""}
</div>
```

**Bottom row** (replace existing bottom row):
```ts
${battery.has || intermediateObjs[0]?.has || checkHasBottomIndividual(individualObjs)
  ? html`<div class="row">
      ${hasLeftSection ? html`<div class="spacer"></div>` : ""}
      ${hasLeftSection
        ? intermediateObjs[0]?.has
          ? intermediateElement(this, this._config, { intermediateObj: intermediateObjs[0], entities, index: 0 })
          : html`<div class="spacer"></div>`
        : ""}
      <div class="spacer"></div>
      ${battery.has ? batteryElement(this, this._config, { battery, entities }) : html`<div class="spacer"></div>`}
      ${individualFieldRightBottom
        ? individualRightBottomElement(this, this._config, {
            displayState: getIndividualDisplayState(individualFieldRightBottom),
            individualObj: individualFieldRightBottom,
            newDur,
            templatesObj,
            battery,
            individualObjs,
          })
        : html`<div class="spacer"></div>`}
      ${hasRightSection
        ? individualFieldLeftBottom
          ? individualLeftBottomElement(this, this._config, {
              displayState: getIndividualDisplayState(individualFieldLeftBottom),
              individualObj: individualFieldLeftBottom,
              newDur,
              templatesObj,
            })
          : html`<div class="spacer"></div>`
        : ""}
    </div>`
  : html`<div class="spacer"></div>`}
```

**Step 5: Update `flowElement` call at the bottom of render()**

Find:
```ts
${flowElement(this._config, {
  battery,
  grid,
  gridMain,
  heatpump,
  individual: individualObjs,
  newDur,
  solar,
})}
```

Replace with:
```ts
${flowElement(this._config, {
  battery,
  grid,
  gridMain,
  intermediateObjs,
  individual: individualObjs,
  newDur,
  solar,
})}
```

**Step 6: Build — must be clean**

```bash
pnpm build 2>&1
```

Expected: **zero errors**. If there are errors, fix them before continuing.

**Step 7: Run tests**

```bash
pnpm test
```

Expected: all 6 tests pass.

**Step 8: Commit**

```bash
git add src/power-flow-card-plus.ts
git commit -m "feat: rewrite render() for adaptive 4-6 col layout with intermediate[] entities"
```

---

## Task 11: Remove remaining heatpump references

**Files:**
- Modify: `src/utils/get-default-config.ts` (if it references heatpump)
- Modify: `src/ui-editor/ui-editor.ts` (if it references heatpump)
- Check all files

**Step 1: Find any remaining heatpump references**

```bash
grep -r "heatpump" src/ --include="*.ts" -l
```

**Step 2: For each file found**, open it, find the heatpump references, and remove or replace them with `intermediate` equivalents. Common locations:
- `src/utils/get-default-config.ts` — remove any heatpump from stub config
- `src/ui-editor/ui-editor.ts` — remove any heatpump schema or editor panels
- `src/style/all.ts` — remove any heatpump dynamic styles

**Step 3: Build clean**

```bash
pnpm build 2>&1
```

Expected: zero errors.

**Step 4: Commit**

```bash
git add -u
git commit -m "chore: remove all remaining heatpump references"
```

---

## Task 12: Full build, test, and visual verification

**Step 1: Clean build**

```bash
pnpm build
```

Expected: zero errors, `dist/` updated.

**Step 2: Full test suite**

```bash
pnpm test
```

Expected: 6 tests pass.

**Step 3: TypeCheck**

```bash
pnpm typecheck
```

Expected: zero errors.

**Step 4: Load in Home Assistant**

Copy `dist/power-flow-card-cascade.js` to your HA `/config/www/` directory and reload.

Test configurations to verify:

**Config A — 4 columns (no gridMain, no right individuals):**
```yaml
entities:
  grid:
    house: { entity: sensor.grid_house }
  solar: { entity: sensor.solar }
  battery: { entity: sensor.battery }
  intermediate:
    - entity: sensor.heatpump
      flowFromGridHouse: sensor.heatpump_from_house
```

Expected: 4-col layout (intermediate bottom + gridHouse + solar + home).

**Config B — 6 columns (gridMain + right individuals):**
```yaml
entities:
  grid:
    main: { entity: sensor.grid_main }
    house: { entity: sensor.grid_house }
  solar: { entity: sensor.solar }
  battery: { entity: sensor.battery }
  intermediate:
    - entity: sensor.heatpump
      flowFromGridHouse: sensor.hp_from_house
      flowFromGridMain: sensor.hp_from_main
    - entity: sensor.ev_charger
      flowFromGridHouse: sensor.ev_from_house
  individual:
    - entity: sensor.device_a
    - entity: sensor.device_b
    - entity: sensor.device_c
```

Expected: 6-col layout.

**Step 5: Visual SVG tuning (if needed)**

If flow line paths look off, adjust the `d=` values in:
- `src/components/flows/gridHouseToIntermediate.ts` — the cubic bezier curves
- `src/components/flows/gridMainToIntermediate.ts` — the H + V paths

Rebuild (`pnpm build`) after each adjustment and reload HA to check.

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: intermediate entities redesign complete — adaptive 4-6 col layout"
```

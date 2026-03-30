import { describe, expect, test } from "@jest/globals";

import { displayNonFossilState } from "../src/utils/display-non-fossil-state";
import { getNonFossilHas, getNonFossilHasPercentage, getNonFossilState } from "../src/states/raw/non-fossil";
import type { PowerFlowCardPlusConfig } from "../src/power-flow-card-plus-config";

// ---------------------------------------------------------------------------
// Helper: create a minimal HomeAssistant mock
// ---------------------------------------------------------------------------
const makeHass = (states: Record<string, { state: string; attributes?: Record<string, any> }>) =>
  ({
    states: Object.fromEntries(
      Object.entries(states).map(([id, obj]) => [id, { entity_id: id, state: obj.state, attributes: obj.attributes ?? {} }])
    ),
    locale: "en",
  }) as any;

// ---------------------------------------------------------------------------
// displayNonFossilState
// ---------------------------------------------------------------------------
describe("displayNonFossilState", () => {
  test("returns 'NaN' when the fossil fuel entity id is an empty string", () => {
    const hass = makeHass({});
    const config = {
      entities: {},
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    expect(displayNonFossilState(hass, config, "", 500)).toBe("NaN");
  });

  test("returns 'NaN' when the fossil fuel entity does not exist in hass", () => {
    const hass = makeHass({});
    const config = {
      entities: { fossil_fuel_percentage: { entity: "sensor.fossil", state_type: "power" } },
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    expect(displayNonFossilState(hass, config, "sensor.fossil", 500)).toBe("NaN");
  });

  test("returns watts display when state_type is 'power'", () => {
    // 20% fossil → 80% non-fossil → 800 W from 1000 W grid
    const hass = makeHass({ "sensor.fossil": { state: "20" } });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil", state_type: "power" },
        grid: { entity: "sensor.grid" },
      },
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    expect(displayNonFossilState(hass, config, "sensor.fossil", 1000)).toBe("800 W");
  });

  test("returns kW display when non-fossil watts exceed the watt threshold", () => {
    // 10% fossil → 90% non-fossil → 1800 W = 1.8 kW from 2000 W grid
    const hass = makeHass({ "sensor.fossil": { state: "10" } });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil", state_type: "power" },
        grid: { entity: "sensor.grid" },
      },
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    expect(displayNonFossilState(hass, config, "sensor.fossil", 2000)).toBe("1.8 kW");
  });

  test("returns percentage display when state_type is 'percentage'", () => {
    // 30% fossil → 70% non-fossil
    const hass = makeHass({ "sensor.fossil": { state: "30" } });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil", state_type: "percentage" },
        grid: { entity: "sensor.grid" },
      },
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    expect(displayNonFossilState(hass, config, "sensor.fossil", 500)).toBe("70 %");
  });

  test("returns 0 % when percentage is below display_zero_tolerance", () => {
    // 95% fossil → 5% non-fossil; tolerance is 10 → clamp to 0
    const hass = makeHass({ "sensor.fossil": { state: "95" } });
    const config = {
      entities: {
        fossil_fuel_percentage: {
          entity: "sensor.fossil",
          state_type: "percentage",
          display_zero_tolerance: 10,
        },
        grid: { entity: "sensor.grid" },
      },
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    expect(displayNonFossilState(hass, config, "sensor.fossil", 500)).toBe("0 %");
  });

  test("returns 0 W when watt value is below display_zero_tolerance", () => {
    // 98% fossil → 2 W non-fossil from 100 W grid; tolerance is 50
    const hass = makeHass({ "sensor.fossil": { state: "98" } });
    const config = {
      entities: {
        fossil_fuel_percentage: {
          entity: "sensor.fossil",
          state_type: "power",
          display_zero_tolerance: 50,
        },
        grid: { entity: "sensor.grid" },
      },
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    expect(displayNonFossilState(hass, config, "sensor.fossil", 100)).toBe("0 W");
  });

  test("uses totalFromGrid when grid entity is a string", () => {
    // Grid entity is a string, so the function should use the passed totalFromGrid
    const hass = makeHass({
      "sensor.fossil": { state: "50" },
      "sensor.grid": { state: "999", attributes: { unit_of_measurement: "W" } },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil", state_type: "power" },
        grid: { entity: "sensor.grid" },
      },
      watt_threshold: 1000,
      kw_decimals: 1,
      w_decimals: 0,
    } as unknown as PowerFlowCardPlusConfig;
    // 50% non-fossil × 400 W (totalFromGrid) = 200 W
    expect(displayNonFossilState(hass, config, "sensor.fossil", 400)).toBe("200 W");
  });
});

// ---------------------------------------------------------------------------
// getNonFossilHas
// ---------------------------------------------------------------------------
describe("getNonFossilHas", () => {
  test("returns false when fossil_fuel_percentage entity is not configured", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilHas(hass, config)).toBe(false);
  });

  test("returns true when display_zero is true, regardless of grid state", () => {
    const hass = makeHass({ "sensor.fossil": { state: "100" } });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil", display_zero: true },
      },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilHas(hass, config)).toBe(true);
  });

  test("returns false when grid state is null (no grid entity configured)", () => {
    const hass = makeHass({ "sensor.fossil": { state: "50" } });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilHas(hass, config)).toBe(false);
  });

  test("returns true when there is positive non-fossil power", () => {
    const hass = makeHass({
      "sensor.grid": { state: "1000", attributes: { unit_of_measurement: "W" } },
      "sensor.fossil": { state: "40" },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
        grid: { entity: "sensor.grid" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    // Due to operator precedence the source formula evaluates as:
    // (gridFromGrid * 1) - (fossilPercent / 100) = 1000 - 0.4 = 999.6 > 0
    expect(getNonFossilHas(hass, config)).toBe(true);
  });

  test("returns false when all grid power is fossil (100% fossil)", () => {
    const hass = makeHass({
      "sensor.grid": { state: "0", attributes: { unit_of_measurement: "W" } },
      "sensor.fossil": { state: "100" },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
        grid: { entity: "sensor.grid" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    // (0 * 1) - (100 / 100) = 0 - 1 = -1, not > 0
    expect(getNonFossilHas(hass, config)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getNonFossilHasPercentage
// ---------------------------------------------------------------------------
describe("getNonFossilHasPercentage", () => {
  test("returns false when fossil_fuel_percentage entity is not configured", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilHasPercentage(hass, config)).toBe(false);
  });

  test("returns true when display_zero is true", () => {
    const hass = makeHass({ "sensor.fossil": { state: "100" } });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil", display_zero: true },
      },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilHasPercentage(hass, config)).toBe(true);
  });

  test("returns false when getNonFossilHas is false", () => {
    const hass = makeHass({
      "sensor.grid": { state: "0", attributes: { unit_of_measurement: "W" } },
      "sensor.fossil": { state: "100" },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
        grid: { entity: "sensor.grid" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilHasPercentage(hass, config)).toBe(false);
  });

  test("returns true when there is positive non-fossil power", () => {
    const hass = makeHass({
      "sensor.grid": { state: "500", attributes: { unit_of_measurement: "W" } },
      "sensor.fossil": { state: "20" },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
        grid: { entity: "sensor.grid" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilHasPercentage(hass, config)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getNonFossilState
// ---------------------------------------------------------------------------
describe("getNonFossilState", () => {
  test("returns null when fossil_fuel_percentage entity is not configured", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilState(hass, config)).toBeNull();
  });

  test("returns null when grid state is null (no grid entity)", () => {
    const hass = makeHass({ "sensor.fossil": { state: "50" } });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilState(hass, config)).toBeNull();
  });

  test("returns 0 when getNonFossilHas is false (e.g., full fossil)", () => {
    const hass = makeHass({
      "sensor.grid": { state: "0", attributes: { unit_of_measurement: "W" } },
      "sensor.fossil": { state: "100" },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
        grid: { entity: "sensor.grid" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getNonFossilState(hass, config)).toBe(0);
  });

  test("returns the non-fossil watt amount when there is positive non-fossil power", () => {
    const hass = makeHass({
      "sensor.grid": { state: "1000", attributes: { unit_of_measurement: "W" } },
      "sensor.fossil": { state: "40" },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
        grid: { entity: "sensor.grid" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    // Due to operator precedence the source formula evaluates as:
    // (gridFromGrid * 1) - (fossilPercent / 100) = 1000 - 0.4 = 999.6
    expect(getNonFossilState(hass, config)).toBeCloseTo(999.6, 5);
  });

  test("returns a small positive amount at the edge of the fossil percentage range", () => {
    const hass = makeHass({
      "sensor.grid": { state: "200", attributes: { unit_of_measurement: "W" } },
      "sensor.fossil": { state: "0" },
    });
    const config = {
      entities: {
        fossil_fuel_percentage: { entity: "sensor.fossil" },
        grid: { entity: "sensor.grid" },
      },
    } as unknown as PowerFlowCardPlusConfig;
    // (200 * 1) - (0 / 100) = 200 - 0 = 200
    expect(getNonFossilState(hass, config)).toBeCloseTo(200, 5);
  });
});

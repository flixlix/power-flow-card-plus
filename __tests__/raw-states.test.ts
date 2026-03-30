import { describe, expect, test } from "@jest/globals";

import { getSecondaryState, getFieldInState, getFieldOutState } from "../src/states/raw/base";
import { getBatteryStateOfCharge, getBatteryInState, getBatteryOutState } from "../src/states/raw/battery";
import { getGridConsumptionState, getGridProductionState, getGridSecondaryState } from "../src/states/raw/grid";
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
// getSecondaryState
// ---------------------------------------------------------------------------
describe("getSecondaryState", () => {
  test("returns null when no secondary_info entity is configured", () => {
    const hass = makeHass({});
    const config = { entities: { solar: {} } } as unknown as PowerFlowCardPlusConfig;
    expect(getSecondaryState(hass, config, "solar")).toBeNull();
  });

  test("returns null when secondary_info.entity is not a string", () => {
    const hass = makeHass({});
    const config = {
      entities: { solar: { secondary_info: { entity: undefined } } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getSecondaryState(hass, config, "solar")).toBeNull();
  });

  test("returns a numeric state as a Number", () => {
    const hass = makeHass({ "sensor.secondary": { state: "42" } });
    const config = {
      entities: { solar: { secondary_info: { entity: "sensor.secondary" } } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getSecondaryState(hass, config, "solar")).toBe(42);
  });

  test("returns a non-numeric state as a string", () => {
    const hass = makeHass({ "sensor.secondary": { state: "charging" } });
    const config = {
      entities: { solar: { secondary_info: { entity: "sensor.secondary" } } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getSecondaryState(hass, config, "solar")).toBe("charging");
  });

  test("returns a decimal numeric state correctly", () => {
    const hass = makeHass({ "sensor.secondary": { state: "3.14" } });
    const config = {
      entities: { grid: { secondary_info: { entity: "sensor.secondary" } } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getSecondaryState(hass, config, "grid")).toBeCloseTo(3.14);
  });
});

// ---------------------------------------------------------------------------
// getFieldInState  (production / charging side — negative raw value or object.production)
// ---------------------------------------------------------------------------
describe("getFieldInState", () => {
  test("returns null when the entity is undefined", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldInState(hass, config, "solar")).toBeNull();
  });

  test("returns absolute value of negative raw state (non-inverted, string entity)", () => {
    // For a non-inverted field, the "in" direction is the onlyNegative portion.
    const hass = makeHass({ "sensor.grid": { state: "-300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldInState(hass, config, "grid")).toBe(300);
  });

  test("returns 0 when raw state is positive and entity is not inverted", () => {
    const hass = makeHass({ "sensor.grid": { state: "300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldInState(hass, config, "grid")).toBe(0);
  });

  test("returns positive part when entity is inverted (flips in/out semantics)", () => {
    const hass = makeHass({ "sensor.grid": { state: "300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: true } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldInState(hass, config, "grid")).toBe(300);
  });

  test("uses the production sub-entity when entity is an object", () => {
    const hass = makeHass({
      "sensor.prod": { state: "500", attributes: { unit_of_measurement: "W" } },
      "sensor.cons": { state: "100", attributes: { unit_of_measurement: "W" } },
    });
    const config = {
      entities: { battery: { entity: { production: "sensor.prod", consumption: "sensor.cons" } } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldInState(hass, config, "battery")).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// getFieldOutState  (consumption / discharging side — positive raw value or object.consumption)
// ---------------------------------------------------------------------------
describe("getFieldOutState", () => {
  test("returns null when the entity is undefined", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldOutState(hass, config, "solar")).toBeNull();
  });

  test("returns positive raw state (non-inverted, string entity)", () => {
    const hass = makeHass({ "sensor.grid": { state: "300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldOutState(hass, config, "grid")).toBe(300);
  });

  test("returns 0 when raw state is negative and entity is not inverted", () => {
    const hass = makeHass({ "sensor.grid": { state: "-300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldOutState(hass, config, "grid")).toBe(0);
  });

  test("returns absolute of negative part when entity is inverted", () => {
    const hass = makeHass({ "sensor.grid": { state: "-300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: true } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldOutState(hass, config, "grid")).toBe(300);
  });

  test("uses the consumption sub-entity when entity is an object", () => {
    const hass = makeHass({
      "sensor.prod": { state: "500", attributes: { unit_of_measurement: "W" } },
      "sensor.cons": { state: "400", attributes: { unit_of_measurement: "W" } },
    });
    const config = {
      entities: { battery: { entity: { production: "sensor.prod", consumption: "sensor.cons" } } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getFieldOutState(hass, config, "battery")).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Battery state functions
// ---------------------------------------------------------------------------
describe("getBatteryStateOfCharge", () => {
  test("returns null when state_of_charge is not configured", () => {
    const hass = makeHass({});
    const config = { entities: { battery: {} } } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryStateOfCharge(hass, config)).toBeNull();
  });

  test("returns null when no battery entity is configured at all", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryStateOfCharge(hass, config)).toBeNull();
  });

  test("returns the numeric state-of-charge value", () => {
    const hass = makeHass({ "sensor.soc": { state: "75" } });
    const config = {
      entities: { battery: { state_of_charge: "sensor.soc" } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryStateOfCharge(hass, config)).toBe(75);
  });

  test("returns null when the state-of-charge entity is unavailable", () => {
    const hass = makeHass({ "sensor.soc": { state: "unavailable" } });
    const config = {
      entities: { battery: { state_of_charge: "sensor.soc" } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryStateOfCharge(hass, config)).toBeNull();
  });
});

describe("getBatteryInState", () => {
  test("returns the charging wattage (absolute negative state) for a non-inverted entity", () => {
    const hass = makeHass({ "sensor.battery": { state: "-200", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { battery: { entity: "sensor.battery", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryInState(hass, config)).toBe(200);
  });

  test("returns 0 when the battery is discharging (positive state, non-inverted)", () => {
    const hass = makeHass({ "sensor.battery": { state: "200", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { battery: { entity: "sensor.battery", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryInState(hass, config)).toBe(0);
  });
});

describe("getBatteryOutState", () => {
  test("returns the discharging wattage (positive state) for a non-inverted entity", () => {
    const hass = makeHass({ "sensor.battery": { state: "150", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { battery: { entity: "sensor.battery", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryOutState(hass, config)).toBe(150);
  });

  test("returns 0 when the battery is charging (negative state, non-inverted)", () => {
    const hass = makeHass({ "sensor.battery": { state: "-150", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { battery: { entity: "sensor.battery", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryOutState(hass, config)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Grid state functions
// ---------------------------------------------------------------------------
describe("getGridConsumptionState", () => {
  test("returns the positive grid state (consuming from grid)", () => {
    const hass = makeHass({ "sensor.grid": { state: "500", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getGridConsumptionState(hass, config)).toBe(500);
  });

  test("returns 0 when exporting to the grid (negative state, non-inverted)", () => {
    const hass = makeHass({ "sensor.grid": { state: "-300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getGridConsumptionState(hass, config)).toBe(0);
  });

  test("returns null when no grid entity is configured", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getGridConsumptionState(hass, config)).toBeNull();
  });
});

describe("getGridProductionState", () => {
  test("returns the absolute value when feeding power to the grid (negative raw state)", () => {
    const hass = makeHass({ "sensor.grid": { state: "-300", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getGridProductionState(hass, config)).toBe(300);
  });

  test("returns 0 when consuming from the grid (positive state, non-inverted)", () => {
    const hass = makeHass({ "sensor.grid": { state: "500", attributes: { unit_of_measurement: "W" } } });
    const config = {
      entities: { grid: { entity: "sensor.grid", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getGridProductionState(hass, config)).toBe(0);
  });

  test("returns null when no grid entity is configured", () => {
    const hass = makeHass({});
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(getGridProductionState(hass, config)).toBeNull();
  });
});

describe("getGridSecondaryState", () => {
  test("returns the secondary state as a number", () => {
    const hass = makeHass({ "sensor.secondary": { state: "100" } });
    const config = {
      entities: { grid: { entity: "sensor.grid", secondary_info: { entity: "sensor.secondary" } } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(getGridSecondaryState(hass, config)).toBe(100);
  });

  test("returns null when no secondary entity is configured for the grid", () => {
    const hass = makeHass({});
    const config = { entities: { grid: { entity: "sensor.grid" } } } as unknown as PowerFlowCardPlusConfig;
    expect(getGridSecondaryState(hass, config)).toBeNull();
  });
});

import { describe, expect, test } from "@jest/globals";

import { getEntityNames, getFirstEntityName } from "../src/states/utils/mutli-entity";
import { onlyNegative, onlyPositive } from "../src/states/utils/negative-positive";
import { isEntityAvailable, doesEntityExist } from "../src/states/utils/existence-entity";
import { isEntityInverted } from "../src/states/utils/is-entity-inverted";
import { hasIndividualObject } from "../src/states/raw/individual/has-individual-object";
import { isAboveTolerance } from "../src/states/tolerance/base";
import { getEntityState } from "../src/states/utils/get-entity-state";
import { getEntityStateWatts } from "../src/states/utils/get-entity-state-watts";
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
// getEntityNames / getFirstEntityName
// ---------------------------------------------------------------------------
describe("getEntityNames", () => {
  test("returns a single-element array for a plain entity id", () => {
    expect(getEntityNames("sensor.one")).toEqual(["sensor.one"]);
  });

  test("splits multiple entities separated by a pipe", () => {
    expect(getEntityNames("sensor.one|sensor.two")).toEqual(["sensor.one", "sensor.two"]);
  });

  test("trims whitespace around the pipe separator", () => {
    expect(getEntityNames("sensor.one | sensor.two")).toEqual(["sensor.one", "sensor.two"]);
  });

  test("handles three or more entities", () => {
    expect(getEntityNames("sensor.a|sensor.b|sensor.c")).toEqual(["sensor.a", "sensor.b", "sensor.c"]);
  });
});

describe("getFirstEntityName", () => {
  test("returns the only entity when there is just one", () => {
    expect(getFirstEntityName("sensor.one")).toBe("sensor.one");
  });

  test("returns only the first of multiple pipe-separated entities", () => {
    expect(getFirstEntityName("sensor.one|sensor.two")).toBe("sensor.one");
  });

  test("returns an empty string for an empty input", () => {
    expect(getFirstEntityName("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// onlyNegative / onlyPositive
// ---------------------------------------------------------------------------
describe("onlyNegative", () => {
  test("returns the absolute value for negative input", () => {
    expect(onlyNegative(-100)).toBe(100);
    expect(onlyNegative(-0.5)).toBe(0.5);
  });

  test("returns 0 for zero input", () => {
    expect(onlyNegative(0)).toBe(0);
  });

  test("returns 0 for positive input", () => {
    expect(onlyNegative(100)).toBe(0);
    expect(onlyNegative(0.01)).toBe(0);
  });
});

describe("onlyPositive", () => {
  test("returns positive values unchanged", () => {
    expect(onlyPositive(100)).toBe(100);
    expect(onlyPositive(0.5)).toBe(0.5);
  });

  test("returns 0 for zero input", () => {
    expect(onlyPositive(0)).toBe(0);
  });

  test("returns 0 for negative input", () => {
    expect(onlyPositive(-100)).toBe(0);
    expect(onlyPositive(-0.01)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isEntityAvailable
// ---------------------------------------------------------------------------
describe("isEntityAvailable", () => {
  test("returns true for a single entity with a numeric state", () => {
    const hass = makeHass({ "sensor.power": { state: "100" } });
    expect(isEntityAvailable(hass, "sensor.power")).toBe(true);
  });

  test("returns false for a single entity with a non-numeric state", () => {
    const hass = makeHass({ "sensor.power": { state: "unavailable" } });
    expect(isEntityAvailable(hass, "sensor.power")).toBe(false);
  });

  test("returns false for an entity that does not exist in hass", () => {
    const hass = makeHass({});
    expect(isEntityAvailable(hass, "sensor.missing")).toBe(false);
  });

  test("returns true when all pipe-joined entities are available", () => {
    const hass = makeHass({
      "sensor.one": { state: "50" },
      "sensor.two": { state: "75" },
    });
    expect(isEntityAvailable(hass, "sensor.one|sensor.two")).toBe(true);
  });

  test("returns false when one of the pipe-joined entities is unavailable", () => {
    const hass = makeHass({
      "sensor.one": { state: "50" },
      "sensor.two": { state: "unavailable" },
    });
    expect(isEntityAvailable(hass, "sensor.one|sensor.two")).toBe(false);
  });

  test("returns false when one of the pipe-joined entities is missing entirely", () => {
    const hass = makeHass({ "sensor.one": { state: "50" } });
    expect(isEntityAvailable(hass, "sensor.one|sensor.missing")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// doesEntityExist
// ---------------------------------------------------------------------------
describe("doesEntityExist", () => {
  test("returns true for an entity that exists in hass.states", () => {
    const hass = makeHass({ "sensor.power": { state: "100" } });
    expect(doesEntityExist(hass, "sensor.power")).toBe(true);
  });

  test("returns false for an entity that does not exist", () => {
    const hass = makeHass({});
    expect(doesEntityExist(hass, "sensor.missing")).toBe(false);
  });

  test("returns false when one of the pipe-joined entities does not exist", () => {
    const hass = makeHass({ "sensor.one": { state: "50" } });
    expect(doesEntityExist(hass, "sensor.one|sensor.missing")).toBe(false);
  });

  test("returns true when all pipe-joined entities exist", () => {
    const hass = makeHass({
      "sensor.one": { state: "50" },
      "sensor.two": { state: "unavailable" }, // non-numeric but exists
    });
    expect(doesEntityExist(hass, "sensor.one|sensor.two")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isEntityInverted
// ---------------------------------------------------------------------------
describe("isEntityInverted", () => {
  test("returns true when invert_state is explicitly true", () => {
    const config = {
      entities: { solar: { entity: "sensor.solar", invert_state: true } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(isEntityInverted(config, "solar")).toBe(true);
  });

  test("returns false when invert_state is explicitly false", () => {
    const config = {
      entities: { solar: { entity: "sensor.solar", invert_state: false } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(isEntityInverted(config, "solar")).toBe(false);
  });

  test("returns false when invert_state is not set", () => {
    const config = {
      entities: { solar: { entity: "sensor.solar" } },
    } as unknown as PowerFlowCardPlusConfig;
    expect(isEntityInverted(config, "solar")).toBe(false);
  });

  test("returns false when the entity type is not present in config", () => {
    const config = { entities: {} } as unknown as PowerFlowCardPlusConfig;
    expect(isEntityInverted(config, "solar")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAboveTolerance
// ---------------------------------------------------------------------------
describe("isAboveTolerance", () => {
  test("returns true when value equals the tolerance", () => {
    expect(isAboveTolerance(5, 5)).toBe(true);
  });

  test("returns true when value exceeds the tolerance", () => {
    expect(isAboveTolerance(10, 5)).toBe(true);
  });

  test("returns false when value is below the tolerance", () => {
    expect(isAboveTolerance(4, 5)).toBe(false);
  });

  test("returns false for null value", () => {
    expect(isAboveTolerance(null, 5)).toBe(false);
  });

  test("returns false for a value of 0 (falsy)", () => {
    expect(isAboveTolerance(0, 0)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasIndividualObject
// ---------------------------------------------------------------------------
describe("hasIndividualObject", () => {
  test("returns true when displayZero is true regardless of state", () => {
    expect(hasIndividualObject(true, null, 0)).toBe(true);
    expect(hasIndividualObject(true, 0, 5)).toBe(true);
    expect(hasIndividualObject(true, -1, 100)).toBe(true);
  });

  test("returns true when state meets or exceeds the tolerance", () => {
    expect(hasIndividualObject(false, 10, 5)).toBe(true);
    expect(hasIndividualObject(false, 5, 5)).toBe(true);
  });

  test("returns false when state is below the tolerance", () => {
    expect(hasIndividualObject(false, 3, 5)).toBe(false);
  });

  test("returns false when state is null and displayZero is false", () => {
    expect(hasIndividualObject(false, null, 0)).toBe(false);
  });

  test("returns false for zero state when tolerance is 0 (zero is falsy in isAboveTolerance)", () => {
    expect(hasIndividualObject(false, 0, 0)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getEntityState
// ---------------------------------------------------------------------------
describe("getEntityState", () => {
  test("returns a number for a numeric-string state", () => {
    const hass = makeHass({ "sensor.power": { state: "250" } });
    expect(getEntityState(hass, "sensor.power")).toBe(250);
  });

  test("returns a negative number correctly", () => {
    const hass = makeHass({ "sensor.grid": { state: "-300" } });
    expect(getEntityState(hass, "sensor.grid")).toBe(-300);
  });

  test("returns null for an entity with an unavailable state", () => {
    const hass = makeHass({ "sensor.power": { state: "unavailable" } });
    expect(getEntityState(hass, "sensor.power")).toBeNull();
  });

  test("returns null for an undefined entity argument", () => {
    const hass = makeHass({});
    expect(getEntityState(hass, undefined)).toBeNull();
  });

  test("sums the states of multiple pipe-joined entities", () => {
    const hass = makeHass({
      "sensor.one": { state: "100" },
      "sensor.two": { state: "200" },
    });
    expect(getEntityState(hass, "sensor.one|sensor.two")).toBe(300);
  });

  test("handles decimal states correctly", () => {
    const hass = makeHass({ "sensor.power": { state: "1.75" } });
    expect(getEntityState(hass, "sensor.power")).toBeCloseTo(1.75);
  });
});

// ---------------------------------------------------------------------------
// getEntityStateWatts
// ---------------------------------------------------------------------------
describe("getEntityStateWatts", () => {
  test("returns W values unchanged", () => {
    const hass = makeHass({ "sensor.power": { state: "500", attributes: { unit_of_measurement: "W" } } });
    expect(getEntityStateWatts(hass, "sensor.power")).toBe(500);
  });

  test("converts kW to W", () => {
    const hass = makeHass({ "sensor.power": { state: "2.5", attributes: { unit_of_measurement: "kW" } } });
    expect(getEntityStateWatts(hass, "sensor.power")).toBe(2500);
  });

  test("converts MW to W", () => {
    const hass = makeHass({ "sensor.power": { state: "1", attributes: { unit_of_measurement: "MW" } } });
    expect(getEntityStateWatts(hass, "sensor.power")).toBe(1_000_000);
  });

  test("handles upper-case unit strings", () => {
    const hass = makeHass({ "sensor.power": { state: "3", attributes: { unit_of_measurement: "KW" } } });
    expect(getEntityStateWatts(hass, "sensor.power")).toBe(3000);
  });

  test("returns 0 for an entity with an unavailable state", () => {
    const hass = makeHass({ "sensor.power": { state: "unavailable", attributes: { unit_of_measurement: "W" } } });
    expect(getEntityStateWatts(hass, "sensor.power")).toBe(0);
  });

  test("returns 0 for an undefined entity argument", () => {
    const hass = makeHass({});
    expect(getEntityStateWatts(hass, undefined)).toBe(0);
  });

  test("treats a missing unit as watts (no conversion)", () => {
    const hass = makeHass({ "sensor.power": { state: "150", attributes: {} } });
    expect(getEntityStateWatts(hass, "sensor.power")).toBe(150);
  });
});

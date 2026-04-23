import { hasIndividualObject } from "../src/states/raw/individual/has-individual-object";
import { getIndividualObject } from "../src/states/raw/individual/get-individual-object";

declare const describe: any;
declare const expect: any;
declare const test: any;

describe("individual visibility", () => {
  test("shows an individual object when state meets the minimum visible power", () => {
    expect(hasIndividualObject(false, 50, 50)).toBe(true);
    expect(hasIndividualObject(false, 49.9, 50)).toBe(false);
  });

  test("display_zero still forces the individual object to be shown", () => {
    expect(hasIndividualObject(true, 0, 100)).toBe(true);
    expect(hasIndividualObject(true, null, 100)).toBe(true);
  });

  test("hide_if_lower_than takes precedence over display_zero_tolerance", () => {
    const hass = {
      states: {
        "sensor.ev_charger_power": {
          state: "50",
          attributes: { unit_of_measurement: "W" },
        },
      },
    } as any;

    const individual = getIndividualObject(hass, {
      entity: "sensor.ev_charger_power",
      hide_if_lower_than: 100,
      display_zero_tolerance: 20,
    });

    expect(individual.has).toBe(false);
    expect(individual.displayZeroTolerance).toBe(100);
  });

  test("display_zero_tolerance still works when hide_if_lower_than is not set", () => {
    const hass = {
      states: {
        "sensor.dryer_power": {
          state: "60",
          attributes: { unit_of_measurement: "W" },
        },
      },
    } as any;

    const individual = getIndividualObject(hass, {
      entity: "sensor.dryer_power",
      display_zero_tolerance: 50,
    });

    expect(individual.has).toBe(true);
    expect(individual.displayZeroTolerance).toBe(50);
  });
});

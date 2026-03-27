import { describe, expect, test } from "@jest/globals";

import { computePowerDistributionAfterSolarAndBattery } from "../src/utils/compute-power-distribution";

describe("power distribution after solar and battery", () => {
  test("scenario: solar + battery + no outage computes expected toHome/toBattery/toGrid", () => {
    const entities = {
      grid: { display_zero_tolerance: 0 },
      battery: { display_zero_tolerance: 0 },
      solar: { display_zero_tolerance: 0 },
      fossil_fuel_percentage: { entity: "sensor.fossil" },
    };

    const grid = {
      icon: "grid",
      powerOutage: { isOutage: false, icon: "outage" },
      state: { fromGrid: 600, toGrid: 200, toBattery: 0, toHome: null as number | null },
    };

    const solar = {
      has: true,
      state: { total: 1000, toHome: null as number | null, toBattery: null as number | null, toGrid: null as number | null },
    };

    const battery = {
      has: true,
      state: { fromBattery: 400, toBattery: 300, toGrid: 0, toHome: null as number | null },
    };

    const nonFossil = {
      has: true,
      hasPercentage: true,
      state: { power: null as number | null },
    };

    computePowerDistributionAfterSolarAndBattery({
      entities,
      grid,
      solar,
      battery,
      nonFossil,
      getEntityStateWatts: () => 0,
      getEntityState: () => 30,
    });

    expect(solar.state.toHome).toBe(500);
    expect(solar.state.toBattery).toBe(300);
    expect(grid.state.toBattery).toBe(0);
    expect(battery.state.toGrid).toBe(0);
    expect(battery.state.toHome).toBe(400);
    expect(grid.state.toHome).toBe(600);
    expect(solar.state.toGrid).toBe(200);
    expect(nonFossil.has).toBe(true);
    expect(nonFossil.hasPercentage).toBe(true);
    expect(nonFossil.state.power).toBeCloseTo(420, 10);
  });

  test("scenario: solar produces negative home so returned energy fills battery then clamps", () => {
    const entities = {
      grid: { display_zero_tolerance: 0 },
      battery: { display_zero_tolerance: 0 },
      solar: { display_zero_tolerance: 0 },
      fossil_fuel_percentage: { entity: "sensor.fossil" },
    };

    const grid = {
      icon: "grid",
      powerOutage: { isOutage: false, icon: "outage" },
      state: { fromGrid: 200, toGrid: 600, toBattery: 0, toHome: null as number | null },
    };

    const solar = {
      has: true,
      state: { total: 500, toHome: null as number | null, toBattery: null as number | null, toGrid: null as number | null },
    };

    const battery = {
      has: true,
      state: { fromBattery: 150, toBattery: 200, toGrid: 0, toHome: null as number | null },
    };

    const nonFossil = {
      has: true,
      hasPercentage: true,
      state: { power: null as number | null },
    };

    computePowerDistributionAfterSolarAndBattery({
      entities,
      grid,
      solar,
      battery,
      nonFossil,
      getEntityStateWatts: () => 0,
      getEntityState: () => 25,
    });

    expect(solar.state.toHome).toBe(0);
    expect(grid.state.toBattery).toBe(200);
    expect(battery.state.toGrid).toBe(0);
    expect(grid.state.toHome).toBe(0);
    expect(solar.state.toGrid).toBe(600);
    expect(nonFossil.state.power).toBe(0);
  });

  test("scenario: power outage overrides fromGrid/toGrid and disables non-fossil", () => {
    const entities = {
      grid: { display_zero_tolerance: 0 },
      battery: { display_zero_tolerance: 0 },
      solar: { display_zero_tolerance: 0 },
      fossil_fuel_percentage: { entity: "sensor.fossil" },
    };

    const grid = {
      icon: "grid",
      powerOutage: { isOutage: true, entityGenerator: "sensor.gen", icon: "mdi:outage" },
      state: { fromGrid: 600, toGrid: 200, toBattery: 0, toHome: null as number | null },
    };

    const solar = {
      has: false,
      state: { total: null as number | null, toHome: null as number | null, toBattery: null as number | null, toGrid: null as number | null },
    };

    const battery = {
      has: true,
      state: { fromBattery: 300, toBattery: 0, toGrid: 200, toHome: null as number | null },
    };

    const nonFossil = {
      has: true,
      hasPercentage: true,
      state: { power: null as number | null },
    };

    computePowerDistributionAfterSolarAndBattery({
      entities,
      grid,
      solar,
      battery,
      nonFossil,
      getEntityStateWatts: () => 1234,
      getEntityState: () => 50,
    });

    expect(grid.icon).toBe("mdi:outage");
    expect(nonFossil.has).toBe(false);
    expect(nonFossil.hasPercentage).toBe(false);
    expect(grid.state.toGrid).toBe(0);
    expect(battery.state.toGrid).toBe(0);
    expect(solar.state.toGrid).toBe(0);
    expect(grid.state.toHome).toBe(1234);
    expect(nonFossil.state.power).toBe(null);
  });

  test("bug #795: PV only charges battery; Home equals grid import", () => {
    const entities = {
      grid: { display_zero_tolerance: 0 },
      battery: { display_zero_tolerance: 0 },
      solar: { display_zero_tolerance: 0 },
      fossil_fuel_percentage: { entity: "sensor.fossil" },
    };

    const grid = {
      icon: "grid",
      powerOutage: { isOutage: false, icon: "outage" },
      // Grid is the source for Home consumption
      state: { fromGrid: 354, toGrid: 0, toBattery: 0, toHome: null as number | null },
    };

    const solar = {
      has: true,
      // PV goes entirely to battery charging (no PV to Home)
      state: { total: 65, toHome: null as number | null, toBattery: null as number | null, toGrid: null as number | null },
    };

    const battery = {
      has: true,
      // Battery is charging from PV
      state: { fromBattery: 0, toBattery: 65, toGrid: 0, toHome: null as number | null },
    };

    const nonFossil = {
      has: false,
      hasPercentage: false,
      state: { power: null as number | null },
    };

    computePowerDistributionAfterSolarAndBattery({
      entities,
      grid,
      solar,
      battery,
      nonFossil,
      getEntityStateWatts: () => 0,
      getEntityState: () => 0,
    });

    expect(solar.state.toHome).toBe(0);
    expect(solar.state.toBattery).toBe(65);
    expect(grid.state.toBattery).toBe(0);
    expect(grid.state.toHome).toBe(354);
    expect(battery.state.toGrid).toBe(0);
    expect(battery.state.toHome).toBe(0);
  });

  test("bug #830/#890: PV charging should be solar->battery (not grid->battery)", () => {
    const entities = {
      grid: { display_zero_tolerance: 0 },
      battery: { display_zero_tolerance: 0 },
      solar: { display_zero_tolerance: 0 },
      fossil_fuel_percentage: { entity: "sensor.fossil" },
    };

    const grid = {
      icon: "grid",
      powerOutage: { isOutage: false, icon: "outage" },
      state: { fromGrid: 354, toGrid: 0, toBattery: 0, toHome: null as number | null },
    };

    const solar = {
      has: true,
      state: { total: 65, toHome: null as number | null, toBattery: null as number | null, toGrid: null as number | null },
    };

    const battery = {
      has: true,
      state: { fromBattery: 0, toBattery: 65, toGrid: 0, toHome: null as number | null },
    };

    const nonFossil = {
      has: false,
      hasPercentage: false,
      state: { power: null as number | null },
    };

    computePowerDistributionAfterSolarAndBattery({
      entities,
      grid,
      solar,
      battery,
      nonFossil,
      getEntityStateWatts: () => 0,
      getEntityState: () => 0,
    });

    // Critical: the card must not classify battery charging as grid->battery.
    expect(grid.state.toBattery).toBe(0);
    expect(solar.state.toBattery).toBe(65);
    // And Home should stay equal to grid import (no extra PV power added).
    expect(grid.state.toHome).toBe(354);
  });
});

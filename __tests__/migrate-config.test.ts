import { describe, expect, test, jest, beforeEach, afterEach } from "@jest/globals";

import { migrateConfig } from "../src/utils/migrate-config";

describe("migrateConfig", () => {
  let warnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // Test 1: flat string entity migrated to house sub-key
  test("migrates flat string entity to grid.house", () => {
    const input = { entities: { grid: { entity: "sensor.grid" } } };
    const result = migrateConfig(input);
    expect(result.entities.grid).toEqual({ house: { entity: "sensor.grid" } });
  });

  // Test 2: flat ComboEntity migrated to house sub-key (deep-equals)
  test("migrates flat ComboEntity to grid.house.entity", () => {
    const comboEntity = { consumption: "sensor.a", production: "sensor.b" };
    const input = { entities: { grid: { entity: comboEntity } } };
    const result = migrateConfig(input);
    expect(result.entities.grid?.house?.entity).toEqual(comboEntity);
  });

  // Test 3: nested config returns same object reference (idempotent)
  test("returns same reference for already-nested config", () => {
    const input = { entities: { grid: { house: { entity: "sensor.grid" } } } };
    const result = migrateConfig(input);
    expect(result).toBe(input);
  });

  // Test 4: double-migration is idempotent by reference
  test("double migration is safe (same reference)", () => {
    const flat = { entities: { grid: { entity: "sensor.grid" } } };
    const once = migrateConfig(flat);
    const twice = migrateConfig(once);
    expect(twice).toBe(once);
  });

  // Test 5: no grid key — returns same reference unchanged
  test("returns same reference when grid is absent", () => {
    const input = { entities: { solar: { entity: "sensor.solar" } } };
    const result = migrateConfig(input);
    expect(result).toBe(input);
  });

  // Test 6: console.warn called for flat config, NOT called for nested
  test("calls console.warn exactly once for flat config", () => {
    const flat = { entities: { grid: { entity: "sensor.grid" } } };
    migrateConfig(flat);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[power-flow-card-plus]")
    );
  });

  test("does NOT call console.warn for already-nested config", () => {
    const nested = { entities: { grid: { house: { entity: "sensor.grid" } } } };
    migrateConfig(nested);
    expect(warnSpy).not.toHaveBeenCalled();
  });

});

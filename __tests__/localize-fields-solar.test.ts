import { describe, expect, test, beforeEach } from "@jest/globals";

import setupCustomlocalize from "../src/localize/localize";
import { computeFieldIcon, computeFieldName } from "../src/utils/compute-field-attributes";
import { getSolarState } from "../src/states/raw/solar";
import type { PowerFlowCardPlusConfig } from "../src/power-flow-card-plus-config";

describe("localize + field helpers + solar sign", () => {
  beforeEach(() => {
    // Minimal localStorage mock used by setupCustomlocalize
    (globalThis as any).localStorage = {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    };
  });

  test("setupCustomlocalize normalizes pt-BR -> pt_BR", () => {
    (globalThis as any).localStorage.setItem("selectedLanguage", "pt-BR");
    expect(setupCustomlocalize("editor.combined")).toBe("Entidade combinada (uma entidade com valores positivos e negativos)");
  });

  test("setupCustomlocalize falls back to key itself when translation is missing", () => {
    (globalThis as any).localStorage.setItem("selectedLanguage", "en");
    expect(setupCustomlocalize("this.key.does.not.exist")).toBe("this.key.does.not.exist");
  });

  test("computeFieldIcon returns explicit icon override", () => {
    const hass = { locale: "en", states: {} } as any;
    expect(computeFieldIcon(hass, { icon: "mdi:test" } as any, "mdi:fallback")).toBe("mdi:test");
  });

  test("computeFieldName returns explicit name override", () => {
    const hass = { locale: "en", states: {} } as any;
    expect(computeFieldName(hass, { name: "My Name" } as any, "Default")).toBe("My Name");
  });

  test("computeFieldIcon uses hass metadata when use_metadata is true", () => {
    const hass = {
      locale: "en",
      states: {
        "sensor.solar": {
          state: "123",
          entity_id: "sensor.solar",
          attributes: {
            unit_of_measurement: "W",
            icon: "mdi:brightness-6",
          },
        },
      },
    } as any;

    const field = { use_metadata: true, entity: "sensor.solar" } as any;
    expect(computeFieldIcon(hass, field, "mdi:fallback")).toBe("mdi:brightness-6");
  });

  test("computeFieldName uses hass friendly_name when use_metadata is true", () => {
    const hass = {
      locale: "en",
      states: {
        "sensor.solar": {
          state: "123",
          entity_id: "sensor.solar",
          attributes: {
            unit_of_measurement: "W",
            friendly_name: "Solar Sensor",
          },
        },
      },
    } as any;

    const field = { use_metadata: true, entity: "sensor.solar" } as any;
    expect(computeFieldName(hass, field, "Default")).toBe("Solar Sensor");
  });

  test("getSolarState returns only positive when invert_state is false", () => {
    const hass = {
      states: {
        "sensor.solar_watts": {
          state: "-500",
          attributes: {
            unit_of_measurement: "W",
          },
        },
      },
    } as any;

    const config = {
      entities: {
        solar: { entity: "sensor.solar_watts", invert_state: false },
      },
    } as unknown as PowerFlowCardPlusConfig;

    expect(getSolarState(hass, config)).toBe(0);
  });

  test("getSolarState returns magnitude of negatives when invert_state is true", () => {
    const hass = {
      states: {
        "sensor.solar_watts": {
          state: "-500",
          attributes: {
            unit_of_measurement: "W",
          },
        },
      },
    } as any;

    const config = {
      entities: {
        solar: { entity: "sensor.solar_watts", invert_state: true },
      },
    } as unknown as PowerFlowCardPlusConfig;

    expect(getSolarState(hass, config)).toBe(500);
  });
});

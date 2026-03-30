import { describe, expect, test } from "@jest/globals";

import { round, isNumberValue, coerceNumber, coerceStringArray } from "../src/utils/utils";
import { convertColorListToHex } from "../src/utils/convert-color";
import { showLine } from "../src/utils/show-line";
import {
  getTopLeftIndividual,
  getBottomLeftIndividual,
  getTopRightIndividual,
  getBottomRightIndividual,
  checkHasRightIndividual,
  checkHasBottomIndividual,
} from "../src/utils/compute-individual-position";
import { defaultValues } from "../src/utils/get-default-config";
import type { IndividualObject } from "../src/states/raw/individual/get-individual-object";
import type { PowerFlowCardPlusConfig } from "../src/power-flow-card-plus-config";

// ---------------------------------------------------------------------------
// round
// ---------------------------------------------------------------------------
describe("round", () => {
  test("rounds to 0 decimal places", () => {
    expect(round(1.5, 0)).toBe(2);
    expect(round(1.4, 0)).toBe(1);
  });

  test("rounds to 1 decimal place", () => {
    expect(round(1.55, 1)).toBe(1.6);
    expect(round(1.54, 1)).toBe(1.5);
  });

  test("rounds to 2 decimal places", () => {
    expect(round(1.005, 2)).toBe(1.01);
  });

  test("handles negative values", () => {
    expect(round(-1.5, 0)).toBe(-1);
    expect(round(-2.5, 0)).toBe(-2);
  });

  test("rounds zero correctly", () => {
    expect(round(0, 2)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isNumberValue
// ---------------------------------------------------------------------------
describe("isNumberValue", () => {
  test("returns true for numeric strings", () => {
    expect(isNumberValue("123")).toBe(true);
    expect(isNumberValue("1.5")).toBe(true);
    expect(isNumberValue("-42")).toBe(true);
    expect(isNumberValue("0")).toBe(true);
    expect(isNumberValue("0.0")).toBe(true);
  });

  test("returns true for actual numbers", () => {
    expect(isNumberValue(42)).toBe(true);
    expect(isNumberValue(0)).toBe(true);
    expect(isNumberValue(-1)).toBe(true);
    expect(isNumberValue(3.14)).toBe(true);
  });

  test("returns false for non-numeric strings", () => {
    expect(isNumberValue("abc")).toBe(false);
    expect(isNumberValue("123hello")).toBe(false);
    expect(isNumberValue("hello123")).toBe(false);
    expect(isNumberValue("")).toBe(false);
    expect(isNumberValue("unavailable")).toBe(false);
  });

  test("returns false for null and undefined", () => {
    expect(isNumberValue(null)).toBe(false);
    expect(isNumberValue(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// coerceNumber
// ---------------------------------------------------------------------------
describe("coerceNumber", () => {
  test("converts numeric string to number", () => {
    expect(coerceNumber("42")).toBe(42);
    expect(coerceNumber("1.5")).toBe(1.5);
    expect(coerceNumber("-7")).toBe(-7);
  });

  test("passes through numeric values unchanged", () => {
    expect(coerceNumber(7)).toBe(7);
    expect(coerceNumber(0)).toBe(0);
    expect(coerceNumber(-3.14)).toBe(-3.14);
  });

  test("returns 0 (default fallback) for invalid values", () => {
    expect(coerceNumber("abc")).toBe(0);
    expect(coerceNumber(null)).toBe(0);
    expect(coerceNumber(undefined)).toBe(0);
  });

  test("returns custom fallback for invalid values", () => {
    expect(coerceNumber("abc", -1)).toBe(-1);
    expect(coerceNumber(null, 99)).toBe(99);
    expect(coerceNumber(undefined, 5)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// coerceStringArray
// ---------------------------------------------------------------------------
describe("coerceStringArray", () => {
  test("splits string by whitespace by default", () => {
    expect(coerceStringArray("a b c")).toEqual(["a", "b", "c"]);
  });

  test("splits string by a custom separator", () => {
    expect(coerceStringArray("a,b,c", ",")).toEqual(["a", "b", "c"]);
  });

  test("returns an array of strings unchanged", () => {
    expect(coerceStringArray(["a", "b"])).toEqual(["a", "b"]);
  });

  test("returns empty array for null", () => {
    expect(coerceStringArray(null)).toEqual([]);
  });

  test("returns empty array for undefined", () => {
    expect(coerceStringArray(undefined)).toEqual([]);
  });

  test("filters out empty strings produced by consecutive whitespace", () => {
    expect(coerceStringArray("a  b")).toEqual(["a", "b"]);
  });

  test("coerces non-string scalar to a string and splits", () => {
    expect(coerceStringArray(123)).toEqual(["123"]);
  });
});

// ---------------------------------------------------------------------------
// convertColorListToHex
// ---------------------------------------------------------------------------
describe("convertColorListToHex", () => {
  test("converts an RGB list to a hex string", () => {
    expect(convertColorListToHex([255, 0, 0])).toBe("#ff0000");
    expect(convertColorListToHex([0, 255, 0])).toBe("#00ff00");
    expect(convertColorListToHex([0, 0, 255])).toBe("#0000ff");
  });

  test("pads single-digit hex values with a leading zero", () => {
    expect(convertColorListToHex([0, 0, 0])).toBe("#000000");
    expect(convertColorListToHex([1, 2, 3])).toBe("#010203");
  });

  test("converts the default grey color used by the card", () => {
    expect(convertColorListToHex([189, 189, 189])).toBe("#bdbdbd");
  });

  test("returns empty string for a falsy input", () => {
    expect(convertColorListToHex(null as any)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// showLine
// ---------------------------------------------------------------------------
describe("showLine", () => {
  test("returns true when power is positive regardless of mode", () => {
    const config = { display_zero_lines: { mode: "hide" } } as unknown as PowerFlowCardPlusConfig;
    expect(showLine(config, 100)).toBe(true);
    expect(showLine(config, 0.01)).toBe(true);
  });

  test("returns false when power is 0 and mode is 'hide'", () => {
    const config = { display_zero_lines: { mode: "hide" } } as unknown as PowerFlowCardPlusConfig;
    expect(showLine(config, 0)).toBe(false);
  });

  test("returns true when power is 0 and mode is 'show'", () => {
    const config = { display_zero_lines: { mode: "show" } } as unknown as PowerFlowCardPlusConfig;
    expect(showLine(config, 0)).toBe(true);
  });

  test("returns true when power is 0 and mode is 'grey_out'", () => {
    const config = { display_zero_lines: { mode: "grey_out" } } as unknown as PowerFlowCardPlusConfig;
    expect(showLine(config, 0)).toBe(true);
  });

  test("returns true when power is 0 and mode is 'transparency'", () => {
    const config = { display_zero_lines: { mode: "transparency" } } as unknown as PowerFlowCardPlusConfig;
    expect(showLine(config, 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// compute-individual-position helpers
// ---------------------------------------------------------------------------
const makeIndividualObj = (has: boolean): IndividualObject => ({
  has,
  field: has ? ({ entity: "sensor.test" } as any) : undefined,
  entity: has ? "sensor.test" : "",
  state: has ? 100 : null,
  displayZero: false,
  displayZeroTolerance: 0,
  icon: "mdi:flash",
  name: "Test",
  color: null,
  unit_white_space: true,
  invertAnimation: false,
  showDirection: false,
  secondary: {
    entity: null,
    template: null,
    has: false,
    state: null,
    icon: null,
    unit: null,
    unit_white_space: false,
    displayZero: false,
    accept_negative: false,
    displayZeroTolerance: 0,
    decimals: null,
  },
});

describe("compute-individual-position", () => {
  const objs = [
    makeIndividualObj(true), // 0 → top-left
    makeIndividualObj(true), // 1 → bottom-left
    makeIndividualObj(true), // 2 → top-right
    makeIndividualObj(false), // 3 → bottom-right (inactive)
  ];

  test("getTopLeftIndividual returns the first active object", () => {
    expect(getTopLeftIndividual(objs)).toEqual(objs[0]);
  });

  test("getBottomLeftIndividual returns the second active object", () => {
    expect(getBottomLeftIndividual(objs)).toEqual(objs[1]);
  });

  test("getTopRightIndividual returns the third active object", () => {
    expect(getTopRightIndividual(objs)).toEqual(objs[2]);
  });

  test("getBottomRightIndividual returns undefined when fourth object is inactive", () => {
    expect(getBottomRightIndividual(objs)).toBeUndefined();
  });

  test("checkHasRightIndividual returns true when a top-right object exists", () => {
    expect(checkHasRightIndividual(objs)).toBe(true);
  });

  test("checkHasRightIndividual returns false when only two active objects exist", () => {
    const twoObjs = [makeIndividualObj(true), makeIndividualObj(true)];
    expect(checkHasRightIndividual(twoObjs)).toBe(false);
  });

  test("checkHasBottomIndividual returns true when a bottom-left object exists", () => {
    expect(checkHasBottomIndividual(objs)).toBe(true);
  });

  test("checkHasBottomIndividual returns false when only one active object exists", () => {
    const oneObj = [makeIndividualObj(true)];
    expect(checkHasBottomIndividual(oneObj)).toBe(false);
  });

  test("returns undefined for positions beyond the number of active objects", () => {
    const singleObj = [makeIndividualObj(true)];
    expect(getBottomLeftIndividual(singleObj)).toBeUndefined();
    expect(getTopRightIndividual(singleObj)).toBeUndefined();
    expect(getBottomRightIndividual(singleObj)).toBeUndefined();
  });

  test("inactive objects (has=false) are skipped when computing positions", () => {
    const mixed = [makeIndividualObj(false), makeIndividualObj(true), makeIndividualObj(true)];
    expect(getTopLeftIndividual(mixed)).toEqual(mixed[1]);
    expect(getBottomLeftIndividual(mixed)).toEqual(mixed[2]);
    expect(getTopRightIndividual(mixed)).toBeUndefined();
  });

  test("returns undefined for all positions when no active objects exist", () => {
    const none = [makeIndividualObj(false), makeIndividualObj(false)];
    expect(getTopLeftIndividual(none)).toBeUndefined();
    expect(getBottomLeftIndividual(none)).toBeUndefined();
    expect(checkHasRightIndividual(none)).toBe(false);
    expect(checkHasBottomIndividual(none)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// defaultValues
// ---------------------------------------------------------------------------
describe("defaultValues", () => {
  test("exports the expected default flow-rate values", () => {
    expect(defaultValues.maxFlowRate).toBe(6);
    expect(defaultValues.minFlowRate).toBe(0.75);
  });

  test("exports the expected default power thresholds", () => {
    expect(defaultValues.wattThreshold).toBe(1000);
    expect(defaultValues.minExpectedPower).toBe(0.01);
    expect(defaultValues.maxExpectedPower).toBe(2000);
  });

  test("exports the expected decimal precision defaults", () => {
    expect(defaultValues.wattDecimals).toBe(0);
    expect(defaultValues.kilowattDecimals).toBe(1);
  });

  test("exports the expected display_zero_lines defaults", () => {
    expect(defaultValues.displayZeroLines.mode).toBe("show");
    expect(defaultValues.displayZeroLines.transparency).toBe(50);
    expect(defaultValues.displayZeroLines.grey_color).toEqual([189, 189, 189]);
  });
});

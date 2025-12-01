import { HomeAssistant, formatNumber } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { isNumberValue, round } from "./utils";

/**
 *
 * @param hass The Home Assistant instance
 * @param config The Power Flow Card Plus configuration
 * @param value The value to display
 * @param options Different options to display the value
 * @returns value with unit, localized and rounded to the correct number of decimals
 */
export const displayValue = (
  hass: HomeAssistant,
  config: PowerFlowCardPlusConfig,
  value: number | string | null,
  {
    unit,
    unitWhiteSpace,
    decimals,
    accept_negative,
    watt_threshold = 1000,
  }: {
    unit?: string;
    unitWhiteSpace?: boolean;
    decimals?: number;
    accept_negative?: boolean;
    watt_threshold?: number;
  }
): string => {
  if (value === null) return "0";

  if (!isNumberValue(value)) return value.toString();

  const valueInNumber = Number(value);

  const transformValue = (v: number) => (!accept_negative ? Math.abs(v) : v);
  const transformedValue = transformValue(valueInNumber);

  const isKW = unit === undefined && Math.abs(transformedValue) >= watt_threshold;

  const decimalsToRound = typeof decimals === 'number' ? decimals : (isKW ? config.kw_decimals : config.w_decimals);

  const v = formatNumber(
    isKW ? round(transformedValue / 1000, decimalsToRound ?? 2) : round(transformedValue, decimalsToRound ?? 0),
    hass.locale
  );

  return `${v}${unitWhiteSpace === false ? "" : " "}${unit || (isKW ? "kW" : "W")}`;
};

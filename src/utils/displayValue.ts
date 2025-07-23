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

  var displayUnit: string;
  var displayNumber: number;
  var displayRound: number;

  if (valueInNumber >= 1000000000) {
    displayUnit = "GW";
    displayNumber = valueInNumber / 1000000000;
    displayRound = config.gw_decimals ?? 2;
  } else if (valueInNumber >= 1000000) {
    displayUnit = "MW";
    displayNumber = valueInNumber / 1000000;
    displayRound = config.mw_decimals ?? 2;
  } else if (valueInNumber >= watt_threshold) {
    displayUnit = "kW";
    displayNumber = valueInNumber / 1000;
    displayRound = config.kw_decimals ?? 2;
  } else {
    displayUnit = "W";
    displayNumber = valueInNumber;
    displayRound = config.w_decimals ?? 0;
  }

  const transformValue = (v: number) => (!accept_negative ? Math.abs(v) : v);

  const v = formatNumber(
    transformValue(round(displayNumber, displayRound)),
    hass.locale
  );

  return `${v}${unitWhiteSpace === false ? "" : " "}${unit || displayUnit}`;
};

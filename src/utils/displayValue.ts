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
    kilowatt_threshold = 1000000,
    megawatt_threshold = 1000000000,
    gigawatt_threshold = 1000000000000,
  }: {
    unit?: string;
    unitWhiteSpace?: boolean;
    decimals?: number;
    accept_negative?: boolean;
    watt_threshold?: number;
    kilowatt_threshold?: number;
    megawatt_threshold?: number;
    gigawatt_threshold?: number;
  }
): string => {
  if (value === null) return "0";

  if (!isNumberValue(value)) return value.toString();

  const valueInNumber = Number(value);

  const displayData: { unit: string; divisor: number; decimals: number } =
    valueInNumber >= gigawatt_threshold
      ? { unit: "TW", decimals: config.tw_decimals ?? 2, divisor: 1000000000000 }
      : valueInNumber >= megawatt_threshold
      ? { unit: "GW", decimals: config.gw_decimals ?? 2, divisor: 1000000000 }
      : valueInNumber >= kilowatt_threshold
      ? { unit: "MW", decimals: config.mw_decimals ?? 2, divisor: 1000000 }
      : valueInNumber >= watt_threshold
      ? { unit: "kW", decimals: config.kw_decimals ?? 2, divisor: 1000 }
      : { unit: "W", decimals: config.w_decimals ?? 0, divisor: 1 };

  const transformValue = (v: number) => (!accept_negative ? Math.abs(v) : v);

  const v = formatNumber(transformValue(round(valueInNumber / displayData.divisor, decimals ?? displayData.decimals)), hass.locale);

  return `${v}${unitWhiteSpace === false ? "" : " "}${unit || displayData.unit}`;
};

import { HomeAssistant, formatNumber } from "custom-card-helpers";
import { isNumberValue, round } from "./utils";

export const displayValue = ({
  hass,
  value,
  unit,
  unitWhiteSpace = true,
  decimals,
  watt_threshold,
}: {
  hass: HomeAssistant;
  value: number | string | null;
  unit?: string | undefined;
  unitWhiteSpace?: boolean | undefined;
  decimals?: number | undefined;
  watt_threshold: number;
}): string => {
  if (value === null) return "0";

  if (!isNumberValue(value)) return value.toString();

  const valueInNumber = Number(value);
  const isKW = unit === undefined && valueInNumber >= watt_threshold;
  const v = formatNumber(isKW ? round(valueInNumber / 1000, decimals ?? 2) : round(valueInNumber, decimals ?? 0), hass.locale);
  return `${v}${unitWhiteSpace === false ? "" : " "}${unit || (isKW ? "kW" : "W")}`;
};

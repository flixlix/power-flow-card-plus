import { HomeAssistant, formatNumber } from "custom-card-helpers";
import { isNumberValue, round } from "./utils";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { BaseConfigEntity } from "../type";

export interface DisplayValueOptions {
  unit?: string,
  unitWhiteSpace?: boolean,
  decimals?: number,
  wDecimals?: number,
  kwDecimals?: number,
  wattThreshold?: number,
}

export const displayValue = (
  hass: HomeAssistant,
  value: number | string | null,
  options: DisplayValueOptions | undefined,
): string => {
  if (value === null) return "0";

  if (!isNumberValue(value)) return value.toString();

  const valueInNumber = Number(value);
  const unit = options?.unit;
  const wattThreshold = options?.wattThreshold ?? 1000;
  const isKW = unit === undefined && valueInNumber >= wattThreshold;
  const decimals = options?.decimals ?? (isKW ? (options?.kwDecimals ?? 2) : (options?.wDecimals ?? 0));
  const v = formatNumber(isKW ? round(valueInNumber / 1000, decimals) : round(valueInNumber, decimals), hass.locale);
  return `${v}${options?.unitWhiteSpace === false ? "" : " "}${unit || (isKW ? "kW" : "W")}`;
};

export const getDisplayValueOptions = (
  mainConfig?: PowerFlowCardPlusConfig,
  entityConfig?: BaseConfigEntity,
): DisplayValueOptions | undefined => {
  const objs: ({
    unit?: string,
    unit_of_measurement?: string,
    unit_white_space?: boolean,
    decimals?: number,
    w_decimals?: number,
    kw_decimals?: number,
    watt_threshold?: number,
  } | undefined)[] = [entityConfig, mainConfig];
  return objs.filter(c => c).reduce<DisplayValueOptions | undefined>((p, c) => ({
    unit: p?.unit ?? c?.unit ?? c?.unit_of_measurement,
    unitWhiteSpace: p?.unitWhiteSpace ?? c?.unit_white_space,
    decimals: p?.decimals ?? c?.decimals,
    wDecimals: p?.wDecimals ?? c?.w_decimals,
    kwDecimals: p?.kwDecimals ?? c?.kw_decimals,
    wattThreshold: p?.wattThreshold ?? c?.watt_threshold,
  }), undefined);
}

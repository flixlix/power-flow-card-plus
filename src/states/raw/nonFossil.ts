import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getGridConsumptionState } from "./grid";
import { getEntityState } from "@/states/utils/getEntityState";
import { getSecondaryState } from "./base";
import { isEntityInverted } from "../utils/isEntityInverted";
import { adjustZeroTolerance } from "../tolerance/base";

export const getNonFossilHas = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const nonFossil = config.entities.fossil_fuel_percentage;
  const grid = config.entities.grid;
  const fossilPercentageEntity = nonFossil?.entity;
  const fossilPercentageDisplayZero = nonFossil?.display_zero;
  const rawPowerFromGrid = getGridConsumptionState(hass, config);
  const powerFromGrid = adjustZeroTolerance(rawPowerFromGrid, grid?.display_zero_tolerance);

  if (fossilPercentageEntity === undefined) return false;

  if (fossilPercentageDisplayZero === true) return true;

  if (powerFromGrid === null || powerFromGrid === 0) return false;

  const nonFossilDecimal = isEntityInverted(config, "fossil_fuel_percentage")
    ? (getEntityState(hass, fossilPercentageEntity) ?? 0) / 100
    : 1 - (getEntityState(hass, fossilPercentageEntity) ?? 0) / 100;
  const has = powerFromGrid * nonFossilDecimal > 0;


  return has;
};

export const getNonFossilSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) =>
  getSecondaryState(hass, config, "fossil_fuel_percentage");

export const getNonFossilState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const nonFossil = config.entities.fossil_fuel_percentage;
  const grid = config.entities.grid;
  const fossilPercentageEntity = nonFossil?.entity;
  const powerFromGrid = adjustZeroTolerance(getGridConsumptionState(hass, config), grid?.display_zero_tolerance);

  if (fossilPercentageEntity === undefined) return null;

  if (powerFromGrid === null) return null;

  if (getNonFossilHas(hass, config) === false) return 0;

  const nonFossilDecimal = isEntityInverted(config, "fossil_fuel_percentage")
    ? (getEntityState(hass, fossilPercentageEntity) ?? 0) / 100
    : 1 - (getEntityState(hass, fossilPercentageEntity) ?? 0) / 100;
  return powerFromGrid * nonFossilDecimal;
};

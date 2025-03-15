import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getGridConsumptionState } from "./grid";
import { getEntityState } from "@/states/utils/getEntityState";
import { getSecondaryState } from "./base";

export const getNonFossilHas = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const nonFossil = config.entities.fossil_fuel_percentage;
  const grid = config.entities.grid;
  const fossilPercentageEntity = nonFossil?.entity;
  const fossilPercentageDisplayZero = nonFossil?.display_zero;
  const gridFromGrid = getGridConsumptionState(hass, config);

  if (fossilPercentageEntity === undefined) return false;

  if (fossilPercentageDisplayZero === true) return true;

  if (gridFromGrid === null) return false;

  return gridFromGrid * 1 - (getEntityState(hass, fossilPercentageEntity) ?? 0) / 100 > 0;
};

export const getNonFossilHasPercentage = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const nonFossil = config.entities.fossil_fuel_percentage;
  const grid = config.entities.grid;
  const fossilPercentageEntity = nonFossil?.entity;
  const fossilPercentageDisplayZero = nonFossil?.display_zero;
  const gridFromGrid = getGridConsumptionState(hass, config);

  if (fossilPercentageEntity === undefined) return false;

  if (fossilPercentageDisplayZero === true) return true;

  if (gridFromGrid === null) return false;

  if (getNonFossilHas(hass, config) === false) return false;

  return gridFromGrid * 1 - (getEntityState(hass, fossilPercentageEntity) ?? 0) / 100 > 0;
};

export const getNonFossilSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) =>
  getSecondaryState(hass, config, "fossil_fuel_percentage");

export const getNonFossilState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const nonFossil = config.entities.fossil_fuel_percentage;
  const fossilPercentageEntity = nonFossil?.entity;
  const gridFromGrid = getGridConsumptionState(hass, config);

  if (fossilPercentageEntity === undefined) return null;

  if (gridFromGrid === null) return null;

  if (getNonFossilHas(hass, config) === false) return 0;

  return gridFromGrid * 1 - (getEntityState(hass, fossilPercentageEntity) ?? 0) / 100;
};

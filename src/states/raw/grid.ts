import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { isEntityInverted } from "../utils/isEntityInverted";
import { onlyNegative, onlyPositive } from "../utils/negativePositive";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";
import { isNumberValue } from "@/utils/utils";
import { getFirstEntityName } from "../utils/mutliEntity";

// Phase 1: grid state reads from entities.grid.house sub-key.
// Phase 2 will add grid_main state resolution.

export const getGridConsumptionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridHouse = (config.entities.grid as any)?.house;
  const entity = gridHouse?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    if (isEntityInverted(config, "grid")) return onlyPositive(state);
    return onlyNegative(state);
  }
  return getEntityStateWatts(hass, (entity as { production: string }).production);
};

export const getGridProductionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridHouse = (config.entities.grid as any)?.house;
  const entity = gridHouse?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    if (isEntityInverted(config, "grid")) return onlyNegative(state);
    return onlyPositive(state);
  }
  return getEntityStateWatts(hass, (entity as { consumption: string }).consumption);
};

export const getGridSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridHouse = (config.entities.grid as any)?.house;
  const entity = gridHouse?.secondary_info?.entity;
  if (typeof entity !== "string") return null;
  const entityObj = hass.states[getFirstEntityName(entity)];
  const secondaryState = entityObj.state;
  if (isNumberValue(secondaryState)) return Number(secondaryState);
  return secondaryState;
};

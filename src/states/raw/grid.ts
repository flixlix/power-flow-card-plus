import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { onlyNegative, onlyPositive } from "../utils/negativePositive";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";
import { isNumberValue } from "@/utils/utils";
import { getFirstEntityName } from "../utils/mutliEntity";

// Phase 2: grid state reads from entities.grid.house and entities.grid.main sub-keys.
// Note: isEntityInverted(config, "grid") was removed — it reads GridEntities.invert_state
// which is always undefined. invert_state lives on Grid (house/main), not GridEntities.

export const getGridConsumptionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridHouseConfig = (config.entities.grid as any)?.house;
  const entity = gridHouseConfig?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    if (!!gridHouseConfig?.invert_state) return onlyPositive(state);
    return onlyNegative(state);
  }
  return getEntityStateWatts(hass, (entity as { production: string }).production);
};

export const getGridProductionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridHouseConfig = (config.entities.grid as any)?.house;
  const entity = gridHouseConfig?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    if (!!gridHouseConfig?.invert_state) return onlyNegative(state);
    return onlyPositive(state);
  }
  return getEntityStateWatts(hass, (entity as { consumption: string }).consumption);
};

export const getGridSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridHouseConfig = (config.entities.grid as any)?.house;
  const entity = gridHouseConfig?.secondary_info?.entity;
  if (typeof entity !== "string") return null;
  const entityObj = hass.states[getFirstEntityName(entity)];
  const secondaryState = entityObj.state;
  if (isNumberValue(secondaryState)) return Number(secondaryState);
  return secondaryState;
};

export const getGridMainConsumptionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridMainConfig = (config.entities.grid as any)?.main;
  const entity = gridMainConfig?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    // Read invert_state directly from gridMainConfig — isEntityInverted(config, "grid") is broken for GridEntities
    if (!!gridMainConfig?.invert_state) return onlyPositive(state);
    return onlyNegative(state);
  }
  return getEntityStateWatts(hass, (entity as { production: string }).production);
};

export const getGridMainProductionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridMainConfig = (config.entities.grid as any)?.main;
  const entity = gridMainConfig?.entity;
  if (entity === undefined) return null;
  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);
    if (!!gridMainConfig?.invert_state) return onlyNegative(state);
    return onlyPositive(state);
  }
  return getEntityStateWatts(hass, (entity as { consumption: string }).consumption);
};

export const getGridMainSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const gridMainConfig = (config.entities.grid as any)?.main;
  const entity = gridMainConfig?.secondary_info?.entity;
  if (typeof entity !== "string") return null;
  const entityObj = hass.states[getFirstEntityName(entity)];
  const secondaryState = entityObj.state;
  if (isNumberValue(secondaryState)) return Number(secondaryState);
  return secondaryState;
};

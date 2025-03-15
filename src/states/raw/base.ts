import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { EntityType } from "@/type";
import { isNumberValue } from "@/utils/utils";
import { isEntityInverted } from "../utils/isEntityInverted";
import { onlyNegative, onlyPositive } from "../utils/negativePositive";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";
import { getFirstEntityName } from "../utils/mutliEntity";

export const getSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig, field: EntityType) => {
  const entity = config.entities?.[field]?.secondary_info?.entity;

  if (typeof entity !== "string") return null;

  const entityObj = hass.states[getFirstEntityName(entity)];
  const secondaryState = entityObj.state;

  if (isNumberValue(secondaryState)) return Number(secondaryState);

  return secondaryState;
};

export const getFieldInState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig, field: EntityType) => {
  const entity = config.entities[field]?.entity;

  if (entity === undefined) return null;

  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);

    if (isEntityInverted(config, field)) return onlyPositive(state);

    return onlyNegative(state);
  }
  return getEntityStateWatts(hass, entity!.production);
};

export const getFieldOutState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig, field: EntityType) => {
  const entity = config.entities[field]?.entity;

  if (entity === undefined) return null;

  if (typeof entity === "string") {
    const state = getEntityStateWatts(hass, entity);

    if (isEntityInverted(config, field)) return onlyNegative(state);

    return onlyPositive(state);
  }
  return getEntityStateWatts(hass, entity!.consumption);
};

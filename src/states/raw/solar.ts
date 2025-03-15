import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { isEntityInverted } from "../utils/isEntityInverted";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";
import { onlyNegative, onlyPositive } from "../utils/negativePositive";
import { getSecondaryState } from "./base";

export const getSolarState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const entity = config.entities.solar?.entity;

  if (entity === undefined) return null;

  const solarStateWatts = getEntityStateWatts(hass, entity);

  if (isEntityInverted(config, "solar")) return onlyNegative(solarStateWatts);

  return onlyPositive(solarStateWatts);
};

export const getSolarSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getSecondaryState(hass, config, "solar");

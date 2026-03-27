import { HassEntity } from "home-assistant-js-websocket";
import { isEntityAvailable } from "./existence-entity";
import { unavailableOrMisconfiguredError } from "@/utils/unavailable-error";
import { HomeAssistant } from "custom-card-helpers";
import { getFirstEntityName } from "./mutli-entity";

export const getEntityStateObj = (hass: HomeAssistant, entity: string | undefined): HassEntity | undefined => {
  if (!entity || !isEntityAvailable(hass, entity)) {
    unavailableOrMisconfiguredError(entity);
    return undefined;
  }

  return hass.states[getFirstEntityName(entity)];
};

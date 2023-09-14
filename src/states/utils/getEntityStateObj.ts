import { HassEntity } from "home-assistant-js-websocket";
import { isEntityAvailable } from "./existenceEntity";
import { unavailableOrMisconfiguredError } from "../../utils/unavailableError";
import { HomeAssistant } from "custom-card-helpers";

export const getEntityStateObj = (hass: HomeAssistant, entity: string | undefined): HassEntity | undefined => {
  if (!entity || !isEntityAvailable(hass, entity)) {
    unavailableOrMisconfiguredError(entity);
    return undefined;
  }
  return hass.states[entity];
};

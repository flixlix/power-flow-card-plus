import { HassEntity } from "home-assistant-js-websocket";
import { isEntityAvailable } from "./existenceEntity";
import { unavailableOrMisconfiguredError } from "../../utils/unavailableError";
import { HomeAssistant } from "custom-card-helpers";
import { getEntityNames } from "./mutliEntity";

export const getEntityStateObj = (hass: HomeAssistant, entity: string | undefined): HassEntity | undefined => {
  if (!entity || !isEntityAvailable(hass, entity)) {
    unavailableOrMisconfiguredError(entity);
    return undefined;
  }

  const ids = getEntityNames(entity);
  return hass.states[ids[0]];
};

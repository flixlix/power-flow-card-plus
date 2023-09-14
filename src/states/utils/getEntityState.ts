import { HomeAssistant } from "custom-card-helpers";
import { isEntityAvailable } from "./existenceEntity";
import { unavailableOrMisconfiguredError } from "../../utils/unavailableError";
import { coerceNumber } from "../../utils/utils";

export const getEntityState = (hass: HomeAssistant, entity: string | undefined): number | null => {
  if (!entity || !isEntityAvailable(hass, entity)) {
    unavailableOrMisconfiguredError(entity);
    return null;
  }
  return coerceNumber(hass.states[entity].state);
};

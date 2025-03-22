import { HomeAssistant } from "custom-card-helpers";
import { isNumberValue } from "@/utils/utils";
import { getEntityNames } from "./mutliEntity";

export const isEntityAvailable = (hass: HomeAssistant, entityId: string): boolean => {
  const ids = getEntityNames(entityId);
  for (const id of ids) {
    if (!isNumberValue(hass.states[id]?.state)) {
      // if one does not exist, the whole result should be false
      return false;
    }
  }

  // if we have multiple IDs, we can safely return true here.
  return ids.length > 0;
};

export const doesEntityExist = (hass: HomeAssistant, entityId: string): boolean => {
  const ids = getEntityNames(entityId);
  for (const id of ids) {
    if (!(id in hass.states)) {
      return false;
    }
  }

  return true;
};

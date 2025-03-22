import { HomeAssistant } from "custom-card-helpers";
import { isEntityAvailable } from "./existenceEntity";
import { unavailableOrMisconfiguredError } from "@/utils/unavailableError";
import { coerceNumber } from "@/utils/utils";
import { getEntityNames } from "./mutliEntity";

export const getEntityState = (hass: HomeAssistant, entity: string | undefined): number | null => {
  if (!entity || !isEntityAvailable(hass, entity)) {
    unavailableOrMisconfiguredError(entity);
    return null;
  }

  const ids = getEntityNames(entity);

  let endResult: number = 0;
  let tempNumber: number;
  for (const id of ids) {
    tempNumber = coerceNumber(hass.states[id].state);
    // somehow using += does not work here (maybe something with rollup?)
    endResult = endResult + tempNumber;
  }

  return endResult;
};

import { HomeAssistant } from "custom-card-helpers";
import { isNumberValue } from "../../utils/utils";

export const isEntityAvailable = (hass: HomeAssistant, entityId: string): boolean => isNumberValue(hass.states[entityId]?.state);

export const doesEntityExist = (hass: HomeAssistant, entityId: string): boolean => entityId in hass.states;

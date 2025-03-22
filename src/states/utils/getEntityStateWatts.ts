import { HomeAssistant } from "custom-card-helpers";
import { getEntityState } from "./getEntityState";
import { getFirstEntityName } from "./mutliEntity";

const prefixes = ["K", "M", "G", "T", "P", "E", "Z", "Y"];

export const getEntityStateWatts = (hass: HomeAssistant, entity: string | undefined): number => {
  const state = getEntityState(hass, entity);
  if (!entity || state === null) return 0;

  const unit = hass.states[getFirstEntityName(entity)].attributes.unit_of_measurement ?? "";

  return convertUnitToWatts(state, unit);
};

const convertUnitToWatts = (value: number, unit: string): number => {
  const prefix = unit.toUpperCase().slice(0, 1);
  const prefixIndex = prefixes.indexOf(prefix);

  if (prefixIndex > -1) return value * Math.pow(1000, prefixIndex + 1);
  return value;
};

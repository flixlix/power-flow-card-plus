import { HomeAssistant } from "custom-card-helpers";
import { getEntityState } from "./getEntityState";
import { getEntityNames } from "./mutliEntity";

const prefixes = ["K", "M", "G", "T", "P", "E", "Z", "Y"];

export const getEntityStateWatts = (hass: HomeAssistant, entity: string | undefined): number => {
  const state = getEntityState(hass, entity);
  if (!entity || state === null) return 0;
  const ids = getEntityNames(entity);

  const unit = hass.states[ids[0]].attributes.unit_of_measurement ?? "";

  return convertUnitToWatts(state, unit);
};

const convertUnitToWatts = (value: number, unit: string): number => {
  const prefix = unit.toUpperCase().slice(0, 1);
  const prefixIndex = prefixes.indexOf(prefix);

  if (prefixIndex > -1) return value * Math.pow(1000, prefixIndex + 1);
  return value;
};

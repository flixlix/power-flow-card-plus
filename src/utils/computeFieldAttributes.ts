import { HomeAssistant } from "custom-card-helpers";
import { getEntityStateObj } from "../states/utils/getEntityStateObj";

export const computeFieldIcon = (hass: HomeAssistant, field: any, fallback: string): string => {
  if (field?.icon) return field.icon;
  if (field?.use_metadata) return getEntityStateObj(hass, field.entity)?.attributes?.icon || "";
  return fallback;
};

export const computeFieldName = (hass: HomeAssistant, field: any, fallback: string): string => {
  if (field?.name) return field.name;
  if (field?.use_metadata) return getEntityStateObj(hass, field.entity)?.attributes?.friendly_name || "";
  return fallback;
};
import { HomeAssistant } from "custom-card-helpers";
import { getEntityStateObj } from "../states/utils/getEntityStateObj";
import { BaseConfigEntity } from "../type";
import { ConfigEntity } from "../power-flow-card-plus-config";

export const computeFieldIcon = (hass: HomeAssistant, field: ConfigEntity | undefined, fallback: string): string => {
  if (field?.icon) return field.icon;

  if (field?.use_metadata) {
    if (typeof field?.entity === "string") return getEntityStateObj(hass, field?.entity)?.attributes?.icon || fallback;

    return (
      getEntityStateObj(hass, field?.entity?.consumption)?.attributes?.icon ||
      getEntityStateObj(hass, field?.entity?.production)?.attributes?.icon ||
      fallback
    );
  }

  return fallback;
};

export const computeFieldName = (hass: HomeAssistant, field: ConfigEntity | undefined, fallback: string): string => {
  if (field?.name) return field.name;

  if (field?.use_metadata) {
    if (typeof field?.entity === "string") return getEntityStateObj(hass, field.entity)?.attributes?.friendly_name || fallback;

    return (
      getEntityStateObj(hass, field?.entity?.consumption)?.attributes?.friendly_name ||
      getEntityStateObj(hass, field?.entity?.production)?.attributes?.friendly_name ||
      fallback
    );
  }

  return fallback;
};

import { HomeAssistant } from "custom-card-helpers";
import { getEntityStateObj } from "../states/utils/getEntityStateObj";
import { BaseConfigEntity } from "../type";
import { ConfigEntity } from "../power-flow-card-plus-config";

export const computeFieldIcon = (hass: HomeAssistant, field: ConfigEntity | undefined, fallback: string): string => {
  const f = field as any;
  if (f?.icon) return f.icon;

  if (f?.use_metadata) {
    if (typeof f?.entity === "string") return getEntityStateObj(hass, f?.entity)?.attributes?.icon || fallback;

    return (
      getEntityStateObj(hass, f?.entity?.consumption)?.attributes?.icon ||
      getEntityStateObj(hass, f?.entity?.production)?.attributes?.icon ||
      fallback
    );
  }

  return fallback;
};

export const computeFieldName = (hass: HomeAssistant, field: ConfigEntity | undefined, fallback: string): string => {
  const f = field as any;
  if (f?.name) return f.name;

  if (f?.use_metadata) {
    if (typeof f?.entity === "string") return getEntityStateObj(hass, f.entity)?.attributes?.friendly_name || fallback;

    return (
      getEntityStateObj(hass, f?.entity?.consumption)?.attributes?.friendly_name ||
      getEntityStateObj(hass, f?.entity?.production)?.attributes?.friendly_name ||
      fallback
    );
  }

  return fallback;
};

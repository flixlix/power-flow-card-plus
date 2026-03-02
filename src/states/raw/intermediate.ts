import { HomeAssistant } from "custom-card-helpers";
import { IntermediateEntity } from "@/power-flow-card-plus-config";
import { getEntityState } from "../utils/getEntityState";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";

export const getIntermediateState = (hass: HomeAssistant, cfg: IntermediateEntity): number => {
  if (!cfg.entity) return 0;
  return getEntityStateWatts(hass, cfg.entity) ?? 0;
};

export const getIntermediateFlowFromGridHouseState = (hass: HomeAssistant, cfg: IntermediateEntity): number => {
  if (!cfg.flowFromGridHouse) return 0;
  return getEntityStateWatts(hass, cfg.flowFromGridHouse) ?? 0;
};

export const getIntermediateFlowFromGridMainState = (hass: HomeAssistant, cfg: IntermediateEntity): number => {
  if (!cfg.flowFromGridMain) return 0;
  return getEntityStateWatts(hass, cfg.flowFromGridMain) ?? 0;
};

export const getIntermediateSecondaryState = (hass: HomeAssistant, cfg: IntermediateEntity): string | number | null => {
  if (!cfg.secondary_info?.entity) return null;
  return getEntityState(hass, cfg.secondary_info.entity);
};

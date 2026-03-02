import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getEntityState } from "../utils/getEntityState";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";

// Power consumption sensor — uses getEntityStateWatts (sensor reports in W or kW)
export const getHeatpumpState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number => {
  const entity = config.entities.heatpump?.entity;
  if (!entity) return 0;
  return getEntityStateWatts(hass, entity) ?? 0;
};

// COP — dimensionless ratio; use getEntityState (NOT getEntityStateWatts — would corrupt ratio)
// Returns null when entity unavailable/unknown (triggers hidden COP span)
export const getHeatpumpCopState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number | null => {
  const entity = config.entities.heatpump?.cop;
  if (!entity) return null;
  return getEntityState(hass, entity);
};

// Flow sensors — report watts, so use getEntityStateWatts
export const getHeatpumpFlowFromGridHouseState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number => {
  const entity = config.entities.heatpump?.flow_from_grid_house;
  if (!entity) return 0;
  return getEntityStateWatts(hass, entity) ?? 0;
};

export const getHeatpumpFlowFromGridMainState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number => {
  const entity = config.entities.heatpump?.flow_from_grid_main;
  if (!entity) return 0;
  return getEntityStateWatts(hass, entity) ?? 0;
};

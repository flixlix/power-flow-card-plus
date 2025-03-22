import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getFieldInState, getFieldOutState } from "./base";
import { getEntityState } from "../utils/getEntityState";

export const getBatteryStateOfCharge = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const entity = config.entities.battery?.state_of_charge;

  if (entity === undefined) return null;

  return getEntityState(hass, entity);
};

export const getBatteryInState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getFieldInState(hass, config, "battery");

export const getBatteryOutState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getFieldOutState(hass, config, "battery");

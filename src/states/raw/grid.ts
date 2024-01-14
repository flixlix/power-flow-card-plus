import { HomeAssistant } from "custom-card-helpers";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";
import { isEntityInverted } from "../utils/isEntityInverted";
import { PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";
import { onlyNegative, onlyPositive } from "../utils/negativePositive";
import { getFieldInState, getFieldOutState, getSecondaryState } from "./base";

export const getGridConsumptionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getFieldOutState(hass, config, "grid");

export const getGridProductionState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getFieldInState(hass, config, "grid");

export const getGridSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getSecondaryState(hass, config, "grid");

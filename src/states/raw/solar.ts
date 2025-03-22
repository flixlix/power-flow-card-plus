import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";
import { isEntityInverted } from "../utils/isEntityInverted";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";
import { onlyNegative, onlyPositive } from "../utils/negativePositive";
import { getSecondaryState } from "./base";

const getState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig,  entity: string | undefined) => {
  if (entity === undefined){
    return null;
  }

  const solarStateWatts = getEntityStateWatts(hass, entity);

  if (isEntityInverted(config, "solar")){
    return onlyNegative(solarStateWatts);
  }
  return onlyPositive(solarStateWatts);
}

export const getSolar1State = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  return getState(hass,config,config.entities.solar?.entity)
};

export const getSolar2State = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  return getState(hass,config,config.entities.solar?.entity2)
};

export const getTotalSolarState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig)=> {
  const solar1State = getSolar1State(hass, config) ?? 0;
  const solar2State = getSolar2State(hass, config) ?? 0;

  return onlyPositive(solar1State + solar2State);
}

export const getSolarSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getSecondaryState(hass, config, "solar");

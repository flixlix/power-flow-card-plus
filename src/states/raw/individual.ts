import { HomeAssistant } from "custom-card-helpers";
import { getEntityStateWatts } from "../utils/getEntityStateWatts";
import { isEntityInverted } from "../utils/isEntityInverted";
import { PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";
import { onlyNegative } from "../utils/negativePositive";
import { EntityType } from "../../type";
import { isNumberValue } from "../../utils/utils";
import { getSecondaryState } from "./base";

export const getIndividualState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig, field: EntityType) => {
  const entity = config.entities.individual1?.entity;

  if (entity === undefined) return null;

  const individualStateWatts = getEntityStateWatts(hass, entity);

  if (isEntityInverted(config, field)) return Math.abs(individualStateWatts * -1);

  return Math.abs(individualStateWatts);
};

export const getIndividualSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig, field: EntityType) =>
  getSecondaryState(hass, config, field);

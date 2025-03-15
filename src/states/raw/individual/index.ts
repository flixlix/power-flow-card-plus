import { HomeAssistant } from "custom-card-helpers";
import { getEntityStateWatts } from "@/states/utils/getEntityStateWatts";
import { IndividualDeviceType } from "@/type";
import { isNumberValue } from "@/utils/utils";
import { getEntityStateObj } from "@/states/utils/getEntityStateObj";

export const getIndividualState = (hass: HomeAssistant, field: IndividualDeviceType) => {
  const entity: string = field?.entity;

  if (entity === undefined) return null;

  const individualStateWatts = getEntityStateWatts(hass, entity);

  return Math.abs(individualStateWatts);
};

export const getIndividualSecondaryState = (hass: HomeAssistant, field: IndividualDeviceType) => {
  if (typeof field?.entity !== "string") return null;

  const entityObj = getEntityStateObj(hass, field?.secondary_info?.entity);
  const secondaryState = entityObj?.state;

  if (isNumberValue(secondaryState)) return Number(secondaryState);

  return secondaryState;
};

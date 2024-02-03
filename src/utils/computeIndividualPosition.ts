import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";

const filterUnusedIndividualObjs = (individualObjs: IndividualObject[]): IndividualObject[] => {
  const cloneIndividualObjs = JSON.parse(JSON.stringify(individualObjs)) as IndividualObject[];
  const individualObjsWithHas = cloneIndividualObjs.filter((i) => i?.has);
  return individualObjsWithHas;
};

const getIndividualObjSortPowerMode = (individualObjs: IndividualObject[], index: number): IndividualObject | undefined => {
  const filteredIndividualObjs = filterUnusedIndividualObjs(individualObjs);
  return filteredIndividualObjs?.[index] ?? undefined;
};

export const getTopLeftIndividual = (config: PowerFlowCardPlusConfig, individualObjs: IndividualObject[]): IndividualObject | undefined => {
  const mode = config.individual_mode_config?.mode;
  switch (mode) {
    case "sort_power": {
      return getIndividualObjSortPowerMode(individualObjs, 0);
    }
    default:
      return undefined;
  }
};

export const getBottomLeftIndividual = (config: PowerFlowCardPlusConfig, individualObjs: IndividualObject[]): IndividualObject | undefined => {
  const mode = config.individual_mode_config?.mode;
  switch (mode) {
    case "sort_power": {
      return getIndividualObjSortPowerMode(individualObjs, 1);
    }
    default:
      return undefined;
  }
};

export const getTopRightIndividual = (config: PowerFlowCardPlusConfig, individualObjs: IndividualObject[]): IndividualObject | undefined => {
  const mode = config.individual_mode_config?.mode;
  switch (mode) {
    case "sort_power": {
      return getIndividualObjSortPowerMode(individualObjs, 2);
    }
    default:
      return undefined;
  }
};

export const getBottomRightIndividual = (config: PowerFlowCardPlusConfig, individualObjs: IndividualObject[]): IndividualObject | undefined => {
  const mode = config.individual_mode_config?.mode;
  switch (mode) {
    case "sort_power": {
      return getIndividualObjSortPowerMode(individualObjs, 3);
    }
    default:
      return undefined;
  }
};

export const checkHasRightIndividual = (config: PowerFlowCardPlusConfig, individualObjs: IndividualObject[]): boolean =>
  !!getTopRightIndividual(config, individualObjs) || !!getBottomRightIndividual(config, individualObjs);

export const checkHasBottomIndividual = (config: PowerFlowCardPlusConfig, individualObjs: IndividualObject[]): boolean =>
  !!getBottomLeftIndividual(config, individualObjs) || !!getBottomRightIndividual(config, individualObjs);

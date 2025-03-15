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

export const getTopLeftIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  return getIndividualObjSortPowerMode(individualObjs, 0);
};

export const getBottomLeftIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  return getIndividualObjSortPowerMode(individualObjs, 1);
};

export const getTopRightIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  return getIndividualObjSortPowerMode(individualObjs, 2);
};

export const getBottomRightIndividual = (individualObjs: IndividualObject[]): IndividualObject | undefined => {
  return getIndividualObjSortPowerMode(individualObjs, 3);
};

export const checkHasRightIndividual = (individualObjs: IndividualObject[]): boolean =>
  !!getTopRightIndividual(individualObjs) || !!getBottomRightIndividual(individualObjs);

export const checkHasBottomIndividual = (individualObjs: IndividualObject[]): boolean =>
  !!getBottomLeftIndividual(individualObjs) || !!getBottomRightIndividual(individualObjs);

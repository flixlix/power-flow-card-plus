import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

export const checkShouldShowDots = (config: PowerFlowCardPlusConfig) => {
  return config.disable_dots !== true;
};

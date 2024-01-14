import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

export const showLine = (config: PowerFlowCardPlusConfig, power: number): boolean => {
  if (power > 0) return true;
  return config?.display_zero_lines?.mode !== "hide";
};

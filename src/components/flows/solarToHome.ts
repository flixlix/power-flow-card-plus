import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

// Solar→Home curve is now drawn inline in the Col D spacer (power-flow-card-plus.ts)
export const flowSolarToHome = (_config: PowerFlowCardPlusConfig, _flows: Flows) => {
  return "";
};

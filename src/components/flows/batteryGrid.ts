import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

type FlowBatteryGridFlows = Pick<Flows, Exclude<keyof Flows, "solar">>;

// Battery↔Grid curve is now drawn inline in the Col D spacer (power-flow-card-plus.ts)
export const flowBatteryGrid = (_config: PowerFlowCardPlusConfig, _flows: FlowBatteryGridFlows) => {
  return "";
};

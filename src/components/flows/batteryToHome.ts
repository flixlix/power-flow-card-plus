import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

type FlowBatteryToHomeFlows = Pick<Flows, Exclude<keyof Flows, "solar">>;

// Battery→Home curve is now drawn inline in the Col D spacer (power-flow-card-plus.ts)
export const flowBatteryToHome = (_config: PowerFlowCardPlusConfig, _flows: FlowBatteryToHomeFlows) => {
  return "";
};

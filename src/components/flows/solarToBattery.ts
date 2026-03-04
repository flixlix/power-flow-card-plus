import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

type FlowSolarToBatteryFlows = Pick<Flows, Exclude<keyof Flows, "grid">>;

export const flowSolarToBattery = (_config: PowerFlowCardPlusConfig, _flows: FlowSolarToBatteryFlows) => {
  // Solar-to-battery vertical line is now drawn inline within the solar and battery circle-containers
  // (see solar.ts and battery.ts) to match how individual/nonFossil vertical lines are drawn.
  return "";
};

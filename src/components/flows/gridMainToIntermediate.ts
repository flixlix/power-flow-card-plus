import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

type FlowsWithGridMainAndIntermediate = Flows & { gridMain: any; intermediateObjs: any[] };

// GridMain→Intermediate curves are now drawn inline in the Col B spacer (power-flow-card-plus.ts)
export const flowGridMainToIntermediate = (_config: PowerFlowCardPlusConfig, _flows: FlowsWithGridMainAndIntermediate, _index: number) => {
  return "";
};

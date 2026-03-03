import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

type FlowsWithIntermediate = Flows & { intermediateObjs: any[] };

// GridHouse→Intermediate curves are now drawn inline in the Col B spacer (power-flow-card-plus.ts)
export const flowGridHouseToIntermediate = (
  _config: PowerFlowCardPlusConfig,
  _flows: FlowsWithIntermediate,
  _index: number
) => {
  return "";
};

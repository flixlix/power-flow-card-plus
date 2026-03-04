import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

type FlowsWithGridMain = Flows & { gridMain: any };

export const flowGridMainToGridHouse = (_config: PowerFlowCardPlusConfig, _flows: FlowsWithGridMain) => {
  // GridMain-to-grid horizontal line is now drawn inline within the spacer between them
  // (see power-flow-card-plus.ts middle row) to match how individual/nonFossil vertical lines are drawn.
  return "";
};

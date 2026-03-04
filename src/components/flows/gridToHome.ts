import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { type Flows } from "./index";

export const flowGridToHome = (_config: PowerFlowCardPlusConfig, _flows: Flows) => {
  // Grid-to-home horizontal line is now drawn inline within the spacer between them
  // (see power-flow-card-plus.ts middle row) to match how individual/nonFossil vertical lines are drawn.
  return "";
};

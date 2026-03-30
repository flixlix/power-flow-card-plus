import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";

export const checkShouldShowDots = (config: PowerFlowCardPlusConfig) => {
  if (config.disable_dots === true) {
    return false;
  }
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return false;
  }
  return true;
};

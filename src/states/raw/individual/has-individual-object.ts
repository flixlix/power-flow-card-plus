import { isAboveTolerance } from "@/states/tolerance/base";

export const hasIndividualObject = (displayZero: boolean, state: number | null, minimumVisiblePower: number) => {
  if (displayZero) return true;
  if (isAboveTolerance(state, minimumVisiblePower)) return true;
  return false;
};

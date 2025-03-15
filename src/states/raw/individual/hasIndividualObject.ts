import { isAboveTolerance } from "@/states/tolerance/base";

export const hasIndividualObject = (displayZero: boolean, state: number | null, tolerance: number) => {
  if (displayZero) return true;
  if (isAboveTolerance(state, tolerance)) return true;
  return false;
};

import { HomeSources } from "../type";

export const computeColor = (colorType: boolean | string | undefined, homeSources: HomeSources, homeLargestSource: string): string => {
  let iconHomeColor: string = "var(--primary-text-color)";
  if (typeof colorType === "string") iconHomeColor = homeSources[colorType].color;
  if (colorType === true) iconHomeColor = homeSources[homeLargestSource].color;
  return iconHomeColor;
};

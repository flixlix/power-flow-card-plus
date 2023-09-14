export const convertColorListToHex = (colorList: number[]): string => {
  return "#".concat(colorList.map((x) => x.toString(16).padStart(2, "0")).join(""));
};

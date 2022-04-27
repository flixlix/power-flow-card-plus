export const roundValue = (value: number, decimalPlaces: number): number => {
  const factorOfTen = 10 ** decimalPlaces;
  return Math.round(value * factorOfTen) / factorOfTen;
};

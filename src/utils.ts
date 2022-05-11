/* eslint-disable no-redeclare */
export function coerceNumber(value: any): number;
export function coerceNumber<D>(value: any, fallback: D): number | D;
export function coerceNumber(value: any, fallbackValue = 0) {
  return _isNumberValue(value) ? Number(value) : fallbackValue;
}

export const round = (value: number, decimalPlaces: number): number =>
  Number(
    `${Math.round(Number(`${value}e${decimalPlaces}`))}e-${decimalPlaces}`
  );

export function _isNumberValue(value: any): boolean {
  // parseFloat(value) handles most of the cases we're interested in (it treats null, empty string,
  // and other non-number values as NaN, where Number just uses 0) but it considers the string
  // '123hello' to be a valid number. Therefore we also check if Number(value) is NaN.
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(parseFloat(value as any)) && !isNaN(Number(value));
}

/* eslint-disable no-redeclare */
export const round = (value: number, decimalPlaces: number): number => Number(`${Math.round(Number(`${value}e${decimalPlaces}`))}e-${decimalPlaces}`);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export function isNumberValue(value: any): boolean {
  // parseFloat(value) handles most of the cases we're interested in (it treats null, empty string,
  // and other non-number values as NaN, where Number just uses 0) but it considers the string
  // '123hello' to be a valid number. Therefore we also check if Number(value) is NaN.
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(parseFloat(value as any)) && !isNaN(Number(value));
}

export function coerceNumber(value: any): number;
export function coerceNumber<D>(value: any, fallback: D): number | D;
export function coerceNumber(value: any, fallbackValue = 0) {
  return isNumberValue(value) ? Number(value) : fallbackValue;
}

export function coerceStringArray(value: any, separator: string | RegExp = /\s+/): string[] {
  const result: string[] = [];

  if (value != null) {
    const sourceValues = Array.isArray(value) ? value : `${value}`.split(separator);
    for (const sourceValue of sourceValues) {
      const trimmedString = `${sourceValue}`.trim();
      if (trimmedString) {
        result.push(trimmedString);
      }
    }
  }

  return result;
}

export const isAboveTolerance = (value: number | null, tolerance: number): boolean => !!value && value >= tolerance;

export const adjustZeroTolerance = (value: number | null, tolerance: number | undefined): number => {
  if (!value) return 0;
  if (!tolerance) return value;

  return isAboveTolerance(value, tolerance) ? value : 0;
};

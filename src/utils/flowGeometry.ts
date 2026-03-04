export interface FlowGeometry {
  numCols: number;
  rowMaxWidth: number;
  cols: {
    nonFossil: number;
    gridMain: number; // -1 if no gridMain
    intermediate: number; // -1 if no gridMain
    gridHouse: number;
    solar: number;
    home: number;
    rightIndiv: number; // -1 if no right section
  };
  hasGridMain: boolean;
}

export function computeFlowGeometry(hasGridMain: boolean, hasRightSection: boolean): FlowGeometry {
  const numCols = (hasGridMain ? 3 : 1) + 2 + (hasRightSection ? 1 : 0);
  const rowMaxWidth = numCols * 140 - 60;

  let cols: FlowGeometry["cols"];

  if (hasGridMain) {
    cols = {
      nonFossil: 0,
      gridMain: 0,
      intermediate: 1,
      gridHouse: 2,
      solar: 3,
      home: 4,
      rightIndiv: hasRightSection ? 5 : -1,
    };
  } else {
    cols = {
      nonFossil: 0,
      gridMain: -1,
      intermediate: -1,
      gridHouse: 0,
      solar: 1,
      home: 2,
      rightIndiv: hasRightSection ? 3 : -1,
    };
  }

  return { numCols, rowMaxWidth, cols, hasGridMain };
}

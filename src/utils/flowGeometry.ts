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

/**
 * Returns inline style string for a flow container spanning from one column to another.
 * Uses CSS calc() so positions track space-between layout at any card width.
 *
 * space-between with N items of 80px width:
 *   center(i) = 40px + i/(N-1) * (100% - 80px)
 */
export function flowStyle(geo: FlowGeometry, fromCol: number, toCol: number, top: number, height: number): string {
  const N = geo.numCols;
  if (N <= 1) return `left:0;width:100%;top:${top}px;height:${height}px;`;

  const f1 = fromCol / (N - 1);
  const f2 = toCol / (N - 1);

  // left = 40 - f1*80 + f1*100%
  const lPx = (40 - f1 * 80).toFixed(1);
  const lPct = (f1 * 100).toFixed(2);

  // width = (f2-f1)*100% - (f2-f1)*80
  const df = f2 - f1;
  const wPx = (-df * 80).toFixed(1);
  const wPct = (df * 100).toFixed(2);

  return `left:calc(${lPx}px + ${lPct}%);width:calc(${wPx}px + ${wPct}%);top:${top}px;height:${height}px;`;
}

/** Style for a thin vertical flow centered on a single column. */
export function flowStyleVertical(geo: FlowGeometry, col: number, top: number, height: number, halfWidth = 5): string {
  const N = geo.numCols;
  if (N <= 1) return `left:calc(50% - ${halfWidth}px);width:${halfWidth * 2}px;top:${top}px;height:${height}px;`;

  const f = col / (N - 1);
  const lPx = (40 - f * 80 - halfWidth).toFixed(1);
  const lPct = (f * 100).toFixed(2);

  return `left:calc(${lPx}px + ${lPct}%);width:${halfWidth * 2}px;top:${top}px;height:${height}px;`;
}

/** Estimated pixel width of a flow container between two columns at max card width. */
export function flowPixelWidth(geo: FlowGeometry, fromCol: number, toCol: number): number {
  const N = geo.numCols;
  if (N <= 1) return geo.rowMaxWidth;
  const df = Math.abs((toCol - fromCol) / (N - 1));
  return Math.round(df * (geo.rowMaxWidth - 80));
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

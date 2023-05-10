export default function getElementWidth(element: HTMLElement | null): number {
  const elementStyles = getComputedStyle(element || document.body);
  const { width } = elementStyles;

  // Parse the width value and extract the numeric portion
  const numericWidth = parseFloat(width);

  // Check if the value is valid, otherwise return 0
  if (Number.isNaN(numericWidth)) {
    return 0;
  }

  // Return the width value
  return numericWidth;
}

export const getEntityNames = (entities: string): string[] => {
  return entities?.split("|").map((p) => p.trim());
};

export const getFirstEntityName = (entities: string): string => {
  const names = getEntityNames(entities);

  return names.length > 0 ? names[0] : "";
};

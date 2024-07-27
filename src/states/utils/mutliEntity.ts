export const getEntityNames = (name: string): string[] => {
    return name?.split("|").map(p => p.trim());
}
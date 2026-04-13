export const mainStickerAnchors = ["grid", "solar", "battery", "home"] as const;

export type MainStickerAnchor = (typeof mainStickerAnchors)[number];
export type StickerAnchor = MainStickerAnchor | `individual:${string}`;

export const isMainStickerAnchor = (anchor: unknown): anchor is MainStickerAnchor =>
  typeof anchor === "string" && (mainStickerAnchors as readonly string[]).includes(anchor);

export const isIndividualStickerAnchor = (anchor: unknown): anchor is `individual:${string}` =>
  typeof anchor === "string" && anchor.startsWith("individual:") && anchor.length > "individual:".length;

export const isStickerAnchor = (anchor: unknown): anchor is StickerAnchor => isMainStickerAnchor(anchor) || isIndividualStickerAnchor(anchor);

export const makeIndividualStickerAnchor = (entityId: string): StickerAnchor => `individual:${entityId}`;

export const getIndividualEntityIdFromStickerAnchor = (anchor: unknown): string | undefined =>
  isIndividualStickerAnchor(anchor) ? anchor.slice("individual:".length) : undefined;

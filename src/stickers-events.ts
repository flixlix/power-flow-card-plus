import { StickerConfig } from "@/type";

export const STICKERS_CONFIG_CHANGED_EVENT = "power-flow-card-plus-stickers-config-changed";
export const STICKERS_EDITOR_ACTIVE_ATTRIBUTE = "data-power-flow-card-plus-stickers-editor-open";

export type StickersConfigChangedDetail = {
  index?: number;
  stickers: StickerConfig[];
};

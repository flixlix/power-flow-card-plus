import { formatNumber } from "custom-card-helpers";
import { html, nothing } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";
import { displayValue } from "@/utils/display-value";
import { isStickerAnchor } from "@/utils/sticker-anchor";
import { isNumberValue } from "@/utils/utils";
import { StickerConfig } from "@/type";

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const isWattBasedUnit = (unit: string): boolean => /^[kMGTPEZY]?W$/i.test(unit.replace(/\s+/g, ""));

const getNormalizedStickerIcon = (sticker: StickerConfig, entity: any): string => {
  if (sticker.icon === "" || sticker.icon === " ") return "";
  if (typeof sticker.icon === "string") return sticker.icon;
  return entity?.attributes?.icon || "mdi:circle-outline";
};

const normalizeSticker = (sticker: StickerConfig): StickerConfig => ({
  ...sticker,
  anchor: isStickerAnchor(sticker.anchor) ? sticker.anchor : undefined,
  hide_with_anchor: sticker.hide_with_anchor !== false,
  offset_x: toOptionalNumber(sticker.offset_x) ?? 0,
  offset_y: toOptionalNumber(sticker.offset_y) ?? 0,
  name_inside_circle: sticker.name_inside_circle !== false,
  show_circle: sticker.show_circle !== false,
  inherit_circle_color: sticker.inherit_circle_color !== false,
  unit_white_space: sticker.unit_white_space !== false,
  x_position: clamp(Number(sticker.x_position ?? 50), 0, 100),
  y_position: clamp(Number(sticker.y_position ?? 50), 0, 100),
  scale: clamp(Number(sticker.scale ?? 100), 1, 100),
});
const toOptionalNumber = (value: unknown): number | undefined => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const getStickerStateToDisplay = (main: PowerFlowCardPlus, config: PowerFlowCardPlusConfig, sticker: StickerConfig, entity: any): string => {
  const state = entity?.state;
  const unit = entity?.attributes?.unit_of_measurement;
  const decimals = entity?.attributes?.display_precision ?? entity?.attributes?.suggested_display_precision;

  if (state === undefined || state === null || state === "") {
    return "";
  }

  if (!isNumberValue(state)) {
    return String(state);
  }

  if (unit !== undefined && unit !== null && unit !== "") {
    if (isWattBasedUnit(String(unit))) {
      return displayValue(main.hass, config, getEntityStateWatts(main.hass, entity?.entity_id), {
        unitWhiteSpace: sticker.unit_white_space,
        watt_threshold: config.watt_threshold,
      });
    }

    return displayValue(main.hass, config, Number(state), {
      unit,
      unitWhiteSpace: sticker.unit_white_space,
      decimals,
      watt_threshold: config.watt_threshold,
    });
  }

  return formatNumber(Number(state), main.hass.locale, {
    maximumFractionDigits: typeof decimals === "number" ? decimals : 2,
  });
};

export const stickersElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  stickerOverrides: StickerConfig[] = config.stickers || []
) => {
  const editable = main.isStickerPreviewEditingEnabled();
  const stickers = stickerOverrides
    .map((sticker, index) => ({
      sticker: normalizeSticker(sticker),
      index,
    }))
    .filter(({ sticker }) => sticker.entity)
    .filter(({ sticker }) => !(sticker.hide_with_anchor && sticker.anchor && !main.isStickerAnchorVisible(sticker.anchor)));
  if (!stickers.length) {
    return nothing;
  }

  const preventEntityClick = config.clickable_entities === false;
  const disableEntityClick = preventEntityClick || editable;

  return html`
    <div class="stickers-layer ${editable ? "stickers-layer--editable" : ""}">
      ${stickers.map(({ sticker, index }) => {
        const entity = main.hass.states[sticker.entity];
        const icon = getNormalizedStickerIcon(sticker, entity);
        const name = sticker.name === undefined ? entity?.attributes?.friendly_name || sticker.entity : sticker.name;
        const state = getStickerStateToDisplay(main, config, sticker, entity);
        const position = main.getStickerCssPosition(sticker);
        const showNameInsideCircle = sticker.name_inside_circle === true;
        const showCircle = sticker.show_circle !== false;
        const inheritCircleColor = sticker.inherit_circle_color === true;
        const raiseState = showCircle && !!state && (!!icon || (showNameInsideCircle && !!name));

        return html`
          <div
            class="sticker-node ${inheritCircleColor ? "inherit-circle-color" : ""} ${editable ? "sticker-node--editable" : ""} ${main.isStickerDragging(index) ? "sticker-node--dragging" : ""}"
            data-inherit-circle-color=${inheritCircleColor ? "true" : "false"}
            data-sticker-index=${String(index)}
            data-sticker-source-anchor=${sticker.anchor ?? ""}
            style="left:${position.left}; top:${position.top}; --sticker-scale:${(sticker.scale ?? 100) / 100};"
          >
            ${!showNameInsideCircle ? html`<span class="label sticker-label">${name}</span>` : nothing}
            <div
              class="circle sticker-circle ${preventEntityClick ? "pointer-events-none" : ""} ${showCircle ? "" : "sticker-circle--hidden"} ${showNameInsideCircle ? "sticker-circle--name-inside" : ""}"
              data-sticker-index=${String(index)}
              data-sticker-source-anchor=${sticker.anchor ?? ""}
              tabindex=${disableEntityClick ? "-1" : "0"}
              @click=${(ev: MouseEvent) => {
                if (disableEntityClick) return;
                main.onEntityClick(ev, undefined, sticker.entity);
              }}
              @keyDown=${(ev: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
                if (disableEntityClick) return;
                if (ev.key === "Enter") {
                  main.openDetails(ev, undefined, sticker.entity, "tap");
                }
              }}
              @pointerdown=${editable ? ((ev: PointerEvent) => main.onStickerPointerDown(ev, index)) : undefined}
              @pointermove=${editable ? ((ev: PointerEvent) => main.onStickerPointerMove(ev)) : undefined}
              @pointerup=${editable ? ((ev: PointerEvent) => main.onStickerPointerUp(ev)) : undefined}
              @pointercancel=${editable ? ((ev: PointerEvent) => main.onStickerPointerCancel(ev)) : undefined}
            >
              <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
              ${icon ? html`<ha-icon .icon=${icon}></ha-icon>` : nothing}
              ${showNameInsideCircle && name ? html`<span class="sticker-inner-name">${name}</span>` : nothing}
              ${state ? html`<span class="sticker-state ${raiseState ? "sticker-state--raised" : ""}">${state}</span>` : nothing}
            </div>
          </div>
        `;
      })}
    </div>
  `;
};

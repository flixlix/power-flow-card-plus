import { html, nothing } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { displayValue } from "@/utils/display-value";
import { generalSecondarySpan } from "./spans/general-secondary-span";
import { TemplatesObj } from "@/type";
import { ConfigEntities, PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";

export const gridElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { entities, grid, templatesObj }: { entities: ConfigEntities; grid: any; templatesObj: TemplatesObj }
) => {
  const disableEntityClick = config.clickable_entities === false;
  return html`<div class="circle-container grid">
    <div
      class="circle ${disableEntityClick ? "pointer-events-none" : ""}"
      data-sticker-anchor="grid"
      @click=${(e: MouseEvent) => {
        const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
        const target =
          grid.powerOutage?.isOutage && outageTarget
            ? outageTarget
            : typeof entities.grid!.entity === "string"
            ? entities.grid!.entity
            : entities.grid!.entity.consumption!;
        main.onEntityClick(e, grid, target);
      }}
      @dblclick=${(e: MouseEvent) => {
        const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
        const target =
          grid.powerOutage?.isOutage && outageTarget
            ? outageTarget
            : typeof entities.grid!.entity === "string"
            ? entities.grid!.entity
            : entities.grid!.entity.consumption!;
        main.onEntityDoubleClick(e, grid, target);
      }}
      @pointerdown=${(e: PointerEvent) => {
        const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
        const target =
          grid.powerOutage?.isOutage && outageTarget
            ? outageTarget
            : typeof entities.grid!.entity === "string"
            ? entities.grid!.entity
            : entities.grid!.entity.consumption!;
        main.onEntityPointerDown(e, entities.grid, target);
      }}
      @pointerup=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @pointercancel=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
          const target =
            grid.powerOutage?.isOutage && outageTarget
              ? outageTarget
              : typeof entities.grid!.entity === "string"
              ? entities.grid!.entity
              : entities.grid!.entity.consumption!;
          main.openDetails(e, entities.grid, target, "tap");
        }
      }}
    >
      <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
      ${generalSecondarySpan(main.hass, main, config, templatesObj, grid, "grid")}
      ${grid.icon !== " " ? html` <ha-icon id="grid-icon" .icon=${grid.icon} />` : nothing}
      ${(entities.grid?.display_state === "two_way" ||
        entities.grid?.display_state === undefined ||
        (entities.grid?.display_state === "one_way_no_zero" && (grid.state.toGrid ?? 0) > 0) ||
        (entities.grid?.display_state === "one_way" && (grid.state.fromGrid === null || grid.state.fromGrid === 0) && grid.state.toGrid !== 0)) &&
      grid.state.toGrid !== null &&
      !grid.powerOutage.isOutage
        ? html`<span
            class="return"
            @click=${(e: MouseEvent) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
              main.onEntityClick(e, grid, target);
            }}
            @dblclick=${(e: MouseEvent) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
              main.onEntityDoubleClick(e, grid, target);
            }}
            @pointerdown=${(e: PointerEvent) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
              main.onEntityPointerDown(e, entities.grid, target);
            }}
            @pointerup=${(e: PointerEvent) => {
              main.onEntityPointerUp(e);
            }}
            @pointercancel=${(e: PointerEvent) => {
              main.onEntityPointerUp(e);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
              if (e.key === "Enter") {
                const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
                main.openDetails(e, entities.grid, target, "tap");
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-left"}></ha-icon>

            ${displayValue(main.hass, config, grid.state.toGrid, {
              unit: grid.unit,
              unitWhiteSpace: grid.unit_white_space,
              decimals: grid.decimals,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : nothing}
      ${((entities.grid?.display_state === "two_way" ||
        entities.grid?.display_state === undefined ||
        (entities.grid?.display_state === "one_way_no_zero" && grid.state.fromGrid > 0) ||
        (entities.grid?.display_state === "one_way" && (grid.state.toGrid === null || grid.state.toGrid === 0))) &&
        grid.state.fromGrid !== null &&
        !grid.powerOutage.isOutage) ||
      (grid.powerOutage.isOutage && !!grid.powerOutage.entityGenerator)
        ? html` <span
            class="consumption"
            @click=${(e: MouseEvent) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.consumption!;
              main.onEntityClick(e, grid, target);
            }}
            @dblclick=${(e: MouseEvent) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.consumption!;
              main.onEntityDoubleClick(e, grid, target);
            }}
            @pointerdown=${(e: PointerEvent) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.consumption!;
              main.onEntityPointerDown(e, entities.grid, target);
            }}
            @pointerup=${(e: PointerEvent) => {
              main.onEntityPointerUp(e);
            }}
            @pointercancel=${(e: PointerEvent) => {
              main.onEntityPointerUp(e);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
              if (e.key === "Enter") {
                const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.consumption!;
                main.openDetails(e, entities.grid, target, "tap");
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-right"}></ha-icon>
            ${displayValue(main.hass, config, grid.state.fromGrid, {
              unit: grid.unit,
              unitWhiteSpace: grid.unit_white_space,
              decimals: grid.decimals,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : nothing}
      ${grid.powerOutage?.isOutage && !grid.powerOutage?.entityGenerator
        ? html`<span class="grid power-outage">${grid.powerOutage.name}</span>`
        : nothing}
    </div>
    <span class="label">${grid.name}</span>
  </div>`;
};

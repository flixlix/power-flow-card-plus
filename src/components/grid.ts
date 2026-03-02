import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { displayValue } from "../utils/displayValue";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { TemplatesObj } from "../type";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

export const gridElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { entities, grid, templatesObj }: { entities: ConfigEntities; grid: any; templatesObj: TemplatesObj }
) => {
  // Phase 2: entities.grid is GridEntities (house/main). Read from .house sub-key.
  const gridConfig = (entities.grid as any)?.house;
  return html`<div class="circle-container grid">
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        const outageTarget = grid.powerOutage?.entityGenerator ?? gridConfig?.power_outage?.entity;
        const target =
          grid.powerOutage?.isOutage && outageTarget
            ? outageTarget
            : typeof gridConfig!.entity === "string"
            ? gridConfig!.entity
            : gridConfig!.entity.consumption!;
        main.openDetails(e, gridConfig?.tap_action, target);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          const outageTarget = grid.powerOutage?.entityGenerator ?? gridConfig?.power_outage?.entity;
          const target =
            grid.powerOutage?.isOutage && outageTarget
              ? outageTarget
              : typeof gridConfig!.entity === "string"
              ? gridConfig!.entity
              : gridConfig!.entity.consumption!;
          main.openDetails(e, gridConfig?.tap_action, target);
        }
      }}
    >
      ${generalSecondarySpan(main.hass, main, config, templatesObj, grid, "grid")}
      ${grid.icon !== " " ? html` <ha-icon id="grid-icon" .icon=${grid.icon} />` : null}
      ${(gridConfig?.display_state === "two_way" ||
        gridConfig?.display_state === undefined ||
        (gridConfig?.display_state === "one_way_no_zero" && (grid.state.toGrid ?? 0) > 0) ||
        (gridConfig?.display_state === "one_way" && (grid.state.fromGrid === null || grid.state.fromGrid === 0) && grid.state.toGrid !== 0)) &&
      grid.state.toGrid !== null &&
      !grid.powerOutage.isOutage
        ? html`<span
            class="return"
            @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
              const target = typeof gridConfig!.entity === "string" ? gridConfig!.entity : gridConfig!.entity.production!;
              main.openDetails(e, gridConfig?.tap_action, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
              if (e.key === "Enter") {
                const target = typeof gridConfig!.entity === "string" ? gridConfig!.entity : gridConfig!.entity.production!;
                main.openDetails(e, gridConfig?.tap_action, target);
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
        : null}
      ${((gridConfig?.display_state === "two_way" ||
        gridConfig?.display_state === undefined ||
        (gridConfig?.display_state === "one_way_no_zero" && grid.state.fromGrid > 0) ||
        (gridConfig?.display_state === "one_way" && (grid.state.toGrid === null || grid.state.toGrid === 0))) &&
        grid.state.fromGrid !== null &&
        !grid.powerOutage.isOutage) ||
      (grid.powerOutage.isOutage && !!grid.powerOutage.entityGenerator)
        ? html` <span
            class="consumption"
            @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
              const target = typeof gridConfig!.entity === "string" ? gridConfig!.entity : gridConfig!.entity.consumption!;
              main.openDetails(e, gridConfig?.tap_action, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
              if (e.key === "Enter") {
                const target = typeof gridConfig!.entity === "string" ? gridConfig!.entity : gridConfig!.entity.consumption!;
                main.openDetails(e, gridConfig?.tap_action, target);
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
        : ""}
      ${grid.powerOutage?.isOutage && !grid.powerOutage?.entityGenerator ? html`<span class="grid power-outage">${grid.powerOutage.name}</span>` : ""}
    </div>
    <span class="label">${grid.name}</span>
  </div>`;
};

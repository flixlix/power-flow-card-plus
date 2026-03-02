import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { displayValue } from "../utils/displayValue";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { TemplatesObj } from "../type";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

export const gridMainElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { entities, gridMain, templatesObj }: { entities: ConfigEntities; gridMain: any; templatesObj: TemplatesObj }
) => {
  // entities.grid is GridEntities (house/main). Access the .main sub-config.
  const gridMainConfig = (entities.grid as any)?.main;
  return html`<div class="circle-container grid-main">
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        const outageTarget = gridMain.powerOutage?.entityGenerator ?? gridMainConfig?.power_outage?.entity;
        const target =
          gridMain.powerOutage?.isOutage && outageTarget
            ? outageTarget
            : typeof gridMainConfig!.entity === "string"
            ? gridMainConfig!.entity
            : gridMainConfig!.entity.consumption!;
        main.openDetails(e, gridMainConfig?.tap_action, target);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          const outageTarget = gridMain.powerOutage?.entityGenerator ?? gridMainConfig?.power_outage?.entity;
          const target =
            gridMain.powerOutage?.isOutage && outageTarget
              ? outageTarget
              : typeof gridMainConfig!.entity === "string"
              ? gridMainConfig!.entity
              : gridMainConfig!.entity.consumption!;
          main.openDetails(e, gridMainConfig?.tap_action, target);
        }
      }}
    >
      ${generalSecondarySpan(main.hass, main, config, templatesObj, gridMain, "grid-main")}
      ${gridMain.icon !== " " ? html` <ha-icon id="grid-main-icon" .icon=${gridMain.icon} />` : null}
      ${(gridMainConfig?.display_state === "two_way" ||
        gridMainConfig?.display_state === undefined ||
        (gridMainConfig?.display_state === "one_way_no_zero" && (gridMain.state.toGridMain ?? 0) > 0) ||
        (gridMainConfig?.display_state === "one_way" && (gridMain.state.fromGridMain === null || gridMain.state.fromGridMain === 0) && gridMain.state.toGridMain !== 0)) &&
      gridMain.state.toGridMain !== null &&
      !gridMain.powerOutage.isOutage
        ? html`<span
            class="return"
            @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
              const target = typeof gridMainConfig!.entity === "string" ? gridMainConfig!.entity : gridMainConfig!.entity.production!;
              main.openDetails(e, gridMainConfig?.tap_action, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
              if (e.key === "Enter") {
                const target = typeof gridMainConfig!.entity === "string" ? gridMainConfig!.entity : gridMainConfig!.entity.production!;
                main.openDetails(e, gridMainConfig?.tap_action, target);
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-left"}></ha-icon>

            ${displayValue(main.hass, config, gridMain.state.toGridMain, {
              unit: gridMain.unit,
              unitWhiteSpace: gridMain.unit_white_space,
              decimals: gridMain.decimals,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : null}
      ${((gridMainConfig?.display_state === "two_way" ||
        gridMainConfig?.display_state === undefined ||
        (gridMainConfig?.display_state === "one_way_no_zero" && gridMain.state.fromGridMain > 0) ||
        (gridMainConfig?.display_state === "one_way" && (gridMain.state.toGridMain === null || gridMain.state.toGridMain === 0))) &&
        gridMain.state.fromGridMain !== null &&
        !gridMain.powerOutage.isOutage) ||
      (gridMain.powerOutage.isOutage && !!gridMain.powerOutage.entityGenerator)
        ? html` <span
            class="consumption"
            @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
              const target = typeof gridMainConfig!.entity === "string" ? gridMainConfig!.entity : gridMainConfig!.entity.consumption!;
              main.openDetails(e, gridMainConfig?.tap_action, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
              if (e.key === "Enter") {
                const target = typeof gridMainConfig!.entity === "string" ? gridMainConfig!.entity : gridMainConfig!.entity.consumption!;
                main.openDetails(e, gridMainConfig?.tap_action, target);
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-right"}></ha-icon>
            ${displayValue(main.hass, config, gridMain.state.fromGridMain, {
              unit: gridMain.unit,
              unitWhiteSpace: gridMain.unit_white_space,
              decimals: gridMain.decimals,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : ""}
      ${gridMain.powerOutage?.isOutage && !gridMain.powerOutage?.entityGenerator ? html`<span class="grid-main power-outage">${gridMain.powerOutage.name}</span>` : ""}
    </div>
    <span class="label">${gridMain.name}</span>
  </div>`;
};

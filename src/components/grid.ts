import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { displayValue } from "../utils/displayValue";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { TemplatesObj } from "../type";
import { ConfigEntities } from "../power-flow-card-plus-config";

export const gridElement = (
  main: PowerFlowCardPlus,
  { entities, grid, templatesObj }: { entities: ConfigEntities; grid: any; templatesObj: TemplatesObj }
) => {
  return html`<div class="circle-container grid">
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void }) => {
        const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
        const target =
          grid.powerOutage?.isOutage && outageTarget
            ? outageTarget
            : typeof entities.grid!.entity === "string"
            ? entities.grid!.entity
            : entities.grid!.entity.consumption!;
        main.openDetails(e, target);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
        if (e.key === "Enter") {
          const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
          const target =
            grid.powerOutage?.isOutage && outageTarget
              ? outageTarget
              : typeof entities.grid!.entity === "string"
              ? entities.grid!.entity
              : entities.grid!.entity.consumption!;
          main.openDetails(e, target);
        }
      }}
    >
      ${generalSecondarySpan(main.hass, main, templatesObj, grid, "grid")}
      <ha-icon .icon=${grid.icon}></ha-icon>
      ${(entities.grid?.display_state === "two_way" ||
        entities.grid?.display_state === undefined ||
        (entities.grid?.display_state === "one_way_no_zero" && (grid.state.toGrid ?? 0) > 0) ||
        (entities.grid?.display_state === "one_way" && (grid.state.fromGrid === null || grid.state.fromGrid === 0) && grid.state.toGrid !== 0)) &&
      grid.state.toGrid !== null &&
      !grid.powerOutage.isOutage
        ? html`<span
            class="return"
            @click=${(e: { stopPropagation: () => void }) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
              main.openDetails(e, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
              if (e.key === "Enter") {
                const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
                main.openDetails(e, target);
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-left"}></ha-icon>
            ${displayValue(main.hass, grid.state.toGrid)}
          </span>`
        : null}
      ${((entities.grid?.display_state === "two_way" ||
        entities.grid?.display_state === undefined ||
        (entities.grid?.display_state === "one_way_no_zero" && grid.state.fromGrid > 0) ||
        (entities.grid?.display_state === "one_way" && (grid.state.toGrid === null || grid.state.toGrid === 0))) &&
        grid.state.fromGrid !== null &&
        !grid.powerOutage.isOutage) ||
      (grid.powerOutage.isOutage && !!grid.powerOutage.entityGenerator)
        ? html` <span
            class="consumption"
            @click=${(e: { stopPropagation: () => void }) => {
              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.consumption!;
              main.openDetails(e, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
              if (e.key === "Enter") {
                const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.consumption!;
                main.openDetails(e, target);
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-right"}></ha-icon>${displayValue(main.hass, grid.state.fromGrid)}
          </span>`
        : ""}
      ${grid.powerOutage?.isOutage && !grid.powerOutage?.entityGenerator ? html`<span class="grid power-outage">${grid.powerOutage.name}</span>` : ""}
    </div>
    <span class="label">${grid.name}</span>
  </div>`;
};

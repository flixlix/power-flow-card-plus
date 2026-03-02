import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { displayValue } from "../utils/displayValue";

export const heatpumpElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  {
    heatpump,
    entities,
  }: {
    heatpump: any;
    entities: ConfigEntities;
  }
) => {
  return html`<div class="circle-container heatpump">
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, entities.heatpump?.tap_action, entities.heatpump?.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, entities.heatpump?.tap_action, entities.heatpump?.entity);
        }
      }}
    >
      ${heatpump.cop.state !== null
        ? html`<span
            id="heatpump-cop-text"
            @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
              main.openDetails(e, entities.heatpump?.tap_action, entities.heatpump?.cop);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
              if (e.key === "Enter") {
                main.openDetails(e, entities.heatpump?.tap_action, entities.heatpump?.cop);
              }
            }}
          >
            COP
            ${Number(heatpump.cop.state).toFixed(1)}
          </span>`
        : null}
      <ha-icon id="heatpump-icon" .icon=${heatpump.icon} />
      ${heatpump.flowFromGridHouse
        ? html`<span class="flow-from-grid-house">
            <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
            ${displayValue(main.hass, config, heatpump.flowFromGridHouse, {
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : null}
      ${heatpump.flowFromGridMain
        ? html`<span class="flow-from-grid-main">
            <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
            ${displayValue(main.hass, config, heatpump.flowFromGridMain, {
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : null}
      <span
        class="consumption"
        @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
          main.openDetails(e, entities.heatpump?.tap_action, entities.heatpump?.entity);
        }}
        @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
          if (e.key === "Enter") {
            main.openDetails(e, entities.heatpump?.tap_action, entities.heatpump?.entity);
          }
        }}
      >
        ${displayValue(main.hass, config, heatpump.state, {
          unit: heatpump.unit,
          unitWhiteSpace: heatpump.unit_white_space,
          decimals: heatpump.decimals,
          watt_threshold: config.watt_threshold,
        })}
      </span>
    </div>
    <span class="label">${heatpump.name}</span>
  </div>`;
};

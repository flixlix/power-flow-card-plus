import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { displayValue } from "../utils/displayValue";

export const intermediateElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  {
    intermediateObj,
    entities,
    index,
  }: {
    intermediateObj: any;
    entities: ConfigEntities;
    index: number; // 0 = top slot (col 1 top row), 1 = bottom slot (col 1 bottom row)
  }
) => {
  const cfg = entities.intermediate?.[index];
  const positionClass = index === 0 ? "intermediate-bottom" : "intermediate-top";

  const circleContent = html`<div
    class="circle"
    @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
      main.openDetails(e, cfg?.tap_action, cfg?.entity);
    }}
    @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
      if (e.key === "Enter") {
        main.openDetails(e, cfg?.tap_action, cfg?.entity);
      }
    }}
  >
    ${intermediateObj.secondary?.has
      ? html`<span
          class="secondary-info intermediate"
          @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
            main.openDetails(e, cfg?.secondary_info?.tap_action, cfg?.secondary_info?.entity);
          }}
        >
          ${displayValue(main.hass, config, intermediateObj.secondary.state, {
            decimals: intermediateObj.secondary.decimals,
            unit: intermediateObj.secondary.unit,
            unitWhiteSpace: intermediateObj.secondary.unit_white_space,
            watt_threshold: config.watt_threshold,
          })}
        </span>`
      : null}
    <ha-icon id="intermediate-${index}-icon" .icon=${intermediateObj.icon} />
    ${intermediateObj.flowFromGridHouse
      ? html`<span class="flow-from-grid-house">
          <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
          ${displayValue(main.hass, config, intermediateObj.flowFromGridHouse, {
            watt_threshold: config.watt_threshold,
          })}
        </span>`
      : null}
    ${intermediateObj.flowFromGridMain
      ? html`<span class="flow-from-grid-main">
          <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
          ${displayValue(main.hass, config, intermediateObj.flowFromGridMain, {
            watt_threshold: config.watt_threshold,
          })}
        </span>`
      : null}
    <span
      class="consumption"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, cfg?.tap_action, cfg?.entity);
      }}
    >
      ${displayValue(main.hass, config, intermediateObj.state, {
        watt_threshold: config.watt_threshold,
      })}
    </span>
  </div>`;

  // index 1 (top slot): label on top like solar; index 0 (bottom slot): label on bottom
  return index === 1
    ? html`<div class="circle-container intermediate ${positionClass}">
        <span class="label">${intermediateObj.name}</span>
        ${circleContent}
      </div>`
    : html`<div class="circle-container intermediate ${positionClass}">
        ${circleContent}
        <span class="label">${intermediateObj.name}</span>
      </div>`;
};

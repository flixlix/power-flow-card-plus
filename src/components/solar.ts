import { html, nothing } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { ConfigEntities, PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { generalSecondarySpan } from "./spans/general-secondary-span";
import { displayValue } from "@/utils/display-value";
import { TemplatesObj } from "@/type";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";

export const solarElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  {
    entities,
    solar,
    templatesObj,
  }: {
    entities: ConfigEntities;
    solar: any;
    templatesObj: TemplatesObj;
  }
) => {
  const sumTotalConfig = entities.solar?.secondary_info?.sum_total;
  const secondaryEntity = config.entities.solar?.secondary_info?.entity;
  const secondarySolarStateWatts = secondaryEntity ? Math.max(getEntityStateWatts(main.hass, secondaryEntity), 0) : 0;
  const bottomSolarState = sumTotalConfig ? solar.state.total - secondarySolarStateWatts : solar.state.total;
  return html`<div class="circle-container solar">
    <span class="label">${solar.name}</span>
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, solar.tap_action, solar.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, solar.tap_action, solar.entity);
        }
      }}
    >
      ${generalSecondarySpan(main.hass, main, config, templatesObj, solar, "solar")}
      ${solar.icon !== " " ? html` <ha-icon id="solar-icon" .icon=${solar.icon} />` : nothing}
      ${entities.solar?.display_zero_state !== false || (bottomSolarState || 0) > 0
        ? html` <span class="solar">
            ${displayValue(main.hass, config, bottomSolarState, {
              unit: solar.state.unit,
              unitWhiteSpace: solar.state.unit_white_space,
              decimals: solar.state.decimals,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : nothing}
    </div>
  </div>`;
};

import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { ConfigEntities } from "../power-flow-card-plus-config";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { displayValue } from "../utils/displayValue";
import { TemplatesObj } from "../type";

export const solarElement = (
  main: PowerFlowCardPlus,
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
  return html`<div class="circle-container solar">
    <span class="label">${solar.name}</span>
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void }) => {
        main.openDetails(e, solar.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
        if (e.key === "Enter") {
          main.openDetails(e, solar.entity);
        }
      }}
    >
      ${generalSecondarySpan(main.hass, main, templatesObj, solar, "solar")}
      <ha-icon id="solar-icon" .icon=${solar.icon}></ha-icon>
      ${entities.solar?.display_zero_state !== false || (solar.state.total || 0) > 0
        ? html` <span class="solar"> ${displayValue(main.hass, solar.state.total as number)}</span>`
        : ""}
    </div>
  </div>`;
};

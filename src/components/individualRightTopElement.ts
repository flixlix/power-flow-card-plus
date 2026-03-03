import { html } from "lit";
import { individualSecondarySpan } from "./spans/individualSecondarySpan";
import { NewDur, TemplatesObj } from "../type";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";
import { PowerFlowCardPlus } from "../power-flow-card-plus";

interface TopIndividual {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj?: IndividualObject;
  displayState: string;
  battery: any;
  individualObjs: IndividualObject[];
}

export const individualRightTopElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, templatesObj, displayState, newDur: _newDur, battery: _battery, individualObjs: _individualObjs }: TopIndividual
) => {
  if (!individualObj) return html`<div class="spacer"></div>`;

  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) || -1;
  if (indexOfIndividual === -1) return html`<div class="spacer"></div>`;

  return html`<div class="circle-container individual-top individual-right individual-right-top">
    <span class="label">${individualObj.name}</span>
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, individualObj?.field?.tap_action, individualObj?.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, individualObj?.field?.tap_action, individualObj?.entity);
        }
      }}
    >
      ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, indexOfIndividual, "right-top")}
      ${individualObj.icon !== " " ? html` <ha-icon id="individual-right-top-icon" .icon=${individualObj.icon} />` : null}
      ${individualObj?.field?.display_zero_state !== false || (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="individual-top individual-right-top">
            ${individualObj?.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
              : ""}${displayState}
          </span>`
        : ""}
    </div>
  </div>`;
};

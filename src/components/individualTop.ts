import { html, svg } from "lit";
import { individualSecondarySpan } from "./spans/individualSecondarySpan";
import { IndividualDeviceType, NewDur, TemplatesObj } from "../type";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { computeIndividualFlowRate } from "../utils/computeFlowRate";
import { showLine } from "../utils/showLine";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { styleLine } from "../utils/styleLine";

interface TopIndividual {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj: IndividualObject;
  displayState: string;
}

export const topindividualElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, templatesObj, displayState, newDur }: TopIndividual
) => {
  return html`<div class="circle-container topindividual">
    <span class="label">${individualObj.name}</span>
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void }) => {
        main.openDetails(e, individualObj?.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
        if (e.key === "Enter") {
          main.openDetails(e, individualObj?.entity);
        }
      }}
    >
      ${individualSecondarySpan(main.hass, main, templatesObj, individualObj, "topindividual")}
      <ha-icon
        id="topindividual-icon"
        .icon=${individualObj.icon}
        style="${individualObj.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
      ${individualObj?.field?.display_zero_state !== false || (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
          ? "padding-bottom: 2px;"
          : "padding-bottom: 0px;"}"
      ></ha-icon>
      ${individualObj?.field?.display_zero_state !== false || (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="topindividual">
            ${individualObj.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
              : ""}${displayState}
          </span>`
        : ""}
    </div>
    ${showLine(config, individualObj.state || 0)
      ? html`
          <svg width="80" height="30">
            <path d="M40 -10 v50" id="topindividual" class="${styleLine(individualObj.state || 0, config)}" />
            ${individualObj.state
              ? svg`<circle
          r="2.4"
          class="topindividual"
          vector-effect="non-scaling-stroke"
        >
          <animateMotion
            dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, newDur.individual2)}s"
            repeatCount="indefinite"
            calcMode="linear"
            keyPoints=${individualObj.invertAnimation ? "0;1" : "1;0"}
            keyTimes="0;1"
          >
            <mpath xlink:href="#topindividual" />
          </animateMotion>
        </circle>`
              : ""}
          </svg>
        `
      : ""}
  </div>`;
};

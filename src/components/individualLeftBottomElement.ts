import { html, svg } from "lit";
import { showLine } from "../utils/showLine";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { NewDur, TemplatesObj } from "../type";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";
import { styleLine } from "../utils/styleLine";
import { individualSecondarySpan } from "./spans/individualSecondarySpan";
import { HomeAssistant } from "custom-card-helpers";
import { computeIndividualFlowRate } from "../utils/computeFlowRate";

interface IndividualBottom {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj?: IndividualObject;
  displayState: string;
}

export const individualLeftBottomElement = (
  main: PowerFlowCardPlus,
  hass: HomeAssistant,
  config: PowerFlowCardPlusConfig,
  { individualObj, templatesObj, displayState, newDur }: IndividualBottom
) => {
  if (!individualObj) return html`<div class="spacer"></div>`;
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) || 0;
  const duration = newDur.individual[indexOfIndividual] || 0;
  return html`<div class="circle-container individual-bottom bottom">
    ${showLine(config, individualObj?.state || 0)
      ? html`
          <svg width="80" height="30">
            <path d="M40 40 v-40" id="individual-bottom" class="${styleLine(individualObj?.state || 0, config)}" />
            ${individualObj?.state
              ? svg`<circle
                                r="1.75"
                                class="individual-bottom"
                                vector-effect="non-scaling-stroke"
                              >
                                <animateMotion
                                  dur="${computeIndividualFlowRate(individualObj.field?.calculate_flow_rate !== false, duration)}s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints=${individualObj.invertAnimation ? "0;1" : "1;0"}
                                  keyTimes="0;1"
                                >
                                  <mpath xlink:href="#individual-bottom" />
                                </animateMotion>
                              </circle>`
              : ""}
          </svg>
        `
      : html` <svg width="80" height="30"></svg> `}
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
      ${individualSecondarySpan(hass, main, templatesObj, individualObj, 1, "left-bottom")}
      <ha-icon
        id="individual-left-bottom-icon"
        .icon=${individualObj?.icon}
        style="${individualObj?.secondary?.has ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${individualObj?.field?.display_zero_state !== false ||
        (individualObj?.state || 0) > (individualObj.displayZeroTolerance ?? 0)
          ? "padding-bottom: 2px;"
          : "padding-bottom: 0px;"}"
      ></ha-icon>
      ${individualObj?.field?.display_zero_state !== false || (individualObj?.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="individual-bottom individual-left-top"
            >${individualObj?.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj?.invertAnimation ? "mdi:arrow-up" : "mdi:arrow-down"}></ha-icon>`
              : ""}${displayState}
          </span>`
        : ""}
    </div>
    <span class="label">${individualObj?.name}</span>
  </div> `;
};

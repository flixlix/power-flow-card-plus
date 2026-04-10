import { html, nothing, svg } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { IndividualObject } from "@/states/raw/individual/get-individual-object";
import { NewDur, TemplatesObj } from "@/type";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";
import { computeIndividualFlowRate } from "@/utils/compute-flow-rate";
import { showLine } from "@/utils/show-line";
import { styleLine } from "@/utils/style-line";
import { individualSecondarySpan } from "./spans/individual-secondary-span";

interface IndividualBottom {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj?: IndividualObject;
  displayState: string;
}

export const individualLeftBottomElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, templatesObj, displayState, newDur }: IndividualBottom
) => {
  if (!individualObj) return html`<div class="spacer"></div>`;
  const disableEntityClick = config.clickable_entities === false;
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) || 0;
  const duration = newDur.individual[indexOfIndividual] || 0;
  return html`<div class="circle-container individual-bottom bottom">
    ${showLine(config, individualObj?.state || 0) && !config.entities.home?.hide
      ? html`
          <svg width="80" height="30">
            <path d="M40 40 v-40" id="individual-bottom" class="${styleLine(individualObj?.state || 0, config)}" />
            ${checkShouldShowDots(config) && individualObj?.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`<circle r="1.75" class="individual-bottom" vector-effect="non-scaling-stroke">
                    <animateMotion
                      dur="${computeIndividualFlowRate(individualObj.field?.calculate_flow_rate !== false, duration)}s"
                      repeatCount="indefinite"
                      calcMode="paced"
                      keyPoints="${individualObj.invertAnimation ? "0;1" : "1;0"}"
                      keyTimes="0;1"
                    >
                      <mpath xlink:href="#individual-bottom" />
                    </animateMotion>
                  </circle>`
              : nothing}
          </svg>
        `
      : html` <svg width="80" height="30"></svg> `}
    <div
      class="circle ${disableEntityClick ? "pointer-events-none" : ""}"
      @click=${(e: MouseEvent) => {
        main.onEntityClick(e, individualObj?.field, individualObj?.entity);
      }}
      @dblclick=${(e: MouseEvent) => {
        main.onEntityDoubleClick(e, individualObj?.field, individualObj?.entity);
      }}
      @pointerdown=${(e: PointerEvent) => {
        main.onEntityPointerDown(e, individualObj?.field, individualObj?.entity);
      }}
      @pointerup=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @pointercancel=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, individualObj?.field, individualObj?.entity, "tap");
        }
      }}
    >
      <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
      ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, indexOfIndividual, "left-bottom")}
      ${individualObj?.icon !== " " ? html` <ha-icon id="individual-left-bottom-icon" .icon=${individualObj?.icon}></ha-icon>` : nothing}
      ${individualObj?.field?.display_zero_state !== false || (individualObj?.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="individual-bottom individual-left-bottom"
            >${individualObj?.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj?.invertAnimation ? "mdi:arrow-up" : "mdi:arrow-down"}></ha-icon>`
              : nothing}${displayState}
          </span>`
        : nothing}
    </div>
    <span class="label">${individualObj?.name}</span>
  </div> `;
};

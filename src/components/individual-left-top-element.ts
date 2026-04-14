import { html, nothing, svg } from "lit";
import { individualSecondarySpan } from "./spans/individual-secondary-span";
import { NewDur, TemplatesObj } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { computeIndividualFlowRate } from "@/utils/compute-flow-rate";
import { showLine } from "@/utils/show-line";
import { IndividualObject } from "@/states/raw/individual/get-individual-object";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { styleLine } from "@/utils/style-line";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";
import { checkFlowDotsCount } from "@/utils/check-flow-dots-count";


interface TopIndividual {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj?: IndividualObject;
  displayState: string;
}

export const individualLeftTopElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, templatesObj, displayState, newDur }: TopIndividual
) => {
  if (!individualObj) return html`<div class="spacer"></div>`;
  const disableEntityClick = config.clickable_entities === false;
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) || 0;
  const duration = newDur.individual[indexOfIndividual] || 0;
  return html`<div class="circle-container individual-top">
    <span class="label">${individualObj.name}</span>
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
      ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, indexOfIndividual, "left-top")}
      ${individualObj.icon !== " " ? html` <ha-icon id="individual-left-top-icon" .icon=${individualObj.icon}></ha-icon>` : nothing}
      ${individualObj?.field?.display_zero_state !== false || (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="individual-top individual-left-top">
            ${individualObj?.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
              : nothing}${displayState}
          </span>`
        : nothing}
    </div>
    ${showLine(config, individualObj.state || 0) && !config.entities.home?.hide
      ? html`
          <svg width="80" height="30">
            <path  
              id="individual-top" 
              class="${styleLine(individualObj.state || 0, config)}"
              d="M40 -10 v50"
              />
            ${checkShouldShowDots(config) && individualObj.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`${Array.from({ length: Math.round((checkFlowDotsCount(config) ?? 1) / 1.75) }).map((_, i) => {
                const n = Math.round((checkFlowDotsCount(config) ?? 1) / 1.75);
                const start = i / n;
                const end = (i + 1) / n;  
                return svg`<circle r="1.75" class="individual-top" vector-effect="non-scaling-stroke">
                    <animateMotion
                      dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, duration) / n}s"
                      repeatCount="indefinite"
                      calcMode="paced"
                      keyPoints=${individualObj.invertAnimation ? `${start} ; ${end}; ${start}` : `${end} ; ${start}; ${end}`}
                      keyTimes="0;1;1"
                    >
                      <mpath xlink:href="#individual-top" />
                    </animateMotion>
                  </circle>`
                  })}`
              : nothing}
          </svg>
        `
      : nothing}
  </div>`;
};

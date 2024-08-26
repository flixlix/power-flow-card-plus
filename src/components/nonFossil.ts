import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { displayNonFossilState } from "../utils/displayNonFossilState";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { NewDur, TemplatesObj } from "../type";
import { styleLine } from "../utils/styleLine";
import { computeIndividualFlowRate } from "../utils/computeFlowRate";
import { showLine } from "../utils/showLine";
import { checkShouldShowDots } from "../utils/checkShouldShowDots";

interface NonFossil {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  entities: ConfigEntities;
  nonFossil: any;
  grid: any;
}

export const nonFossilElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { nonFossil, entities, templatesObj, grid, newDur }: NonFossil
) => {
  return html`${!nonFossil.hasPercentage
    ? html`<div class="spacer"></div>`
    : html`<div class="circle-container low-carbon">
        <span class="label">${nonFossil.name}</span>
        <div
          class="circle"
          @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
            main.openDetails(e, entities.fossil_fuel_percentage?.tap_action, entities.fossil_fuel_percentage?.entity);
          }}
          @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
            if (e.key === "Enter") {
              main.openDetails(e, entities.fossil_fuel_percentage?.tap_action, entities.fossil_fuel_percentage?.entity);
            }
          }}
        >
          ${generalSecondarySpan(main.hass, main, config, templatesObj, nonFossil, "low-carbon")}
          ${nonFossil.icon !== " " ? html` <ha-icon id="low-carbon-icon" .icon=${nonFossil.icon} />` : null}
          ${entities.fossil_fuel_percentage?.display_zero_state !== false ||
          (nonFossil.state.power || 0) > (entities.fossil_fuel_percentage?.display_zero_tolerance || 0)
            ? html`
                <span class="low-carbon"
                  >${displayNonFossilState(main.hass, config, entities!.fossil_fuel_percentage!.entity, grid.state.fromGrid)}</span
                >
              `
            : ""}
        </div>
        ${showLine(config, nonFossil.state.power || 0)
          ? html`
              <svg width="80" height="30">
                <path d="M40 -10 v40" class="low-carbon ${styleLine(nonFossil.state.power || 0, config)}" id="low-carbon" />
                ${checkShouldShowDots(config) && nonFossil.has && nonFossil.state.power > 0
                  ? svg`<circle
                r="1.75"
                class="low-carbon"
                vector-effect="non-scaling-stroke"
              >
                  <animateMotion
                    dur="${computeIndividualFlowRate(entities.fossil_fuel_percentage?.calculate_flow_rate, newDur.nonFossil)}s"
                    repeatCount="indefinite"
                    calcMode="linear"
                  >
                    <mpath xlink:href="#low-carbon" />
                  </animateMotion>
              </circle>`
                  : ""}
              </svg>
            `
          : ""}
      </div>`}`;
};

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
          @click=${(e: { stopPropagation: () => void }) => {
            main.openDetails(e, entities.fossil_fuel_percentage?.entity);
          }}
          @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
            if (e.key === "Enter") {
              main.openDetails(e, entities.fossil_fuel_percentage?.entity);
            }
          }}
        >
          ${generalSecondarySpan(main.hass, main, templatesObj, nonFossil, "low-carbon")}
          <ha-icon
            .icon=${nonFossil.icon}
            class="low-carbon"
            style="${nonFossil.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
            ${entities.fossil_fuel_percentage?.display_zero_state !== false ||
            (nonFossil.state.power || 0) > (entities.fossil_fuel_percentage?.display_zero_tolerance || 0)
              ? "padding-bottom: 2px;"
              : "padding-bottom: 0px;"}"
          ></ha-icon>
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
                ${checkShouldShowDots(config) && nonFossil.has
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

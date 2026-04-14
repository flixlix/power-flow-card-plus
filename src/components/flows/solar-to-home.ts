import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/show-line";
import { html, svg, nothing } from "lit";
import { styleLine } from "@/utils/style-line";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/compute-individual-position";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";
import { checkFlowDotsCount } from "@/utils/check-flow-dots-count";


const solarToHomeDot = (config: PowerFlowCardPlusConfig, solar: Flows["solar"], newDur: Flows["newDur"]) => {
  if (!checkShouldShowDots(config) || !solar.state.toHome) return nothing;

  return svg`${Array.from({ length: checkFlowDotsCount(config) ?? 1 }).map((_, i) => {const n = checkFlowDotsCount(config) ?? 1;
  return svg`<circle r="1" class="solar" vector-effect="non-scaling-stroke">
      <animateMotion dur="${newDur.solarToHome / n}s" repeatCount="indefinite" calcMode="paced"
      keyTimes="0;1;1" keyPoints="${(i) / n} ; ${(i+1) / n}; ${(i) / n}">
        <mpath xlink:href="#solar" />
      </animateMotion>
    </circle>`;
  })}`
};

export const flowSolarToHome = (config: PowerFlowCardPlusConfig, { battery, grid, individual, solar, newDur }: Flows) => {
  const shouldShow = solar.has && showLine(config, solar.state.toHome || 0) && !config.entities.home?.hide;
  if (!shouldShow) return nothing;

  return html`<div
    class="lines ${classMap({
      high: battery.has || checkHasBottomIndividual(individual),
      "individual1-individual2": !battery.has && individual.every((i) => i?.has),
      "multi-individual": checkHasRightIndividual(individual),
    })}"
  >
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-home-flow">
      <path
        id="solar"
        class="solar ${styleLine(solar.state.toHome || 0, config)}"
        d="M${battery.has ? 55 : 53},0 v${grid.has ? 15 : 17} c0,${battery.has ? "30 10,30 30,30" : "35 10,35 30,35"} h25"
        vector-effect="non-scaling-stroke"
      ></path>
      ${solarToHomeDot(config, solar, newDur)}
    </svg>
  </div>`;
};

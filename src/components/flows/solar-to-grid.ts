import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/show-line";
import { html, svg, nothing } from "lit";
import { styleLine } from "@/utils/style-line";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/compute-individual-position";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";

const solarToGridDot = (config: PowerFlowCardPlusConfig, solar: Flows["solar"], newDur: Flows["newDur"]) => {
  if (!checkShouldShowDots(config) || !solar.state.toGrid || !solar.has) return nothing;

  return svg`<circle
    r="1"
    class="return"
    vector-effect="non-scaling-stroke"
  >
    <animateMotion
      dur="${newDur.solarToGrid}s"
      repeatCount="indefinite"
      calcMode="paced"
    >
      <mpath xlink:href="#return" />
    </animateMotion>
  </circle>`;
};

export const flowSolarToGrid = (config: PowerFlowCardPlusConfig, { battery, grid, individual, solar, newDur }: Flows) => {
  const shouldShow = grid.hasReturnToGrid && solar.has && showLine(config, solar.state.toGrid || 0);
  if (!shouldShow) return nothing;

  return html`<div
    class="lines ${classMap({
      high: battery.has || checkHasBottomIndividual(individual),
      "individual1-individual2": !battery.has && individual.every((i) => i?.has),
      "multi-individual": checkHasRightIndividual(individual),
    })}"
  >
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-grid-flow">
      <path
        id="return"
        class="return ${styleLine(solar.state.toGrid || 0, config)}"
        d="M${battery.has ? 45 : 47},0 v15 c0,${battery.has ? "30 -10,30 -30,30" : "35 -10,35 -30,35"} h-20"
        vector-effect="non-scaling-stroke"
      ></path>
      ${solarToGridDot(config, solar, newDur)}
    </svg>
  </div>`;
};

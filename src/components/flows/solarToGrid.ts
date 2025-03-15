import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

export const flowSolarToGrid = (config: PowerFlowCardPlusConfig, { battery, grid, individual, solar, newDur }: Flows) => {
  return grid.hasReturnToGrid && solar.has && showLine(config, solar.state.toGrid || 0)
    ? html`<div
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
          ${checkShouldShowDots(config) && solar.state.toGrid && solar.has
            ? svg`<circle
                r="1"
                class="return"
                vector-effect="non-scaling-stroke"
              >
                <animateMotion
                  dur="${newDur.solarToGrid}s"
                  repeatCount="indefinite"
                  calcMode="linear"
                >
                  <mpath xlink:href="#return" />
                </animateMotion>
              </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};

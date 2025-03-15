import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

export const flowSolarToHome = (config: PowerFlowCardPlusConfig, { battery, grid, individual, solar, newDur }: Flows) => {
  return solar.has && showLine(config, solar.state.toHome || 0) && !config.entities.home?.hide
    ? html`<div
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
          ${checkShouldShowDots(config) && solar.state.toHome
            ? svg`<circle
                        r="1"
                        class="solar"
                        vector-effect="non-scaling-stroke"
                      >
                        <animateMotion
                          dur="${newDur.solarToHome}s"
                          repeatCount="indefinite"
                          calcMode="linear"
                        >
                          <mpath xlink:href="#solar" />
                        </animateMotion>
                      </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};

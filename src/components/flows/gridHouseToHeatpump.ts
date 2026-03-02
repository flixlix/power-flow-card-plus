import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowsWithHeatpump = Flows & { heatpump: any };

export const flowGridHouseToHeatpump = (config: PowerFlowCardPlusConfig, { battery, grid, heatpump, individual, newDur }: FlowsWithHeatpump) => {
  return heatpump.has && grid.has && showLine(config, heatpump.flowFromGridHouse)
    ? html`<div
        class="lines ${classMap({
          high: battery.has || checkHasBottomIndividual(individual),
          "individual1-individual2": !battery.has && individual.every((i: any) => i?.has),
          "multi-individual": checkHasRightIndividual(individual),
        })}"
        id="grid-house-heatpump-flow"
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <path
            id="grid-house-heatpump"
            class="heatpump ${styleLine(heatpump.flowFromGridHouse || 0, config)}"
            d="M80,50 v8 c0,42 -60,42 -60,42"
            vector-effect="non-scaling-stroke"
          ></path>
          ${checkShouldShowDots(config) && heatpump.flowFromGridHouse
            ? svg`<circle
            r="1"
            class="heatpump"
            vector-effect="non-scaling-stroke"
          >
            <animateMotion
              dur="${newDur.heatpumpFromGridHouse}s"
              repeatCount="indefinite"
              calcMode="linear"
            >
              <mpath xlink:href="#grid-house-heatpump" />
            </animateMotion>
          </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};

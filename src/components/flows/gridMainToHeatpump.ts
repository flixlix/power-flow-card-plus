import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowsWithHeatpump = Flows & { heatpump: any; gridMain?: any };

export const flowGridMainToHeatpump = (config: PowerFlowCardPlusConfig, { battery, gridMain, heatpump, individual, newDur }: FlowsWithHeatpump) => {
  return heatpump.has && gridMain?.has && showLine(config, heatpump.flowFromGridMain)
    ? html`<div
        class="lines ${classMap({
          high: battery.has || checkHasBottomIndividual(individual),
          "individual1-individual2": !battery.has && individual.every((i: any) => i?.has),
          "multi-individual": checkHasRightIndividual(individual),
        })}"
        id="grid-main-heatpump-flow"
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <path
            id="grid-main-heatpump"
            class="heatpump ${styleLine(heatpump.flowFromGridMain || 0, config)}"
            d="M20,50 v50"
            vector-effect="non-scaling-stroke"
          ></path>
          ${checkShouldShowDots(config) && heatpump.flowFromGridMain
            ? svg`<circle
            r="1"
            class="heatpump"
            vector-effect="non-scaling-stroke"
          >
            <animateMotion
              dur="${newDur.heatpumpFromGridMain}s"
              repeatCount="indefinite"
              calcMode="linear"
            >
              <mpath xlink:href="#grid-main-heatpump" />
            </animateMotion>
          </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};

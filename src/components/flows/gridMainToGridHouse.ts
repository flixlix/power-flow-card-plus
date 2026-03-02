import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowsWithGridMain = Flows & { gridMain: any };

export const flowGridMainToGridHouse = (config: PowerFlowCardPlusConfig, { battery, grid, gridMain, individual, solar, newDur }: FlowsWithGridMain) => {
  const showImport = showLine(config, gridMain.state.fromGridMain);
  const showExport = showLine(config, gridMain.state.toGridMain);
  return gridMain.has && grid.has && (showImport || showExport)
    ? html`<div
        class="lines ${classMap({
          high: battery.has || checkHasBottomIndividual(individual),
          "individual1-individual2": !battery.has && individual.every((i: any) => i?.has),
          "multi-individual": checkHasRightIndividual(individual),
        })}"
      >
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          id="grid-main-house-flow"
          class="flat-line"
        >
          <path
            class="grid ${styleLine(gridMain.state.fromGridMain || gridMain.state.toGridMain || 0, config)}"
            id="grid-main-house"
            d="M0,${battery.has ? 50 : solar.has ? 56 : 53} H100"
            vector-effect="non-scaling-stroke"
          ></path>
          ${checkShouldShowDots(config) && gridMain.state.fromGridMain
            ? svg`<circle
                r="1"
                class="grid"
                vector-effect="non-scaling-stroke"
              >
                <animateMotion
                  dur="${newDur.gridMainToGridHouse}s"
                  repeatCount="indefinite"
                  calcMode="linear"
                >
                  <mpath xlink:href="#grid-main-house" />
                </animateMotion>
              </circle>`
            : ""}
          ${checkShouldShowDots(config) && gridMain.state.toGridMain
            ? svg`<circle
                r="1"
                class="return"
                vector-effect="non-scaling-stroke"
              >
                <animateMotion
                  dur="${newDur.gridMainToGridHouse}s"
                  repeatCount="indefinite"
                  keyPoints="1;0"
                  keyTimes="0;1"
                  calcMode="linear"
                >
                  <mpath xlink:href="#grid-main-house" />
                </animateMotion>
              </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};

import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/show-line";
import { html, svg } from "lit";
import { styleLine } from "@/utils/style-line";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/compute-individual-position";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";

type FlowBatteryToGridFlows = Pick<Flows, Exclude<keyof Flows, "solar">>;

export const flowBatteryToGrid = (config: PowerFlowCardPlusConfig, { battery, grid, individual, newDur }: FlowBatteryToGridFlows) => {
  return grid.has && battery.has && showLine(config, Math.max(grid.state.toBattery || 0, battery.state.toGrid || 0))
    ? html`<div
        class="lines ${classMap({
          high: battery.has || checkHasBottomIndividual(individual),
          "individual1-individual2": !battery.has && individual.every((i) => i?.has),
          "multi-individual": checkHasRightIndividual(individual),
        })}"
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-grid-flow">
          <path
            id="battery-grid"
            class=${styleLine(battery.state.toGrid || grid.state.toBattery || 0, config)}
            d="M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20"
            vector-effect="non-scaling-stroke"
          ></path>
          ${checkShouldShowDots(config) && grid.state.toBattery
            ? svg`<circle
          r="1"
          class="battery-from-grid"
          vector-effect="non-scaling-stroke"
        >
          <animateMotion
            dur="${newDur.batteryGrid}s"
            repeatCount="indefinite"
            keyPoints="1;0" keyTimes="0;1"
            calcMode="linear"
          >
            <mpath xlink:href="#battery-grid" />
          </animateMotion>
        </circle>`
            : ""}
          ${checkShouldShowDots(config) && battery.state.toGrid
            ? svg`<circle
              r="1"
              class="battery-to-grid"
              vector-effect="non-scaling-stroke"
            >
              <animateMotion
                dur="${newDur.batteryGrid}s"
                repeatCount="indefinite"
                calcMode="linear"
              >
                <mpath xlink:href="#battery-grid" />
              </animateMotion>
            </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};

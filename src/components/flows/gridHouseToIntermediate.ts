import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowsWithIntermediate = Flows & { intermediateObjs: any[] };

// index 0 = intermediate[0] (bottom slot), index 1 = intermediate[1] (top slot)
export const flowGridHouseToIntermediate = (
  config: PowerFlowCardPlusConfig,
  { battery, grid, intermediateObjs, individual, newDur }: FlowsWithIntermediate,
  index: number
) => {
  const intermediateObj = intermediateObjs[index];
  if (!intermediateObj?.has || !grid.has || !showLine(config, intermediateObj.flowFromGridHouse)) return "";

  const pathId = `grid-house-intermediate-${index}`;
  const divId = `grid-house-intermediate-${index}-flow`;

  // index=0: curve from gridHouse mid down-left to intermediate[0] bottom
  // index=1: curve from gridHouse mid up-left to intermediate[1] top
  // These coordinates are approximate — tune visually in HA after build.
  const d = index === 0
    ? "M55,50 v8 c0,42 -43,42 -43,42"
    : "M55,50 v-8 c0,-42 -43,-42 -43,-42";

  return html`<div
      class="lines ${classMap({
        high: battery.has || checkHasBottomIndividual(individual),
        "individual1-individual2": !battery.has && individual.every((i: any) => i?.has),
        "multi-individual": checkHasRightIndividual(individual),
      })}"
      id="${divId}"
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <path
          id="${pathId}"
          class="intermediate ${styleLine(intermediateObj.flowFromGridHouse || 0, config)}"
          d="${d}"
          vector-effect="non-scaling-stroke"
        ></path>
        ${checkShouldShowDots(config) && intermediateObj.flowFromGridHouse
          ? svg`<circle
              r="1"
              class="intermediate"
              vector-effect="non-scaling-stroke"
            >
              <animateMotion
                dur="${newDur.intermediateFromGridHouse[index]}s"
                repeatCount="indefinite"
                calcMode="linear"
              >
                <mpath xlink:href="#${pathId}" />
              </animateMotion>
            </circle>`
          : ""}
      </svg>
    </div>`;
};

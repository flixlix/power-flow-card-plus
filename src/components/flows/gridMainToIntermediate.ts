import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowsWithIntermediate = Flows & { intermediateObjs: any[]; gridMain?: any };

// index 0 = intermediate[0] (bottom slot), index 1 = intermediate[1] (top slot)
export const flowGridMainToIntermediate = (
  config: PowerFlowCardPlusConfig,
  { battery, gridMain, intermediateObjs, individual, newDur }: FlowsWithIntermediate,
  index: number
) => {
  const intermediateObj = intermediateObjs[index];
  if (!intermediateObj?.has || !gridMain?.has || !showLine(config, intermediateObj.flowFromGridMain)) return "";

  const pathId = `grid-main-intermediate-${index}`;
  const divId = `grid-main-intermediate-${index}-flow`;

  // index=0: gridMain (col 0 mid) → intermediate[0] (col 1 bottom): right then down
  // index=1: gridMain (col 0 mid) → intermediate[1] (col 1 top): right then up
  // gridMain is to the LEFT of the lines SVG viewport (col 0), so start at x=0 left edge.
  // Intermediate col 1 is at approximately x=12. Approximate paths — tune visually.
  const d = index === 0
    ? "M0,50 H12 V100"
    : "M0,50 H12 V0";

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
          class="intermediate ${styleLine(intermediateObj.flowFromGridMain || 0, config)}"
          d="${d}"
          vector-effect="non-scaling-stroke"
        ></path>
        ${checkShouldShowDots(config) && intermediateObj.flowFromGridMain
          ? svg`<circle
              r="1"
              class="intermediate"
              vector-effect="non-scaling-stroke"
            >
              <animateMotion
                dur="${newDur.intermediateFromGridMain[index]}s"
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

import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/showLine";
import { html, svg } from "lit";
import { styleLine } from "@/utils/styleLine";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/computeIndividualPosition";
import { checkShouldShowDots } from "@/utils/checkShouldShowDots";

type FlowSolarToBatteryFlows = Pick<Flows, Exclude<keyof Flows, "grid">>;

export const flowSolarToBattery = (config: PowerFlowCardPlusConfig, { battery, individual, solar, newDur }: FlowSolarToBatteryFlows) => {
  return battery.has && solar.has && showLine(config, solar.state.toBattery || 0)
    ? html`<div
        class="lines ${classMap({
          high: battery.has || checkHasBottomIndividual(individual),
          "individual1-individual2": !battery.has && individual.every((i) => i?.has),
          "multi-individual": checkHasRightIndividual(individual),
        })}"
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-battery-flow" class="flat-line">
          <path
            id="battery-solar"
            class="battery-solar ${styleLine(solar.state.toBattery || 0, config)}"
            d="M50,0 V100"
            vector-effect="non-scaling-stroke"
          ></path>
          ${checkShouldShowDots(config) && solar.state.toBattery
            ? svg`<circle
                r="1"
                class="battery-solar"
                vector-effect="non-scaling-stroke"
              >
                <animateMotion
                  dur="${newDur.solarToBattery}s"
                  repeatCount="indefinite"
                  calcMode="linear"
                >
                  <mpath xlink:href="#battery-solar" />
                </animateMotion>
              </circle>`
            : ""}
        </svg>
      </div>`
    : "";
};

import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/show-line";
import { html, svg, nothing } from "lit";
import { styleLine } from "@/utils/style-line";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/compute-individual-position";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";
import { checkFlowDotsCount } from "@/utils/check-flow-dots-count";


const solarToBatteryDot = (config: PowerFlowCardPlusConfig, solar: Flows["solar"], newDur: Flows["newDur"]) => {
  if (!checkShouldShowDots(config) || !solar.state.toBattery) return nothing;

  return svg`${Array.from({ length: checkFlowDotsCount(config) ?? 1 }).map((_, i) => {const n = checkFlowDotsCount(config) ?? 1;
  return svg`<circle r="1" class="battery-solar" vector-effect="non-scaling-stroke">
      <animateMotion dur="${newDur.solarToBattery / n}s" repeatCount="indefinite" calcMode="paced"
      keyTimes="0;1;1" keyPoints="${(i) / n} ; ${(i+1) / n}; ${(i) / n}">
        <mpath xlink:href="#battery-solar" />
      </animateMotion>
    </circle>`;
  })}`
};

type FlowSolarToBatteryFlows = Pick<Flows, Exclude<keyof Flows, "grid">>;
export const flowSolarToBattery = (config: PowerFlowCardPlusConfig, { battery, individual, solar, newDur }: FlowSolarToBatteryFlows) => {
  const shouldShow = battery.has && solar.has && showLine(config, solar.state.toBattery || 0);
  if (!shouldShow) return nothing;

  return html`<div
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
      ${solarToBatteryDot(config, solar, newDur)}
    </svg>
  </div>`;
};

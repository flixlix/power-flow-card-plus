import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../../power-flow-card-plus";
import { classMap } from "lit/directives/class-map.js";
import { NewDur } from "../../type";
import { styleLine } from "../../utils/styleLine";
import { PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";
import { showLine } from "../../utils/showLine";
import { IndividualObject } from "../../states/raw/individual/getIndividualObject";
import { flowSolarToHome } from "./solarToHome";
import { flowSolarToGrid } from "./solarToGrid";
import { flowSolarToBattery } from "./solarToBattery";
import { flowGridToHome } from "./gridToHome";
import { flowBatteryToHome } from "./batteryToHome";
import { flowBatteryGrid } from "./batteryGrid";

export interface Flows {
  battery: any;
  grid: any;
  individual: IndividualObject[];
  solar: any;
  newDur: NewDur;
}

export const flowElement = (config: PowerFlowCardPlusConfig, { battery, grid, individual, solar, newDur }: Flows) => {
  return html`
  ${flowSolarToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToGrid(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToBattery(config, { battery, individual, solar, newDur })}
  ${flowGridToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowBatteryToHome(config, { battery, grid, individual, newDur })}
  ${flowBatteryGrid(config, { battery, grid, individual, newDur })}
</div>`;
};

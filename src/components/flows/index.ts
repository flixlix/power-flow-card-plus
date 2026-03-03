import { html } from "lit";
import { NewDur } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { IndividualObject } from "@/states/raw/individual/getIndividualObject";
import { flowSolarToHome } from "./solarToHome";
import { flowSolarToGrid } from "./solarToGrid";
import { flowSolarToBattery } from "./solarToBattery";
import { flowGridToHome } from "./gridToHome";
import { flowBatteryToHome } from "./batteryToHome";
import { flowBatteryGrid } from "./batteryGrid";
import { flowGridMainToGridHouse } from "./gridMainToGridHouse";
import { flowGridHouseToIntermediate } from "./gridHouseToIntermediate";

export interface Flows {
  battery: any;
  grid: any;
  gridMain?: any;
  intermediateObjs?: any[];
  individual: IndividualObject[];
  solar: any;
  newDur: NewDur;
}

export const flowElement = (
  config: PowerFlowCardPlusConfig,
  { battery, grid, gridMain, intermediateObjs = [], individual, solar, newDur }: Flows
) => {
  return html`
  ${flowSolarToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToGrid(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToBattery(config, { battery, individual, solar, newDur })}
  ${gridMain ? flowGridMainToGridHouse(config, { battery, grid, gridMain, individual, solar, newDur }) : ""}
  ${flowGridToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowBatteryToHome(config, { battery, grid, individual, newDur })}
  ${flowBatteryGrid(config, { battery, grid, individual, newDur })}
  ${intermediateObjs.length > 0 ? flowGridHouseToIntermediate(config, { battery, grid, intermediateObjs, individual, solar, newDur }, 0) : ""}
  ${intermediateObjs.length > 1 ? flowGridHouseToIntermediate(config, { battery, grid, intermediateObjs, individual, solar, newDur }, 1) : ""}
</div>`;
};

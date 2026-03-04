import { html } from "lit";
import { NewDur } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { IndividualObject } from "@/states/raw/individual/getIndividualObject";
import { FlowGeometry } from "@/utils/flowGeometry";
import { flowSolarToHome } from "./solarToHome";
import { flowSolarToGrid } from "./solarToGrid";
import { flowSolarToBattery } from "./solarToBattery";
import { flowGridToHome } from "./gridToHome";
import { flowBatteryToHome } from "./batteryToHome";
import { flowBatteryGrid } from "./batteryGrid";
import { flowGridMainToGridHouse } from "./gridMainToGridHouse";
import { flowGridHouseToIntermediate } from "./gridHouseToIntermediate";
import { flowGridMainToIntermediate } from "./gridMainToIntermediate";

export interface Flows {
  battery: any;
  grid: any;
  gridMain?: any;
  intermediateObjs?: any[];
  individual: IndividualObject[];
  solar: any;
  newDur: NewDur;
  geo: FlowGeometry;
}

export const flowElement = (
  config: PowerFlowCardPlusConfig,
  { battery, grid, gridMain, intermediateObjs = [], individual, solar, newDur, geo }: Flows
) => {
  return html`
    ${flowSolarToHome(config, { battery, grid, individual, solar, newDur, geo })}
    ${flowSolarToGrid(config, { battery, grid, individual, solar, newDur, geo })}
    ${flowSolarToBattery(config, { battery, individual, solar, newDur, geo })}
    ${gridMain ? flowGridMainToGridHouse(config, { battery, grid, gridMain, individual, solar, newDur, geo }) : ""}
    ${flowGridToHome(config, { battery, grid, individual, solar, newDur, geo })}
    ${flowBatteryToHome(config, { battery, grid, individual, newDur, geo })} ${flowBatteryGrid(config, { battery, grid, individual, newDur, geo })}
    ${intermediateObjs.length > 0 ? flowGridHouseToIntermediate(config, { battery, grid, intermediateObjs, individual, solar, newDur, geo }, 0) : ""}
    ${intermediateObjs.length > 1 ? flowGridHouseToIntermediate(config, { battery, grid, intermediateObjs, individual, solar, newDur, geo }, 1) : ""}
    ${gridMain && intermediateObjs.length > 0
      ? flowGridMainToIntermediate(config, { battery, grid, gridMain, intermediateObjs, individual, solar, newDur, geo }, 0)
      : ""}
    ${gridMain && intermediateObjs.length > 1
      ? flowGridMainToIntermediate(config, { battery, grid, gridMain, intermediateObjs, individual, solar, newDur, geo }, 1)
      : ""}
  `;
};

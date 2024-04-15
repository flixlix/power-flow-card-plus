import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { isEntityAvailable } from "../states/utils/existenceEntity";
import { unavailableOrMisconfiguredError } from "./unavailableError";
import { getEntityState } from "../states/utils/getEntityState";
import { getEntityStateWatts } from "../states/utils/getEntityStateWatts";
import { displayValue } from "./displayValue";

export const displayNonFossilState = (
  hass: HomeAssistant,
  config: PowerFlowCardPlusConfig,
  entityFossil: string,
  totalFromGrid: number
): string | number => {
  if (!entityFossil || !isEntityAvailable(hass, entityFossil)) {
    unavailableOrMisconfiguredError(entityFossil);
    return "NaN";
  }
  const unitWhiteSpace = config.entities.fossil_fuel_percentage?.unit_white_space ?? true;
  const unitOfMeasurement: "W" | "%" = config.entities.fossil_fuel_percentage?.state_type === "percentage" ? "%" : "W" || "W";
  const nonFossilFuelDecimal: number = 1 - (getEntityState(hass, entityFossil) ?? 0) / 100;
  let gridConsumption: number;
  if (typeof config.entities.grid?.entity === "string") {
    gridConsumption = totalFromGrid;
  } else {
    gridConsumption = getEntityStateWatts(hass, config.entities.grid?.entity.consumption) || 0;
  }

  /* based on choice, change output from watts to % */

  const displayZeroTolerance = config.entities.fossil_fuel_percentage?.display_zero_tolerance ?? 0;
  if (unitOfMeasurement === "W") {
    let nonFossilFuelWatts = gridConsumption * nonFossilFuelDecimal;
    if (displayZeroTolerance) {
      if (nonFossilFuelWatts < displayZeroTolerance) {
        nonFossilFuelWatts = 0;
      }
    }
    return displayValue(hass, config, nonFossilFuelWatts, {
      unitWhiteSpace,
      watt_threshold: config.watt_threshold,
    });
  }
  let nonFossilFuelPercentage: number = 100 - (getEntityState(hass, entityFossil) ?? 0);
  if (displayZeroTolerance) {
    if (nonFossilFuelPercentage < displayZeroTolerance) {
      nonFossilFuelPercentage = 0;
    }
  }
  return displayValue(hass, config, nonFossilFuelPercentage, {
    unit: "%",
    unitWhiteSpace,
    decimals: 0,
    watt_threshold: config.watt_threshold,
  });
};

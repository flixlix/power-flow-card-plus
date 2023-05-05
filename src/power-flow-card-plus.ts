/* eslint-disable wc/guard-super-call */
/* eslint-disable import/extensions */
/* eslint-disable no-nested-ternary */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { HassEntity, UnsubscribeFunc } from "home-assistant-js-websocket";
import { formatNumber, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { html, LitElement, PropertyValues, svg, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "./power-flow-card-plus-config";
import { coerceNumber, coerceStringArray, round, isNumberValue } from "./utils/utils";
import { EntityType } from "./type";
import { logError } from "./logging";
import { registerCustomCard } from "./utils/register-custom-card";
import { RenderTemplateResult, subscribeRenderTemplate } from "./template/ha-websocket.js";
import { styles } from "./style";
import { defaultValues, getDefaultConfig } from "./utils/get-default-config";

const circleCircumference = 238.76104;

registerCustomCard({
  type: "power-flow-card-plus",
  name: "Power Flow Card Plus",
  description:
    "An extended version of the power flow card with richer options, advanced features and a few small UI enhancements. Inspired by the Energy Dashboard.",
});

@customElement("power-flow-card-plus")
export class PowerFlowCardPlus extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config = {} as PowerFlowCardPlusConfig;

  @state() private _templateResults: Partial<Record<string, RenderTemplateResult>> = {};
  @state() private _unsubRenderTemplate?: Promise<UnsubscribeFunc>;
  @state() private _unsubRenderTemplates?: Map<string, Promise<UnsubscribeFunc>> = new Map();

  @query("#battery-grid-flow") batteryGridFlow?: SVGSVGElement;
  @query("#battery-home-flow") batteryToHomeFlow?: SVGSVGElement;
  @query("#grid-home-flow") gridToHomeFlow?: SVGSVGElement;
  @query("#solar-battery-flow") solarToBatteryFlow?: SVGSVGElement;
  @query("#solar-grid-flow") solarToGridFlow?: SVGSVGElement;
  @query("#solar-home-flow") solarToHomeFlow?: SVGSVGElement;

  setConfig(config: PowerFlowCardPlusConfig): void {
    if (!config.entities || (!config.entities?.battery?.entity && !config.entities?.grid?.entity && !config.entities?.solar?.entity)) {
      throw new Error("At least one entity for battery, grid or solar must be defined");
    }
    this._config = {
      ...config,
      inverted_entities: coerceStringArray(config.inverted_entities, ","),
      kw_decimals: coerceNumber(config.kw_decimals, defaultValues.kilowattDecimals),
      min_flow_rate: coerceNumber(config.min_flow_rate, defaultValues.minFlowRate),
      max_flow_rate: coerceNumber(config.max_flow_rate, defaultValues.maxFlowRate),
      w_decimals: coerceNumber(config.w_decimals, defaultValues.wattDecimals),
      watt_threshold: coerceNumber(config.watt_threshold, defaultValues.wattThreshold),
      max_expected_power: coerceNumber(config.max_expected_power, defaultValues.maxExpectedPower),
      min_expected_power: coerceNumber(config.min_expected_power, defaultValues.minExpectedPower),
    };
  }

  public connectedCallback() {
    super.connectedCallback();
    this._tryConnectAll();
  }

  public disconnectedCallback() {
    this._tryDisconnectAll();
  }

  // do not use ui editor for now, as it is not working
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./ui-editor/ui-editor");
    return document.createElement("power-flow-card-plus-editor");
  }

  public static getStubConfig(hass: HomeAssistant): object {
    // get available power entities
    return getDefaultConfig(hass);
  }

  public getCardSize(): Promise<number> | number {
    return 3;
  }
  private unavailableOrMisconfiguredError = (entityId: string | undefined) =>
    logError(`Entity "${entityId ?? "Unknown"}" is not available or misconfigured`);

  private entityExists = (entityId: string): boolean => entityId in this.hass.states;

  private entityAvailable = (entityId: string): boolean => isNumberValue(this.hass.states[entityId]?.state);

  private entityInverted = (entityType: EntityType) => this._config!.inverted_entities.includes(entityType);

  private previousDur: { [name: string]: number } = {};

  private mapRange(value: number, minOut: number, maxOut: number, minIn: number, maxIn: number): number {
    if (value > maxIn) return maxOut;
    return ((value - minIn) * (maxOut - minOut)) / (maxIn - minIn) + minOut;
  }

  private circleRate = (value: number, total: number): number => {
    if (this._config.use_new_flow_rate_model) {
      const maxPower = this._config.max_expected_power;
      const minPower = this._config.min_expected_power;
      const maxRate = this._config.max_flow_rate;
      const minRate = this._config.min_flow_rate;
      return this.mapRange(value, maxRate, minRate, minPower, maxPower);
    }
    const min = this._config?.min_flow_rate!;
    const max = this._config?.max_flow_rate!;
    return max - (value / total) * (max - min);
  };

  private getEntityStateObj = (entity: string | undefined): HassEntity | undefined => {
    if (!entity || !this.entityAvailable(entity)) {
      this.unavailableOrMisconfiguredError(entity);
      return undefined;
    }
    return this.hass.states[entity];
  };

  private additionalCircleRate = (entry?: boolean | number, value?: number) => {
    if (entry === true && value) {
      return value;
    }
    if (isNumberValue(entry)) {
      return entry;
    }
    return 1.66;
  };

  private getEntityState = (entity: string | undefined): number => {
    if (!entity || !this.entityAvailable(entity)) {
      this.unavailableOrMisconfiguredError(entity);
      return 0;
    }
    return coerceNumber(this.hass.states[entity].state);
  };

  private getEntityStateWatts = (entity: string | undefined): number => {
    if (!entity || !this.entityAvailable(entity)) {
      this.unavailableOrMisconfiguredError(entity);
      return 0;
    }
    const stateObj = this.hass.states[entity];
    const value = coerceNumber(stateObj.state);
    if (stateObj.attributes.unit_of_measurement === "kW") return value * 1000;
    return value;
  };

  private displayNonFossilState = (entityFossil: string, totalFromGrid: number): string | number => {
    if (!entityFossil || !this.entityAvailable(entityFossil)) {
      this.unavailableOrMisconfiguredError(entityFossil);
      return "NaN";
    }
    const unitWhiteSpace = this._config!.entities.fossil_fuel_percentage?.unit_white_space ?? true;
    const unitOfMeasurement: "W" | "%" = this._config!.entities.fossil_fuel_percentage?.state_type === "percentage" ? "%" : "W" || "W";
    const nonFossilFuelDecimal: number = 1 - this.getEntityState(entityFossil) / 100;
    let gridConsumption: number;
    if (typeof this._config!.entities.grid!.entity === "string") {
      gridConsumption = totalFromGrid;
    } else {
      gridConsumption = this.getEntityStateWatts(this._config!.entities!.grid!.entity!.consumption) || 0;
    }

    /* based on choice, change output from watts to % */
    let result: string | number;
    const displayZeroTolerance = this._config.entities.fossil_fuel_percentage?.display_zero_tolerance ?? 0;
    if (unitOfMeasurement === "W") {
      let nonFossilFuelWatts = gridConsumption * nonFossilFuelDecimal;
      if (displayZeroTolerance) {
        if (nonFossilFuelWatts < displayZeroTolerance) {
          nonFossilFuelWatts = 0;
        }
      }
      result = this.displayValue(nonFossilFuelWatts, "W", unitWhiteSpace);
    } else {
      let nonFossilFuelPercentage: number = 100 - this.getEntityState(entityFossil);
      if (displayZeroTolerance) {
        if (nonFossilFuelPercentage < displayZeroTolerance) {
          nonFossilFuelPercentage = 0;
        }
      }
      result = nonFossilFuelPercentage
        .toFixed(0)
        .toString()
        .concat(unitWhiteSpace === false ? "" : " ")
        .concat(unitOfMeasurement);
    }
    return result;
  };

  private displayValue = (value: number | string | null, unit?: string | undefined, unitWhiteSpace?: boolean | undefined) => {
    if (value === null) return "0";
    if (Number.isNaN(+value)) return value;
    const valueInNumber = Number(value);
    const isKW = unit === undefined && valueInNumber >= this._config!.watt_threshold;
    const v = formatNumber(
      isKW ? round(valueInNumber / 1000, this._config!.kw_decimals) : round(valueInNumber, this._config!.w_decimals),
      this.hass.locale
    );
    return `${v}${unitWhiteSpace === false ? "" : " "}${unit || (isKW ? "kW" : "W")}`;
  };

  private openDetails(entityId?: string | undefined): void {
    if (!entityId || !this._config.clickable_entities) return;
    /* also needs to open details if entity is unavailable, but not if entity doesn't exist is hass states */
    if (!this.entityExists(entityId)) return;
    const e = new CustomEvent("hass-more-info", {
      composed: true,
      detail: { entityId },
    });
    this.dispatchEvent(e);
  }

  private hasField(field?: any, acceptStringState?: boolean): boolean {
    return (
      (field !== undefined && field?.display_zero === true) ||
      (this.getEntityStateWatts(field?.entity) > (field?.display_zero_tolerance ?? 0) && this.entityAvailable(field?.entity)) ||
      acceptStringState
        ? typeof this.hass.states[field?.entity]?.state === "string"
        : false
    ) as boolean;
  }

  private showLine(power: number): boolean {
    if (this._config?.display_zero_lines !== false) return true;
    return power > 0;
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { entities } = this._config;

    function colorRgbListToHex(rgbList: number[]): string {
      return "#".concat(rgbList.map((x) => x.toString(16).padStart(2, "0")).join(""));
    }

    this.style.setProperty(
      "--clickable-cursor",
      this._config.clickable_entities ? "pointer" : "default"
    ); /* show pointer if clickable entities is enabled */

    const hasGrid = entities?.grid?.entity !== undefined;
    const hasGridPowerOutage = this.hasField(entities.grid?.power_outage, true);
    const isGridPowerOutage =
      hasGridPowerOutage && this.hass.states[entities.grid!.power_outage!.entity!].state === (entities.grid?.power_outage.state_alert ?? "on");

    const hasBattery = entities?.battery?.entity !== undefined;

    const hasIndividual2 = this.hasField(entities.individual2);
    const hasIndividual2Secondary = this.hasField(entities.individual2?.secondary_info, true);

    const hasIndividual1 = this.hasField(entities.individual1);
    const hasIndividual1Secondary = this.hasField(entities.individual1?.secondary_info, true);

    const hasSolarProduction = entities.solar !== undefined;
    const hasSolarSecondary = this.hasField(entities.solar?.secondary_info);

    const hasHomeSecondary = this.hasField(entities.home?.secondary_info);

    const hasReturnToGrid = hasGrid && (typeof entities.grid!.entity === "string" || entities.grid!.entity!.production);

    let totalFromGrid: number | null = 0;
    let totalToGrid: number | null = 0;

    let gridConsumptionColor = this._config.entities.grid?.color?.consumption;
    if (gridConsumptionColor !== undefined) {
      if (typeof gridConsumptionColor === "object") {
        gridConsumptionColor = colorRgbListToHex(gridConsumptionColor);
      }
      this.style.setProperty("--energy-grid-consumption-color", gridConsumptionColor || "var(--energy-grid-consumption-color)" || "#488fc2");
    }

    if (hasGrid) {
      if (typeof entities.grid!.entity === "string") {
        if (this.entityInverted("grid")) {
          totalFromGrid = Math.abs(Math.min(this.getEntityStateWatts(entities.grid?.entity), 0));
        } else {
          totalFromGrid = Math.max(this.getEntityStateWatts(entities.grid?.entity), 0);
        }
      } else {
        totalFromGrid = this.getEntityStateWatts(entities.grid!.entity!.consumption);
      }
    }

    if (this._config.entities.grid?.display_zero_tolerance !== undefined) {
      totalFromGrid = totalFromGrid! > this._config.entities.grid?.display_zero_tolerance ? totalFromGrid : 0;
    }

    const hasGridSecondary = this.hasField(entities.grid?.secondary_info);

    let gridSecondaryUsage: number | null = null;
    if (hasGridSecondary) {
      const gridSecondaryEntity = this.hass.states[this._config.entities.grid?.secondary_info?.entity ?? 0];
      const gridSecondaryState = Number(gridSecondaryEntity.state);
      if (this.entityInverted("gridSecondary")) {
        gridSecondaryUsage = Math.abs(Math.min(gridSecondaryState, 0));
      } else {
        gridSecondaryUsage = Math.max(gridSecondaryState, 0);
      }
    }

    let gridProductionColor = this._config.entities.grid?.color?.production;
    if (gridProductionColor !== undefined) {
      if (typeof gridProductionColor === "object") {
        gridProductionColor = colorRgbListToHex(gridProductionColor);
      }
      this.style.setProperty("--energy-grid-return-color", gridProductionColor || "#a280db");
    }
    if (hasReturnToGrid) {
      if (typeof entities.grid!.entity === "string") {
        totalToGrid = this.entityInverted("grid")
          ? Math.max(this.getEntityStateWatts(entities.grid!.entity), 0)
          : Math.abs(Math.min(this.getEntityStateWatts(entities.grid!.entity), 0));
      } else {
        totalToGrid = this.getEntityStateWatts(entities.grid?.entity.production);
      }
    }

    if (this._config.entities.grid?.display_zero_tolerance !== undefined) {
      totalToGrid = totalToGrid! > this._config.entities.grid?.display_zero_tolerance ? totalToGrid : 0;
    }

    const mainGridEntity: undefined | string =
      typeof entities.grid?.entity === "object" ? entities.grid.entity.consumption || entities.grid.entity.production : entities.grid?.entity;

    const gridIcon: string = !isGridPowerOutage
      ? entities.grid?.icon || (entities.grid?.use_metadata && this.getEntityStateObj(mainGridEntity)?.attributes.icon) || "mdi:transmission-tower"
      : entities.grid?.power_outage.icon_alert || "mdi:transmission-tower-off";

    const gridName: string =
      entities.grid?.name ||
      (entities.grid?.use_metadata && this.getEntityStateObj(mainGridEntity)?.attributes.friendly_name) ||
      this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.grid");

    const gridIconColorType = entities.grid?.color_icon;
    this.style.setProperty(
      "--icon-grid-color",
      gridIconColorType === "consumption"
        ? "var(--energy-grid-consumption-color)"
        : gridIconColorType === "production"
        ? "var(--energy-grid-return-color)"
        : gridIconColorType === true
        ? totalFromGrid >= totalToGrid
          ? "var(--energy-grid-consumption-color)"
          : "var(--energy-grid-return-color)"
        : "var(--primary-text-color)"
    );

    const gridSecondaryValueColorType = this._config.entities.grid?.secondary_info?.color_value;
    this.style.setProperty(
      "--secondary-text-grid-color",
      gridSecondaryValueColorType === "consumption"
        ? "var(--energy-grid-consumption-color)"
        : gridSecondaryValueColorType === "production"
        ? "var(--energy-grid-return-color)"
        : gridSecondaryValueColorType === true
        ? totalFromGrid >= totalToGrid
          ? "var(--energy-grid-consumption-color)"
          : "var(--energy-grid-return-color)"
        : "var(--primary-text-color)"
    );

    const gridCircleColorType = this._config.entities.grid?.color_circle;
    this.style.setProperty(
      "--circle-grid-color",
      gridCircleColorType === "consumption"
        ? "var(--energy-grid-consumption-color)"
        : gridCircleColorType === "production"
        ? "var(--energy-grid-return-color)"
        : gridCircleColorType === true
        ? totalFromGrid >= totalToGrid
          ? "var(--energy-grid-consumption-color)"
          : "var(--energy-grid-return-color)"
        : "var(--energy-grid-consumption-color)"
    );

    let individual1Usage: number | null = null;
    let individual1SecondaryUsage: number | string | null = null;
    const individual1Name: string =
      this._config.entities.individual1?.name || this.getEntityStateObj(entities.individual1?.entity)?.attributes.friendly_name || "Car";
    const individual1Icon: undefined | string =
      this._config.entities.individual1?.icon || this.getEntityStateObj(entities.individual1?.entity)?.attributes.icon || "mdi:car-electric";
    let individual1Color = this._config.entities.individual1?.color;
    if (individual1Color !== undefined) {
      if (typeof individual1Color === "object") individual1Color = colorRgbListToHex(individual1Color);
      this.style.setProperty("--individualone-color", individual1Color); /* dynamically update color of entity depending on user's input */
    }
    this.style.setProperty(
      "--icon-individualone-color",
      this._config.entities.individual1?.color_icon ? "var(--individualone-color)" : "var(--primary-text-color)"
    );
    if (hasIndividual1) {
      const individual1Entity = this.hass.states[this._config.entities.individual1?.entity!];
      const individual1State = Number(individual1Entity.state);
      if (this.entityInverted("individual1")) individual1Usage = Math.abs(Math.min(individual1State, 0));
      else individual1Usage = Math.max(individual1State, 0);
    }
    if (hasIndividual1Secondary) {
      const individual1SecondaryEntity = this.hass.states[this._config.entities.individual1?.secondary_info?.entity!];
      const individual1SecondaryState = individual1SecondaryEntity.state;
      if (typeof individual1SecondaryState === "number") {
        if (this.entityInverted("individual1Secondary")) {
          individual1SecondaryUsage = Math.abs(Math.min(individual1SecondaryState, 0));
        } else {
          individual1SecondaryUsage = Math.max(individual1SecondaryState, 0);
        }
      } else if (typeof individual1SecondaryState === "string") {
        individual1SecondaryUsage = individual1SecondaryState;
      }
    }

    let individual2Usage: number | null = null;
    let individual2SecondaryUsage: number | string | null = null;
    const individual2Name: string =
      this._config.entities.individual2?.name || this.getEntityStateObj(entities.individual2?.entity)?.attributes.friendly_name || "Motorcycle";
    const individual2Icon: undefined | string =
      this._config.entities.individual2?.icon || this.getEntityStateObj(entities.individual2?.entity)?.attributes.icon || "mdi:motorbike-electric";
    let individual2Color = this._config.entities.individual2?.color;
    if (individual2Color !== undefined) {
      if (typeof individual2Color === "object") individual2Color = colorRgbListToHex(individual2Color);
      this.style.setProperty("--individualtwo-color", individual2Color); /* dynamically update color of entity depending on user's input */
    }
    this.style.setProperty(
      "--icon-individualtwo-color",
      this._config.entities.individual2?.color_icon ? "var(--individualtwo-color)" : "var(--primary-text-color)"
    );
    if (hasIndividual2) {
      const individual2Entity = this.hass.states[this._config.entities.individual2?.entity!];
      const individual2State = Number(individual2Entity.state);
      if (this.entityInverted("individual2")) individual2Usage = Math.abs(Math.min(individual2State, 0));
      else individual2Usage = Math.max(individual2State, 0);
    }
    if (hasIndividual2Secondary) {
      const individual2SecondaryEntity = this.hass.states[this._config.entities.individual2?.secondary_info?.entity!];
      const individual2SecondaryState = individual2SecondaryEntity.state;
      if (typeof individual2SecondaryState === "number") {
        if (this.entityInverted("individual2Secondary")) {
          individual2SecondaryUsage = Math.abs(Math.min(individual2SecondaryState, 0));
        } else {
          individual2SecondaryUsage = Math.max(individual2SecondaryState, 0);
        }
      } else if (typeof individual2SecondaryState === "string") {
        individual2SecondaryUsage = individual2SecondaryState;
      }
    }

    let solarSecondaryProduction: number | null = null;
    if (hasSolarSecondary) {
      const solarSecondaryEntity = this.hass.states[this._config.entities.solar?.secondary_info?.entity!];
      const solarSecondaryState = Number(solarSecondaryEntity.state);
      if (this.entityInverted("solarSecondary")) {
        solarSecondaryProduction = Math.abs(Math.min(solarSecondaryState, 0));
      } else {
        solarSecondaryProduction = Math.max(solarSecondaryState, 0);
      }
    }

    let homeSecondaryUsage: number | null = null;

    if (hasHomeSecondary) {
      const homeSecondaryEntity = this.hass.states[this._config.entities.home?.secondary_info?.entity!];
      const homeSecondaryState = Number(homeSecondaryEntity.state);
      if (this.entityInverted("homeSecondary")) {
        homeSecondaryUsage = Math.abs(Math.min(homeSecondaryState, 0));
      } else {
        homeSecondaryUsage = Math.max(homeSecondaryState, 0);
      }
    }
    let totalSolarProduction: number = 0;
    if (this._config.entities.solar?.color !== undefined) {
      let solarColor = this._config.entities.solar?.color;
      if (typeof solarColor === "object") solarColor = colorRgbListToHex(solarColor);
      this.style.setProperty("--energy-solar-color", solarColor || "#ff9800");
    }
    this.style.setProperty("--icon-solar-color", this._config.entities.solar?.color_icon ? "var(--energy-solar-color)" : "var(--primary-text-color)");
    if (hasSolarProduction) {
      if (this.entityInverted("solar")) totalSolarProduction = Math.abs(Math.min(this.getEntityStateWatts(entities.solar?.entity), 0));
      else totalSolarProduction = Math.max(this.getEntityStateWatts(entities.solar?.entity), 0);
      if (entities.solar?.display_zero_tolerance) {
        if (entities.solar.display_zero_tolerance >= totalSolarProduction) totalSolarProduction = 0;
      }
    }

    let totalBatteryIn: number | null = 0;
    let totalBatteryOut: number | null = 0;
    if (hasBattery) {
      if (typeof entities.battery?.entity === "string") {
        totalBatteryIn = this.entityInverted("battery")
          ? Math.max(this.getEntityStateWatts(entities.battery!.entity), 0)
          : Math.abs(Math.min(this.getEntityStateWatts(entities.battery!.entity), 0));
        totalBatteryOut = this.entityInverted("battery")
          ? Math.abs(Math.min(this.getEntityStateWatts(entities.battery!.entity), 0))
          : Math.max(this.getEntityStateWatts(entities.battery!.entity), 0);
      } else {
        totalBatteryIn = this.getEntityStateWatts(entities.battery?.entity?.production);
        totalBatteryOut = this.getEntityStateWatts(entities.battery?.entity?.consumption);
      }
      if (entities?.battery?.display_zero_tolerance) {
        if (entities.battery.display_zero_tolerance >= totalBatteryIn) totalBatteryIn = 0;
        if (entities.battery.display_zero_tolerance >= totalBatteryOut) totalBatteryOut = 0;
      }
    }

    let solarConsumption: number | null = null;
    if (hasSolarProduction) {
      solarConsumption = totalSolarProduction - (totalToGrid ?? 0) - (totalBatteryIn ?? 0);
    }

    let batteryFromGrid: null | number = null;
    let batteryToGrid: null | number = null;
    if (solarConsumption !== null && solarConsumption < 0) {
      // What we returned to the grid and what went in to the battery is more
      // than produced, so we have used grid energy to fill the battery or
      // returned battery energy to the grid
      if (hasBattery) {
        batteryFromGrid = Math.abs(solarConsumption);
        if (batteryFromGrid > totalFromGrid) {
          batteryToGrid = Math.min(batteryFromGrid - totalFromGrid, 0);
          batteryFromGrid = totalFromGrid;
        }
      }
      solarConsumption = 0;
    }

    let solarToBattery: null | number = null;
    if (hasSolarProduction && hasBattery) {
      if (!batteryToGrid) {
        batteryToGrid = Math.max(0, (totalToGrid || 0) - (totalSolarProduction || 0) - (totalBatteryIn || 0) - (batteryFromGrid || 0));
      }
      solarToBattery = totalBatteryIn! - (batteryFromGrid || 0);
    } else if (!hasSolarProduction && hasBattery) {
      batteryToGrid = totalToGrid;
    }

    let solarToGrid = 0;
    if (hasSolarProduction && totalToGrid) solarToGrid = totalToGrid - (batteryToGrid ?? 0);

    let batteryConsumption: number = 0;
    if (hasBattery) {
      batteryConsumption = (totalBatteryOut ?? 0) - (batteryToGrid ?? 0);
    }

    let batteryConsumptionColor = this._config.entities.battery?.color?.consumption;
    if (batteryConsumptionColor !== undefined) {
      if (typeof batteryConsumptionColor === "object") batteryConsumptionColor = colorRgbListToHex(batteryConsumptionColor);
      this.style.setProperty("--energy-battery-out-color", batteryConsumptionColor || "#4db6ac");
    }
    let batteryProductionColor = this._config.entities.battery?.color?.production;
    if (batteryProductionColor !== undefined) {
      if (typeof batteryProductionColor === "object") batteryProductionColor = colorRgbListToHex(batteryProductionColor);
      this.style.setProperty("--energy-battery-in-color", batteryProductionColor || "#a280db");
    }

    const mainBatteryEntity: undefined | string =
      typeof entities.battery?.entity === "object" ? entities.battery.entity.consumption : entities.battery?.entity;

    const batteryName: string =
      entities.battery?.name ||
      (entities.battery?.use_metadata && this.getEntityStateObj(mainBatteryEntity)?.attributes.friendly_name) ||
      this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.battery");

    const batteryIconColorType = this._config.entities.battery?.color_icon;
    this.style.setProperty(
      "--icon-battery-color",
      batteryIconColorType === "consumption"
        ? "var(--energy-battery-in-color)"
        : batteryIconColorType === "production"
        ? "var(--energy-battery-out-color)"
        : batteryIconColorType === true
        ? totalBatteryOut >= totalBatteryIn
          ? "var(--energy-battery-out-color)"
          : "var(--energy-battery-in-color)"
        : "var(--primary-text-color)"
    );

    const batteryStateOfChargeColorType = this._config.entities.battery?.color_state_of_charge_value;
    this.style.setProperty(
      "--text-battery-state-of-charge-color",
      batteryStateOfChargeColorType === "consumption"
        ? "var(--energy-battery-in-color)"
        : batteryStateOfChargeColorType === "production"
        ? "var(--energy-battery-out-color)"
        : batteryStateOfChargeColorType === true
        ? totalBatteryOut >= totalBatteryIn
          ? "var(--energy-battery-out-color)"
          : "var(--energy-battery-in-color)"
        : "var(--primary-text-color)"
    );

    const batteryCircleColorType = this._config.entities.battery?.color_circle;
    this.style.setProperty(
      "--circle-battery-color",
      batteryCircleColorType === "consumption"
        ? "var(--energy-battery-in-color)"
        : batteryCircleColorType === "production"
        ? "var(--energy-battery-out-color)"
        : batteryCircleColorType === true
        ? totalBatteryOut >= totalBatteryIn
          ? "var(--energy-battery-out-color)"
          : "var(--energy-battery-in-color)"
        : "var(--energy-battery-in-color)"
    );

    const gridConsumption = Math.max(totalFromGrid - (batteryFromGrid ?? 0), 0);

    const totalIndividualConsumption = coerceNumber(individual1Usage, 0) + coerceNumber(individual2Usage, 0);

    const totalHomeConsumption = Math.max(gridConsumption + (solarConsumption ?? 0) + (batteryConsumption ?? 0), 0);

    let homeBatteryCircumference: number = 0;
    if (batteryConsumption) homeBatteryCircumference = circleCircumference * (batteryConsumption / totalHomeConsumption);

    let homeSolarCircumference: number = 0;
    if (hasSolarProduction) {
      homeSolarCircumference = circleCircumference * (solarConsumption! / totalHomeConsumption);
    }

    const hasNonFossilFuelSecondary = this.hasField(entities.fossil_fuel_percentage?.secondary_info, true);

    let nonFossilFuelSecondaryUsage: number | string | null = null;

    if (hasNonFossilFuelSecondary) {
      const nonFossilFuelSecondaryEntity = this.hass.states[this._config.entities.fossil_fuel_percentage?.secondary_info?.entity!];
      const nonFossilFuelSecondaryState = nonFossilFuelSecondaryEntity.state;
      if (typeof nonFossilFuelSecondaryState === "number") {
        if (this.entityInverted("nonFossilSecondary")) {
          nonFossilFuelSecondaryUsage = Math.abs(Math.min(nonFossilFuelSecondaryState, 0));
        } else {
          nonFossilFuelSecondaryUsage = Math.max(nonFossilFuelSecondaryState, 0);
        }
      } else if (typeof nonFossilFuelSecondaryState === "string") {
        nonFossilFuelSecondaryUsage = nonFossilFuelSecondaryState;
      }
    }

    const hasNonFossilFuelUsage =
      gridConsumption * 1 - this.getEntityState(entities.fossil_fuel_percentage?.entity) / 100 > 0 &&
      entities.fossil_fuel_percentage?.entity !== undefined &&
      this.entityAvailable(entities.fossil_fuel_percentage?.entity);

    const hasFossilFuelPercentage =
      (entities.fossil_fuel_percentage?.entity !== undefined && entities.fossil_fuel_percentage?.display_zero === true) || hasNonFossilFuelUsage;

    let nonFossilFuelPower: number | undefined;
    let homeNonFossilCircumference: number = 0;

    if (hasNonFossilFuelUsage) {
      const nonFossilFuelDecimal: number = 1 - this.getEntityState(entities.fossil_fuel_percentage?.entity) / 100;
      nonFossilFuelPower = gridConsumption * nonFossilFuelDecimal;
      homeNonFossilCircumference = circleCircumference * (nonFossilFuelPower / totalHomeConsumption);
    }
    const homeGridCircumference =
      circleCircumference *
      ((totalHomeConsumption - (nonFossilFuelPower ?? 0) - (batteryConsumption ?? 0) - (solarConsumption ?? 0)) / totalHomeConsumption);

    const totalLines =
      gridConsumption +
      (solarConsumption ?? 0) +
      solarToGrid +
      (solarToBattery ?? 0) +
      (batteryConsumption ?? 0) +
      (batteryFromGrid ?? 0) +
      (batteryToGrid ?? 0);

    const batteryChargeState = entities.battery?.state_of_charge?.length ? this.getEntityState(entities.battery?.state_of_charge) : null;

    let batteryIcon = "mdi:battery-high";
    if (batteryChargeState === null) {
      batteryIcon = "mdi:battery";
    } else if (batteryChargeState <= 72 && batteryChargeState > 44) {
      batteryIcon = "mdi:battery-medium";
    } else if (batteryChargeState <= 44 && batteryChargeState > 16) {
      batteryIcon = "mdi:battery-low";
    } else if (batteryChargeState <= 16) {
      batteryIcon = "mdi:battery-outline";
    }
    if (entities.battery?.icon !== undefined) batteryIcon = entities.battery?.icon;

    const newDur = {
      batteryGrid: this.circleRate(batteryFromGrid ?? batteryToGrid ?? 0, totalLines),
      batteryToHome: this.circleRate(batteryConsumption ?? 0, totalLines),
      gridToHome: this.circleRate(gridConsumption, totalLines),
      solarToBattery: this.circleRate(solarToBattery ?? 0, totalLines),
      solarToGrid: this.circleRate(solarToGrid, totalLines),
      solarToHome: this.circleRate(solarConsumption ?? 0, totalLines),
      individual1: this.circleRate(individual1Usage ?? 0, totalIndividualConsumption),
      individual2: this.circleRate(individual2Usage ?? 0, totalIndividualConsumption),
      nonFossil: this.circleRate(nonFossilFuelPower ?? 0, totalLines),
    };

    // Smooth duration changes
    ["batteryGrid", "batteryToHome", "gridToHome", "solarToBattery", "solarToGrid", "solarToHome"].forEach((flowName) => {
      const flowSVGElement = this[`${flowName}Flow`] as SVGSVGElement;
      if (flowSVGElement && this.previousDur[flowName] && this.previousDur[flowName] !== newDur[flowName]) {
        flowSVGElement.pauseAnimations();
        flowSVGElement.setCurrentTime(flowSVGElement.getCurrentTime() * (newDur[flowName] / this.previousDur[flowName]));
        flowSVGElement.unpauseAnimations();
      }
      this.previousDur[flowName] = newDur[flowName];
    });

    let nonFossilColor = this._config.entities.fossil_fuel_percentage?.color;
    if (nonFossilColor !== undefined) {
      if (typeof nonFossilColor === "object") nonFossilColor = colorRgbListToHex(nonFossilColor);
      this.style.setProperty("--non-fossil-color", nonFossilColor || "var(--energy-non-fossil-color)");
    }
    this.style.setProperty(
      "--icon-non-fossil-color",
      this._config.entities.fossil_fuel_percentage?.color_icon ? "var(--non-fossil-color)" : "var(--primary-text-color)" || "var(--non-fossil-color)"
    );

    const homeIconColorType = this._config.entities.home?.color_icon;
    const homeSources = {
      battery: {
        value: homeBatteryCircumference,
        color: "var(--energy-battery-out-color)",
      },
      solar: {
        value: homeSolarCircumference,
        color: "var(--energy-solar-color)",
      },
      grid: {
        value: homeGridCircumference,
        color: "var(--energy-grid-consumption-color)",
      },
      gridNonFossil: {
        value: homeNonFossilCircumference,
        color: "var(--energy-non-fossil-color)",
      },
    };

    /* return source object with largest value property */
    const homeLargestSource = Object.keys(homeSources).reduce((a, b) => (homeSources[a].value > homeSources[b].value ? a : b));

    let iconHomeColor: string = "var(--primary-text-color)";
    if (homeIconColorType === "solar") {
      iconHomeColor = "var(--energy-solar-color)";
    } else if (homeIconColorType === "battery") {
      iconHomeColor = "var(--energy-battery-out-color)";
    } else if (homeIconColorType === "grid") {
      iconHomeColor = "var(--energy-grid-consumption-color)";
    } else if (homeIconColorType === true) {
      iconHomeColor = homeSources[homeLargestSource].color;
    }
    this.style.setProperty("--icon-home-color", iconHomeColor);

    const homeTextColorType = this._config.entities.home?.color_value;
    let textHomeColor: string = "var(--primary-text-color)";
    if (homeTextColorType === "solar") {
      textHomeColor = "var(--energy-solar-color)";
    } else if (homeTextColorType === "battery") {
      textHomeColor = "var(--energy-battery-out-color)";
    } else if (homeTextColorType === "grid") {
      textHomeColor = "var(--energy-grid-consumption-color)";
    } else if (homeTextColorType === true) {
      textHomeColor = homeSources[homeLargestSource].color;
    }

    const solarIcon =
      entities.solar?.icon || (entities.solar?.use_metadata && this.getEntityStateObj(entities.solar.entity)?.attributes?.icon) || "mdi:solar-power";

    const solarName: string =
      entities.solar?.name ||
      (entities.solar?.use_metadata && this.getEntityStateObj(entities.solar.entity)?.attributes.friendly_name) ||
      this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.solar");

    const homeIcon =
      entities.home?.icon || (entities.home?.use_metadata && this.getEntityStateObj(entities.home.entity)?.attributes?.icon) || "mdi:home";

    const homeName =
      entities.home?.name ||
      (entities.home?.use_metadata && this.getEntityStateObj(entities.home.entity)?.attributes.friendly_name) ||
      this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.home");

    const nonFossilIcon =
      entities.fossil_fuel_percentage?.icon ||
      (entities.fossil_fuel_percentage?.use_metadata && this.getEntityStateObj(entities.fossil_fuel_percentage.entity)?.attributes?.icon) ||
      "mdi:leaf";

    const nonFossilName =
      entities.fossil_fuel_percentage?.name ||
      (entities.fossil_fuel_percentage?.use_metadata && this.getEntityStateObj(entities.fossil_fuel_percentage.entity)?.attributes.friendly_name) ||
      this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.low_carbon");

    this.style.setProperty("--text-home-color", textHomeColor);

    this.style.setProperty(
      "--text-solar-color",
      this._config.entities.solar?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)"
    );
    this.style.setProperty(
      "--text-non-fossil-color",
      this._config.entities.fossil_fuel_percentage?.color_value ? "var(--energy-non-fossil-color)" : "var(--primary-text-color)"
    );
    this.style.setProperty(
      "--secondary-text-non-fossil-color",
      this._config.entities.fossil_fuel_percentage?.secondary_info?.color_value ? "var(--energy-non-fossil-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--text-individualone-color",
      this._config.entities.individual1?.color_value ? "var(--individualone-color)" : "var(--primary-text-color)"
    );
    this.style.setProperty(
      "--text-individualtwo-color",
      this._config.entities.individual2?.color_value ? "var(--individualtwo-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--secondary-text-individualone-color",
      this._config.entities.individual1?.secondary_info?.color_value ? "var(--individualone-color)" : "var(--primary-text-color)"
    );
    this.style.setProperty(
      "--secondary-text-individualtwo-color",
      this._config.entities.individual2?.secondary_info?.color_value ? "var(--individualtwo-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--secondary-text-solar-color",
      this._config.entities.solar?.secondary_info?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--secondary-text-home-color",
      this._config.entities.home?.secondary_info?.color_value ? "var(--text-home-color)" : "var(--primary-text-color)"
    );

    const templatesObj = {
      gridSecondary: this._templateResults.gridSecondary?.result,
      solarSecondary: this._templateResults.solarSecondary?.result,
      homeSecondary: this._templateResults.homeSecondary?.result,
      individual1Secondary: this._templateResults.individual1Secondary?.result,
      individual2Secondary: this._templateResults.individual2Secondary?.result,
      nonFossilFuelSecondary: this._templateResults.nonFossilFuelSecondary?.result,
    };

    return html`
      <ha-card .header=${this._config.title}>
        <div class="card-content">
          ${hasSolarProduction || hasIndividual2 || hasIndividual1 || hasFossilFuelPercentage
            ? html`<div class="row">
                ${!hasFossilFuelPercentage
                  ? html`<div class="spacer"></div>`
                  : html`<div class="circle-container low-carbon">
                      <span class="label">${nonFossilName}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          this.openDetails(entities.fossil_fuel_percentage?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.fossil_fuel_percentage?.entity);
                          }
                        }}
                      >
                        ${hasNonFossilFuelSecondary
                          ? html`
                              <span class="secondary-info low-carbon">
                                ${entities.fossil_fuel_percentage?.secondary_info?.icon
                                  ? html`<ha-icon
                                      class="secondary-info small"
                                      .icon=${entities.fossil_fuel_percentage?.secondary_info?.icon}
                                    ></ha-icon>`
                                  : ""}
                                ${this.displayValue(
                                  nonFossilFuelSecondaryUsage,
                                  entities.fossil_fuel_percentage?.secondary_info?.unit_of_measurement,
                                  entities.fossil_fuel_percentage?.secondary_info?.unit_white_space
                                )}
                              </span>
                            `
                          : entities.fossil_fuel_percentage?.secondary_info?.template
                          ? html`<span class="secondary-info low-carbon"> ${templatesObj.nonFossilFuelSecondary} </span>`
                          : ""}
                        <ha-icon
                          .icon=${nonFossilIcon}
                          class="low-carbon"
                          style="${hasNonFossilFuelSecondary ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.fossil_fuel_percentage?.display_zero_state !== false ||
                          (nonFossilFuelPower || 0) > (entities.fossil_fuel_percentage?.display_zero_tolerance || 0)
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.fossil_fuel_percentage?.display_zero_state !== false ||
                        (nonFossilFuelPower || 0) > (entities.fossil_fuel_percentage?.display_zero_tolerance || 0)
                          ? html`
                              <span class="low-carbon">${this.displayNonFossilState(entities!.fossil_fuel_percentage!.entity, totalFromGrid)}</span>
                            `
                          : ""}
                      </div>
                      ${this.showLine(nonFossilFuelPower || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 -10 v40" class="low-carbon" id="low-carbon" />
                              ${hasNonFossilFuelUsage
                                ? svg`<circle
                              r="2.4"
                              class="low-carbon"
                              vector-effect="non-scaling-stroke"
                            >
                                <animateMotion
                                  dur="${this.additionalCircleRate(entities.fossil_fuel_percentage?.calculate_flow_rate, newDur.nonFossil)}s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                >
                                  <mpath xlink:href="#low-carbon" />
                                </animateMotion>
                            </circle>`
                                : ""}
                            </svg>
                          `
                        : ""}
                    </div>`}
                ${hasSolarProduction
                  ? html`<div class="circle-container solar">
                      <span class="label">${solarName}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          this.openDetails(entities.solar!.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.solar!.entity);
                          }
                        }}
                      >
                        ${hasSolarSecondary
                          ? html`
                              <span class="secondary-info solar">
                                ${entities.solar?.secondary_info?.icon
                                  ? html`<ha-icon class="secondary-info small" .icon=${entities.solar?.secondary_info?.icon}></ha-icon>`
                                  : ""}
                                ${this.displayValue(
                                  solarSecondaryProduction,
                                  entities.solar?.secondary_info?.unit_of_measurement,
                                  entities.solar?.secondary_info?.unit_white_space
                                )}
                              </span>
                            `
                          : entities.solar?.secondary_info?.template
                          ? html`<span class="secondary-info solar"> ${templatesObj.solarSecondary} </span>`
                          : ""}

                        <ha-icon
                          id="solar-icon"
                          .icon=${solarIcon}
                          style="${hasSolarSecondary ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.solar?.display_zero_state !== false || (totalSolarProduction || 0) > 0
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.solar?.display_zero_state !== false || (totalSolarProduction || 0) > 0
                          ? html` <span class="solar"> ${this.displayValue(totalSolarProduction)}</span>`
                          : ""}
                      </div>
                    </div>`
                  : hasIndividual2 || hasIndividual1
                  ? html`<div class="spacer"></div>`
                  : ""}
                ${hasIndividual2
                  ? html`<div class="circle-container individual2">
                      <span class="label">${individual2Name}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          this.openDetails(entities.individual2?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.individual2?.entity);
                          }
                        }}
                      >
                        ${hasIndividual2Secondary
                          ? html`
                              <span class="secondary-info individual2">
                                ${entities.individual2?.secondary_info?.icon
                                  ? html`<ha-icon class="secondary-info small" .icon=${entities.individual2?.secondary_info?.icon}></ha-icon>`
                                  : ""}
                                ${this.displayValue(
                                  individual2SecondaryUsage,
                                  entities.individual2?.secondary_info?.unit_of_measurement,
                                  entities.individual2?.secondary_info?.unit_white_space
                                )}
                              </span>
                            `
                          : entities.individual2?.secondary_info?.template
                          ? html`<span class="secondary-info individual2"> ${templatesObj.individual2Secondary} </span>`
                          : ""}
                        <ha-icon
                          id="individual2-icon"
                          .icon=${individual2Icon}
                          style="${hasIndividual2Secondary ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.individual2?.display_zero_state !== false || (individual2Usage || 0) > 0
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.individual2?.display_zero_state !== false || (individual2Usage || 0) > 0
                          ? html` <span class="individual2"
                              >${this.displayValue(individual2Usage, this._config.entities.individual2?.unit_of_measurement)}
                            </span>`
                          : ""}
                      </div>
                      ${this.showLine(individual2Usage || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 -10 v50" id="individual2" />
                              ${individual2Usage
                                ? svg`<circle
                              r="2.4"
                              class="individual2"
                              vector-effect="non-scaling-stroke"
                            >
                              <animateMotion
                                dur="${this.additionalCircleRate(entities.individual2?.calculate_flow_rate, newDur.individual2)}s"    
                                repeatCount="indefinite"
                                calcMode="linear"
                                keyPoints=${entities.individual2?.inverted_animation ? "0;1" : "1;0"}
                                keyTimes="0;1"
                              >
                                <mpath xlink:href="#individual2" />
                              </animateMotion>
                            </circle>`
                                : ""}
                            </svg>
                          `
                        : ""}
                    </div>`
                  : hasIndividual1
                  ? html`<div class="circle-container individual1">
                      <span class="label">${individual1Name}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          this.openDetails(entities.individual1?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.individual1?.entity);
                          }
                        }}
                      >
                        ${hasIndividual1Secondary
                          ? html`
                              <span class="secondary-info individual1">
                                ${entities.individual1?.secondary_info?.icon
                                  ? html`<ha-icon class="secondary-info small" .icon=${entities.individual1?.secondary_info?.icon}></ha-icon>`
                                  : ""}
                                ${this.displayValue(
                                  individual1SecondaryUsage,
                                  entities.individual1?.secondary_info?.unit_of_measurement,
                                  entities.individual1?.secondary_info?.unit_white_space
                                )}
                              </span>
                            `
                          : entities.individual1?.secondary_info?.template
                          ? html`<span class="secondary-info individual1"> ${templatesObj.individual1Secondary} </span>`
                          : ""}
                        <ha-icon
                          id="individual1-icon"
                          .icon=${individual1Icon}
                          style="${hasIndividual1Secondary ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.individual1?.display_zero_state !== false || (individual1Usage || 0) > 0
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.individual1?.display_zero_state !== false || (individual1Usage || 0) > 0
                          ? html` <span class="individual1"
                              >${this.displayValue(individual1Usage, this._config.entities.individual1?.unit_of_measurement)}
                            </span>`
                          : ""}
                      </div>
                      ${this.showLine(individual1Usage || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 -10 v40" id="individual1" />
                              ${individual1Usage
                                ? svg`<circle
                                r="2.4"
                                class="individual1"
                                vector-effect="non-scaling-stroke"
                              >
                                <animateMotion
                                  dur="${this.additionalCircleRate(entities.individual1?.calculate_flow_rate, newDur.individual1)}s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints=${entities.individual1?.inverted_animation ? "0;1" : "1;0"}
                                  keyTimes="0;1"

                                >
                                  <mpath xlink:href="#individual1" />
                                </animateMotion>
                              </circle>`
                                : ""}
                            </svg>
                          `
                        : html``}
                    </div> `
                  : html`<div class="spacer"></div>`}
              </div>`
            : html``}
          <div class="row">
            ${hasGrid
              ? html` <div class="circle-container grid">
                  <div
                    class="circle"
                    @click=${(e: { stopPropagation: () => void }) => {
                      const target: string =
                        typeof entities.grid!.entity === "string"
                          ? entities.grid!.entity
                          : entities.grid!.entity!.consumption! || entities.grid!.entity!.production!;
                      e.stopPropagation();
                      this.openDetails(target);
                    }}
                    @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                      if (e.key === "Enter") {
                        const target: string =
                          typeof entities.grid!.entity === "string"
                            ? entities.grid!.entity
                            : entities.grid!.entity!.consumption! || entities.grid!.entity!.production!;
                        e.stopPropagation();
                        this.openDetails(target);
                      }
                    }}
                  >
                    ${hasGridSecondary
                      ? html`
                          <span class="secondary-info grid">
                            ${entities.grid?.secondary_info?.icon
                              ? html`<ha-icon class="secondary-info small" .icon=${entities.grid?.secondary_info?.icon}></ha-icon>`
                              : ""}
                            ${this.displayValue(
                              gridSecondaryUsage,
                              entities.grid?.secondary_info?.unit_of_measurement,
                              entities.grid?.secondary_info?.unit_white_space
                            )}
                          </span>
                        `
                      : entities.grid?.secondary_info?.template
                      ? html`<span class="secondary-info grid"> ${templatesObj.gridSecondary} </span>`
                      : ""}
                    <ha-icon .icon=${gridIcon}></ha-icon>
                    ${(entities.grid?.display_state === "two_way" ||
                      entities.grid?.display_state === undefined ||
                      (entities.grid?.display_state === "one_way" && totalToGrid > 0) ||
                      (entities.grid?.display_state === "one_way_no_zero" && (totalFromGrid === null || totalFromGrid === 0) && totalToGrid !== 0)) &&
                    totalToGrid !== null &&
                    !isGridPowerOutage
                      ? html`<span
                          class="return"
                          @click=${(e: { stopPropagation: () => void }) => {
                            const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
                            e.stopPropagation();
                            this.openDetails(target);
                          }}
                          @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                            if (e.key === "Enter") {
                              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
                              e.stopPropagation();
                              this.openDetails(target);
                            }
                          }}
                        >
                          <ha-icon class="small" .icon=${"mdi:arrow-left"}></ha-icon>
                          ${this.displayValue(totalToGrid)}
                        </span>`
                      : null}
                    ${(entities.grid?.display_state === "two_way" ||
                      entities.grid?.display_state === undefined ||
                      (entities.grid?.display_state === "one_way" && totalFromGrid > 0) ||
                      (entities.grid?.display_state === "one_way_no_zero" && (totalToGrid === null || totalToGrid === 0))) &&
                    totalFromGrid !== null &&
                    !isGridPowerOutage
                      ? html` <span class="consumption">
                          <ha-icon class="small" .icon=${"mdi:arrow-right"}></ha-icon>${this.displayValue(totalFromGrid)}
                        </span>`
                      : ""}
                    ${isGridPowerOutage
                      ? html`<span class="grid power-outage"> ${entities.grid?.power_outage.label_alert || html`Power<br />Outage`} </span>`
                      : ""}
                  </div>
                  <span class="label">${gridName}</span>
                </div>`
              : html`<div class="spacer"></div>`}
            <div class="circle-container home">
              <div
                class="circle"
                id="home-circle"
                @click=${(e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  this.openDetails(entities.home?.entity);
                }}
                @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    this.openDetails(entities.home?.entity);
                  }
                }}
              >
                ${hasHomeSecondary
                  ? html`
                      <span class="secondary-info home">
                        ${entities.home?.secondary_info?.icon
                          ? html`<ha-icon class="secondary-info small" .icon=${entities.home?.secondary_info?.icon}></ha-icon>`
                          : ""}
                        ${this.displayValue(
                          homeSecondaryUsage,
                          entities.home?.secondary_info?.unit_of_measurement,
                          entities.home?.secondary_info?.unit_white_space
                        )}
                      </span>
                    `
                  : entities.home?.secondary_info?.template
                  ? html`<span class="secondary-info home"> ${templatesObj.homeSecondary} </span>`
                  : ""}
                <ha-icon .icon=${homeIcon}></ha-icon>
                ${this._config.entities.home?.override_state && this._config.entities.home.entity
                  ? entities.home?.subtract_individual
                    ? this.displayValue(Number(this.hass.states[this._config.entities.home!.entity].state) - totalIndividualConsumption)
                    : this.displayValue(this.hass.states[this._config.entities.home!.entity].state)
                  : this._config.entities.home?.subtract_individual
                  ? this.displayValue(totalHomeConsumption - totalIndividualConsumption || 0)
                  : this.displayValue(totalHomeConsumption)}
                <svg>
                  ${homeSolarCircumference !== undefined
                    ? svg`<circle
                            class="solar"
                            cx="40"
                            cy="40"
                            r="38"
                            stroke-dasharray="${homeSolarCircumference} ${circleCircumference - homeSolarCircumference}"
                            shape-rendering="geometricPrecision"
                            stroke-dashoffset="-${circleCircumference - homeSolarCircumference}"
                          />`
                    : ""}
                  ${homeBatteryCircumference
                    ? svg`<circle
                            class="battery"
                            cx="40"
                            cy="40"
                            r="38"
                            stroke-dasharray="${homeBatteryCircumference} ${circleCircumference - homeBatteryCircumference}"
                            stroke-dashoffset="-${circleCircumference - homeBatteryCircumference - (homeSolarCircumference || 0)}"
                            shape-rendering="geometricPrecision"
                          />`
                    : ""}
                  ${homeNonFossilCircumference !== undefined
                    ? svg`<circle
                            class="low-carbon"
                            cx="40"
                            cy="40"
                            r="38"
                            stroke-dasharray="${homeNonFossilCircumference} ${circleCircumference - homeNonFossilCircumference}"
                            stroke-dashoffset="-${
                              circleCircumference - homeNonFossilCircumference - (homeBatteryCircumference || 0) - (homeSolarCircumference || 0)
                            }"
                            shape-rendering="geometricPrecision"
                          />`
                    : ""}
                  <circle
                    class="grid"
                    cx="40"
                    cy="40"
                    r="38"
                    stroke-dasharray="${homeGridCircumference ??
                    circleCircumference - homeSolarCircumference! - (homeBatteryCircumference || 0)} ${homeGridCircumference !== undefined
                      ? circleCircumference - homeGridCircumference
                      : homeSolarCircumference! + (homeBatteryCircumference || 0)}"
                    stroke-dashoffset="0"
                    shape-rendering="geometricPrecision"
                  />
                </svg>
              </div>
              ${this.showLine(individual1Usage || 0) && hasIndividual2 ? "" : html` <span class="label">${homeName}</span>`}
            </div>
          </div>
          ${hasBattery || (hasIndividual1 && hasIndividual2)
            ? html`<div class="row">
                <div class="spacer"></div>
                ${hasBattery
                  ? html` <div class="circle-container battery">
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          const target = entities.battery?.state_of_charge!
                            ? entities.battery?.state_of_charge!
                            : typeof entities.battery?.entity === "string"
                            ? entities.battery?.entity!
                            : entities.battery?.entity!.production;
                          e.stopPropagation();
                          this.openDetails(target);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            const target = entities.battery?.state_of_charge!
                              ? entities.battery?.state_of_charge!
                              : typeof entities.battery!.entity === "string"
                              ? entities.battery!.entity!
                              : entities.battery!.entity!.production;
                            e.stopPropagation();
                            this.openDetails(target);
                          }
                        }}
                      >
                        ${batteryChargeState !== null
                          ? html` <span
                              @click=${(e: { stopPropagation: () => void }) => {
                                e.stopPropagation();
                                this.openDetails(entities.battery?.state_of_charge!);
                              }}
                              @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                                if (e.key === "Enter") {
                                  e.stopPropagation();
                                  this.openDetails(entities.battery?.state_of_charge!);
                                }
                              }}
                              id="battery-state-of-charge-text"
                            >
                              ${formatNumber(batteryChargeState, this.hass.locale, {
                                maximumFractionDigits: 0,
                                minimumFractionDigits: 0,
                              })}${this._config.entities?.battery?.state_of_charge_unit_white_space === false ? "" : " "}%
                            </span>`
                          : null}
                        <ha-icon
                          .icon=${batteryIcon}
                          style=${entities.battery?.display_state === "two_way"
                            ? "padding-top: 0px; padding-bottom: 2px;"
                            : entities.battery?.display_state === "one_way" && totalBatteryIn === 0 && totalBatteryOut === 0
                            ? "padding-top: 2px; padding-bottom: 0px;"
                            : "padding-top: 2px; padding-bottom: 2px;"}
                          @click=${(e: { stopPropagation: () => void }) => {
                            e.stopPropagation();
                            this.openDetails(entities.battery?.state_of_charge!);
                          }}
                          @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              this.openDetails(entities.battery?.state_of_charge!);
                            }
                          }}
                        ></ha-icon>
                        ${entities.battery?.display_state === "two_way" ||
                        entities.battery?.display_state === undefined ||
                        (entities.battery?.display_state === "one_way" && totalBatteryIn > 0) ||
                        (entities.battery?.display_state === "one_way_no_zero" && totalBatteryIn !== 0)
                          ? html`<span
                              class="battery-in"
                              @click=${(e: { stopPropagation: () => void }) => {
                                const target =
                                  typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.production!;
                                e.stopPropagation();
                                this.openDetails(target);
                              }}
                              @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                                if (e.key === "Enter") {
                                  const target =
                                    typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.production!;
                                  e.stopPropagation();
                                  this.openDetails(target);
                                }
                              }}
                            >
                              <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
                              ${this.displayValue(totalBatteryIn)}</span
                            >`
                          : ""}
                        ${entities.battery?.display_state === "two_way" ||
                        entities.battery?.display_state === undefined ||
                        (entities.battery?.display_state === "one_way" && totalBatteryOut > 0) ||
                        (entities.battery?.display_state === "one_way_no_zero" && (totalBatteryIn === 0 || totalBatteryOut !== 0))
                          ? html`<span
                              class="battery-out"
                              @click=${(e: { stopPropagation: () => void }) => {
                                const target =
                                  typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.consumption!;
                                e.stopPropagation();
                                this.openDetails(target);
                              }}
                              @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                                if (e.key === "Enter") {
                                  const target =
                                    typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.consumption!;
                                  e.stopPropagation();
                                  this.openDetails(target);
                                }
                              }}
                            >
                              <ha-icon class="small" .icon=${"mdi:arrow-up"}></ha-icon>
                              ${this.displayValue(totalBatteryOut)}</span
                            >`
                          : ""}
                      </div>
                      <span class="label">${batteryName}</span>
                    </div>`
                  : html`<div class="spacer"></div>`}
                ${hasIndividual2 && hasIndividual1
                  ? html`<div class="circle-container individual1 bottom">
                      ${this.showLine(individual1Usage || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 40 v-40" id="individual1" />
                              ${individual1Usage
                                ? svg`<circle
                                r="2.4"
                                class="individual1"
                                vector-effect="non-scaling-stroke"
                              >
                                <animateMotion
                                  dur="${this.additionalCircleRate(entities.individual1?.calculate_flow_rate, newDur.individual1)}s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints=${entities.individual1?.inverted_animation ? "0;1" : "1;0"}
                                  keyTimes="0;1"
                                >
                                  <mpath xlink:href="#individual1" />
                                </animateMotion>
                              </circle>`
                                : ""}
                            </svg>
                          `
                        : html` <svg width="80" height="30"></svg> `}
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          this.openDetails(entities.individual1?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.individual1?.entity);
                          }
                        }}
                      >
                        ${hasIndividual1Secondary
                          ? html`
                              <span class="secondary-info individual1">
                                ${entities.individual1?.secondary_info?.icon
                                  ? html`<ha-icon class="secondary-info small" .icon=${entities.individual1?.secondary_info?.icon}></ha-icon>`
                                  : ""}
                                ${this.displayValue(
                                  individual1SecondaryUsage,
                                  entities.individual1?.secondary_info?.unit_of_measurement,
                                  entities.individual1?.secondary_info?.unit_white_space
                                )}
                              </span>
                            `
                          : entities.individual1?.secondary_info?.template
                          ? html`<span class="secondary-info individual1"> ${templatesObj.individual1Secondary} </span>`
                          : ""}
                        <ha-icon
                          id="individual1-icon"
                          .icon=${individual1Icon}
                          style="${hasIndividual1Secondary ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.individual1?.display_zero_state !== false || (individual1Usage || 0) > 0
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.individual1?.display_zero_state !== false || (individual1Usage || 0) > 0
                          ? html` <span class="individual1"
                              >${this.displayValue(individual1Usage, this._config.entities.individual1?.unit_of_measurement)}
                            </span>`
                          : ""}
                      </div>
                      <span class="label">${individual1Name}</span>
                    </div>`
                  : html`<div class="spacer"></div>`}
              </div>`
            : html`<div class="spacer"></div>`}
          ${hasSolarProduction && this.showLine(solarConsumption || 0)
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2": !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-home-flow">
                  <path
                    id="solar"
                    class="solar"
                    d="M${hasBattery ? 55 : 53},0 v${hasGrid ? 15 : 17} c0,${hasBattery ? "30 10,30 30,30" : "35 10,35 30,35"} h25"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${solarConsumption
                    ? svg`<circle
                            r="1"
                            class="solar"
                            vector-effect="non-scaling-stroke"
                          >
                            <animateMotion
                              dur="${newDur.solarToHome}s"
                              repeatCount="indefinite"
                              calcMode="linear"
                            >
                              <mpath xlink:href="#solar" />
                            </animateMotion>
                          </circle>`
                    : ""}
                </svg>
              </div>`
            : ""}
          ${hasReturnToGrid && hasSolarProduction && this.showLine(solarToGrid)
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2": !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-grid-flow">
                  <path
                    id="return"
                    class="return"
                    d="M${hasBattery ? 45 : 47},0 v15 c0,${hasBattery ? "30 -10,30 -30,30" : "35 -10,35 -30,35"} h-20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${solarToGrid && hasSolarProduction
                    ? svg`<circle
                        r="1"
                        class="return"
                        vector-effect="non-scaling-stroke"
                      >
                        <animateMotion
                          dur="${newDur.solarToGrid}s"
                          repeatCount="indefinite"
                          calcMode="linear"
                        >
                          <mpath xlink:href="#return" />
                        </animateMotion>
                      </circle>`
                    : ""}
                </svg>
              </div>`
            : ""}
          ${hasBattery && hasSolarProduction && this.showLine(solarToBattery || 0)
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2": !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-battery-flow">
                  <path id="battery-solar" class="battery-solar" d="M50,0 V100" vector-effect="non-scaling-stroke"></path>
                  ${solarToBattery
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
            : ""}
          ${hasGrid && this.showLine(gridConsumption)
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2": !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="grid-home-flow">
                  <path
                    class="grid"
                    id="grid"
                    d="M0,${hasBattery ? 50 : hasSolarProduction ? 56 : 53} H100"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${gridConsumption
                    ? svg`<circle
                    r="1"
                    class="grid"
                    vector-effect="non-scaling-stroke"
                  >
                    <animateMotion
                      dur="${newDur.gridToHome}s"
                      repeatCount="indefinite"
                      calcMode="linear"
                    >
                      <mpath xlink:href="#grid" />
                    </animateMotion>
                  </circle>`
                    : ""}
                </svg>
              </div>`
            : null}
          ${hasBattery && this.showLine(batteryConsumption)
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2": !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-home-flow">
                  <path
                    id="battery-home"
                    class="battery-home"
                    d="M55,100 v-${hasGrid ? 15 : 17} c0,-30 10,-30 30,-30 h20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${batteryConsumption
                    ? svg`<circle
                        r="1"
                        class="battery-home"
                        vector-effect="non-scaling-stroke"
                      >
                        <animateMotion
                          dur="${newDur.batteryToHome}s"
                          repeatCount="indefinite"
                          calcMode="linear"
                        >
                          <mpath xlink:href="#battery-home" />
                        </animateMotion>
                      </circle>`
                    : ""}
                </svg>
              </div>`
            : ""}
          ${hasGrid && hasBattery && this.showLine(Math.max(batteryFromGrid || 0, batteryToGrid || 0))
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2": !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-grid-flow">
                  <path
                    id="battery-grid"
                    class=${classMap({
                      "battery-from-grid": Boolean(batteryFromGrid),
                      "battery-to-grid": Boolean(batteryToGrid),
                    })}
                    d="M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${batteryFromGrid
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
                  ${batteryToGrid
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
            : ""}
        </div>
        ${this._config.dashboard_link
          ? html`
              <div class="card-actions">
                <a href=${this._config.dashboard_link}
                  ><mwc-button>
                    ${this._config.dashboard_link_label ||
                    this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard")}
                  </mwc-button></a
                >
              </div>
            `
          : ""}
      </ha-card>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.hass) {
      return;
    }

    this._tryConnectAll();
  }

  private _tryConnectAll() {
    const { entities } = this._config;
    const templatesObj = {
      gridSecondary: entities.grid?.secondary_info?.template,
      solarSecondary: entities.solar?.secondary_info?.template,
      homeSecondary: entities.home?.secondary_info?.template,
      individual1Secondary: entities.individual1?.secondary_info?.template,
      individual2Secondary: entities.individual2?.secondary_info?.template,
      nonFossilFuelSecondary: entities.fossil_fuel_percentage?.secondary_info?.template,
    };

    for (const [key, value] of Object.entries(templatesObj)) {
      if (value) {
        this._tryConnect(value, key);
      }
    }
  }

  private async _tryConnect(inputTemplate: string, topic: string): Promise<void> {
    if (!this.hass || !this._config || this._unsubRenderTemplates?.get(topic) !== undefined || inputTemplate === "") {
      return;
    }

    try {
      const sub = subscribeRenderTemplate(
        this.hass.connection,
        (result) => {
          this._templateResults[topic] = result;
        },
        {
          template: inputTemplate,
          entity_ids: this._config.entity_id,
          variables: {
            config: this._config,
            user: this.hass.user!.name,
          },
          strict: true,
        }
      );
      this._unsubRenderTemplates?.set(topic, sub);
      await sub;
    } catch (_err) {
      this._templateResults = {
        ...this._templateResults,
        [topic]: {
          result: inputTemplate,
          listeners: { all: false, domains: [], entities: [], time: false },
        },
      };
      this._unsubRenderTemplates?.delete(topic);
    }
  }

  private async _tryDisconnectAll() {
    const { entities } = this._config;
    const templatesObj = {
      gridSecondary: entities.grid?.secondary_info?.template,
      solarSecondary: entities.solar?.secondary_info?.template,
      homeSecondary: entities.home?.secondary_info?.template,

      individual1Secondary: entities.individual1?.secondary_info?.template,
      individual2Secondary: entities.individual2?.secondary_info?.template,
    };

    for (const [key, value] of Object.entries(templatesObj)) {
      if (value) {
        this._tryDisconnect(key);
      }
    }
  }

  private async _tryDisconnect(topic: string): Promise<void> {
    const unsubRenderTemplate = this._unsubRenderTemplates?.get(topic);
    if (!unsubRenderTemplate) {
      return;
    }

    try {
      const unsub = await unsubRenderTemplate;
      unsub();
      this._unsubRenderTemplates?.delete(topic);
    } catch (err: any) {
      if (err.code === "not_found" || err.code === "template_error") {
        // If we get here, the connection was probably already closed. Ignore.
      } else {
        throw err;
      }
    }
  }

  static styles = styles;
}

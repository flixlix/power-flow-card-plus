/* eslint-disable wc/guard-super-call */
/* eslint-disable import/extensions */
/* eslint-disable no-nested-ternary */
import { HassEntity, UnsubscribeFunc } from "home-assistant-js-websocket";
import { formatNumber, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { html, LitElement, PropertyValues, svg, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "./power-flow-card-plus-config";
import { coerceNumber, round, isNumberValue } from "./utils/utils";
import { EntityType } from "./type";
import { logError } from "./logging";
import { registerCustomCard } from "./utils/register-custom-card";
import { RenderTemplateResult, subscribeRenderTemplate } from "./template/ha-websocket.js";
import { styles } from "./style";
import { defaultValues, getDefaultConfig } from "./utils/get-default-config";
import getElementWidth from "./utils/get-element-width";
import localize from "./localize/localize";

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
  @state() private _width = 0;

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
      kw_decimals: coerceNumber(config.kw_decimals, defaultValues.kilowattDecimals),
      min_flow_rate: coerceNumber(config.min_flow_rate, defaultValues.minFlowRate),
      max_flow_rate: coerceNumber(config.max_flow_rate, defaultValues.maxFlowRate),
      w_decimals: coerceNumber(config.w_decimals, defaultValues.wattDecimals),
      watt_threshold: coerceNumber(config.watt_threshold, defaultValues.wattThreshold),
      max_expected_power: coerceNumber(config.max_expected_power, defaultValues.maxExpectedPower),
      min_expected_power: coerceNumber(config.min_expected_power, defaultValues.minExpectedPower),
      display_zero_lines: {
        mode: config.display_zero_lines?.mode ?? defaultValues.displayZeroLines.mode,
        transparency: coerceNumber(config.display_zero_lines?.transparency, defaultValues.displayZeroLines.transparency),
        grey_color: config.display_zero_lines?.grey_color ?? defaultValues.displayZeroLines.grey_color,
      },
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

  private entityInverted = (entityType: EntityType) => !!this._config.entities[entityType]?.invert_state;

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
    return max - (value / (total > 0 ? total : value)) * (max - min);
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
    if (stateObj.attributes.unit_of_measurement?.toUpperCase().startsWith("KW")) return value * 1000;
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
    if (typeof this._config.entities.grid?.entity === "string") {
      gridConsumption = totalFromGrid;
    } else {
      gridConsumption = this.getEntityStateWatts(this._config.entities.grid?.entity.consumption) || 0;
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
      result = this.displayValue(nonFossilFuelWatts, undefined, unitWhiteSpace);
    } else {
      let nonFossilFuelPercentage: number = 100 - this.getEntityState(entityFossil);
      if (displayZeroTolerance) {
        if (nonFossilFuelPercentage < displayZeroTolerance) {
          nonFossilFuelPercentage = 0;
        }
      }
      result = this.displayValue(nonFossilFuelPercentage, unitOfMeasurement, unitWhiteSpace, 0);
    }
    return result;
  };

  /**
   * Display value with unit
   * @param value - value to display (if text, will be returned as is)
   * @param unit - unit to display (default is dynamic)
   * @param unitWhiteSpace - wether add space between value and unit (default true)
   * @param decimals - number of decimals to display (default is user defined)
   */
  private displayValue = (
    value: number | string | null,
    unit?: string | undefined,
    unitWhiteSpace?: boolean | undefined,
    decimals?: number | undefined
  ): string => {
    if (value === null) return "0";
    if (Number.isNaN(+value)) return value.toString();
    const valueInNumber = Number(value);
    const isKW = unit === undefined && valueInNumber >= this._config!.watt_threshold;
    const v = formatNumber(
      isKW ? round(valueInNumber / 1000, decimals ?? this._config!.kw_decimals) : round(valueInNumber, decimals ?? this._config!.w_decimals),
      this.hass.locale
    );
    return `${v}${unitWhiteSpace === false ? "" : " "}${unit || (isKW ? "kW" : "W")}`;
  };

  private openDetails(event: { stopPropagation: any; key?: string }, entityId?: string | undefined): void {
    event.stopPropagation();
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
      (Math.abs(this.getEntityStateWatts(field?.entity)) > (field?.display_zero_tolerance ?? 0) && this.entityAvailable(field?.entity)) ||
      acceptStringState
        ? typeof this.hass.states[field?.entity]?.state === "string"
        : false
    ) as boolean;
  }

  /**
   * Determine wether to show the line or not based on if the power is flowing or not and if not, based on display_zero_lines mode
   * @param power - power flowing through the line
   * @returns  boolean - `true` if line should be shown, `false` if not
   */
  private showLine(power: number): boolean {
    if (power > 0) return true;
    return this._config?.display_zero_lines?.mode !== "hide";
  }

  /**
   * Depending on display_zero_lines mode, return the style class to apply to the line
   * @param power - power flowing through the line
   * @returns string - style class to apply to the line
   */
  private styleLine(power: number): string {
    if (power > 0) return "";
    const displayZeroMode = this._config?.display_zero_lines?.mode;
    if (displayZeroMode === "show" || displayZeroMode === undefined) return "";
    let styleclass = "";
    if (displayZeroMode === "transparency" || displayZeroMode === "custom") {
      const transparency = this._config?.display_zero_lines?.transparency;
      if (transparency ?? 50 > 0) styleclass += "transparency ";
    }
    if (displayZeroMode === "grey_out" || displayZeroMode === "custom") {
      styleclass += "grey";
    }
    return styleclass;
  }

  private computeFieldIcon(field: any, fallback: string): string {
    if (field?.icon) return field.icon;
    if (field?.use_metadata) return this.getEntityStateObj(field.entity)?.attributes?.icon || "";
    return fallback;
  }

  private computeFieldName(field: any, fallback: string): string {
    if (field?.name) return field.name;
    if (field?.use_metadata) return this.getEntityStateObj(field.entity)?.attributes?.friendly_name || "";
    return fallback;
  }

  private convertColorListToHex(colorList: number[]): string {
    return "#".concat(colorList.map((x) => x.toString(16).padStart(2, "0")).join(""));
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { entities } = this._config;

    this.style.setProperty(
      "--clickable-cursor",
      this._config.clickable_entities ? "pointer" : "default"
    ); /* show pointer if clickable entities is enabled */

    const initialNumericState = null as null | number;
    const initialSecondaryState = null as null | string | number;

    const grid = {
      entity: entities.grid?.entity,
      has: entities?.grid?.entity !== undefined,
      hasReturnToGrid: typeof entities.grid?.entity === "string" || entities.grid?.entity?.production,
      state: {
        fromGrid: 0,
        toGrid: initialNumericState,
        toBattery: initialNumericState,
        toHome: initialNumericState,
      },
      powerOutage: {
        has: this.hasField(entities.grid?.power_outage, true),
        isOutage:
          (entities.grid && this.hass.states[entities.grid.power_outage?.entity]?.state) === (entities.grid?.power_outage?.state_alert ?? "on"),
        icon: entities.grid?.power_outage?.icon_alert || "mdi:transmission-tower-off",
        name: entities.grid?.power_outage?.label_alert ?? html`Power<br />Outage`,
        entityGenerator: entities.grid?.power_outage?.entity_generator,
      },
      icon: this.computeFieldIcon(entities.grid, "mdi:transmission-tower"),
      name: this.computeFieldName(entities.grid, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.grid")) as
        | string
        | TemplateResult<1>,
      mainEntity:
        typeof entities.grid?.entity === "object" ? entities.grid.entity.consumption || entities.grid.entity.production : entities.grid?.entity,
      color: {
        fromGrid: entities.grid?.color?.consumption,
        toGrid: entities.grid?.color?.production,
        icon_type: entities.grid?.color_icon,
        circle_type: entities.grid?.color_circle,
      },
      secondary: {
        entity: entities.grid?.secondary_info?.entity,
        decimals: entities.grid?.secondary_info?.decimals,
        template: entities.grid?.secondary_info?.template,
        has: this.hasField(entities.grid?.secondary_info, true),
        state: initialSecondaryState,
        icon: entities.grid?.secondary_info?.icon,
        unit: entities.grid?.secondary_info?.unit_of_measurement,
        unit_white_space: entities.grid?.secondary_info?.unit_white_space,
        accept_negative: entities.grid?.secondary_info?.accept_negative || false,
        color: {
          type: entities.grid?.secondary_info?.color_value,
        },
      },
    };

    const solar = {
      entity: entities.solar?.entity as string | undefined,
      has: entities.solar?.entity !== undefined,
      state: {
        total: initialNumericState,
        toHome: initialNumericState,
        toGrid: initialNumericState,
        toBattery: initialNumericState,
      },
      icon: this.computeFieldIcon(entities.solar, "mdi:solar-power"),
      name: this.computeFieldName(entities.solar, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.solar")),
      secondary: {
        entity: entities.solar?.secondary_info?.entity,
        decimals: entities.solar?.secondary_info?.decimals,
        template: entities.solar?.secondary_info?.template,
        has: this.hasField(entities.solar?.secondary_info, true),
        accept_negative: entities.solar?.secondary_info?.accept_negative || false,
        state: initialSecondaryState,
        icon: entities.solar?.secondary_info?.icon,
        unit: entities.solar?.secondary_info?.unit_of_measurement,
        unit_white_space: entities.solar?.secondary_info?.unit_white_space,
      },
    };

    const battery = {
      entity: entities.battery?.entity,
      has: entities?.battery?.entity !== undefined,
      mainEntity: typeof entities.battery?.entity === "object" ? entities.battery.entity.consumption : entities.battery?.entity,
      name: this.computeFieldName(entities.battery, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.battery")),
      icon: this.computeFieldIcon(entities.battery, "mdi:battery-high"),
      state_of_charge: {
        state: entities.battery?.state_of_charge?.length ? this.getEntityState(entities.battery?.state_of_charge) : null,
        unit: entities?.battery?.state_of_charge_unit || "%",
        unit_white_space: entities?.battery?.state_of_charge_unit_white_space || true,
        decimals: entities?.battery?.state_of_charge_decimals || 0,
      },
      state: {
        toBattery: 0,
        fromBattery: 0,
        toGrid: 0,
        toHome: 0,
      },
      color: {
        fromBattery: entities.battery?.color?.consumption,
        toBattery: entities.battery?.color?.production,
        icon_type: undefined as string | boolean | undefined,
        circle_type: entities.battery?.color_circle,
      },
    };

    const home = {
      entity: entities.home?.entity,
      has: entities?.home?.entity !== undefined,
      state: initialNumericState,
      icon: this.computeFieldIcon(entities?.home, "mdi:home"),
      name: this.computeFieldName(entities?.home, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.home")),
      color: {
        icon_type: entities.home?.color_icon,
      },
      secondary: {
        entity: entities.home?.secondary_info?.entity,
        template: entities.home?.secondary_info?.template,
        has: this.hasField(entities.home?.secondary_info, true),
        state: null as number | string | null,
        accept_negative: entities.home?.secondary_info?.accept_negative || false,
        unit: entities.home?.secondary_info?.unit_of_measurement,
        unit_white_space: entities.home?.secondary_info?.unit_white_space,
        icon: entities.home?.secondary_info?.icon,
        decimals: entities.home?.secondary_info?.decimals,
      },
    };

    const getIndividualObject = (field: "individual1" | "individual2") => ({
      entity: entities[field]?.entity,
      has: this.hasField(entities[field]),
      displayZero: entities[field]?.display_zero,
      displayZeroTolerance: entities[field]?.display_zero_tolerance,
      state: initialNumericState,
      icon: this.computeFieldIcon(entities[field], field === "individual1" ? "mdi:car-electric" : "mdi:motorbike-electric"),
      name: this.computeFieldName(entities[field], field === "individual1" ? localize("card.label.car") : localize("card.label.motorbike")),
      color: entities[field]?.color,
      unit: entities[field]?.unit_of_measurement,
      unit_white_space: entities[field]?.unit_white_space,
      decimals: entities[field]?.decimals,
      invertAnimation: entities[field]?.inverted_animation || false,
      showDirection: entities[field]?.show_direction || false,
      secondary: {
        entity: entities[field]?.secondary_info?.entity,
        template: entities[field]?.secondary_info?.template,
        has: this.hasField(entities[field]?.secondary_info, true),
        accept_negative: entities[field]?.secondary_info?.accept_negative || false,
        state: initialSecondaryState,
        icon: entities[field]?.secondary_info?.icon,
        unit: entities[field]?.secondary_info?.unit_of_measurement,
        unit_white_space: entities[field]?.secondary_info?.unit_white_space,
        displayZero: entities[field]?.secondary_info?.display_zero,
        displayZeroTolerance: entities[field]?.secondary_info?.display_zero_tolerance,
        decimals: entities[field]?.secondary_info?.decimals,
      },
    });

    const individual1 = getIndividualObject("individual1");

    const individual2 = getIndividualObject("individual2");

    type Individual = typeof individual2 & typeof individual1;

    const nonFossil = {
      entity: entities.fossil_fuel_percentage?.entity,
      name:
        entities.fossil_fuel_percentage?.name ||
        (entities.fossil_fuel_percentage?.use_metadata && this.getEntityStateObj(entities.fossil_fuel_percentage.entity)?.attributes.friendly_name) ||
        this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.low_carbon"),
      icon:
        entities.fossil_fuel_percentage?.icon ||
        (entities.fossil_fuel_percentage?.use_metadata && this.getEntityStateObj(entities.fossil_fuel_percentage.entity)?.attributes?.icon) ||
        "mdi:leaf",
      has: false,
      hasPercentage: false,
      state: {
        power: initialNumericState,
      },
      color: entities.fossil_fuel_percentage?.color,
      color_value: entities.fossil_fuel_percentage?.color_value,
      secondary: {
        entity: entities.fossil_fuel_percentage?.secondary_info?.entity,
        decimals: entities.fossil_fuel_percentage?.secondary_info?.decimals,
        template: entities.fossil_fuel_percentage?.secondary_info?.template,
        has: this.hasField(entities.fossil_fuel_percentage?.secondary_info, true),
        accept_negative: entities.fossil_fuel_percentage?.secondary_info?.accept_negative || false,
        state: initialSecondaryState,
        icon: entities.fossil_fuel_percentage?.secondary_info?.icon,
        unit: entities.fossil_fuel_percentage?.secondary_info?.unit_of_measurement,
        unit_white_space: entities.fossil_fuel_percentage?.secondary_info?.unit_white_space,
        color_value: entities.fossil_fuel_percentage?.secondary_info?.color_value,
      },
    };

    if (grid.has) {
      if (typeof entities.grid!.entity === "string") {
        if (this.entityInverted("grid")) {
          grid.state.fromGrid = Math.abs(Math.min(this.getEntityStateWatts(entities.grid?.entity), 0));
        } else {
          grid.state.fromGrid = Math.max(this.getEntityStateWatts(entities.grid?.entity), 0);
        }
      } else {
        grid.state.fromGrid = this.getEntityStateWatts(entities.grid!.entity!.consumption);
      }
    }

    if (grid.hasReturnToGrid) {
      if (typeof entities.grid!.entity === "string") {
        grid.state.toGrid = this.entityInverted("grid")
          ? Math.max(this.getEntityStateWatts(entities.grid!.entity), 0)
          : Math.abs(Math.min(this.getEntityStateWatts(entities.grid!.entity), 0));
      } else {
        grid.state.toGrid = this.getEntityStateWatts(entities.grid?.entity.production);
      }
    }

    this.style.setProperty(
      "--secondary-text-solar-color",
      entities.solar?.secondary_info?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)"
    );

    if (solar.secondary.has) {
      const solarSecondaryEntity = this.hass.states[entities.solar?.secondary_info?.entity!];
      const solarSecondaryState = solarSecondaryEntity.state;
      if (Number.isNaN(+solarSecondaryState) || solar.secondary.accept_negative) {
        solar.secondary.state = solarSecondaryState;
      } else {
        solar.secondary.state = Math.max(Number(solarSecondaryState), 0);
      }
    }

    if (entities.solar?.color !== undefined) {
      let solarColor = entities.solar?.color;
      if (typeof solarColor === "object") solarColor = this.convertColorListToHex(solarColor);
      this.style.setProperty("--energy-solar-color", solarColor || "#ff9800");
    }
    this.style.setProperty("--icon-solar-color", entities.solar?.color_icon ? "var(--energy-solar-color)" : "var(--primary-text-color)");
    if (solar.has) {
      if (this.entityInverted("solar")) solar.state.total = Math.abs(Math.min(this.getEntityStateWatts(entities.solar?.entity), 0));
      else solar.state.total = Math.max(this.getEntityStateWatts(entities.solar?.entity), 0);
      if (entities.solar?.display_zero_tolerance) {
        if (entities.solar.display_zero_tolerance >= solar.state.total) solar.state.total = 0;
      }
    }

    if (battery.has) {
      if (typeof entities.battery?.entity === "string") {
        battery.state.toBattery = this.entityInverted("battery")
          ? Math.max(this.getEntityStateWatts(entities.battery!.entity), 0)
          : Math.abs(Math.min(this.getEntityStateWatts(entities.battery!.entity), 0));
        battery.state.fromBattery = this.entityInverted("battery")
          ? Math.abs(Math.min(this.getEntityStateWatts(entities.battery!.entity), 0))
          : Math.max(this.getEntityStateWatts(entities.battery!.entity), 0);
      } else {
        battery.state.toBattery = this.getEntityStateWatts(entities.battery?.entity?.production);
        battery.state.fromBattery = this.getEntityStateWatts(entities.battery?.entity?.consumption);
      }
      if (entities?.battery?.display_zero_tolerance) {
        if (entities.battery.display_zero_tolerance >= battery.state.toBattery) battery.state.toBattery = 0;
        if (entities.battery.display_zero_tolerance >= battery.state.fromBattery) battery.state.fromBattery = 0;
      }
    }

    if (solar.has) {
      solar.state.toHome = (solar.state.total ?? 0) - (grid.state.toGrid ?? 0) - (battery.state.toBattery ?? 0);
      if (entities.solar?.display_zero_tolerance) {
        if (entities.solar.display_zero_tolerance >= (solar.state.total || 0)) solar.state.toHome = 0;
      }
    }
    const largestGridBatteryTolerance = Math.max(entities.grid?.display_zero_tolerance ?? 0, entities.battery?.display_zero_tolerance ?? 0);

    if (solar.state.toHome !== null && solar.state.toHome < 0) {
      // What we returned to the grid and what went in to the battery is more
      // than produced, so we have used grid energy to fill the battery or
      // returned battery energy to the grid
      if (battery.has) {
        grid.state.toBattery = Math.abs(solar.state.toHome);
        if (grid.state.toBattery > (grid.state.fromGrid ?? 0)) {
          battery.state.toGrid = Math.min(grid.state.toBattery - (grid.state.fromGrid ?? 0), 0);
          grid.state.toBattery = grid.state.fromGrid;
        }
      }
      solar.state.toHome = 0;
    } else if (battery.state.toBattery && battery.state.toBattery > 0) {
      grid.state.toBattery = battery.state.toBattery;
    }
    grid.state.toBattery = (grid.state.toBattery ?? 0) > largestGridBatteryTolerance ? grid.state.toBattery : 0;

    if (battery.has) {
      if (solar.has) {
        if (!battery.state.toGrid) {
          battery.state.toGrid = Math.max(
            0,
            (grid.state.toGrid || 0) - (solar.state.total || 0) - (battery.state.toBattery || 0) - (grid.state.toBattery || 0)
          );
        }
        solar.state.toBattery = battery.state.toBattery - (grid.state.toBattery || 0);
        if (entities.solar?.display_zero_tolerance) {
          if (entities.solar.display_zero_tolerance >= (solar.state.total || 0)) solar.state.toBattery = 0;
        }
      } else {
        battery.state.toGrid = grid.state.toGrid || 0;
      }
      battery.state.toGrid = (battery.state.toGrid || 0) > largestGridBatteryTolerance ? battery.state.toGrid || 0 : 0;
      battery.state.toHome = (battery.state.fromBattery ?? 0) - (battery.state.toGrid ?? 0);
    }

    grid.state.toHome = Math.max(grid.state.fromGrid - (grid.state.toBattery ?? 0), 0);

    if (solar.has && grid.state.toGrid) solar.state.toGrid = grid.state.toGrid - (battery.state.toGrid ?? 0);
    if (entities.solar?.display_zero_tolerance) {
      if (entities.solar.display_zero_tolerance >= (solar.state.total || 0)) solar.state.toGrid = 0;
    }
    this.style.setProperty("--text-solar-color", entities.solar?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)");

    if (grid.color.fromGrid !== undefined) {
      // If the user has set a color for the grid consumption, convert it to hex
      if (typeof grid.color.fromGrid === "object") {
        grid.color.fromGrid = this.convertColorListToHex(grid.color.fromGrid);
      }
    }

    if (grid.secondary.has) {
      const gridSecondaryEntity = this.hass.states[entities.grid?.secondary_info?.entity!];
      const gridSecondaryState = gridSecondaryEntity.state;
      if (Number.isNaN(+gridSecondaryState) || grid.secondary.accept_negative) {
        grid.secondary.state = gridSecondaryState;
      } else {
        grid.secondary.state = Math.max(Number(gridSecondaryState), 0);
      }
    }

    if (grid.color.toGrid !== undefined) {
      if (typeof grid.color.toGrid === "object") {
        grid.color.toGrid = this.convertColorListToHex(grid.color.toGrid);
      }
      this.style.setProperty("--energy-grid-return-color", grid.color.toGrid || "#a280db");
    }

    if (grid.color.fromGrid !== undefined) {
      if (typeof grid.color.fromGrid === "object") {
        grid.color.fromGrid = this.convertColorListToHex(grid.color.fromGrid);
      }
      this.style.setProperty("--energy-grid-consumption-color", grid.color.fromGrid || "#a280db");
    }

    // Reset State Values to 0 if they are below the display_zero_tolerance
    if (entities.grid?.display_zero_tolerance !== undefined) {
      solar.state.toGrid = (solar.state.toGrid ?? 0) > entities.grid?.display_zero_tolerance ? solar.state.toGrid : 0;
      grid.state.toGrid = (grid.state.toGrid ?? 0) > entities.grid?.display_zero_tolerance ? grid.state.toGrid : 0;
      if (grid.state.fromGrid <= entities.grid?.display_zero_tolerance) {
        grid.state.fromGrid = 0;
        grid.state.toHome = 0;
        grid.state.toBattery = 0;
      }
    }

    this.style.setProperty(
      "--icon-grid-color",
      grid.color.icon_type === "consumption"
        ? "var(--energy-grid-consumption-color)"
        : grid.color.icon_type === "production"
        ? "var(--energy-grid-return-color)"
        : grid.color.icon_type === true
        ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
          ? "var(--energy-grid-consumption-color)"
          : "var(--energy-grid-return-color)"
        : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--secondary-text-grid-color",
      grid.secondary.color.type === "consumption"
        ? "var(--energy-grid-consumption-color)"
        : grid.secondary.color.type === "production"
        ? "var(--energy-grid-return-color)"
        : grid.secondary.color.type === true
        ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
          ? "var(--energy-grid-consumption-color)"
          : "var(--energy-grid-return-color)"
        : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--circle-grid-color",
      grid.color.circle_type === "consumption"
        ? "var(--energy-grid-consumption-color)"
        : grid.color.circle_type === "production"
        ? "var(--energy-grid-return-color)"
        : grid.color.circle_type === true
        ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
          ? "var(--energy-grid-consumption-color)"
          : "var(--energy-grid-return-color)"
        : "var(--energy-grid-consumption-color)"
    );

    if (individual1.color !== undefined) {
      if (typeof individual1.color === "object") individual1.color = this.convertColorListToHex(individual1.color);
      this.style.setProperty("--individualone-color", individual1.color); /* dynamically update color of entity depending on user's input */
    }
    this.style.setProperty(
      "--icon-individualone-color",
      entities.individual1?.color_icon ? "var(--individualone-color)" : "var(--primary-text-color)"
    );
    if (individual1.has) {
      const individual1State = this.getEntityStateWatts(entities.individual1?.entity);
      if (individual1State < 0) individual1.invertAnimation = !individual1.invertAnimation;
      individual1.state = Math.abs(individual1State);
    }
    if (individual1.secondary.has) {
      const individual1SecondaryEntity = this.hass.states[entities.individual1?.secondary_info?.entity!];
      const individual1SecondaryState = individual1SecondaryEntity.state;
      if (typeof individual1SecondaryState === "number" && !individual1.secondary.accept_negative) {
        individual1.secondary.state = Math.max(individual1SecondaryState, 0);
      } else if (typeof individual1SecondaryState === "string") {
        individual1.secondary.state = individual1SecondaryState;
      }
    }

    if (nonFossil.entity !== undefined) {
      nonFossil.hasPercentage =
        (entities.fossil_fuel_percentage?.entity !== undefined && entities.fossil_fuel_percentage?.display_zero === true) ||
        ((grid.state.fromGrid ?? 0) * 1 - this.getEntityState(entities.fossil_fuel_percentage?.entity) / 100 > 0 &&
          entities.fossil_fuel_percentage?.entity !== undefined &&
          this.entityAvailable(entities.fossil_fuel_percentage?.entity));
    }

    if (individual2.color !== undefined) {
      if (typeof individual2.color === "object") individual2.color = this.convertColorListToHex(individual2.color);
      this.style.setProperty("--individualtwo-color", individual2.color); /* dynamically update color of entity depending on user's input */
    }
    this.style.setProperty(
      "--icon-individualtwo-color",
      entities.individual2?.color_icon ? "var(--individualtwo-color)" : "var(--primary-text-color)"
    );
    if (individual2.has) {
      const individual2State = this.getEntityStateWatts(entities.individual2?.entity);
      if (individual2State < 0) individual2.invertAnimation = !individual2.invertAnimation;
      individual2.state = Math.abs(individual2State);
    }
    if (individual2.secondary.has) {
      const individual2SecondaryEntity = this.hass.states[entities.individual2?.secondary_info?.entity!];
      const individual2SecondaryState = individual2SecondaryEntity.state;
      if (typeof individual2SecondaryState === "number" && !individual2.secondary.accept_negative) {
        individual2.secondary.state = Math.max(individual2SecondaryState, 0);
      } else if (typeof individual2SecondaryState === "string") {
        individual2.secondary.state = individual2SecondaryState;
      }
    }

    if (home.secondary.has) {
      const homeSecondaryEntity = this.hass.states[entities.home?.secondary_info?.entity!];
      const homeSecondaryState = homeSecondaryEntity.state;
      if (Number.isNaN(+homeSecondaryState) || home.secondary.accept_negative) {
        home.secondary.state = homeSecondaryState;
      } else {
        home.secondary.state = Math.max(Number(homeSecondaryState), 0);
      }
    }

    if (battery.color.fromBattery !== undefined) {
      if (typeof battery.color.fromBattery === "object") battery.color.fromBattery = this.convertColorListToHex(battery.color.fromBattery);
      this.style.setProperty("--energy-battery-out-color", battery.color.fromBattery || "#4db6ac");
    }
    if (battery.color.toBattery !== undefined) {
      if (typeof battery.color.toBattery === "object") battery.color.toBattery = this.convertColorListToHex(battery.color.toBattery);
      this.style.setProperty("--energy-battery-in-color", battery.color.toBattery || "#a280db");
    }

    battery.color.icon_type = entities.battery?.color_icon;
    this.style.setProperty(
      "--icon-battery-color",
      battery.color.icon_type === "consumption"
        ? "var(--energy-battery-in-color)"
        : battery.color.icon_type === "production"
        ? "var(--energy-battery-out-color)"
        : battery.color.icon_type === true
        ? battery.state.fromBattery >= battery.state.toBattery
          ? "var(--energy-battery-out-color)"
          : "var(--energy-battery-in-color)"
        : "var(--primary-text-color)"
    );

    const batteryStateOfChargeColorType = entities.battery?.color_state_of_charge_value;
    this.style.setProperty(
      "--text-battery-state-of-charge-color",
      batteryStateOfChargeColorType === "consumption"
        ? "var(--energy-battery-in-color)"
        : batteryStateOfChargeColorType === "production"
        ? "var(--energy-battery-out-color)"
        : batteryStateOfChargeColorType === true
        ? battery.state.fromBattery >= battery.state.toBattery
          ? "var(--energy-battery-out-color)"
          : "var(--energy-battery-in-color)"
        : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--circle-battery-color",
      battery.color.circle_type === "consumption"
        ? "var(--energy-battery-in-color)"
        : battery.color.circle_type === "production"
        ? "var(--energy-battery-out-color)"
        : battery.color.circle_type === true
        ? battery.state.fromBattery >= battery.state.toBattery
          ? "var(--energy-battery-out-color)"
          : "var(--energy-battery-in-color)"
        : "var(--energy-battery-in-color)"
    );

    const totalIndividualConsumption =
      coerceNumber(individual1.state, 0) * (individual1.invertAnimation ? -1 : 1) +
      coerceNumber(individual2.state, 0) * (individual2.invertAnimation ? -1 : 1);

    const totalHomeConsumption = Math.max(grid.state.toHome + (solar.state.toHome ?? 0) + (battery.state.toHome ?? 0), 0);

    let homeBatteryCircumference: number = 0;
    if (battery.state.toHome) homeBatteryCircumference = circleCircumference * (battery.state.toHome / totalHomeConsumption);

    let homeSolarCircumference: number = 0;
    if (solar.has) {
      homeSolarCircumference = circleCircumference * (solar.state.toHome! / totalHomeConsumption);
    }

    if (nonFossil.secondary.has) {
      const nonFossilFuelSecondaryEntity = this.hass.states[entities.fossil_fuel_percentage?.secondary_info?.entity!];
      const nonFossilFuelSecondaryState = nonFossilFuelSecondaryEntity.state;
      if (typeof nonFossilFuelSecondaryState === "number" && !nonFossil.secondary.accept_negative) {
        nonFossil.secondary.state = Math.max(nonFossilFuelSecondaryState, 0);
      } else if (typeof nonFossilFuelSecondaryState === "string") {
        nonFossil.secondary.state = nonFossilFuelSecondaryState;
      }
    }

    let homeNonFossilCircumference: number = 0;

    nonFossil.has =
      grid.state.toHome * 1 - this.getEntityState(entities.fossil_fuel_percentage?.entity) / 100 > 0 &&
      entities.fossil_fuel_percentage?.entity !== undefined &&
      this.entityAvailable(entities.fossil_fuel_percentage?.entity);

    if (nonFossil.has) {
      const nonFossilFuelDecimal = 1 - this.getEntityState(entities.fossil_fuel_percentage?.entity) / 100;
      nonFossil.state.power = grid.state.toHome * nonFossilFuelDecimal;
      homeNonFossilCircumference = circleCircumference * (nonFossil.state.power / totalHomeConsumption);
    }

    nonFossil.hasPercentage =
      (entities.fossil_fuel_percentage?.entity !== undefined && entities.fossil_fuel_percentage?.display_zero === true) || nonFossil.has;

    if (grid.powerOutage.isOutage) {
      grid.state.fromGrid = grid.powerOutage.entityGenerator ? Math.max(this.getEntityStateWatts(grid.powerOutage.entityGenerator), 0) : 0;
      grid.state.toHome = Math.max(grid.state.fromGrid - (grid.state.toBattery ?? 0), 0);
      grid.state.toGrid = 0;
      battery.state.toGrid = 0;
      solar.state.toGrid = 0;
      grid.icon = grid.powerOutage.icon;
      nonFossil.has = false;
      nonFossil.hasPercentage = false;
    }

    const totalLines =
      grid.state.toHome +
      (solar.state.toHome ?? 0) +
      (solar.state.toGrid ?? 0) +
      (solar.state.toBattery ?? 0) +
      (battery.state.toHome ?? 0) +
      (grid.state.toBattery ?? 0) +
      (battery.state.toGrid ?? 0);

    if (battery.state_of_charge.state === null) {
      battery.icon = "mdi:battery";
    } else if (battery.state_of_charge.state <= 72 && battery.state_of_charge.state > 44) {
      battery.icon = "mdi:battery-medium";
    } else if (battery.state_of_charge.state <= 44 && battery.state_of_charge.state > 16) {
      battery.icon = "mdi:battery-low";
    } else if (battery.state_of_charge.state <= 16) {
      battery.icon = "mdi:battery-outline";
    }
    if (entities.battery?.icon !== undefined) battery.icon = entities.battery?.icon;

    const newDur = {
      batteryGrid: this.circleRate(grid.state.toBattery ?? battery.state.toGrid ?? 0, totalLines),
      batteryToHome: this.circleRate(battery.state.toHome ?? 0, totalLines),
      gridToHome: this.circleRate(grid.state.toHome, totalLines),
      solarToBattery: this.circleRate(solar.state.toBattery ?? 0, totalLines),
      solarToGrid: this.circleRate(solar.state.toGrid ?? 0, totalLines),
      solarToHome: this.circleRate(solar.state.toHome ?? 0, totalLines),
      individual1: this.circleRate(individual1.state ?? 0, totalIndividualConsumption),
      individual2: this.circleRate(individual2.state ?? 0, totalIndividualConsumption),
      nonFossil: this.circleRate(nonFossil.state.power ?? 0, totalLines),
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

    if (nonFossil.color !== undefined) {
      if (typeof nonFossil.color === "object") nonFossil.color = this.convertColorListToHex(nonFossil.color);
      this.style.setProperty("--non-fossil-color", nonFossil.color || "var(--energy-non-fossil-color)");
    }
    this.style.setProperty(
      "--icon-non-fossil-color",
      entities.fossil_fuel_percentage?.color_icon ? "var(--non-fossil-color)" : "var(--primary-text-color)" || "var(--non-fossil-color)"
    );

    const getIndividualDisplayState = (field: Individual) => {
      if (field.state === undefined) return "";
      return this.displayValue(field.state, field.unit, field.unit_white_space, field.decimals);
    };

    const individual1DisplayState = getIndividualDisplayState(individual1);

    const individual2DisplayState = getIndividualDisplayState(individual2);

    this.style.setProperty(
      "--text-non-fossil-color",
      entities.fossil_fuel_percentage?.color_value ? "var(--non-fossil-color)" : "var(--primary-text-color)"
    );
    this.style.setProperty(
      "--secondary-text-non-fossil-color",
      entities.fossil_fuel_percentage?.secondary_info?.color_value ? "var(--non-fossil-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--text-individualone-color",
      entities.individual1?.color_value ? "var(--individualone-color)" : "var(--primary-text-color)"
    );
    this.style.setProperty(
      "--text-individualtwo-color",
      entities.individual2?.color_value ? "var(--individualtwo-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--secondary-text-individualone-color",
      entities.individual1?.secondary_info?.color_value ? "var(--individualone-color)" : "var(--primary-text-color)"
    );
    this.style.setProperty(
      "--secondary-text-individualtwo-color",
      entities.individual2?.secondary_info?.color_value ? "var(--individualtwo-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--secondary-text-home-color",
      entities.home?.secondary_info?.color_value ? "var(--text-home-color)" : "var(--primary-text-color)"
    );

    this.style.setProperty(
      "--transparency-unused-lines",
      this._config?.display_zero_lines?.transparency ? this._config.display_zero_lines.transparency.toString() : "0"
    );

    this.style.setProperty(
      "--battery-grid-line",
      grid.state.toBattery || 0 > 0 ? "var(--energy-grid-consumption-color)" : "var(--energy-grid-return-color)"
    );

    if (entities.grid?.color_value === false) {
      this.style.setProperty("--text-grid-consumption-color", "var(--primary-text-color)");
      this.style.setProperty("--text-grid-return-color", "var(--primary-text-color)");
    } else {
      this.style.setProperty("--text-grid-consumption-color", "var(--energy-grid-consumption-color)");
      this.style.setProperty("--text-grid-return-color", "var(--energy-grid-return-color)");
    }

    if (entities.battery?.color_value === false) {
      this.style.setProperty("--text-battery-in-color", "var(--primary-text-color)");
      this.style.setProperty("--text-battery-out-color", "var(--primary-text-color)");
    } else {
      this.style.setProperty("--text-battery-in-color", "var(--energy-battery-in-color)");
      this.style.setProperty("--text-battery-out-color", "var(--energy-battery-out-color)");
    }

    if (this._config.display_zero_lines?.grey_color !== undefined) {
      let greyColor = this._config.display_zero_lines.grey_color;
      if (typeof greyColor === "object") greyColor = this.convertColorListToHex(greyColor);
      this.style.setProperty("--greyed-out--line-color", greyColor);
    }

    const templatesObj = {
      gridSecondary: this._templateResults.gridSecondary?.result,
      solarSecondary: this._templateResults.solarSecondary?.result,
      homeSecondary: this._templateResults.homeSecondary?.result,
      individual1Secondary: this._templateResults.individual1Secondary?.result,
      individual2Secondary: this._templateResults.individual2Secondary?.result,
      nonFossilFuelSecondary: this._templateResults.nonFossilFuelSecondary?.result,
    };

    const homeUsageToDisplay =
      entities.home?.override_state && entities.home.entity
        ? entities.home?.subtract_individual
          ? this.displayValue(this.getEntityStateWatts(entities.home.entity) - totalIndividualConsumption)
          : this.displayValue(this.getEntityStateWatts(entities.home!.entity))
        : entities.home?.subtract_individual
        ? this.displayValue(totalHomeConsumption - totalIndividualConsumption || 0)
        : this.displayValue(totalHomeConsumption);

    const homeGridCircumference =
      circleCircumference *
      ((totalHomeConsumption - (nonFossil.state.power ?? 0) - (battery.state.toHome ?? 0) - (solar.state.toHome ?? 0)) / totalHomeConsumption);

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

    const isCardWideEnough = this._width > 420;
    if (solar.has) {
      if (battery.has) {
        // has solar, battery and grid
        this.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "106%" : "102%");
        this.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-3%" : "-1%");
        this.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 160px)" : "calc(100% - 160px)");
      } else {
        // has solar but no battery
        this.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "104%" : "102%");
        this.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-2%" : "-1%");
        this.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 154px)" : "calc(100% - 157px)");
        this.style.setProperty("--lines-svg-not-flat-width", isCardWideEnough ? "calc(103% - 172px)" : "calc(103% - 169px)");
      }
    }

    /* return source object with largest value property */
    const homeLargestSource = Object.keys(homeSources).reduce((a, b) => (homeSources[a].value > homeSources[b].value ? a : b));

    let iconHomeColor: string = "var(--primary-text-color)";
    if (home.color.icon_type === "solar") {
      iconHomeColor = "var(--energy-solar-color)";
    } else if (home.color.icon_type === "battery") {
      iconHomeColor = "var(--energy-battery-out-color)";
    } else if (home.color.icon_type === "grid") {
      iconHomeColor = "var(--energy-grid-consumption-color)";
    } else if (home.color.icon_type === true) {
      iconHomeColor = homeSources[homeLargestSource].color;
    }
    this.style.setProperty("--icon-home-color", iconHomeColor);

    const homeTextColorType = entities.home?.color_value;
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

    this.style.setProperty("--text-home-color", textHomeColor);

    const baseSecondarySpan = ({
      className,
      template,
      value,
      entityId,
      icon,
    }: {
      className: string;
      template?: string;
      value?: string;
      entityId?: string;
      icon?: string;
    }) => {
      if (value || template) {
        return html`<span
          class="secondary-info ${className}"
          @click=${(e: { stopPropagation: () => void }) => {
            this.openDetails(e, entityId);
          }}
          @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
            if (e.key === "Enter") {
              this.openDetails(e, entityId);
            }
          }}
        >
          ${entities.solar?.secondary_info?.icon ? html`<ha-icon class="secondary-info small" .icon=${icon}></ha-icon>` : ""}
          ${template ?? value}</span
        >`;
      }
      return "";
    };

    const generalSecondarySpan = (field, key: string) => {
      return html` ${field.secondary.has || field.secondary.template
        ? html` ${baseSecondarySpan({
            className: key,
            entityId: field.secondary.entity,
            icon: field.secondary.icon,
            value: this.displayValue(field.secondary.state, field.secondary.unit, field.secondary.unit_white_space, field.secondary.decimals),
            template: templatesObj[`${key}Secondary`],
          })}`
        : ""}`;
    };

    const individualSecondarySpan = (individual: Individual, key: string) => {
      const templateResult: string = templatesObj[`${key}Secondary`];
      const value = individual.secondary.has
        ? this.displayValue(
            individual.secondary.state,
            individual.secondary.unit,
            individual.secondary.unit_white_space,
            individual.secondary.decimals
          )
        : undefined;
      const passesDisplayZeroCheck =
        individual.secondary.displayZero !== false ||
        (isNumberValue(individual.secondary.state)
          ? (Number(individual.secondary.state) ?? 0) > (individual.secondary.displayZeroTolerance ?? 0)
          : true);
      return html` ${(individual.secondary.has && passesDisplayZeroCheck) || templateResult
        ? html`${baseSecondarySpan({
            className: key,
            entityId: individual.secondary.entity,
            icon: individual.secondary.icon,
            value,
            template: templatesObj[`${key}Secondary`],
          })}`
        : ""}`;
    };

    return html`
      <ha-card
        .header=${this._config.title}
        class=${this._config.full_size ? "full-size" : ""}
        style=${this._config.style_ha_card ? this._config.style_ha_card : ""}
      >
        <div
          class="card-content ${this._config.full_size ? "full-size" : ""}"
          id="power-flow-card-plus"
          style=${this._config.style_card_content ? this._config.style_card_content : ""}
        >
          ${solar.has || individual2.has || individual1.has || nonFossil.hasPercentage
            ? html`<div class="row">
                ${!nonFossil.hasPercentage
                  ? html`<div class="spacer"></div>`
                  : html`<div class="circle-container low-carbon">
                      <span class="label">${nonFossil.name}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          this.openDetails(e, entities.fossil_fuel_percentage?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            this.openDetails(e, entities.fossil_fuel_percentage?.entity);
                          }
                        }}
                      >
                        ${generalSecondarySpan(nonFossil, "nonFossilFuel")}
                        <ha-icon
                          .icon=${nonFossil.icon}
                          class="low-carbon"
                          style="${nonFossil.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.fossil_fuel_percentage?.display_zero_state !== false ||
                          (nonFossil.state.power || 0) > (entities.fossil_fuel_percentage?.display_zero_tolerance || 0)
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.fossil_fuel_percentage?.display_zero_state !== false ||
                        (nonFossil.state.power || 0) > (entities.fossil_fuel_percentage?.display_zero_tolerance || 0)
                          ? html`
                              <span class="low-carbon"
                                >${this.displayNonFossilState(entities!.fossil_fuel_percentage!.entity, grid.state.fromGrid)}</span
                              >
                            `
                          : ""}
                      </div>
                      ${this.showLine(nonFossil.state.power || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 -10 v40" class="low-carbon ${this.styleLine(nonFossil.state.power || 0)}" id="low-carbon" />
                              ${nonFossil.has
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
                ${solar.has
                  ? html`<div class="circle-container solar">
                      <span class="label">${solar.name}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          this.openDetails(e, solar.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            this.openDetails(e, solar.entity);
                          }
                        }}
                      >
                        ${generalSecondarySpan(solar, "solar")}
                        <ha-icon
                          id="solar-icon"
                          .icon=${solar.icon}
                          style="${solar.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.solar?.display_zero_state !== false || (solar.state.total || 0) > 0
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.solar?.display_zero_state !== false || (solar.state.total || 0) > 0
                          ? html` <span class="solar"> ${this.displayValue(solar.state.total as number)}</span>`
                          : ""}
                      </div>
                    </div>`
                  : individual2.has || individual1.has
                  ? html`<div class="spacer"></div>`
                  : ""}
                ${individual2.has
                  ? html`<div class="circle-container individual2">
                      <span class="label">${individual2.name}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          this.openDetails(e, entities.individual2?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            this.openDetails(e, entities.individual2?.entity);
                          }
                        }}
                      >
                        ${individualSecondarySpan(individual2, "individual2")}
                        <ha-icon
                          id="individual2-icon"
                          .icon=${individual2.icon}
                          style="${individual2.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.individual2?.display_zero_state !== false || (individual2.state || 0) > (individual2.displayZeroTolerance ?? 0)
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.individual2?.display_zero_state !== false || (individual2.state || 0) > (individual2.displayZeroTolerance ?? 0)
                          ? html` <span class="individual2">
                              ${individual2.showDirection
                                ? html`<ha-icon class="small" .icon=${individual2.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
                                : ""}${individual2DisplayState}
                            </span>`
                          : ""}
                      </div>
                      ${this.showLine(individual2.state || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 -10 v50" id="individual2" class="${this.styleLine(individual2.state || 0)}" />
                              ${individual2.state
                                ? svg`<circle
                              r="2.4"
                              class="individual2"
                              vector-effect="non-scaling-stroke"
                            >
                              <animateMotion
                                dur="${this.additionalCircleRate(entities.individual2?.calculate_flow_rate, newDur.individual2)}s"
                                repeatCount="indefinite"
                                calcMode="linear"
                                keyPoints=${individual2.invertAnimation ? "0;1" : "1;0"}
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
                  : individual1.has
                  ? html`<div class="circle-container individual1">
                      <span class="label">${individual1.name}</span>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          this.openDetails(e, entities.individual1?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            this.openDetails(e, entities.individual1?.entity);
                          }
                        }}
                      >
                        ${individualSecondarySpan(individual1, "individual1")}
                        <ha-icon
                          id="individual1-icon"
                          .icon=${individual1.icon}
                          style="${individual1.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.individual1?.display_zero_state !== false || (individual1.state || 0) > (individual1.displayZeroTolerance ?? 0)
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.individual1?.display_zero_state !== false || (individual1.state || 0) > (individual1.displayZeroTolerance ?? 0)
                          ? html` <span class="individual1"
                              >${individual1.showDirection
                                ? html`<ha-icon class="small" .icon=${individual1.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
                                : ""}${individual1DisplayState}
                            </span>`
                          : ""}
                      </div>
                      ${this.showLine(individual1.state || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 -10 v40" id="individual1" class="${this.styleLine(individual1.state || 0)}" />
                              ${individual1.state
                                ? svg`<circle
                                r="2.4"
                                class="individual1"
                                vector-effect="non-scaling-stroke"
                              >
                                <animateMotion
                                  dur="${this.additionalCircleRate(entities.individual1?.calculate_flow_rate, newDur.individual1)}s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints=${individual1.invertAnimation ? "0;1" : "1;0"}
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
            ${grid.has
              ? html` <div class="circle-container grid">
                  <div
                    class="circle"
                    @click=${(e: { stopPropagation: () => void }) => {
                      const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
                      const target =
                        grid.powerOutage?.isOutage && outageTarget
                          ? outageTarget
                          : typeof entities.grid!.entity === "string"
                          ? entities.grid!.entity
                          : entities.grid!.entity.production!;
                      this.openDetails(e, target);
                    }}
                    @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                      if (e.key === "Enter") {
                        const outageTarget = grid.powerOutage?.entityGenerator ?? entities.grid?.power_outage?.entity;
                        const target =
                          grid.powerOutage?.isOutage && outageTarget
                            ? outageTarget
                            : typeof entities.grid!.entity === "string"
                            ? entities.grid!.entity
                            : entities.grid!.entity.production!;
                        this.openDetails(e, target);
                      }
                    }}
                  >
                    ${generalSecondarySpan(grid, "grid")}
                    <ha-icon .icon=${grid.icon}></ha-icon>
                    ${(entities.grid?.display_state === "two_way" ||
                      entities.grid?.display_state === undefined ||
                      (entities.grid?.display_state === "one_way_no_zero" && (grid.state.toGrid ?? 0) > 0) ||
                      (entities.grid?.display_state === "one_way" &&
                        (grid.state.fromGrid === null || grid.state.fromGrid === 0) &&
                        grid.state.toGrid !== 0)) &&
                    grid.state.toGrid !== null &&
                    !grid.powerOutage.isOutage
                      ? html`<span
                          class="return"
                          @click=${(e: { stopPropagation: () => void }) => {
                            const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
                            this.openDetails(e, target);
                          }}
                          @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                            if (e.key === "Enter") {
                              const target = typeof entities.grid!.entity === "string" ? entities.grid!.entity : entities.grid!.entity.production!;
                              this.openDetails(e, target);
                            }
                          }}
                        >
                          <ha-icon class="small" .icon=${"mdi:arrow-left"}></ha-icon>
                          ${this.displayValue(grid.state.toGrid)}
                        </span>`
                      : null}
                    ${((entities.grid?.display_state === "two_way" ||
                      entities.grid?.display_state === undefined ||
                      (entities.grid?.display_state === "one_way_no_zero" && grid.state.fromGrid > 0) ||
                      (entities.grid?.display_state === "one_way" && (grid.state.toGrid === null || grid.state.toGrid === 0))) &&
                      grid.state.fromGrid !== null &&
                      !grid.powerOutage.isOutage) ||
                    (grid.powerOutage.isOutage && !!grid.powerOutage.entityGenerator)
                      ? html` <span class="consumption">
                          <ha-icon class="small" .icon=${"mdi:arrow-right"}></ha-icon>${this.displayValue(grid.state.fromGrid)}
                        </span>`
                      : ""}
                    ${grid.powerOutage?.isOutage && !grid.powerOutage?.entityGenerator
                      ? html`<span class="grid power-outage">${grid.powerOutage.name}</span>`
                      : ""}
                  </div>
                  <span class="label">${grid.name}</span>
                </div>`
              : html`<div class="spacer"></div>`}
            <div class="circle-container home">
              <div
                class="circle"
                id="home-circle"
                @click=${(e: { stopPropagation: () => void }) => {
                  this.openDetails(e, entities.home?.entity);
                }}
                @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                  if (e.key === "Enter") {
                    this.openDetails(e, entities.home?.entity);
                  }
                }}
              >
                ${generalSecondarySpan(home, "home")}
                <ha-icon .icon=${home.icon}></ha-icon>
                ${homeUsageToDisplay}
                <svg class="home-circle-sections">
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
              ${this.showLine(individual1.state || 0) && individual2.has && individual1.has
                ? html`<span class="label"></span>`
                : html` <span class="label">${home.name}</span>`}
            </div>
          </div>
          ${battery.has || (individual1.has && individual2.has)
            ? html`<div class="row">
                <div class="spacer"></div>
                ${battery.has
                  ? html` <div class="circle-container battery">
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          const target = entities.battery?.state_of_charge!
                            ? entities.battery?.state_of_charge!
                            : typeof entities.battery?.entity === "string"
                            ? entities.battery?.entity!
                            : entities.battery?.entity!.production;
                          this.openDetails(e, target);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            const target = entities.battery?.state_of_charge!
                              ? entities.battery?.state_of_charge!
                              : typeof entities.battery!.entity === "string"
                              ? entities.battery!.entity!
                              : entities.battery!.entity!.production;
                            this.openDetails(e, target);
                          }
                        }}
                      >
                        ${battery.state_of_charge.state !== null
                          ? html` <span
                              @click=${(e: { stopPropagation: () => void }) => {
                                this.openDetails(e, entities.battery?.state_of_charge!);
                              }}
                              @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                                if (e.key === "Enter") {
                                  this.openDetails(e, entities.battery?.state_of_charge!);
                                }
                              }}
                              id="battery-state-of-charge-text"
                            >
                              ${this.displayValue(
                                battery.state_of_charge.state,
                                battery.state_of_charge.unit,
                                battery.state_of_charge.unit_white_space,
                                battery.state_of_charge.decimals
                              )}
                            </span>`
                          : null}
                        <ha-icon
                          .icon=${battery.icon}
                          style=${entities.battery?.display_state === "two_way"
                            ? "padding-top: 0px; padding-bottom: 2px;"
                            : entities.battery?.display_state === "one_way_no_zero" &&
                              battery.state.toBattery === 0 &&
                              battery.state.fromBattery === 0
                            ? "padding-top: 2px; padding-bottom: 0px;"
                            : "padding-top: 2px; padding-bottom: 2px;"}
                          @click=${(e: { stopPropagation: () => void }) => {
                            this.openDetails(e, entities.battery?.state_of_charge!);
                          }}
                          @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                            if (e.key === "Enter") {
                              this.openDetails(e, entities.battery?.state_of_charge!);
                            }
                          }}
                        ></ha-icon>
                        ${entities.battery?.display_state === "two_way" ||
                        entities.battery?.display_state === undefined ||
                        (entities.battery?.display_state === "one_way_no_zero" && battery.state.toBattery > 0) ||
                        (entities.battery?.display_state === "one_way" && battery.state.toBattery !== 0)
                          ? html`<span
                              class="battery-in"
                              @click=${(e: { stopPropagation: () => void }) => {
                                const target =
                                  typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.production!;

                                this.openDetails(e, target);
                              }}
                              @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                                if (e.key === "Enter") {
                                  const target =
                                    typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.production!;

                                  this.openDetails(e, target);
                                }
                              }}
                            >
                              <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
                              ${this.displayValue(battery.state.toBattery)}</span
                            >`
                          : ""}
                        ${entities.battery?.display_state === "two_way" ||
                        entities.battery?.display_state === undefined ||
                        (entities.battery?.display_state === "one_way_no_zero" && battery.state.fromBattery > 0) ||
                        (entities.battery?.display_state === "one_way" && (battery.state.toBattery === 0 || battery.state.fromBattery !== 0))
                          ? html`<span
                              class="battery-out"
                              @click=${(e: { stopPropagation: () => void }) => {
                                const target =
                                  typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.consumption!;

                                this.openDetails(e, target);
                              }}
                              @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                                if (e.key === "Enter") {
                                  const target =
                                    typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.consumption!;

                                  this.openDetails(e, target);
                                }
                              }}
                            >
                              <ha-icon class="small" .icon=${"mdi:arrow-up"}></ha-icon>
                              ${this.displayValue(battery.state.fromBattery)}</span
                            >`
                          : ""}
                      </div>
                      <span class="label">${battery.name}</span>
                    </div>`
                  : html`<div class="spacer"></div>`}
                ${individual2.has && individual1.has
                  ? html`<div class="circle-container individual1 bottom">
                      ${this.showLine(individual1.state || 0)
                        ? html`
                            <svg width="80" height="30">
                              <path d="M40 40 v-40" id="individual1" class="${this.styleLine(individual1.state || 0)}" />
                              ${individual1.state
                                ? svg`<circle
                                r="2.4"
                                class="individual1"
                                vector-effect="non-scaling-stroke"
                              >
                                <animateMotion
                                  dur="${this.additionalCircleRate(entities.individual1?.calculate_flow_rate, newDur.individual1)}s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints=${individual1.invertAnimation ? "0;1" : "1;0"}
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
                          this.openDetails(e, entities.individual1?.entity);
                        }}
                        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
                          if (e.key === "Enter") {
                            this.openDetails(e, entities.individual1?.entity);
                          }
                        }}
                      >
                        ${individualSecondarySpan(individual1, "individual1")}
                        <ha-icon
                          id="individual1-icon"
                          .icon=${individual1.icon}
                          style="${individual1.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
                          ${entities.individual1?.display_zero_state !== false || (individual1.state || 0) > (individual1.displayZeroTolerance ?? 0)
                            ? "padding-bottom: 2px;"
                            : "padding-bottom: 0px;"}"
                        ></ha-icon>
                        ${entities.individual1?.display_zero_state !== false || (individual1.state || 0) > (individual1.displayZeroTolerance ?? 0)
                          ? html` <span class="individual1"
                              >${individual1.showDirection
                                ? html`<ha-icon class="small" .icon=${individual1.invertAnimation ? "mdi:arrow-up" : "mdi:arrow-down"}></ha-icon>`
                                : ""}${individual1DisplayState}
                            </span>`
                          : ""}
                      </div>
                      <span class="label">${individual1.name}</span>
                    </div>`
                  : html`<div class="spacer"></div>`}
              </div>`
            : html`<div class="spacer"></div>`}
          ${solar.has && this.showLine(solar.state.toHome || 0)
            ? html`<div
                class="lines ${classMap({
                  high: battery.has,
                  "individual1-individual2": !battery.has && individual2.has && individual1.has,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-home-flow">
                  <path
                    id="solar"
                    class="solar ${this.styleLine(solar.state.toHome || 0)}"
                    d="M${battery.has ? 55 : 53},0 v${grid.has ? 15 : 17} c0,${battery.has ? "30 10,30 30,30" : "35 10,35 30,35"} h25"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${solar.state.toHome
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
          ${grid.hasReturnToGrid && solar.has && this.showLine(solar.state.toGrid || 0)
            ? html`<div
                class="lines ${classMap({
                  high: battery.has,
                  "individual1-individual2": !battery.has && individual2.has && individual1.has,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-grid-flow">
                  <path
                    id="return"
                    class="return ${this.styleLine(solar.state.toGrid || 0)}"
                    d="M${battery.has ? 45 : 47},0 v15 c0,${battery.has ? "30 -10,30 -30,30" : "35 -10,35 -30,35"} h-20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${solar.state.toGrid && solar.has
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
          ${battery.has && solar.has && this.showLine(solar.state.toBattery || 0)
            ? html`<div
                class="lines ${classMap({
                  high: battery.has,
                  "individual1-individual2": !battery.has && individual2.has && individual1.has,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="solar-battery-flow"
                  class="flat-line"
                >
                  <path
                    id="battery-solar"
                    class="battery-solar ${this.styleLine(solar.state.toBattery || 0)}"
                    d="M50,0 V100"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${solar.state.toBattery
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
          ${grid.has && this.showLine(grid.state.fromGrid)
            ? html`<div
                class="lines ${classMap({
                  high: battery.has,
                  "individual1-individual2": !battery.has && individual2.has && individual1.has,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="grid-home-flow"
                  class="flat-line"
                >
                  <path
                    class="grid ${this.styleLine(grid.state.toHome || 0)}"
                    id="grid"
                    d="M0,${battery.has ? 50 : solar.has ? 56 : 53} H100"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${grid.state.toHome
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
          ${battery.has && this.showLine(battery.state.toHome)
            ? html`<div
                class="lines ${classMap({
                  high: battery.has,
                  "individual1-individual2": !battery.has && individual2.has && individual1.has,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-home-flow">
                  <path
                    id="battery-home"
                    class="battery-home ${this.styleLine(battery.state.toHome || 0)}"
                    d="M55,100 v-${grid.has ? 15 : 17} c0,-30 10,-30 30,-30 h20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${battery.state.toHome
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
          ${grid.has && battery.has && this.showLine(Math.max(grid.state.toBattery || 0, battery.state.toGrid || 0))
            ? html`<div
                class="lines ${classMap({
                  high: battery.has,
                  "individual1-individual2": !battery.has && individual2.has && individual1.has,
                })}"
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-grid-flow">
                  <path
                    id="battery-grid"
                    class=${this.styleLine(battery.state.toGrid || grid.state.toBattery || 0)}
                    d="M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  ${grid.state.toBattery
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
                  ${battery.state.toGrid
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
        ${this._config.dashboard_link || this._config.second_dashboard_link
          ? html`
              <div class="card-actions">
                ${this._config.dashboard_link
                  ? html`
                      <a href=${this._config.dashboard_link}
                        ><mwc-button>
                          ${this._config.dashboard_link_label ||
                          this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard")}
                        </mwc-button></a
                      >
                    `
                  : ""}
                ${this._config.second_dashboard_link
                  ? html`
                      <a href=${this._config.second_dashboard_link}
                        ><mwc-button>
                          ${this._config.second_dashboard_link_label ||
                          this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard")}
                        </mwc-button></a
                      >
                    `
                  : ""}
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

    const elem = this?.shadowRoot?.querySelector("#power-flow-card-plus");
    const widthStr = elem ? getComputedStyle(elem).getPropertyValue("width") : "0px";
    this._width = parseInt(widthStr.replace("px", ""), 10);

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

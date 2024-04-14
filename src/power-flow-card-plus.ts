/* eslint-disable wc/guard-super-call */
/* eslint-disable import/extensions */
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { html, LitElement, PropertyValues, svg, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { MAX_INDIVIDUAL_ENTITIES, PowerFlowCardPlusConfig } from "./power-flow-card-plus-config";
import { coerceNumber } from "./utils/utils";
import { registerCustomCard } from "./utils/register-custom-card";
import { RenderTemplateResult, subscribeRenderTemplate } from "./template/ha-websocket.js";
import { styles } from "./style";
import { defaultValues, getDefaultConfig } from "./utils/get-default-config";
import { getEntityStateWatts } from "./states/utils/getEntityStateWatts";
import { getEntityState } from "./states/utils/getEntityState";
import { doesEntityExist } from "./states/utils/existenceEntity";
import { computeFlowRate } from "./utils/computeFlowRate";
import { getGridConsumptionState, getGridProductionState, getGridSecondaryState } from "./states/raw/grid";
import { getSolarSecondaryState } from "./states/raw/solar";
import { getSolarState } from "./states/raw/solar";
import { getBatteryInState, getBatteryOutState, getBatteryStateOfCharge } from "./states/raw/battery";
import { computeFieldIcon, computeFieldName } from "./utils/computeFieldAttributes";
import { adjustZeroTolerance } from "./states/tolerance/base";
import { getNonFossilHas, getNonFossilHasPercentage, getNonFossilSecondaryState } from "./states/raw/nonFossil";
import { getHomeSecondaryState } from "./states/raw/home";
import { GridObject, HomeSources, NewDur, TemplatesObj } from "./type";
import { displayValue } from "./utils/displayValue";
import { allDynamicStyles } from "./style/all";
import { nonFossilElement } from "./components/nonFossil";
import { solarElement } from "./components/solar";
import { gridElement } from "./components/grid";
import { homeElement } from "./components/home";
import { batteryElement } from "./components/battery";
import { flowElement } from "./components/flows";
import { dashboardLinkElement } from "./components/misc/dashboard_link";
import { IndividualObject, getIndividualObject } from "./states/raw/individual/getIndividualObject";
import { individualLeftTopElement } from "./components/individualLeftTopElement";
import { individualLeftBottomElement } from "./components/individualLeftBottomElement";
import {
  checkHasBottomIndividual,
  checkHasRightIndividual,
  getBottomLeftIndividual,
  getBottomRightIndividual,
  getTopLeftIndividual,
  getTopRightIndividual,
} from "./utils/computeIndividualPosition";
import { individualRightTopElement } from "./components/individualRightTopElement";
import { individualRightBottomElement } from "./components/individualRightBottomElement";

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
      individual_mode_config: {
        mode: "sort_power",
      },
    };

    if (this._config.entities?.individual && this._config.entities.individual.length > MAX_INDIVIDUAL_ENTITIES)
      throw new Error(`Only ${MAX_INDIVIDUAL_ENTITIES} individual entities are supported`);
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

  private previousDur: { [name: string]: number } = {};

  public openDetails(event: { stopPropagation: any; key?: string }, entityId?: string | undefined): void {
    event.stopPropagation();
    if (!entityId || !this._config.clickable_entities) return;
    /* also needs to open details if entity is unavailable, but not if entity doesn't exist is hass states */
    if (!doesEntityExist(this.hass, entityId)) return;
    const e = new CustomEvent("hass-more-info", {
      composed: true,
      detail: { entityId },
    });
    this.dispatchEvent(e);
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { entities } = this._config;

    this.style.setProperty("--clickable-cursor", this._config.clickable_entities ? "pointer" : "default");

    const initialNumericState = null as null | number;

    const grid: GridObject = {
      entity: entities.grid?.entity,
      has: entities?.grid?.entity !== undefined,
      hasReturnToGrid: typeof entities.grid?.entity === "string" || !!entities.grid?.entity?.production,
      state: {
        fromGrid: getGridConsumptionState(this.hass, this._config),
        toGrid: getGridProductionState(this.hass, this._config),
        toBattery: initialNumericState,
        toHome: initialNumericState,
      },
      powerOutage: {
        has: entities.grid?.power_outage?.entity !== undefined,
        isOutage:
          (entities.grid && this.hass.states[entities.grid.power_outage?.entity]?.state) === (entities.grid?.power_outage?.state_alert ?? "on"),
        icon: entities.grid?.power_outage?.icon_alert || "mdi:transmission-tower-off",
        name: entities.grid?.power_outage?.label_alert ?? html`Power<br />Outage`,
        entityGenerator: entities.grid?.power_outage?.entity_generator,
      },
      icon: computeFieldIcon(this.hass, entities.grid, "mdi:transmission-tower"),
      name: computeFieldName(this.hass, entities.grid, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.grid")),
      mainEntity:
        typeof entities.grid?.entity === "object" ? entities.grid.entity.consumption || entities.grid.entity.production : entities.grid?.entity,
      color: {
        fromGrid: entities.grid?.color?.consumption,
        toGrid: entities.grid?.color?.production,
        icon_type: entities.grid?.color_icon as boolean | "consumption" | "production" | undefined,
        circle_type: entities.grid?.color_circle,
      },
      secondary: {
        entity: entities.grid?.secondary_info?.entity,
        decimals: entities.grid?.secondary_info?.decimals,
        template: entities.grid?.secondary_info?.template,
        has: entities.grid?.secondary_info?.entity !== undefined,
        state: getGridSecondaryState(this.hass, this._config),
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
        total: getSolarState(this.hass, this._config),
        toHome: initialNumericState,
        toGrid: initialNumericState,
        toBattery: initialNumericState,
      },
      icon: computeFieldIcon(this.hass, entities.solar, "mdi:solar-power"),
      name: computeFieldName(this.hass, entities.solar, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.solar")),
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

    const checkIfHasBattery = () => {
      if (!entities.battery?.entity) return false;
      if (typeof entities.battery?.entity === "object") return entities.battery?.entity.consumption || entities.battery?.entity.production;
      return entities.battery?.entity !== undefined;
    };

    const battery = {
      entity: entities.battery?.entity,
      has: checkIfHasBattery(),
      mainEntity: typeof entities.battery?.entity === "object" ? entities.battery.entity.consumption : entities.battery?.entity,
      name: computeFieldName(this.hass, entities.battery, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.battery")),
      icon: computeFieldIcon(this.hass, entities.battery, "mdi:battery-high"),
      state_of_charge: {
        state: getBatteryStateOfCharge(this.hass, this._config),
        unit: entities?.battery?.state_of_charge_unit || "%",
        unit_white_space: entities?.battery?.state_of_charge_unit_white_space || true,
        decimals: entities?.battery?.state_of_charge_decimals || 0,
      },
      state: {
        toBattery: getBatteryInState(this.hass, this._config),
        fromBattery: getBatteryOutState(this.hass, this._config),
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
      icon: computeFieldIcon(this.hass, entities?.home, "mdi:home"),
      name: computeFieldName(this.hass, entities?.home, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.home")),
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
      name: computeFieldName(this.hass, entities.fossil_fuel_percentage, this.hass.localize("card.label.non_fossil_fuel_percentage")),
      icon: computeFieldIcon(this.hass, entities.fossil_fuel_percentage, "mdi:leaf"),
      has: getNonFossilHas(this.hass, this._config),
      hasPercentage: getNonFossilHasPercentage(this.hass, this._config),
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
    } else {
      grid.state.toBattery = 0;
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
      grid.state.fromGrid = grid.powerOutage.entityGenerator ? Math.max(getEntityStateWatts(this.hass, grid.powerOutage.entityGenerator), 0) : 0;
      grid.state.toHome = Math.max(grid.state.fromGrid - (grid.state.toBattery ?? 0), 0);
      grid.state.toGrid = 0;
      battery.state.toGrid = 0;
      solar.state.toGrid = 0;
      grid.icon = grid.powerOutage.icon;
      nonFossil.has = false;
      nonFossil.hasPercentage = false;
    }

    // Set Initial State for Non Fossil Fuel Percentage
    if (nonFossil.has) {
      const nonFossilFuelDecimal = 1 - (getEntityState(this.hass, entities.fossil_fuel_percentage?.entity) ?? 0) / 100;
      nonFossil.state.power = grid.state.toHome * nonFossilFuelDecimal;
    }

    // Calculate Total Consumptions
    const totalIndividualConsumption = individualObjs?.reduce((a, b) => a + (b.state || 0), 0) || 0;

    const totalHomeConsumption = Math.max(grid.state.toHome + (solar.state.toHome ?? 0) + (battery.state.toHome ?? 0), 0);

    // Calculate Circumferences
    const homeBatteryCircumference = battery.state.toHome ? circleCircumference * (battery.state.toHome / totalHomeConsumption) : 0;
    const homeSolarCircumference = solar.state.toHome ? circleCircumference * (solar.state.toHome / totalHomeConsumption) : 0;
    const homeNonFossilCircumference = nonFossil.state.power ? circleCircumference * (nonFossil.state.power / totalHomeConsumption) : 0;
    const homeGridCircumference =
      circleCircumference *
      ((totalHomeConsumption - (nonFossil.state.power ?? 0) - (battery.state.toHome ?? 0) - (solar.state.toHome ?? 0)) / totalHomeConsumption);

    const homeUsageToDisplay =
      entities.home?.override_state && entities.home.entity
        ? entities.home?.subtract_individual
          ? displayValue(this.hass, getEntityStateWatts(this.hass, entities.home.entity) - totalIndividualConsumption)
          : displayValue(this.hass, getEntityStateWatts(this.hass, entities.home!.entity))
        : entities.home?.subtract_individual
        ? displayValue(this.hass, totalHomeConsumption - totalIndividualConsumption || 0)
        : displayValue(this.hass, totalHomeConsumption);

    const totalLines =
      grid.state.toHome +
      (solar.state.toHome ?? 0) +
      (solar.state.toGrid ?? 0) +
      (solar.state.toBattery ?? 0) +
      (battery.state.toHome ?? 0) +
      (grid.state.toBattery ?? 0) +
      (battery.state.toGrid ?? 0);

    // Battery SoC
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

    // Compute durations
    const newDur: NewDur = {
      batteryGrid: computeFlowRate(this._config, grid.state.toBattery ?? battery.state.toGrid ?? 0, totalLines),
      batteryToHome: computeFlowRate(this._config, battery.state.toHome ?? 0, totalLines),
      gridToHome: computeFlowRate(this._config, grid.state.toHome, totalLines),
      solarToBattery: computeFlowRate(this._config, solar.state.toBattery ?? 0, totalLines),
      solarToGrid: computeFlowRate(this._config, solar.state.toGrid ?? 0, totalLines),
      solarToHome: computeFlowRate(this._config, solar.state.toHome ?? 0, totalLines),
      individual: individualObjs?.map((individual) => computeFlowRate(this._config, individual.state ?? 0, totalIndividualConsumption)) || [],
      nonFossil: computeFlowRate(this._config, nonFossil.state.power ?? 0, totalLines),
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

    const homeSources: HomeSources = {
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

    const getIndividualDisplayState = (field?: IndividualObject) => {
      if (!field) return "";
      if (field?.state === undefined) return "";
      return displayValue(this.hass, field?.state, field?.unit, field?.unit_white_space, field?.decimals);
    };

    const individualKeys = ["left-top", "left-bottom", "right-top", "right-bottom"];
    // Templates
    const templatesObj: TemplatesObj = {
      gridSecondary: this._templateResults.gridSecondary?.result,
      solarSecondary: this._templateResults.solarSecondary?.result,
      homeSecondary: this._templateResults.homeSecondary?.result,

      nonFossilFuelSecondary: this._templateResults.nonFossilFuelSecondary?.result,
      individual: individualObjs?.map((_, index) => this._templateResults[`${individualKeys[index]}Secondary`]?.result) || [],
    };

    // Styles
    const isCardWideEnough = this._width > 420;
    allDynamicStyles(this, {
      grid,
      solar,
      battery,
      display_zero_lines_grey_color: this._config.display_zero_lines?.mode === "grey_out" ? this._config.display_zero_lines?.grey_color : "",
      display_zero_lines_transparency: this._config.display_zero_lines?.mode === "transparency" ? this._config.display_zero_lines?.transparency : "",
      entities,
      homeLargestSource,
      homeSources,
      individual: individualObjs,
      nonFossil,
      isCardWideEnough,
    });

    const individualFieldLeftTop = getTopLeftIndividual(this._config, individualObjs);
    const individualFieldLeftBottom = getBottomLeftIndividual(this._config, individualObjs);
    const individualFieldRightTop = getTopRightIndividual(this._config, individualObjs);
    const individualFieldRightBottom = getBottomRightIndividual(this._config, individualObjs);

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
          ${solar.has || individualObjs?.some((individual) => individual?.has) || nonFossil.hasPercentage
            ? html`<div class="row">
                ${nonFossilElement(this, this._config, {
                  entities,
                  grid,
                  newDur,
                  nonFossil,
                  templatesObj,
                })}
                ${solar.has
                  ? solarElement(this, {
                      entities,
                      solar,
                      templatesObj,
                    })
                  : individualObjs?.some((individual) => individual?.has)
                  ? html`<div class="spacer"></div>`
                  : ""}
                ${individualFieldLeftTop
                  ? individualLeftTopElement(this, this._config, {
                      individualObj: individualFieldLeftTop,
                      displayState: getIndividualDisplayState(individualFieldLeftTop),
                      newDur,
                      templatesObj,
                    })
                  : html`<div class="spacer"></div>`}
                ${checkHasRightIndividual(this._config, individualObjs)
                  ? individualRightTopElement(this, this._config, {
                      displayState: getIndividualDisplayState(individualFieldRightTop),
                      individualObj: individualFieldRightTop,
                      newDur,
                      templatesObj,
                      battery,
                      individualObjs,
                    })
                  : html``}
              </div>`
            : html``}
          <div class="row">
            ${grid.has
              ? gridElement(this, {
                  entities,
                  grid,
                  templatesObj,
                })
              : html`<div class="spacer"></div>`}
            <div class="spacer"></div>
            ${homeElement(this, this._config, {
              circleCircumference,
              entities,
              grid,
              home,
              homeBatteryCircumference,
              homeGridCircumference,
              homeNonFossilCircumference,
              homeSolarCircumference,
              newDur,
              templatesObj,
              homeUsageToDisplay,
              individual: individualObjs,
            })}
            ${checkHasRightIndividual(this._config, individualObjs) ? html` <div class="spacer"></div>` : html``}
          </div>
          ${battery.has || checkHasBottomIndividual(this._config, individualObjs)
            ? html`<div class="row">
                <div class="spacer"></div>

                ${battery.has ? batteryElement(this, { battery, entities }) : html`<div class="spacer"></div>`}
                ${individualFieldLeftBottom
                  ? individualLeftBottomElement(this, this.hass, this._config, {
                      displayState: getIndividualDisplayState(individualFieldLeftBottom),
                      individualObj: individualFieldLeftBottom,
                      newDur,
                      templatesObj,
                    })
                  : html`<div class="spacer"></div>`}
                ${checkHasRightIndividual(this._config, individualObjs)
                  ? individualRightBottomElement(this, this._config, {
                      displayState: getIndividualDisplayState(individualFieldRightBottom),
                      individualObj: individualFieldRightBottom,
                      newDur,
                      templatesObj,
                      battery,
                      individualObjs,
                    })
                  : html``}
              </div>`
            : html`<div class="spacer"></div>`}
          ${flowElement(this._config, {
            battery,
            grid,
            individual: individualObjs,
            newDur,
            solar,
          })}
        </div>
        ${dashboardLinkElement(this._config, this.hass)}
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
      individualSecondary: entities.individual?.map((individual) => individual.secondary_info?.template),
      nonFossilFuelSecondary: entities.fossil_fuel_percentage?.secondary_info?.template,
    };

    for (const [key, value] of Object.entries(templatesObj)) {
      if (value) {
        if (Array.isArray(value)) {
          const individualKeys = ["left-top", "left-bottom", "right-top", "right-bottom"];
          value.forEach((template, index) => {
            if (template) this._tryConnect(template, `${individualKeys[index]}Secondary`);
          });
        } else {
          this._tryConnect(value, key);
        }
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
      individualSecondary: entities.individual?.map((individual) => individual.secondary_info?.template),
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

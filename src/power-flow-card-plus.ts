import { ActionConfig, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { html, LitElement, nothing, PropertyValues, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { batteryElement } from "@/components/battery";
import { flowElement } from "@/components/flows";
import { gridElement } from "@/components/grid";
import { homeElement } from "@/components/home";
import { individualLeftBottomElement } from "@/components/individual-left-bottom-element";
import { individualLeftTopElement } from "@/components/individual-left-top-element";
import { individualRightBottomElement } from "@/components/individual-right-bottom-element";
import { individualRightTopElement } from "@/components/individual-right-top-element";
import { dashboardLinkElement } from "@/components/misc/dashboard-link";
import { nonFossilElement } from "@/components/non-fossil";
import { solarElement } from "@/components/solar";
import { handleAction } from "@/ha/panels/lovelace/common/handle-action";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getBatteryInState, getBatteryOutState, getBatteryStateOfCharge } from "@/states/raw/battery";
import { getGridConsumptionState, getGridProductionState, getGridSecondaryState } from "@/states/raw/grid";
import { getHomeSecondaryState } from "@/states/raw/home";
import { getIndividualObject, IndividualObject } from "@/states/raw/individual/get-individual-object";
import { getNonFossilHas, getNonFossilHasPercentage, getNonFossilSecondaryState } from "@/states/raw/non-fossil";
import { getSolarSecondaryState, getSolarState } from "@/states/raw/solar";
import { adjustZeroTolerance } from "@/states/tolerance/base";
import { doesEntityExist } from "@/states/utils/existence-entity";
import { getEntityState } from "@/states/utils/get-entity-state";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";
import { styles } from "@/style";
import { allDynamicStyles } from "@/style/all";
import { RenderTemplateResult, subscribeRenderTemplate } from "@/template/ha-websocket.js";
import { ActionConfigSet, GridObject, HomeSources, NewDur, TemplatesObj } from "@/type";
import { computeFieldIcon, computeFieldName } from "@/utils/compute-field-attributes";
import { computeFlowRate } from "@/utils/compute-flow-rate";
import { computePowerDistributionAfterSolarAndBattery } from "@/utils/compute-power-distribution";
import {
  checkHasBottomIndividual,
  checkHasRightIndividual,
  getBottomLeftIndividual,
  getBottomRightIndividual,
  getTopLeftIndividual,
  getTopRightIndividual,
} from "@/utils/compute-individual-position";
import { displayValue } from "@/utils/display-value";
import { defaultValues, getDefaultConfig } from "@/utils/get-default-config";
import { registerCustomCard } from "@/utils/register-custom-card";
import { coerceNumber } from "@/utils/utils";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";
import { sortIndividualObjects } from "@/utils/sort-individual-objects";

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
  private readonly wideEnoughForFourIndividuals = 359;
  private _resizeObserver?: ResizeObserver;
  private _handleVisibilityChange = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      this.requestUpdate();
    }
  };

  @query("#battery-grid-flow") batteryGridFlow?: SVGSVGElement;
  @query("#battery-home-flow") batteryToHomeFlow?: SVGSVGElement;
  @query("#grid-home-flow") gridToHomeFlow?: SVGSVGElement;
  @query("#solar-battery-flow") solarToBatteryFlow?: SVGSVGElement;
  @query("#solar-grid-flow") solarToGridFlow?: SVGSVGElement;
  @query("#solar-home-flow") solarToHomeFlow?: SVGSVGElement;
  private _renderData?:
    | {
        entities: PowerFlowCardPlusConfig["entities"];
        grid: GridObject;
        solar: any;
        battery: any;
        home: any;
        nonFossil: any;
        individualObjs: IndividualObject[];
        newDur: NewDur;
        templatesObj: TemplatesObj;
        homeBatteryCircumference: number;
        homeSolarCircumference: number;
        homeNonFossilCircumference: number;
        homeGridCircumference: number;
        homeUsageToDisplay: string;
        sortedIndividualObjects: IndividualObject[];
        individualFieldLeftTop?: IndividualObject;
        individualFieldLeftBottom?: IndividualObject;
        individualFieldRightTop?: IndividualObject;
        individualFieldRightBottom?: IndividualObject;
      }
    | undefined;

  setConfig(config: PowerFlowCardPlusConfig): void {
    if ((config.entities as any).individual1 || (config.entities as any).individual2) {
      throw new Error("You are using an outdated configuration. Please update your configuration to the latest version.");
    }
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
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this._handleVisibilityChange);
    }
    this._tryConnectAll();
  }

  public disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this._handleVisibilityChange);
    }
    this._tryDisconnectAll();
    super.disconnectedCallback();
  }

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
  private _pendingTapTimeouts = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  private _holdTimeouts = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  private _holdTriggered = new WeakMap<HTMLElement, boolean>();
  private readonly _doubleTapDelay = 250;
  private readonly _holdDelay = 500;

  private _normalizeActionConfig(config?: ActionConfig | ActionConfigSet): ActionConfigSet | undefined {
    if (!config) return undefined;
    if ("tap_action" in config || "hold_action" in config || "double_tap_action" in config) {
      return config as ActionConfigSet;
    }
    return {
      tap_action: {
        action: "more-info",
      } as ActionConfig,
    };
  }

  public openDetails(
    event: { stopPropagation: () => void; key?: string; target: HTMLElement },
    config?: ActionConfig | ActionConfigSet,
    entityId?: string | undefined,
    action: "tap" | "hold" | "double_tap" = "tap"
  ): void {
    event.stopPropagation();
    const normalizedConfig = this._normalizeActionConfig(config);
    const hasAnyAction = !!(normalizedConfig?.tap_action || normalizedConfig?.hold_action || normalizedConfig?.double_tap_action);

    if (!hasAnyAction) {
      if (!entityId || !this._config.clickable_entities) return;
      if (!doesEntityExist(this.hass, entityId)) return;
      const e = new CustomEvent("hass-more-info", {
        composed: true,
        detail: { entityId },
      });
      this.dispatchEvent(e);
      return;
    }

    handleAction(
      event.target,
      this.hass!,
      {
        entity: entityId,
        tap_action: normalizedConfig?.tap_action,
        hold_action: normalizedConfig?.hold_action,
        double_tap_action: normalizedConfig?.double_tap_action,
      },
      action
    );
  }

  public onEntityClick(event: MouseEvent, config?: ActionConfig | ActionConfigSet, entityId?: string): void {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement | null;
    const normalizedConfig = this._normalizeActionConfig(config);
    if (!target) return;
    if (this._holdTriggered.get(target)) {
      this._holdTriggered.set(target, false);
      return;
    }
    if (normalizedConfig?.double_tap_action) {
      const existing = this._pendingTapTimeouts.get(target);
      if (existing) clearTimeout(existing);
      const timeout = setTimeout(() => {
        this.openDetails({ stopPropagation: () => event.stopPropagation(), target }, normalizedConfig, entityId, "tap");
        this._pendingTapTimeouts.delete(target);
      }, this._doubleTapDelay);
      this._pendingTapTimeouts.set(target, timeout);
      return;
    }
    this.openDetails({ stopPropagation: () => event.stopPropagation(), target }, normalizedConfig, entityId, "tap");
  }

  public onEntityDoubleClick(event: MouseEvent, config?: ActionConfig | ActionConfigSet, entityId?: string): void {
    const target = event.currentTarget as HTMLElement | null;
    const normalizedConfig = this._normalizeActionConfig(config);
    if (!target) return;
    const existing = this._pendingTapTimeouts.get(target);
    if (existing) {
      clearTimeout(existing);
      this._pendingTapTimeouts.delete(target);
    }
    if (!normalizedConfig?.double_tap_action) return;
    this.openDetails({ stopPropagation: () => event.stopPropagation(), target }, normalizedConfig, entityId, "double_tap");
  }

  public onEntityPointerDown(event: PointerEvent, config?: ActionConfig | ActionConfigSet, entityId?: string): void {
    const target = event.currentTarget as HTMLElement | null;
    const normalizedConfig = this._normalizeActionConfig(config);
    if (!target || !normalizedConfig?.hold_action) return;
    const existing = this._holdTimeouts.get(target);
    if (existing) clearTimeout(existing);
    this._holdTriggered.set(target, false);
    const timeout = setTimeout(() => {
      this._holdTriggered.set(target, true);
      this.openDetails({ stopPropagation: () => event.stopPropagation(), target }, normalizedConfig, entityId, "hold");
      this._holdTimeouts.delete(target);
    }, this._holdDelay);
    this._holdTimeouts.set(target, timeout);
  }

  public onEntityPointerUp(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const holdTimeout = this._holdTimeouts.get(target);
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      this._holdTimeouts.delete(target);
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) {
      return nothing;
    }
    const data = this._renderData ?? this._computeRenderData();
    const {
      entities,
      grid,
      solar,
      battery,
      home,
      nonFossil,
      individualObjs,
      newDur,
      templatesObj,
      homeBatteryCircumference,
      homeGridCircumference,
      homeNonFossilCircumference,
      homeSolarCircumference,
      homeUsageToDisplay,
      individualFieldLeftTop,
      individualFieldLeftBottom,
      individualFieldRightTop,
      individualFieldRightBottom,
    } = data;
    const getIndividualDisplayState = (field?: IndividualObject) => {
      if (!field) return "";
      if (field?.state === undefined) return "";
      return displayValue(this.hass, this._config, field?.state, {
        decimals: field?.decimals,
        unit: field?.unit,
        unitWhiteSpace: field?.unit_white_space,
        watt_threshold: this._config.watt_threshold,
      });
    };

    return html`
      <ha-card
        .header=${this._config.title}
        class=${this._config.full_size ? "full-size" : ""}
        style=${this._config.style_ha_card ? this._config.style_ha_card : ""}
      >
        <div
          class="card-content ${this._config.full_size ? "full-size" : ""} ${this._config.no_labels ? "no-labels" : ""}"
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
                  ? solarElement(this, this._config, {
                      entities,
                      solar,
                      templatesObj,
                    })
                  : individualObjs?.some((individual) => individual?.has)
                    ? html`<div class="spacer"></div>`
                    : nothing}
                ${individualFieldLeftTop
                  ? individualLeftTopElement(this, this._config, {
                      individualObj: individualFieldLeftTop,
                      displayState: getIndividualDisplayState(individualFieldLeftTop),
                      newDur,
                      templatesObj,
                    })
                  : html`<div class="spacer"></div>`}
                ${checkHasRightIndividual(individualObjs)
                  ? individualRightTopElement(this, this._config, {
                      displayState: getIndividualDisplayState(individualFieldRightTop),
                      individualObj: individualFieldRightTop,
                      newDur,
                      templatesObj,
                      battery,
                      individualObjs,
                    })
                  : nothing}
              </div>`
            : nothing}
          <div class="row">
            ${grid.has
              ? gridElement(this, this._config, {
                  entities,
                  grid,
                  templatesObj,
                })
              : html`<div class="spacer"></div>`}
            <div class="spacer"></div>
            ${!entities.home?.hide
              ? homeElement(this, this._config, {
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
                })
              : html`<div class="spacer"></div>`}
            ${checkHasRightIndividual(individualObjs) ? html` <div class="spacer"></div>` : nothing}
          </div>
          ${battery.has || checkHasBottomIndividual(individualObjs)
            ? html`<div class="row">
                <div class="spacer"></div>
                ${battery.has ? batteryElement(this, this._config, { battery, entities }) : html`<div class="spacer"></div>`}
                ${individualFieldLeftBottom
                  ? individualLeftBottomElement(this, this._config, {
                      displayState: getIndividualDisplayState(individualFieldLeftBottom),
                      individualObj: individualFieldLeftBottom,
                      newDur,
                      templatesObj,
                    })
                  : html`<div class="spacer"></div>`}
                ${checkHasRightIndividual(individualObjs)
                  ? individualRightBottomElement(this, this._config, {
                      displayState: getIndividualDisplayState(individualFieldRightBottom),
                      individualObj: individualFieldRightBottom,
                      newDur,
                      templatesObj,
                    })
                  : nothing}
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

    const elem = this.shadowRoot?.querySelector("#power-flow-card-plus") as HTMLElement | null;
    if (elem) {
      if (!this._resizeObserver) {
        this._resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;
          const width = Math.round(entry.contentRect.width);
          if (width !== this._width) {
            this._width = width;
          }
        });
      }
      this._resizeObserver.observe(elem);
      const width = Math.round(elem.getBoundingClientRect().width);
      if (width !== this._width) {
        this._width = width;
      }
    }

    this._tryConnectAll();
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (!this._config || !this.hass) {
      return;
    }
    if (
      changedProps.has("hass") ||
      changedProps.has("_config") ||
      changedProps.has("_templateResults") ||
      changedProps.has("_width") ||
      this._renderData === undefined
    ) {
      this.style.setProperty("--clickable-cursor", this._config.clickable_entities ? "pointer" : "default");
      this._renderData = this._computeRenderData();
    }
  }

  private _computeRenderData() {
    const { entities } = this._config;
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
        icon_type: entities.grid?.color_icon as "color_dynamically" | "no_color" | "production" | "consumption" | undefined,
        circle_type: entities.grid?.color_circle,
      },
      tap_action: entities.grid?.tap_action,
      hold_action: entities.grid?.hold_action,
      double_tap_action: entities.grid?.double_tap_action,
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
        tap_action: entities.grid?.secondary_info?.tap_action,
        hold_action: entities.grid?.secondary_info?.hold_action,
        double_tap_action: entities.grid?.secondary_info?.double_tap_action,
      },
    };
    const hasSolarEntity = entities.solar?.entity !== undefined;
    const isProducingSolar = (getSolarState(this.hass, this._config) ?? 0) > 0;
    const displayZero = entities.solar?.display_zero !== false || isProducingSolar;
    const solar = {
      entity: entities.solar?.entity as string | undefined,
      has: hasSolarEntity && displayZero,
      state: {
        total: getSolarState(this.hass, this._config),
        toHome: initialNumericState,
        toGrid: initialNumericState,
        toBattery: initialNumericState,
      },
      icon: computeFieldIcon(this.hass, entities.solar, "mdi:solar-power"),
      name: computeFieldName(this.hass, entities.solar, this.hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.solar")),
      tap_action: entities.solar?.tap_action,
      hold_action: entities.solar?.hold_action,
      double_tap_action: entities.solar?.double_tap_action,
      secondary: {
        entity: entities.solar?.secondary_info?.entity,
        decimals: entities.solar?.secondary_info?.decimals,
        template: entities.solar?.secondary_info?.template,
        has: entities.solar?.secondary_info?.entity !== undefined,
        accept_negative: entities.solar?.secondary_info?.accept_negative || false,
        state: getSolarSecondaryState(this.hass, this._config),
        icon: entities.solar?.secondary_info?.icon,
        unit: entities.solar?.secondary_info?.unit_of_measurement,
        unit_white_space: entities.solar?.secondary_info?.unit_white_space,
        tap_action: entities.solar?.secondary_info?.tap_action,
        hold_action: entities.solar?.secondary_info?.hold_action,
        double_tap_action: entities.solar?.secondary_info?.double_tap_action,
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
        unit: entities?.battery?.state_of_charge_unit ?? "%",
        unit_white_space: entities?.battery?.state_of_charge_unit_white_space ?? true,
        decimals: entities?.battery?.state_of_charge_decimals || 0,
      },
      state: {
        toBattery: getBatteryInState(this.hass, this._config),
        fromBattery: getBatteryOutState(this.hass, this._config),
        toGrid: 0,
        toHome: 0,
      },
      tap_action: entities.battery?.tap_action,
      hold_action: entities.battery?.hold_action,
      double_tap_action: entities.battery?.double_tap_action,
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
      tap_action: entities.home?.tap_action,
      hold_action: entities.home?.hold_action,
      double_tap_action: entities.home?.double_tap_action,
      secondary: {
        entity: entities.home?.secondary_info?.entity,
        template: entities.home?.secondary_info?.template,
        has: entities.home?.secondary_info?.entity !== undefined,
        state: getHomeSecondaryState(this.hass, this._config),
        accept_negative: entities.home?.secondary_info?.accept_negative || false,
        unit: entities.home?.secondary_info?.unit_of_measurement,
        unit_white_space: entities.home?.secondary_info?.unit_white_space,
        icon: entities.home?.secondary_info?.icon,
        decimals: entities.home?.secondary_info?.decimals,
        tap_action: entities.home?.secondary_info?.tap_action,
        hold_action: entities.home?.secondary_info?.hold_action,
        double_tap_action: entities.home?.secondary_info?.double_tap_action,
      },
    };
    const individualObjs: IndividualObject[] = entities.individual?.map((individual) => getIndividualObject(this.hass, individual)) || [];
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
      tap_action: entities.fossil_fuel_percentage?.tap_action,
      hold_action: entities.fossil_fuel_percentage?.hold_action,
      double_tap_action: entities.fossil_fuel_percentage?.double_tap_action,
      secondary: {
        entity: entities.fossil_fuel_percentage?.secondary_info?.entity,
        decimals: entities.fossil_fuel_percentage?.secondary_info?.decimals,
        template: entities.fossil_fuel_percentage?.secondary_info?.template,
        has: entities.fossil_fuel_percentage?.secondary_info?.entity !== undefined,
        state: getNonFossilSecondaryState(this.hass, this._config),
        accept_negative: entities.fossil_fuel_percentage?.secondary_info?.accept_negative || false,
        icon: entities.fossil_fuel_percentage?.secondary_info?.icon,
        unit: entities.fossil_fuel_percentage?.secondary_info?.unit_of_measurement,
        unit_white_space: entities.fossil_fuel_percentage?.secondary_info?.unit_white_space,
        color_value: entities.fossil_fuel_percentage?.secondary_info?.color_value,
        tap_action: entities.fossil_fuel_percentage?.secondary_info?.tap_action,
        hold_action: entities.fossil_fuel_percentage?.secondary_info?.hold_action,
        double_tap_action: entities.fossil_fuel_percentage?.secondary_info?.double_tap_action,
      },
    };
    grid.state.fromGrid = adjustZeroTolerance(grid.state.fromGrid, entities.grid?.display_zero_tolerance);
    grid.state.toGrid = adjustZeroTolerance(grid.state.toGrid, entities.grid?.display_zero_tolerance);
    solar.state.total = adjustZeroTolerance(solar.state.total, entities.solar?.display_zero_tolerance);
    battery.state.fromBattery = adjustZeroTolerance(battery.state.fromBattery, entities.battery?.display_zero_tolerance);
    battery.state.toBattery = adjustZeroTolerance(battery.state.toBattery, entities.battery?.display_zero_tolerance);
    if (grid.state.fromGrid === 0) {
      grid.state.toHome = 0;
      grid.state.toBattery = 0;
    }
    if (solar.state.total === 0) {
      solar.state.toGrid = 0;
      solar.state.toBattery = 0;
      solar.state.toHome = 0;
    }
    if (battery.state.fromBattery === 0) {
      battery.state.toGrid = 0;
      battery.state.toHome = 0;
    }
    computePowerDistributionAfterSolarAndBattery({
      entities: {
        grid: entities.grid,
        battery: entities.battery,
        solar: entities.solar,
        fossil_fuel_percentage: entities.fossil_fuel_percentage,
      },
      grid,
      solar,
      battery,
      nonFossil,
      getEntityStateWatts: (entityId) => getEntityStateWatts(this.hass, entityId),
      getEntityState: (entityId) => getEntityState(this.hass, entityId),
    });
    const totalIndividualConsumption = individualObjs?.reduce((a, b) => a + (b.has ? b.state || 0 : 0), 0) || 0;
    const totalHomeConsumption = Math.max((grid.state.toHome ?? 0) + (solar.state.toHome ?? 0) + (battery.state.toHome ?? 0), 0);
    const homeBatteryCircumference = battery.state.toHome ? circleCircumference * (battery.state.toHome / totalHomeConsumption) : 0;
    const homeSolarCircumference = solar.state.toHome ? circleCircumference * (solar.state.toHome / totalHomeConsumption) : 0;
    const homeNonFossilCircumference = nonFossil.state.power ? circleCircumference * (nonFossil.state.power / totalHomeConsumption) : 0;
    const homeGridCircumference =
      circleCircumference *
      ((totalHomeConsumption - (nonFossil.state.power ?? 0) - (battery.state.toHome ?? 0) - (solar.state.toHome ?? 0)) / totalHomeConsumption);
    const homeUsageToDisplay =
      entities.home?.override_state && entities.home.entity
        ? entities.home?.subtract_individual
          ? displayValue(this.hass, this._config, getEntityStateWatts(this.hass, entities.home.entity) - totalIndividualConsumption, {
              unit: entities.home?.unit_of_measurement,
              unitWhiteSpace: entities.home?.unit_white_space,
              watt_threshold: this._config.watt_threshold,
            })
          : displayValue(this.hass, this._config, getEntityStateWatts(this.hass, entities.home.entity), {
              unit: entities.home?.unit_of_measurement,
              unitWhiteSpace: entities.home?.unit_white_space,
              watt_threshold: this._config.watt_threshold,
            })
        : entities.home?.subtract_individual
          ? displayValue(this.hass, this._config, totalHomeConsumption - totalIndividualConsumption || 0, {
              unit: entities.home?.unit_of_measurement,
              unitWhiteSpace: entities.home?.unit_white_space,
              watt_threshold: this._config.watt_threshold,
            })
          : displayValue(this.hass, this._config, totalHomeConsumption, {
              unit: entities.home?.unit_of_measurement,
              unitWhiteSpace: entities.home?.unit_white_space,
              watt_threshold: this._config.watt_threshold,
            });
    const totalLines =
      (grid.state.toHome ?? 0) +
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
    const batteryUseMetadataIcon = entities.battery?.use_metadata;
    if (batteryUseMetadataIcon) {
      const metadataIcon = computeFieldIcon(this.hass, entities.battery, "NO_ICON_METADATA");
      if (metadataIcon !== "NO_ICON_METADATA") {
        battery.icon = metadataIcon;
      }
    }
    const newDur: NewDur = {
      batteryGrid: computeFlowRate(this._config, Math.max(grid.state.toBattery ?? 0, battery.state.toGrid ?? 0, 0), totalLines),
      batteryToHome: computeFlowRate(this._config, battery.state.toHome ?? 0, totalLines),
      gridToHome: computeFlowRate(this._config, grid.state.toHome ?? 0, totalLines),
      solarToBattery: computeFlowRate(this._config, solar.state.toBattery ?? 0, totalLines),
      solarToGrid: computeFlowRate(this._config, solar.state.toGrid ?? 0, totalLines),
      solarToHome: computeFlowRate(this._config, solar.state.toHome ?? 0, totalLines),
      individual: individualObjs?.map((individual) => computeFlowRate(this._config, individual.state ?? 0, totalIndividualConsumption)) || [],
      nonFossil: computeFlowRate(this._config, nonFossil.state.power ?? 0, totalLines),
    };
    if (checkShouldShowDots(this._config)) {
      ["batteryGrid", "batteryToHome", "gridToHome", "solarToBattery", "solarToGrid", "solarToHome"].forEach((flowName) => {
        const flowSVGElement = this[`${flowName}Flow`] as SVGSVGElement;
        if (flowSVGElement && this.previousDur[flowName] && this.previousDur[flowName] !== newDur[flowName]) {
          flowSVGElement.pauseAnimations();
          flowSVGElement.setCurrentTime(flowSVGElement.getCurrentTime() * (newDur[flowName] / this.previousDur[flowName]));
          flowSVGElement.unpauseAnimations();
        }
        this.previousDur[flowName] = newDur[flowName];
      });
    } else {
      this.previousDur = {};
    }
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
    const homeLargestSource = Object.keys(homeSources).reduce((a, b) => (homeSources[a].value > homeSources[b].value ? a : b));
    const individualKeys = ["left-top", "left-bottom", "right-top", "right-bottom"];
    const templatesObj: TemplatesObj = {
      gridSecondary: this._templateResults.gridSecondary?.result,
      solarSecondary: this._templateResults.solarSecondary?.result,
      homeSecondary: this._templateResults.homeSecondary?.result,
      nonFossilFuelSecondary: this._templateResults.nonFossilFuelSecondary?.result,
      individual: individualObjs?.map((_, index) => this._templateResults[`${individualKeys[index]}Secondary`]?.result) || [],
    };

    const isCardWideEnough = this._width > 420;
    const sortedIndividualObjects = this._config.sort_individual_devices ? sortIndividualObjects(individualObjs) : individualObjs;
    const maxVisibleIndividuals = this._config.allow_layout_break ? 4 : this._width >= this.wideEnoughForFourIndividuals ? 4 : 2;

    const filteredNotShownIndividualObjects = sortedIndividualObjects.filter((individual) => individual.has);
    const visibleIndividualObjects = filteredNotShownIndividualObjects.slice(0, maxVisibleIndividuals);

    const individualFieldLeftTop = getTopLeftIndividual(visibleIndividualObjects);
    const individualFieldLeftBottom = getBottomLeftIndividual(visibleIndividualObjects);
    const individualFieldRightTop = getTopRightIndividual(visibleIndividualObjects);
    const individualFieldRightBottom = getBottomRightIndividual(visibleIndividualObjects);

    allDynamicStyles(this, {
      grid,
      solar,
      battery,
      display_zero_lines_grey_color: this._config.display_zero_lines?.mode === "grey_out" ? this._config.display_zero_lines?.grey_color : "",
      display_zero_lines_transparency: this._config.display_zero_lines?.mode === "transparency" ? this._config.display_zero_lines?.transparency : "",
      entities,
      homeLargestSource,
      homeSources,
      individual: sortedIndividualObjects,
      nonFossil,
      isCardWideEnough,
    });
    return {
      entities,
      grid,
      solar,
      battery,
      home,
      nonFossil,
      individualObjs: visibleIndividualObjects,
      newDur,
      templatesObj,
      homeBatteryCircumference,
      homeSolarCircumference,
      homeNonFossilCircumference,
      homeGridCircumference,
      homeUsageToDisplay,
      sortedIndividualObjects: visibleIndividualObjects,
      individualFieldLeftTop,
      individualFieldLeftBottom,
      individualFieldRightTop,
      individualFieldRightBottom,
    };
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
    } catch {
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

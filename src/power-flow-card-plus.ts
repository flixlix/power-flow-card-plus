/* eslint-disable no-nested-ternary */
import {
  mdiArrowDown,
  mdiArrowLeft,
  mdiArrowRight,
  mdiArrowUp,
  mdiBattery,
  mdiBatteryHigh,
  mdiBatteryLow,
  mdiBatteryMedium,
  mdiBatteryOutline,
  mdiHome,
  mdiSolarPower,
  mdiTransmissionTower,
} from "@mdi/js";
import { formatNumber, HomeAssistant } from "custom-card-helpers";
import { css, html, LitElement, svg, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardConfig } from "./power-flow-card-plus-config.js";
import {
  coerceNumber,
  coerceStringArray,
  round,
  isNumberValue,
} from "./utils.js";
import { EntityType } from "./type.js";
import { logError } from "./logging.js";

const CIRCLE_CIRCUMFERENCE = 238.76104;
const KW_DECIMALS = 1;
const MAX_FLOW_RATE = 6;
const MIN_FLOW_RATE = 0.75;
const W_DECIMALS = 1;

@customElement("power-flow-card-plus")
export class PowerFlowCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config = {} as PowerFlowCardConfig;

  @query("#battery-grid-flow") batteryGridFlow?: SVGSVGElement;
  @query("#battery-home-flow") batteryToHomeFlow?: SVGSVGElement;
  @query("#grid-home-flow") gridToHomeFlow?: SVGSVGElement;
  @query("#solar-battery-flow") solarToBatteryFlow?: SVGSVGElement;
  @query("#solar-grid-flow") solarToGridFlow?: SVGSVGElement;
  @query("#solar-home-flow") solarToHomeFlow?: SVGSVGElement;

  setConfig(config: PowerFlowCardConfig): void {
    if (
      !config.entities ||
      (!config.entities.battery &&
        !config.entities.grid &&
        !config.entities.solar)
    ) {
      throw new Error(
        "At least one entity for battery, grid or solar must be defined"
      );
    }
    this._config = {
      ...config,
      inverted_entities: coerceStringArray(config.inverted_entities, ","),
      kw_decimals: coerceNumber(config.kw_decimals, KW_DECIMALS),
      min_flow_rate: coerceNumber(config.min_flow_rate, MIN_FLOW_RATE),
      max_flow_rate: coerceNumber(config.max_flow_rate, MAX_FLOW_RATE),
      w_decimals: coerceNumber(config.w_decimals, W_DECIMALS),
      watt_threshold: coerceNumber(config.watt_threshold),
    };
  }

  public getCardSize(): Promise<number> | number {
    return 3;
  }
  private unavailableOrMisconfiguredError = (entityId: string | undefined) =>
    logError(
      `entity "${entityId ?? "Unknown"}" is not available or misconfigured`
    );

  private entityExists = (entityId: string): boolean =>
    entityId in this.hass.states;

  private entityAvailable = (entityId: string): boolean =>
    isNumberValue(this.hass.states[entityId]?.state);

  private entityInverted = (entityType: EntityType) =>
    this._config!.inverted_entities.includes(entityType);

  private previousDur: { [name: string]: number } = {};

  private circleRate = (value: number, total: number): number => {
    const min = this._config?.min_flow_rate!;
    const max = this._config?.max_flow_rate!;
    return max - (value / total) * (max - min);
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
    if (stateObj.attributes.unit_of_measurement === "W") return value;
    return value * 1000;
  };

  private displayValue = (value: number | null) => {
    if (value === null) return "0";
    const isKW = value >= this._config!.watt_threshold;
    const v = formatNumber(
      isKW
        ? round(value / 1000, this._config!.kw_decimals)
        : round(value, this._config!.w_decimals),
      this.hass.locale
    );
    return `${v} ${isKW ? "kW" : "W"}`;
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

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { entities } = this._config;

    this.style.setProperty(
      "--clickable-cursor",
      this._config.clickable_entities ? "pointer" : "default"
    ); /* show pointer if clickable entities is enabled */

    const hasGrid = entities.grid !== undefined;

    const hasBattery = entities.battery !== undefined;

    const hasIndividual2 =
      (entities.individual2 !== undefined &&
        entities.individual2?.display_zero === true) ||
      (this.getEntityStateWatts(entities.individual2?.entity) > 0 &&
        this.entityAvailable(entities.individual2?.entity!));

    const hasIndividual1 =
      (entities.individual1 !== undefined &&
        entities.individual1?.display_zero === true) ||
      (this.getEntityStateWatts(entities.individual1?.entity) > 0 &&
        this.entityAvailable(entities.individual1?.entity!));
    const hasSolarProduction = entities.solar !== undefined;
    const hasReturnToGrid =
      hasGrid &&
      (typeof entities.grid === "string" || entities.grid.production);

    let totalFromGrid = 0;
    if (hasGrid) {
      if (typeof entities.grid === "string") {
        if (this.entityInverted("grid"))
          totalFromGrid = Math.abs(
            Math.min(this.getEntityStateWatts(entities.grid), 0)
          );
        else
          totalFromGrid = Math.max(this.getEntityStateWatts(entities.grid), 0);
      } else {
        totalFromGrid = this.getEntityStateWatts(entities.grid.consumption);
      }
    }

    let individual2Usage: number | null = null;
    const individual2Name: string =
      this._config.entities.individual2?.name || "Motorcycle";
    const individual2Icon: undefined | string =
      this._config.entities.individual2?.icon || "mdi:motorbike-electric";
    const individual2Color: string =
      this._config.entities.individual2?.color! || "#964CB5";
    this.style.setProperty(
      "--individualtwo-color",
      individual2Color
    ); /* dynamically update color of entity depending on use input */
    if (hasIndividual2) {
      const individual2Entity =
        this.hass.states[this._config.entities.individual2?.entity!];
      const individual2State = Number(individual2Entity.state);
      if (this.entityInverted("individual2"))
        individual2Usage = Math.abs(Math.min(individual2State, 0));
      else individual2Usage = Math.max(individual2State, 0);
    }

    let individual1Usage: number | null = null;
    const individual1Name: string =
      this._config.entities.individual1?.name || "Car";
    const individual1Icon: undefined | string =
      this._config.entities.individual1?.icon || "mdi:car-electric";
    const individual1Color: string =
      this._config.entities.individual1?.color! || "#D0CC5B";
    this.style.setProperty(
      "--individualone-color",
      individual1Color
    ); /* dynamically update color of entity depending on use input */
    if (hasIndividual1) {
      const individual1Entity =
        this.hass.states[this._config.entities.individual1?.entity!];
      const individual1State = Number(individual1Entity.state);
      if (this.entityInverted("individual1"))
        individual1Usage = Math.abs(Math.min(individual1State, 0));
      else individual1Usage = Math.max(individual1State, 0);
    }

    let totalSolarProduction: number = 0;
    if (hasSolarProduction) {
      if (this.entityInverted("solar"))
        totalSolarProduction = Math.abs(
          Math.min(this.getEntityStateWatts(entities.solar), 0)
        );
      else
        totalSolarProduction = Math.max(
          this.getEntityStateWatts(entities.solar),
          0
        );
    }

    let totalBatteryIn: number | null = null;
    let totalBatteryOut: number | null = null;
    if (hasBattery) {
      if (typeof entities.battery === "string") {
        totalBatteryIn = this.entityInverted("battery")
          ? Math.max(this.getEntityStateWatts(entities.battery), 0)
          : Math.abs(Math.min(this.getEntityStateWatts(entities.battery), 0));
        totalBatteryOut = this.entityInverted("battery")
          ? Math.abs(Math.min(this.getEntityStateWatts(entities.battery), 0))
          : Math.max(this.getEntityStateWatts(entities.battery), 0);
      } else {
        totalBatteryIn = this.getEntityStateWatts(entities.battery?.production);
        totalBatteryOut = this.getEntityStateWatts(
          entities.battery?.consumption
        );
      }
    }

    let returnedToGrid: number | null = null;
    if (hasReturnToGrid) {
      if (typeof entities.grid === "string") {
        returnedToGrid = this.entityInverted("grid")
          ? Math.max(this.getEntityStateWatts(entities.grid), 0)
          : Math.abs(Math.min(this.getEntityStateWatts(entities.grid), 0));
      } else {
        returnedToGrid = this.getEntityStateWatts(entities.grid.production);
      }
    }

    let solarConsumption: number | null = null;
    if (hasSolarProduction) {
      solarConsumption =
        totalSolarProduction - (returnedToGrid ?? 0) - (totalBatteryIn ?? 0);
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
        batteryToGrid = Math.max(
          0,
          (returnedToGrid || 0) -
            (totalSolarProduction || 0) -
            (totalBatteryIn || 0) -
            (batteryFromGrid || 0)
        );
      }
      solarToBattery = totalBatteryIn! - (batteryFromGrid || 0);
    } else if (!hasSolarProduction && hasBattery) {
      batteryToGrid = returnedToGrid;
    }

    let solarToGrid = 0;
    if (hasSolarProduction && returnedToGrid)
      solarToGrid = returnedToGrid - (batteryToGrid ?? 0);

    let batteryConsumption: number | null = null;
    if (hasBattery) {
      batteryConsumption = (totalBatteryOut ?? 0) - (batteryToGrid ?? 0);
    }

    const gridConsumption = Math.max(totalFromGrid - (batteryFromGrid ?? 0), 0);

    const totalHomeConsumption = Math.max(
      gridConsumption + (solarConsumption ?? 0) + (batteryConsumption ?? 0),
      0
    );

    let homeBatteryCircumference: number | undefined;
    if (batteryConsumption)
      homeBatteryCircumference =
        CIRCLE_CIRCUMFERENCE * (batteryConsumption / totalHomeConsumption);

    let homeSolarCircumference: number | undefined;
    if (hasSolarProduction) {
      homeSolarCircumference =
        CIRCLE_CIRCUMFERENCE * (solarConsumption! / totalHomeConsumption);
    }

    const homeGridCircumference =
      CIRCLE_CIRCUMFERENCE *
      ((totalHomeConsumption -
        (batteryConsumption ?? 0) -
        (solarConsumption ?? 0)) /
        totalHomeConsumption);

    const totalLines =
      gridConsumption +
      (solarConsumption ?? 0) +
      solarToGrid +
      (solarToBattery ?? 0) +
      (batteryConsumption ?? 0) +
      (batteryFromGrid ?? 0) +
      (batteryToGrid ?? 0);

    const batteryChargeState = entities.battery_charge?.length
      ? this.getEntityState(entities.battery_charge)
      : null;

    let batteryIcon = mdiBatteryHigh;
    if (batteryChargeState === null) {
      batteryIcon = mdiBattery;
    } else if (batteryChargeState <= 72 && batteryChargeState > 44) {
      batteryIcon = mdiBatteryMedium;
    } else if (batteryChargeState <= 44 && batteryChargeState > 16) {
      batteryIcon = mdiBatteryLow;
    } else if (batteryChargeState <= 16) {
      batteryIcon = mdiBatteryOutline;
    }

    const newDur = {
      batteryGrid: this.circleRate(
        batteryFromGrid ?? batteryToGrid ?? 0,
        totalLines
      ),
      batteryToHome: this.circleRate(batteryConsumption ?? 0, totalLines),
      gridToHome: this.circleRate(gridConsumption, totalLines),
      solarToBattery: this.circleRate(solarToBattery ?? 0, totalLines),
      solarToGrid: this.circleRate(solarToGrid, totalLines),
      solarToHome: this.circleRate(solarConsumption ?? 0, totalLines),
    };

    // Smooth duration changes
    [
      "batteryGrid",
      "batteryToHome",
      "gridToHome",
      "solarToBattery",
      "solarToGrid",
      "solarToHome",
    ].forEach((flowName) => {
      const flowSVGElement = this[`${flowName}Flow`] as SVGSVGElement;
      if (
        flowSVGElement &&
        this.previousDur[flowName] &&
        this.previousDur[flowName] !== newDur[flowName]
      ) {
        flowSVGElement.pauseAnimations();
        flowSVGElement.setCurrentTime(
          flowSVGElement.getCurrentTime() *
            (newDur[flowName] / this.previousDur[flowName])
        );
        flowSVGElement.unpauseAnimations();
      }
      this.previousDur[flowName] = newDur[flowName];
    });

    return html`
      <ha-card .header=${this._config.title}>
        <div class="card-content">
          ${hasSolarProduction || hasIndividual2 || hasIndividual1
            ? html`<div class="row">
                <div class="spacer"></div>
                ${hasSolarProduction
                  ? html`<div class="circle-container solar">
                      <span class="label"
                        >${this.hass.localize(
                          "ui.panel.lovelace.cards.energy.energy_distribution.solar"
                        )}</span
                      >
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          this.openDetails(entities.solar![0]);
                        }}
                        @keyDown=${(e: {
                          key: string;
                          stopPropagation: () => void;
                        }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.solar![0]);
                          }
                        }}
                      >
                        <ha-svg-icon .path=${mdiSolarPower}></ha-svg-icon>
                        <span class="solar">
                          ${this.displayValue(totalSolarProduction)}</span
                        >
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
                        @keyDown=${(e: {
                          key: string;
                          stopPropagation: () => void;
                        }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.individual2?.entity);
                          }
                        }}
                      >
                        <ha-icon
                          id="individual2-icon"
                          .icon=${individual2Icon}
                        ></ha-icon>
                        ${this.displayValue(individual2Usage)}
                      </div>
                      <svg width="80" height="30">
                        <path d="M40 -10 v50" id="individual2" />
                        ${individual2Usage
                          ? svg`<circle
                              r="1"
                              class="individual2"
                              vector-effect="non-scaling-stroke"
                            >
                              <animateMotion
                                dur="1.66s"
                                repeatCount="indefinite"
                                calcMode="linear"
                                keyPoints="1;0" 
                                keyTimes="0;1"
                              >
                                <mpath xlink:href="#individual2" />
                              </animateMotion>
                            </circle>`
                          : ""}
                      </svg>
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
                        @keyDown=${(e: {
                          key: string;
                          stopPropagation: () => void;
                        }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.individual1?.entity);
                          }
                        }}
                      >
                        <ha-icon
                          id="individual1-icon"
                          .icon=${individual1Icon}
                        ></ha-icon>
                        ${this.displayValue(individual1Usage)}
                      </div>
                      <svg width="80" height="30">
                        <path d="M40 -10 v40" id="individual1" />
                        ${individual1Usage
                          ? svg`<circle
                                r="1"
                                class="individual1"
                                vector-effect="non-scaling-stroke"
                              >
                                <animateMotion
                                  dur="1.66s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints="1;0" 
                                  keyTimes="0;1"
                                >
                                  <mpath xlink:href="#individual1" />
                                </animateMotion>
                              </circle>`
                          : ""}
                      </svg>
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
                      const target =
                        typeof entities.grid === "string"
                          ? entities.grid
                          : entities.grid?.consumption![0] ||
                            entities.grid?.production![0];
                      e.stopPropagation();
                      this.openDetails(target);
                    }}
                    @keyDown=${(e: {
                      key: string;
                      stopPropagation: () => void;
                    }) => {
                      if (e.key === "Enter") {
                        const target =
                          typeof entities.grid === "string"
                            ? entities.grid
                            : entities.grid?.consumption![0] ||
                              entities.grid?.production![0];
                        e.stopPropagation();
                        this.openDetails(target);
                      }
                    }}
                  >
                    <ha-svg-icon .path=${mdiTransmissionTower}></ha-svg-icon>
                    ${returnedToGrid !== null
                      ? html`<span
                          class="return"
                          @click=${(e: { stopPropagation: () => void }) => {
                            const target =
                              typeof entities.grid === "string"
                                ? entities.grid
                                : entities.grid?.production![0];
                            e.stopPropagation();
                            this.openDetails(target);
                          }}
                          @keyDown=${(e: {
                            key: string;
                            stopPropagation: () => void;
                          }) => {
                            if (e.key === "Enter") {
                              const target =
                                typeof entities.grid === "string"
                                  ? entities.grid
                                  : entities.grid?.production![0];
                              e.stopPropagation();
                              this.openDetails(target);
                            }
                          }}
                        >
                          <ha-svg-icon
                            class="small"
                            .path=${mdiArrowLeft}
                          ></ha-svg-icon
                          >${this.displayValue(returnedToGrid)}
                        </span>`
                      : null}
                    <span class="consumption">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowRight}
                      ></ha-svg-icon
                      >${this.displayValue(totalFromGrid)}
                    </span>
                  </div>
                  <span class="label"
                    >${this.hass.localize(
                      "ui.panel.lovelace.cards.energy.energy_distribution.grid"
                    )}</span
                  >
                </div>`
              : html`<div class="spacer"></div>`}
            <div class="circle-container home">
              <div
                class="circle"
                id="home-circle"
                @click=${(e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  this.openDetails(entities.home![0]);
                }}
                @keyDown=${(e: {
                  key: string;
                  stopPropagation: () => void;
                }) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    this.openDetails(entities.home![0]);
                  }
                }}
              >
                <ha-svg-icon .path=${mdiHome}></ha-svg-icon>
                ${this.displayValue(totalHomeConsumption)}
                <svg>
                  ${homeSolarCircumference !== undefined
                    ? svg`<circle
                            class="solar"
                            cx="40"
                            cy="40"
                            r="38"
                            stroke-dasharray="${homeSolarCircumference} ${
                        CIRCLE_CIRCUMFERENCE - homeSolarCircumference
                      }"
                            shape-rendering="geometricPrecision"
                            stroke-dashoffset="-${
                              CIRCLE_CIRCUMFERENCE - homeSolarCircumference
                            }"
                          />`
                    : ""}
                  ${homeBatteryCircumference
                    ? svg`<circle
                            class="battery"
                            cx="40"
                            cy="40"
                            r="38"
                            stroke-dasharray="${homeBatteryCircumference} ${
                        CIRCLE_CIRCUMFERENCE - homeBatteryCircumference
                      }"
                            stroke-dashoffset="-${
                              CIRCLE_CIRCUMFERENCE -
                              homeBatteryCircumference -
                              (homeSolarCircumference || 0)
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
                    CIRCLE_CIRCUMFERENCE -
                      homeSolarCircumference! -
                      (homeBatteryCircumference ||
                        0)} ${homeGridCircumference !== undefined
                      ? CIRCLE_CIRCUMFERENCE - homeGridCircumference
                      : homeSolarCircumference! +
                        (homeBatteryCircumference || 0)}"
                    stroke-dashoffset="0"
                    shape-rendering="geometricPrecision"
                  />
                </svg>
              </div>
              ${hasIndividual2 && hasIndividual1
                ? ""
                : html` <span class="label"
                    >${this.hass.localize(
                      "ui.panel.lovelace.cards.energy.energy_distribution.home"
                    )}</span
                  >`}
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
                          const target = entities.battery_charge![0]
                            ? entities.battery_charge![0]
                            : typeof entities.battery === "string"
                            ? entities.battery
                            : entities.battery?.production![0];
                          e.stopPropagation();
                          this.openDetails(target);
                        }}
                        @keyDown=${(e: {
                          key: string;
                          stopPropagation: () => void;
                        }) => {
                          if (e.key === "Enter") {
                            const target = entities.battery_charge![0]
                              ? entities.battery_charge![0]
                              : typeof entities.battery === "string"
                              ? entities.battery
                              : entities.battery?.production![0];
                            e.stopPropagation();
                            this.openDetails(target);
                          }
                        }}
                      >
                        ${batteryChargeState !== null
                          ? html` <span
                              @click=${(e: { stopPropagation: () => void }) => {
                                e.stopPropagation();
                                this.openDetails(entities.battery_charge!);
                              }}
                              @keyDown=${(e: {
                                key: string;
                                stopPropagation: () => void;
                              }) => {
                                if (e.key === "Enter") {
                                  e.stopPropagation();
                                  this.openDetails(entities.battery_charge!);
                                }
                              }}
                            >
                              ${formatNumber(
                                batteryChargeState,
                                this.hass.locale,
                                {
                                  maximumFractionDigits: 0,
                                  minimumFractionDigits: 0,
                                }
                              )}%
                            </span>`
                          : null}
                        <ha-svg-icon
                          .path=${batteryIcon}
                          @click=${(e: { stopPropagation: () => void }) => {
                            e.stopPropagation();
                            this.openDetails(entities.battery_charge![0]);
                          }}
                          @keyDown=${(e: {
                            key: string;
                            stopPropagation: () => void;
                          }) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              this.openDetails(entities.battery_charge![0]);
                            }
                          }}
                        ></ha-svg-icon>
                        <span
                          class="battery-in"
                          @click=${(e: { stopPropagation: () => void }) => {
                            const target =
                              typeof entities.battery === "string"
                                ? entities.battery
                                : entities.battery?.production![0];
                            e.stopPropagation();
                            this.openDetails(target);
                          }}
                          @keyDown=${(e: {
                            key: string;
                            stopPropagation: () => void;
                          }) => {
                            if (e.key === "Enter") {
                              const target =
                                typeof entities.battery === "string"
                                  ? entities.battery
                                  : entities.battery?.production![0];
                              e.stopPropagation();
                              this.openDetails(target);
                            }
                          }}
                        >
                          <ha-svg-icon
                            class="small"
                            .path=${mdiArrowDown}
                          ></ha-svg-icon
                          >${this.displayValue(totalBatteryIn)}</span
                        >
                        <span
                          class="battery-out"
                          @click=${(e: { stopPropagation: () => void }) => {
                            const target =
                              typeof entities.battery === "string"
                                ? entities.battery
                                : entities.battery?.consumption![0];
                            e.stopPropagation();
                            this.openDetails(target);
                          }}
                          @keyDown=${(e: {
                            key: string;
                            stopPropagation: () => void;
                          }) => {
                            if (e.key === "Enter") {
                              const target =
                                typeof entities.battery === "string"
                                  ? entities.battery
                                  : entities.battery?.consumption![0];
                              e.stopPropagation();
                              this.openDetails(target);
                            }
                          }}
                        >
                          <ha-svg-icon
                            class="small"
                            .path=${mdiArrowUp}
                          ></ha-svg-icon
                          >${this.displayValue(totalBatteryOut)}</span
                        >
                      </div>
                      <span class="label"
                        >${this.hass.localize(
                          "ui.panel.lovelace.cards.energy.energy_distribution.battery"
                        )}</span
                      >
                    </div>`
                  : html`<div class="spacer"></div>`}
                ${hasIndividual2 && hasIndividual1
                  ? html`<div class="circle-container individual1 bottom">
                      <svg width="80" height="30">
                        <path d="M40 40 v-40" id="individual1" />
                        ${individual1Usage
                          ? svg`<circle
                                r="1"
                                class="individual1"
                                vector-effect="non-scaling-stroke"
                                onClick=${(e) => {
                                  e.stopPropagation();
                                  this.openDetails(
                                    entities.individual1?.entity
                                  );
                                }}                                
                              >
                                <animateMotion
                                  dur="1.66s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints="1;0" 
                                  keyTimes="0;1"
                                >
                                  <mpath xlink:href="#individual1" />
                                </animateMotion>
                              </circle>`
                          : ""}
                      </svg>
                      <div
                        class="circle"
                        @click=${(e: { stopPropagation: () => void }) => {
                          e.stopPropagation();
                          this.openDetails(entities.individual1?.entity);
                        }}
                        @keyDown=${(e: {
                          key: string;
                          stopPropagation: () => void;
                        }) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            this.openDetails(entities.individual1?.entity);
                          }
                        }}
                      >
                        <ha-icon
                          id="individual1-icon"
                          .icon=${individual1Icon}
                        ></ha-icon>
                        ${this.displayValue(individual1Usage)}
                      </div>
                      <span class="label">${individual1Name}</span>
                    </div>`
                  : html`<div class="spacer"></div>`}
              </div>`
            : html`<div class="spacer"></div>`}
          ${hasSolarProduction
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2":
                    !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="solar-home-flow"
                >
                  <path
                    id="solar"
                    class="solar"
                    d="M${hasBattery ? 55 : 53},0 v${hasGrid
                      ? 15
                      : 17} c0,${hasBattery
                      ? "30 10,30 30,30"
                      : "35 10,35 30,35"} h25"
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
          ${hasReturnToGrid && hasSolarProduction
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2":
                    !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="solar-grid-flow"
                >
                  <path
                    id="return"
                    class="return"
                    d="M${hasBattery ? 45 : 47},0 v15 c0,${hasBattery
                      ? "30 -10,30 -30,30"
                      : "35 -10,35 -30,35"} h-20"
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
          ${hasBattery && hasSolarProduction
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2":
                    !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="solar-battery-flow"
                >
                  <path
                    id="battery-solar"
                    class="battery-solar"
                    d="M50,0 V100"
                    vector-effect="non-scaling-stroke"
                  ></path>
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
          ${hasGrid
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2":
                    !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="grid-home-flow"
                >
                  <path
                    class="grid"
                    id="grid"
                    d="M0,${hasBattery
                      ? 50
                      : hasSolarProduction
                      ? 56
                      : 53} H100"
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
          ${hasBattery
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2":
                    !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="battery-home-flow"
                >
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
          ${hasGrid && hasBattery
            ? html`<div
                class="lines ${classMap({
                  high: hasBattery,
                  "individual1-individual2":
                    !hasBattery && hasIndividual2 && hasIndividual1,
                })}"
              >
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  id="battery-grid-flow"
                >
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
                    ${this.hass.localize(
                      "ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard"
                    )}
                  </mwc-button></a
                >
              </div>
            `
          : ""}
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      --mdc-icon-size: 24px;
    }
    :root {
      --individualone-color: #d0cc5b;
      --individualtwo-color: #964cb5;
      --clickable-cursor: pointer;
    }
    .card-content {
      position: relative;
    }
    .lines {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 146px;
      display: flex;
      justify-content: center;
      padding: 0 16px 16px;
      box-sizing: border-box;
    }
    .lines.individual1-individual2 {
      bottom: 110px;
    }
    .lines.high {
      bottom: 100px;
      height: 156px;
    }
    .lines svg {
      width: calc(100% - 160px);
      height: 100%;
      max-width: 340px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      max-width: 500px;
      margin: 0 auto;
    }
    .circle-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2;
    }
    .circle-container.solar {
      margin: 0 4px;
      height: 130px;
    }
    .circle-container.individual2 {
      margin-left: 4px;
      height: 130px;
    }
    .circle-container.individual1 {
      margin-left: 4px;
      height: 130px;
    }
    .circle-container.individual1.bottom {
      position: relative;
      top: -20px;
      margin-bottom: -20px;
    }
    .circle-container.battery {
      height: 110px;
      justify-content: flex-end;
    }
    .spacer {
      width: 84px;
    }
    .circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      box-sizing: border-box;
      border: 2px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 12px;
      line-height: 12px;
      position: relative;
      text-decoration: none;
      color: var(--primary-text-color);
    }
    .circle-container .circle {
      cursor: var(--clickable-cursor);
    }
    #battery-grid {
      stroke: var(--energy-grid-return-color);
    }
    ha-svg-icon {
      padding-bottom: 2px;
    }
    ha-svg-icon.small {
      --mdc-icon-size: 12px;
    }
    .label {
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    line,
    path {
      stroke: var(--disabled-text-color);
      stroke-width: 1;
      fill: none;
    }
    .circle svg {
      position: absolute;
      fill: none;
      stroke-width: 4px;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    .individual2 path,
    .individual2 circle {
      stroke: var(--individualtwo-color);
    }
    circle.individual2 {
      stroke-width: 4;
      fill: var(--individualtwo-color);
    }
    .individual2 .circle {
      border-color: var(--individualtwo-color);
    }
    .individual1 path,
    .individual1 circle {
      stroke: var(--individualone-color);
    }
    circle.individual1 {
      stroke-width: 4;
      fill: var(--individualone-color);
    }
    .individual1 .circle {
      border-color: var(--individualone-color);
    }
    .solar {
      color: var(--primary-text-color);
    }
    .solar .circle {
      border-color: var(--energy-solar-color);
    }
    circle.solar,
    path.solar {
      stroke: var(--energy-solar-color);
    }
    circle.solar {
      stroke-width: 4;
      fill: var(--energy-solar-color);
    }
    .battery .circle {
      border-color: var(--energy-battery-in-color);
    }
    circle.battery,
    path.battery {
      stroke: var(--energy-battery-out-color);
    }
    path.battery-home,
    circle.battery-home {
      stroke: var(--energy-battery-out-color);
    }
    circle.battery-home {
      stroke-width: 4;
      fill: var(--energy-battery-out-color);
    }
    path.battery-solar,
    circle.battery-solar {
      stroke: var(--energy-battery-in-color);
    }
    circle.battery-solar {
      stroke-width: 4;
      fill: var(--energy-battery-in-color);
    }
    .battery-in {
      color: var(--energy-battery-in-color);
    }
    .battery-out {
      color: var(--energy-battery-out-color);
    }
    path.battery-from-grid {
      stroke: var(--energy-grid-consumption-color);
    }
    path.battery-to-grid {
      stroke: var(--energy-grid-return-color);
    }
    path.return,
    circle.return,
    circle.battery-to-grid {
      stroke: var(--energy-grid-return-color);
    }
    circle.return,
    circle.battery-to-grid {
      stroke-width: 4;
      fill: var(--energy-grid-return-color);
    }
    .return {
      color: var(--energy-grid-return-color);
    }
    .grid .circle {
      border-color: var(--energy-grid-consumption-color);
    }
    .consumption {
      color: var(--energy-grid-consumption-color);
    }
    circle.grid,
    circle.battery-from-grid,
    path.grid {
      stroke: var(--energy-grid-consumption-color);
    }
    circle.grid,
    circle.battery-from-grid {
      stroke-width: 4;
      fill: var(--energy-grid-consumption-color);
    }
    .home .circle {
      border-width: 0;
      border-color: var(--primary-color);
    }
    .home .circle.border {
      border-width: 2px;
    }
    .circle svg circle {
      animation: rotate-in 0.6s ease-in;
      transition: stroke-dashoffset 0.4s, stroke-dasharray 0.4s;
      fill: none;
    }

    // TODO fix this
    /* fixes lines not connecting fully to circles */
    /*     #solar-home-flow {
      width: calc(100% - 150px);
      transform: translate(-3px, -3px);
      height: calc(100% + 10px);
    }

    #solar-grid-flow {
      width: calc(100% - 150px);
      transform: translate(3px, -3px);
      height: calc(100% + 10px);
    }

    #battery-home-flow {
      width: calc(100% - 150px);
      transform: translate(-3px, -7px);
      height: calc(100% + 10px);
    }

    #battery-grid-flow {
      width: calc(100% - 150px);
      transform: translate(3px, -7px);
      height: calc(100% + 10px);
    } */

    @keyframes rotate-in {
      from {
        stroke-dashoffset: 238.76104;
        stroke-dasharray: 238.76104;
      }
    }
    .card-actions a {
      text-decoration: none;
    }
  `;
}

const windowWithCards = window as unknown as Window & {
  customCards: unknown[];
};
windowWithCards.customCards = windowWithCards.customCards || [];
windowWithCards.customCards.push({
  type: "power-flow-card-plus",
  name: "Power Flow Card Plus",
  description:
    "An extended version of the power flow card with richer options, advanced features and a few small enhancements. Inspired by the Energy Dashboard.",
});

declare global {
  interface HTMLElementTagNameMap {
    "power-flow-card-plus": PowerFlowCard;
  }
}

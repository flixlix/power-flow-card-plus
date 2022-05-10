/* eslint no-nested-ternary: warn */
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
import { PowerFlowCardConfig } from "./power-flow-card-config.js";
import { coerceNumber, roundValue } from "./utils.js";

const CIRCLE_CIRCUMFERENCE = 238.76104;
const MAX_FLOW_RATE = 6;
const MIN_FLOW_RATE = 0.75;

@customElement("power-flow-card")
export class PowerFlowCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: PowerFlowCardConfig;

  @query("#battery-home-flow") batteryToHomeFlow?: SVGSVGElement;
  @query("#grid-home-flow") gridToHomeFlow?: SVGSVGElement;
  @query("#solar-battery-flow") solarToBatteryFlow?: SVGSVGElement;
  @query("#solar-grid-flow") solarToGridFlow?: SVGSVGElement;
  @query("#solar-home-flow") solarToHomeFlow?: SVGSVGElement;

  setConfig(config: PowerFlowCardConfig): void {
    this._config = {
      ...config,
      min_flow_rate: config.min_flow_rate ?? MIN_FLOW_RATE,
      max_flow_rate: config.max_flow_rate ?? MAX_FLOW_RATE,
      watt_threshold: config.watt_threshold ?? 0,
    };
  }

  public getCardSize(): Promise<number> | number {
    return 3;
  }

  private previousDur: { [name: string]: number } = {};

  private circleRate = (value: number, total: number): number => {
    const min = this._config?.min_flow_rate!;
    const max = this._config?.max_flow_rate!;
    return max - (value / total) * (max - min);
  };

  private getEntityState = (entity: string | undefined): number => {
    if (!entity) return 0;
    return coerceNumber(this.hass.states[entity].state);
  };

  private getEntityStateWatts = (entity: string | undefined): number => {
    if (!entity) return 0;
    const stateObj = this.hass.states[entity];
    const value = coerceNumber(stateObj.state);
    if (stateObj.attributes.unit_of_measurement === "W") return value;
    return value * 1000;
  };

  private displayValue = (value: number) =>
    value >= coerceNumber(this._config?.watt_threshold, 0)
      ? `${roundValue(value / 1000, 1)} kW`
      : `${roundValue(value, 1)} W`;

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { entities } = this._config;

    const hasBattery = entities.battery !== undefined;
    const hasSolarProduction = entities.solar !== undefined;
    const hasReturnToGrid =
      typeof entities.grid === "string" || entities.grid.production;

    const batteryChargeState = entities.battery_charge?.length
      ? this.getEntityState(entities.battery_charge)
      : null;
    const solarState = Math.max(this.getEntityStateWatts(entities.solar), 0);

    const solarToGrid = hasReturnToGrid
      ? typeof entities.grid === "string"
        ? Math.abs(Math.min(this.getEntityStateWatts(entities.grid), 0))
        : this.getEntityStateWatts(entities.grid.production)
      : 0;

    const batteryToHome =
      typeof entities.battery === "string"
        ? Math.max(this.getEntityStateWatts(entities.battery), 0)
        : this.getEntityStateWatts(entities.battery?.consumption);

    const gridToHome =
      typeof entities.grid === "string"
        ? Math.max(this.getEntityStateWatts(entities.grid), 0)
        : this.getEntityStateWatts(entities.grid.consumption);

    const solarToBattery =
      typeof entities.battery === "string"
        ? Math.abs(Math.min(this.getEntityStateWatts(entities.battery), 0))
        : this.getEntityStateWatts(entities.battery?.production);

    const solarToHome = solarState - solarToGrid - solarToBattery;

    const homeConsumption = batteryToHome + gridToHome + solarToHome;
    const totalConsumption = homeConsumption + solarToBattery + solarToGrid;

    // eslint-disable-next-line prefer-const
    let homeBatteryCircumference: number | undefined;
    if (hasBattery)
      homeBatteryCircumference =
        CIRCLE_CIRCUMFERENCE * (batteryToHome / homeConsumption);

    let homeSolarCircumference: number | undefined;
    if (hasSolarProduction)
      homeSolarCircumference =
        CIRCLE_CIRCUMFERENCE * (solarToHome / homeConsumption);

    const homeHighCarbonCircumference =
      CIRCLE_CIRCUMFERENCE * (gridToHome / homeConsumption);

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
      batteryToHome: this.circleRate(batteryToHome, totalConsumption),
      gridToHome: this.circleRate(gridToHome, totalConsumption),
      solarToBattery: this.circleRate(solarToBattery, totalConsumption),
      solarToGrid: this.circleRate(solarToGrid, totalConsumption),
      solarToHome: this.circleRate(solarToHome, totalConsumption),
    };

    // Smooth duration changes
    [
      "batteryToHome",
      "gridToHome",
      "solarToBattery",
      "solarToGrid",
      "solarToHome",
    ].forEach((flowName) => {
      const flowSVGElement = this[`${flowName}Flow`];
      if (
        flowSVGElement &&
        this.previousDur[flowName] &&
        this.previousDur[flowName] !== newDur[flowName]
      ) {
        flowSVGElement.setCurrentTime(
          flowSVGElement.getCurrentTime() *
            (newDur[flowName] / this.previousDur[flowName])
        );
      }
      this.previousDur[flowName] = newDur[flowName];
    });

    return html`
      <ha-card .header=${this._config.title}>
        <div class="card-content">
          ${hasSolarProduction
            ? html`<div class="circle-container solar">
                <span class="label"
                  >${this.hass.localize(
                    "ui.panel.lovelace.cards.energy.energy_distribution.solar"
                  )}</span
                >
                <div class="circle">
                  <ha-svg-icon .path=${mdiSolarPower}></ha-svg-icon>
                  <span class="solar"> ${this.displayValue(solarState)}</span>
                </div>
              </div>`
            : html``}
          <div class="row">
            <div class="circle-container grid">
              <div class="circle">
                <ha-svg-icon .path=${mdiTransmissionTower}></ha-svg-icon>
                ${hasReturnToGrid
                  ? html`<span class="return">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowLeft}
                      ></ha-svg-icon
                      >${this.displayValue(solarToGrid)}
                    </span>`
                  : null}
                <span class="consumption">
                  <ha-svg-icon
                    class="small"
                    .path=${mdiArrowRight}
                  ></ha-svg-icon
                  >${this.displayValue(gridToHome)}
                </span>
              </div>
              <span class="label"
                >${this.hass.localize(
                  "ui.panel.lovelace.cards.energy.energy_distribution.grid"
                )}</span
              >
            </div>
            <div class="circle-container home">
              <div
                class="circle ${classMap({
                  border: homeSolarCircumference === undefined,
                })}"
              >
                <ha-svg-icon .path=${mdiHome}></ha-svg-icon>
                ${this.displayValue(homeConsumption)}
                ${homeSolarCircumference !== undefined
                  ? html`<svg>
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
                        stroke-dasharray="${homeHighCarbonCircumference ??
                        CIRCLE_CIRCUMFERENCE -
                          homeSolarCircumference! -
                          (homeBatteryCircumference ||
                            0)} ${homeHighCarbonCircumference !== undefined
                          ? CIRCLE_CIRCUMFERENCE - homeHighCarbonCircumference
                          : homeSolarCircumference! +
                            (homeBatteryCircumference || 0)}"
                        stroke-dashoffset="0"
                        shape-rendering="geometricPrecision"
                      />
                    </svg>`
                  : ""}
              </div>
              <span class="label"
                >${this.hass.localize(
                  "ui.panel.lovelace.cards.energy.energy_distribution.home"
                )}</span
              >
            </div>
          </div>
          ${hasBattery
            ? html`<div class="row">
                <div class="spacer"></div>
                <div class="circle-container battery">
                  <div class="circle">
                    ${batteryChargeState !== null
                      ? html` <span>
                          ${formatNumber(batteryChargeState, this.hass.locale, {
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          })}%
                        </span>`
                      : null}
                    <ha-svg-icon .path=${batteryIcon}></ha-svg-icon>
                    <span class="battery-in">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowDown}
                      ></ha-svg-icon
                      >${this.displayValue(solarToBattery)}</span
                    >
                    <span class="battery-out">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowUp}
                      ></ha-svg-icon
                      >${this.displayValue(batteryToHome)}</span
                    >
                  </div>
                  <span class="label"
                    >${this.hass.localize(
                      "ui.panel.lovelace.cards.energy.energy_distribution.battery"
                    )}</span
                  >
                </div>
                <div class="spacer"></div>
              </div>`
            : ""}
          <div class="lines ${classMap({ battery: hasBattery })}">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
              id="grid-home-flow"
            >
              <path
                class="grid"
                id="grid"
                d="M0,${hasBattery ? 50 : hasSolarProduction ? 56 : 53} H100"
                vector-effect="non-scaling-stroke"
              ></path>
              ${gridToHome
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
          </div>
          <div class="lines ${classMap({ battery: hasBattery })}">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
              id="solar-home-flow"
            >
              ${hasSolarProduction
                ? svg`<path
                    id="solar"
                    class="solar"
                    d="M${hasBattery ? 55 : 53},0 v15 c0,${
                    hasBattery ? "35 10,30 30,30" : "40 10,35 30,35"
                  } h25"
                    vector-effect="non-scaling-stroke"
                  ></path>`
                : ""}
              ${solarToHome > 0
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
          </div>
          <div class="lines ${classMap({ battery: hasBattery })}">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
              id="solar-grid-flow"
            >
              ${hasReturnToGrid && hasSolarProduction
                ? svg`<path
                    id="return"
                    class="return"
                    d="M${hasBattery ? 45 : 47},0 v15 c0,${
                    hasBattery ? "35 -10,30 -30,30" : "40 -10,35 -30,35"
                  } h-20"
                    vector-effect="non-scaling-stroke"
                  ></path> `
                : ""}
              ${solarToGrid > 0 && hasSolarProduction
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
          </div>
          <div class="lines ${classMap({ battery: hasBattery })}">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
              id="solar-battery-flow"
            >
              ${hasBattery && hasSolarProduction
                ? svg`<path
                    id="battery-solar"
                    class="battery-solar"
                    d="M50,0 V100"
                    vector-effect="non-scaling-stroke"
                  ></path>`
                : ""}
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
          </div>
          <div class="lines ${classMap({ battery: hasBattery })}">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
              id="battery-home-flow"
            >
              ${hasBattery
                ? svg`<path
                    id="battery-home"
                    class="battery-home"
                    d="M55,100 v-15 c0,-35 10,-30 30,-30 h20"
                    vector-effect="non-scaling-stroke"
                  ></path>
                  `
                : ""}
              ${batteryToHome > 0
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
          </div>
        </div></ha-card
      >
    `;
  }

  static styles = css`
    :host {
      --mdc-icon-size: 24px;
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
    .lines.battery {
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
    }
    .circle-container.solar {
      margin: 0 4px;
      height: 130px;
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
      stroke: var(--primary-text-color);
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
    .solar {
      color: var(--energy-solar-color);
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
    @keyframes rotate-in {
      from {
        stroke-dashoffset: 238.76104;
        stroke-dasharray: 238.76104;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "power-flow-card": PowerFlowCard;
  }
}

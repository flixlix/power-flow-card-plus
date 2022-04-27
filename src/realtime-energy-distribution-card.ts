/* eslint no-nested-ternary: warn */
import {
  mdiArrowDown,
  mdiArrowLeft,
  mdiArrowRight,
  mdiArrowUp,
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
import { RealtimeEnergyDistributionCardConfig } from "./realtime-energy-distribution-card-config.js";
import { roundValue } from "./utils.js";

const CIRCLE_CIRCUMFERENCE = 238.76104;
const SLOWEST_CIRCLE_RATE = 6;
const FASTEST_CIRCLE_RATE = 0.75;

@customElement("realtime-energy-distribution-card")
export class RealtimeEnergyDistributionCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: RealtimeEnergyDistributionCardConfig;

  @query("#battery-home-flow") batteryToHomeFlow?: SVGSVGElement;
  @query("#grid-home-flow") gridToHomeFlow?: SVGSVGElement;
  @query("#solar-battery-flow") solarToBatteryFlow?: SVGSVGElement;
  @query("#solar-grid-flow") solarToGridFlow?: SVGSVGElement;
  @query("#solar-home-flow") solarToHomeFlow?: SVGSVGElement;

  setConfig(config: RealtimeEnergyDistributionCardConfig): void {
    this._config = config;
  }

  public getCardSize(): Promise<number> | number {
    return 3;
  }

  private previousDur: { [name: string]: number } = {};

  private circleRate = (value: number, total: number): number =>
    SLOWEST_CIRCLE_RATE -
    (value / total) * (SLOWEST_CIRCLE_RATE - FASTEST_CIRCLE_RATE);

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const hasBattery = this._config.entities.battery !== undefined;
    const hasSolarProduction = this._config.entities.solar !== undefined;
    const hasReturnToGrid = true;

    const batteryState = this._config.entities.battery
      ? +this.hass.states[this._config.entities.battery].state
      : 0;
    const batteryChargeState = this._config.entities.battery_charge
      ? +this.hass.states[this._config.entities.battery_charge].state
      : 0;
    const gridState = this._config.entities.grid
      ? +this.hass.states[this._config.entities.grid].state
      : 0;
    const solarState = this._config.entities.solar
      ? +this.hass.states[this._config.entities.solar].state
      : 0;

    const solarToGrid = roundValue(Math.abs(Math.min(gridState, 0)), 1);
    const batteryToHome = roundValue(Math.max(batteryState, 0), 1);
    const gridToHome = roundValue(Math.max(gridState, 0), 1);
    const solarToBattery = roundValue(Math.abs(Math.min(batteryState, 0)), 1);
    const solarToHome =
      roundValue(solarState, 1) - solarToGrid - solarToBattery;

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
    if (batteryChargeState <= 72 && batteryChargeState > 44) {
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
                  ${solarState > 0
                    ? html` <span class="solar">
                        ${roundValue(solarState, 1)} kW</span
                      >`
                    : html``}
                </div>
              </div>`
            : html``}
          <div class="row">
            <div class="circle-container grid">
              <div class="circle">
                <ha-svg-icon .path=${mdiTransmissionTower}></ha-svg-icon>
                <span class="return">
                  <ha-svg-icon class="small" .path=${mdiArrowLeft}></ha-svg-icon
                  >${roundValue(solarToGrid, 1)} kW
                </span>
                <span class="consumption">
                  <ha-svg-icon
                    class="small"
                    .path=${mdiArrowRight}
                  ></ha-svg-icon
                  >${roundValue(gridToHome, 1)} kW
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
                ${roundValue(homeConsumption, 1)} kW
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
                    <span>
                      ${formatNumber(batteryChargeState, this.hass.locale, {
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0,
                      })}%
                    </span>
                    <ha-svg-icon .path=${batteryIcon}></ha-svg-icon>
                    <span class="battery-in">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowDown}
                      ></ha-svg-icon
                      >${roundValue(solarToBattery, 1)} kW</span
                    >
                    <span class="battery-out">
                      <ha-svg-icon
                        class="small"
                        .path=${mdiArrowUp}
                      ></ha-svg-icon
                      >${roundValue(batteryToHome, 1)} kW</span
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
    "realtime-energy-distribution-card": RealtimeEnergyDistributionCard;
  }
}

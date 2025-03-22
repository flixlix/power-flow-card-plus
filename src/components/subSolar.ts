import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { displayValue } from "../utils/displayValue";
import { styleLine } from "../utils/styleLine";
import { checkShouldShowDots } from "../utils/checkShouldShowDots";
import { computeFlowRate } from "../utils/computeFlowRate";

export interface Solar {
  entity: string | undefined
  entity2: string | undefined
  state: {
    total: number,
    solar1: number,
    solar2: number
  }
}

export const subSolarElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  solar: Solar,
  multipleIndividuals: boolean
) => {
  return html`${solar.entity && solar.entity2 ? html`
    <div class="subSolarContainer">
      <div class="row">
        ${renderSubSolarRow(main, config, solar, multipleIndividuals)}
      </div>
      <div class="subSolarFlowContainer">
        <div class="halfFlexBox"></div>
        <div class="fullFlexBox">
          ${renderFlowContainer(config, solar, multipleIndividuals)}
        </div>
        <div class="halfFlexBox"></div>
        ${multipleIndividuals ? html`<div class="halfFlexBox"></div>` : html``}
      </div>
    </div>
    `: html``}
  `
}

const renderSubSolarRow = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  solar: Solar,
  multipleIndividuals: boolean
) => {
  return html`
    <div class="halfFlexBox"></div>
    <div class="subSolarValueContainer fullFlexBox">
      <div class="subSolarColumnContainer">
        <span>PV 1</span>
        <span>
          ${displayValue(main.hass, config, solar.state.solar1, {
            unit: solar.state['unit'],
            unitWhiteSpace: solar.state['unitWhiteSpace'],
            decimals: solar.state['decimals'],
            watt_threshold: config.watt_threshold,
          })}
        </span>
      </div>
      <div class="subSolarColumnContainer">
        <span>PV 2</span>
        <span>
          ${displayValue(main.hass, config, solar.state.solar2, {
            unit: solar.state['unit'],
            unitWhiteSpace: solar.state['unitWhiteSpace'],
            decimals: solar.state['decimals'],
            watt_threshold: config.watt_threshold,
          })}
        </span>
      </div>
    </div>
    <div class="halfFlexBox"></div>
    ${multipleIndividuals ? html`<div class="halfFlexBox"></div>` : html``}
  `
}

const renderFlowContainer = (
  config: PowerFlowCardPlusConfig,
  solar,
  multipleIndividuals: boolean
) => {
  return html`
    <div>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width: 100%; height: 90px;">
        <path
          id="subSolarEntity1"
          class="solar ${styleLine(solar.state || 0, config)}"
          d="${multipleIndividuals ? "M10,40 v10 c0,50,30,0,30,50" : "M10,40 v10 c0,50,38,0,38,50"}"
          vector-effect="non-scaling-stroke"
        />
        <path
          id="subSolarEntity2"
          class="solar ${styleLine(solar.state || 0, config)}"
          d="${multipleIndividuals ? "M88,40 v10 c0,50 -44,0 -44,50" : "M90,40 v10 c0,50 -38,0 -38,50"}"
          vector-effect="non-scaling-stroke"
        />
        ${checkShouldShowDots(config) && solar.state.total
          ? svg`
              <circle r="1" class="solar" vector-effect="non-scaling-stroke">
                <animateMotion
                  dur="${computeFlowRate(config, solar.state.solar1, solar.state.total)}s"
                  repeatCount="indefinite"
                  calcMode="linear"
                >
                  <mpath xlink:href="#subSolarEntity1" />
                </animateMotion>
              </circle>
              <circle r="1" class="solar" vector-effect="non-scaling-stroke">
                <animateMotion
                  dur="${computeFlowRate(config, solar.state.solar2, solar.state.total)}s"
                  repeatCount="indefinite"
                  calcMode="linear"
                >
                  <mpath xlink:href="#subSolarEntity2" />
                </animateMotion>
              </circle>
             `
          : ""}
      </svg>
    </div>
  `
}

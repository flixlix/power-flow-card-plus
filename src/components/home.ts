import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { NewDur, TemplatesObj } from "../type";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { showLine } from "../utils/showLine";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";

interface Home {
  home: any;
  entities: ConfigEntities;
  templatesObj: TemplatesObj;
  grid: any;
  newDur: NewDur;
  homeUsageToDisplay: string;
  homeSolarCircumference: number;
  circleCircumference: number;
  homeBatteryCircumference: number;
  homeNonFossilCircumference: number;
  homeGridCircumference: number;
  individual: IndividualObject[];
}

export const homeElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  {
    home,
    entities,
    templatesObj,
    homeUsageToDisplay,
    homeSolarCircumference,
    circleCircumference,
    homeBatteryCircumference,
    homeNonFossilCircumference,
    homeGridCircumference,
    individual,
  }: Home
) => {
  const showHomeLabel = individual.filter((i) => i.has).length <= 1;

  return html`<div class="circle-container home">
  <div
    class="circle"
    id="home-circle"
    @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
      main.openDetails(e, entities.home?.tap_action, entities.home?.entity);
    }}
    @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
      if (e.key === "Enter") {
        main.openDetails(e, entities.home?.tap_action, entities.home?.entity);
      }
    }}
  >
    ${generalSecondarySpan(main.hass, main, config, templatesObj, home, "home")}
    ${home.icon !== " " ? html`<ha-icon id="home-icon" .icon=${home.icon} />` : null}
    ${homeUsageToDisplay}
    <svg class="home-circle-sections">
      ${
        homeSolarCircumference !== undefined
          ? svg`<circle
                class="solar"
                cx="40"
                cy="40"
                r="38"
                stroke-dasharray="${homeSolarCircumference} ${circleCircumference - homeSolarCircumference}"
                shape-rendering="geometricPrecision"
                stroke-dashoffset="-${circleCircumference - homeSolarCircumference}"
              />`
          : ""
      }
      ${
        homeBatteryCircumference
          ? svg`<circle
                class="battery"
                cx="40"
                cy="40"
                r="38"
                stroke-dasharray="${homeBatteryCircumference} ${circleCircumference - homeBatteryCircumference}"
                stroke-dashoffset="-${circleCircumference - homeBatteryCircumference - (homeSolarCircumference || 0)}"
                shape-rendering="geometricPrecision"
              />`
          : ""
      }
      ${
        homeNonFossilCircumference !== undefined
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
          : ""
      }
      <circle
        class="grid"
        cx="40"
        cy="40"
        r="38"
        stroke-dasharray="${homeGridCircumference ?? circleCircumference - homeSolarCircumference! - (homeBatteryCircumference || 0)} ${
    homeGridCircumference !== undefined ? circleCircumference - homeGridCircumference : homeSolarCircumference! + (homeBatteryCircumference || 0)
  }"
        stroke-dashoffset="0"
        shape-rendering="geometricPrecision"
      />
    </svg>
  </div>
  ${!showHomeLabel ? html`<span class="label"></span>` : html`<span class="label">${home.name}</span>`}
</div>
</div>`;
};

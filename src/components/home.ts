import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { NewDur, TemplatesObj } from "../type";
import { ConfigEntities } from "../power-flow-card-plus-config";

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
  individual1: any;
  individual2: any;
}

export const homeElement = (
  main: PowerFlowCardPlus,
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
    individual1,
    individual2,
  }: Home
) => {
  return html`<div class="circle-container home">
  <div
    class="circle"
    id="home-circle"
    @click=${(e: { stopPropagation: () => void }) => {
      main.openDetails(e, entities.home?.entity);
    }}
    @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
      if (e.key === "Enter") {
        main.openDetails(e, entities.home?.entity);
      }
    }}
  >
    ${generalSecondarySpan(main.hass, main, templatesObj, home, "home")}
    <ha-icon .icon=${home.icon}></ha-icon>
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
  ${
    main.showLine(individual1.state || 0) && individual2.has && individual1.has
      ? html`<span class="label"></span>`
      : html` <span class="label">${home.name}</span>`
  }
</div>
</div>`;
};
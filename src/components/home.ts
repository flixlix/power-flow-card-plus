import { html, nothing, svg } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { generalSecondarySpan } from "./spans/general-secondary-span";
import { NewDur, TemplatesObj } from "@/type";
import { ConfigEntities, PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { IndividualObject } from "@/states/raw/individual/get-individual-object";

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
  const isHomeEntityDefined = entities.home?.entity !== undefined;
  const staticAction =
    entities.home?.tap_action !== undefined || entities.home?.hold_action !== undefined || entities.home?.double_tap_action !== undefined;
  const isClickable = isHomeEntityDefined && !staticAction;
  const disableEntityClick = config.clickable_entities === false || !isClickable;

  return html`
    <div class="circle-container home">
      <div
        class="circle ${disableEntityClick ? "pointer-events-none" : ""}"
        id="home-circle"
        @click=${(e: MouseEvent) => {
          main.onEntityClick(e, entities.home, entities.home?.entity);
        }}
        @dblclick=${(e: MouseEvent) => {
          main.onEntityDoubleClick(e, entities.home, entities.home?.entity);
        }}
        @pointerdown=${(e: PointerEvent) => {
          main.onEntityPointerDown(e, entities.home, entities.home?.entity);
        }}
        @pointerup=${(e: PointerEvent) => {
          main.onEntityPointerUp(e);
        }}
        @pointercancel=${(e: PointerEvent) => {
          main.onEntityPointerUp(e);
        }}
        @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
          if (e.key === "Enter") {
            main.openDetails(e, entities.home, entities.home?.entity, "tap");
          }
        }}
      >
        <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
        ${generalSecondarySpan(main.hass, main, config, templatesObj, home, "home")}
        ${home.icon !== " " ? html`<ha-icon id="home-icon" .icon=${home.icon}></ha-icon>` : nothing} ${homeUsageToDisplay}
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
            : nothing}
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
            : nothing}
          ${homeNonFossilCircumference !== undefined
            ? svg`<circle
                  class="low-carbon"
                  cx="40"
                  cy="40"
                  r="38"
                  stroke-dasharray="${homeNonFossilCircumference} ${circleCircumference - homeNonFossilCircumference}"
                  stroke-dashoffset="-${circleCircumference -
                  homeNonFossilCircumference -
                  (homeBatteryCircumference || 0) -
                  (homeSolarCircumference || 0)}"
                  shape-rendering="geometricPrecision"
                />`
            : nothing}
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
      ${!showHomeLabel ? html`<span class="label"></span>` : html`<span class="label">${home.name}</span>`}
    </div>
  `;
};

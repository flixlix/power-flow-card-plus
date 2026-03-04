import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { generalSecondarySpan } from "./spans/generalSecondarySpan";
import { displayValue } from "../utils/displayValue";
import { NewDur, TemplatesObj } from "../type";
import { showLine } from "../utils/showLine";
import { styleLine } from "../utils/styleLine";
import { checkShouldShowDots } from "../utils/checkShouldShowDots";

export const solarElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  {
    entities,
    solar,
    templatesObj,
    battery,
    newDur,
  }: {
    entities: ConfigEntities;
    solar: any;
    templatesObj: TemplatesObj;
    battery: any;
    newDur: NewDur;
  }
) => {
  return html`<div class="circle-container solar">
    <span class="label">${solar.name}</span>
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, solar.tap_action, solar.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, solar.tap_action, solar.entity);
        }
      }}
    >
      ${generalSecondarySpan(main.hass, main, config, templatesObj, solar, "solar")}
      ${solar.icon !== " " ? html` <ha-icon id="solar-icon" .icon=${solar.icon} />` : null}
      ${entities.solar?.display_zero_state !== false || (solar.state.total || 0) > 0
        ? html` <span class="solar">
            ${displayValue(main.hass, config, solar.state.total, {
              unit: solar.state.unit,
              unitWhiteSpace: solar.state.unit_white_space,
              decimals: solar.state.decimals,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : ""}
    </div>
    ${battery.has && showLine(config, solar.state.toBattery || 0)
      ? html`
          <svg width="80" height="30" style="overflow:visible">
            <path d="M40 -10 v150" id="solar-to-battery" class="battery-solar ${styleLine(solar.state.toBattery || 0, config)}" />
            ${checkShouldShowDots(config) && solar.state.toBattery
              ? svg`<circle
                  r="1.75"
                  class="battery-solar"
                  vector-effect="non-scaling-stroke"
                >
                  <animateMotion
                    dur="${newDur.solarToBattery}s"
                    repeatCount="indefinite"
                    calcMode="linear"
                  >
                    <mpath xlink:href="#solar-to-battery" />
                  </animateMotion>
                </circle>`
              : ""}
          </svg>
        `
      : ""}
  </div>`;
};

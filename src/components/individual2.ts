import { html, svg } from "lit";
import { individualSecondarySpan } from "./spans/individualSecondarySpan";
import { NewDur, TemplatesObj } from "../type";
import { ConfigEntities } from "../power-flow-card-plus-config";

interface Individual2 {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  entities: ConfigEntities;
  individual2: any;
  individual2DisplayState: string;
}

export const individual2Element = (main, { entities, individual2, templatesObj, individual2DisplayState, newDur }: Individual2) => {
  return html`<div class="circle-container individual2">
    <span class="label">${individual2.name}</span>
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void }) => {
        main.openDetails(e, entities.individual2?.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
        if (e.key === "Enter") {
          main.openDetails(e, entities.individual2?.entity);
        }
      }}
    >
      ${individualSecondarySpan(main.hass, main, templatesObj, individual2, "individual2")}
      <ha-icon
        id="individual2-icon"
        .icon=${individual2.icon}
        style="${individual2.secondary.has ? "padding-top: 2px;" : "padding-top: 0px;"}
      ${entities.individual2?.display_zero_state !== false || (individual2.state || 0) > (individual2.displayZeroTolerance ?? 0)
          ? "padding-bottom: 2px;"
          : "padding-bottom: 0px;"}"
      ></ha-icon>
      ${entities.individual2?.display_zero_state !== false || (individual2.state || 0) > (individual2.displayZeroTolerance ?? 0)
        ? html` <span class="individual2">
            ${individual2.showDirection
              ? html`<ha-icon class="small" .icon=${individual2.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
              : ""}${individual2DisplayState}
          </span>`
        : ""}
    </div>
    ${main.showLine(individual2.state || 0)
      ? html`
          <svg width="80" height="30">
            <path d="M40 -10 v50" id="individual2" class="${main.styleLine(individual2.state || 0)}" />
            ${individual2.state
              ? svg`<circle
          r="2.4"
          class="individual2"
          vector-effect="non-scaling-stroke"
        >
          <animateMotion
            dur="${main.additionalCircleRate(entities.individual2?.calculate_flow_rate, newDur.individual2)}s"
            repeatCount="indefinite"
            calcMode="linear"
            keyPoints=${individual2.invertAnimation ? "0;1" : "1;0"}
            keyTimes="0;1"
          >
            <mpath xlink:href="#individual2" />
          </animateMotion>
        </circle>`
              : ""}
          </svg>
        `
      : ""}
  </div>`;
};

import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../../power-flow-card-plus";
import { classMap } from "lit/directives/class-map.js";
import { NewDur } from "../../type";
import { styleLine } from "../../utils/styleLine";
import { PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";

interface Flows {
  battery: any;
  grid: any;
  individual1: any;
  individual2: any;
  solar: any;
  newDur: NewDur;
}

export const flowElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { battery, grid, individual1, individual2, solar, newDur }: Flows
) => {
  return html`${
    solar.has && main.showLine(solar.state.toHome || 0)
      ? html`<div
          class="lines ${classMap({
            high: battery.has,
            "individual1-individual2": !battery.has && individual2.has && individual1.has,
          })}"
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-home-flow">
            <path
              id="solar"
              class="solar ${styleLine(solar.state.toHome || 0, config)}"
              d="M${battery.has ? 55 : 53},0 v${grid.has ? 15 : 17} c0,${battery.has ? "30 10,30 30,30" : "35 10,35 30,35"} h25"
              vector-effect="non-scaling-stroke"
            ></path>
            ${solar.state.toHome
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
      : ""
  }
  ${
    grid.hasReturnToGrid && solar.has && main.showLine(solar.state.toGrid || 0)
      ? html`<div
          class="lines ${classMap({
            high: battery.has,
            "individual1-individual2": !battery.has && individual2.has && individual1.has,
          })}"
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="solar-grid-flow">
            <path
              id="return"
              class="return ${styleLine(solar.state.toGrid || 0, config)}"
              d="M${battery.has ? 45 : 47},0 v15 c0,${battery.has ? "30 -10,30 -30,30" : "35 -10,35 -30,35"} h-20"
              vector-effect="non-scaling-stroke"
            ></path>
            ${solar.state.toGrid && solar.has
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
      : ""
  }
  ${
    battery.has && solar.has && main.showLine(solar.state.toBattery || 0)
      ? html`<div
          class="lines ${classMap({
            high: battery.has,
            "individual1-individual2": !battery.has && individual2.has && individual1.has,
          })}"
        >
          <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            id="solar-battery-flow"
            class="flat-line"
          >
            <path
              id="battery-solar"
              class="battery-solar ${styleLine(solar.state.toBattery || 0, config)}"
              d="M50,0 V100"
              vector-effect="non-scaling-stroke"
            ></path>
            ${solar.state.toBattery
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
      : ""
  }
  ${
    grid.has && main.showLine(grid.state.fromGrid)
      ? html`<div
          class="lines ${classMap({
            high: battery.has,
            "individual1-individual2": !battery.has && individual2.has && individual1.has,
          })}"
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="grid-home-flow" class="flat-line">
            <path
              class="grid ${styleLine(grid.state.toHome || 0, config)}"
              id="grid"
              d="M0,${battery.has ? 50 : solar.has ? 56 : 53} H100"
              vector-effect="non-scaling-stroke"
            ></path>
            ${grid.state.toHome
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
      : null
  }
  ${
    battery.has && main.showLine(battery.state.toHome)
      ? html`<div
          class="lines ${classMap({
            high: battery.has,
            "individual1-individual2": !battery.has && individual2.has && individual1.has,
          })}"
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-home-flow">
            <path
              id="battery-home"
              class="battery-home ${styleLine(battery.state.toHome || 0, config)}"
              d="M55,100 v-${grid.has ? 15 : 17} c0,-30 10,-30 30,-30 h20"
              vector-effect="non-scaling-stroke"
            ></path>
            ${battery.state.toHome
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
      : ""
  }
  ${
    grid.has && battery.has && main.showLine(Math.max(grid.state.toBattery || 0, battery.state.toGrid || 0))
      ? html`<div
          class="lines ${classMap({
            high: battery.has,
            "individual1-individual2": !battery.has && individual2.has && individual1.has,
          })}"
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="battery-grid-flow">
            <path
              id="battery-grid"
              class=${styleLine(battery.state.toGrid || grid.state.toBattery || 0, config)}
              d="M45,100 v-15 c0,-30 -10,-30 -30,-30 h-20"
              vector-effect="non-scaling-stroke"
            ></path>
            ${grid.state.toBattery
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
            ${battery.state.toGrid
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
      : ""
  }
</div>`;
};

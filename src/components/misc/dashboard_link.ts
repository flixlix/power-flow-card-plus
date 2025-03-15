import { html } from "lit";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { HomeAssistant } from "custom-card-helpers";

export const dashboardLinkElement = (config: PowerFlowCardPlusConfig, hass: HomeAssistant) => {
  return config.dashboard_link || config.second_dashboard_link
    ? html`
        <div class="card-actions">
          ${config.dashboard_link
            ? html`
                <a href=${config.dashboard_link}
                  ><mwc-button>
                    ${config.dashboard_link_label || hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard")}
                  </mwc-button></a
                >
              `
            : ""}
          ${config.second_dashboard_link
            ? html`
                <a href=${config.second_dashboard_link}
                  ><mwc-button>
                    ${config.second_dashboard_link_label ||
                    hass.localize("ui.panel.lovelace.cards.energy.energy_distribution.go_to_energy_dashboard")}
                  </mwc-button></a
                >
              `
            : ""}
        </div>
      `
    : html``;
};

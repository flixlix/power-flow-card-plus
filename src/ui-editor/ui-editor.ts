/* eslint-disable import/extensions */

import { LitElement, html, TemplateResult } from "lit-element";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

@customElement("power-flow-card-plus-editor")
export class PowerFlowCardPlusEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: PowerFlowCardPlusConfig;

  public async setConfig(config: PowerFlowCardPlusConfig): Promise<void> {
    this._config = config;
  }

  protected render(): TemplateResult | void {
    if (!this.hass) return html``;
    return html`
      <div class="card-config">
        <ha-textfield label="Title" .value=${this._config?.title || ""} .configValue=${"title"} @input=${this._valueChanged}></ha-textfield>
      </div>
    `;
  }
  private _valueChanged(ev: any): void {
    if (!this._config || !this.hass) {
      return;
    }
    if (ev.target) {
      const { target } = ev;
      if (target.configValue) {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, "config-changed", { config: this._config });
  }
}

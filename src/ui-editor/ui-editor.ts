/* eslint-disable no-use-before-define */
/* eslint-disable import/extensions */

import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { assert } from "superstruct";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { cardConfigStruct, SCHEMA } from "./schema";

export const loadHaForm = async () => {
  if (customElements.get("ha-form")) return;

  const helpers = await (window as any).loadCardHelpers?.();
  if (!helpers) return;
  const card = await helpers.createCardElement({ type: "entity" });
  if (!card) return;
  await card.getConfigElement();
};

@customElement("power-flow-card-plus-editor")
export class PowerFlowCardPlusEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: PowerFlowCardPlusConfig;

  public async setConfig(config: PowerFlowCardPlusConfig): Promise<void> {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  connectedCallback(): void {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    loadHaForm();
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    const data = {
      ...this._config,
    };

    return html`
      <div class="card-config">
        <ha-icon-button @click=${() => window.open("https://github.com/flixlix/power-flow-card-plus", "_blank")} style="align-self: flex-end;">
          <ha-icon icon="hass:help-circle"></ha-icon>
        </ha-icon-button>

        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${SCHEMA}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
          .documentationUrl="https://github.com/flixlix/power-flow-card-plus"
        ></ha-form>
      </div>
    `;
  }
  private _valueChanged(ev: any): void {
    const config = ev.detail.value;
    if (!this._config || !this.hass) {
      return;
    }
    fireEvent(this, "config-changed", { config });
  }

  private _computeLabelCallback = (schema) => schema.label || this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);

  static get styles() {
    return css`
      ha-form {
        width: 100%;
      }

      ha-icon {
        padding-bottom: 2px;
      }

      .card-config {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      ha-svg-icon {
        top: -4px;
        right: 1px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "power-flow-card-plus-editor": PowerFlowCardPlusEditor;
  }
}

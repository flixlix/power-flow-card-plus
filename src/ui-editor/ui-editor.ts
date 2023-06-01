/* eslint-disable no-use-before-define */
/* eslint-disable import/extensions */

import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { assert } from "superstruct";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { cardConfigStruct, generalConfigSchema, entitiesSchema, advancedOptionsSchema } from "./schema/_schema-all";
import localize from "../localize/localize";

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
  @state() private showOther = false;

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
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${generalConfigSchema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
        <div style="height: 24px"></div>
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${entitiesSchema(localize)}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
          class="entities-section"
        ></ha-form>
        <div style="height: 24px"></div>
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${advancedOptionsSchema(localize)}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }
  private _valueChanged(ev: any): void {
    const config = ev.detail.value || "";
    if (!this._config || !this.hass) {
      return;
    }
    fireEvent(this, "config-changed", { config });
  }

  private _computeLabelCallback = (schema: any) =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) || localize(`editor.${schema?.name}`);

  static get styles() {
    return css`
      ha-form {
        width: 100%;
      }

      ha-icon-button {
        align-self: center;
      }

      .entities-section * {
        background-color: #f00;
      }

      .card-config {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .config-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .config-header.sub-header {
        margin-top: 24px;
      }

      ha-icon {
        padding-bottom: 2px;
        position: relative;
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

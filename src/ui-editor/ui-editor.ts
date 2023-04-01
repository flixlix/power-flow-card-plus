/* eslint-disable no-use-before-define */
/* eslint-disable import/extensions */

import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { assert } from "superstruct";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import {
  cardConfigStruct,
  generalConfigSchema,
  gridConfigSchema,
  batteryConfigSchema,
  solarConfigSchema,
  homeConfigSchema,
  nonFossilConfigSchema,
  individual1ConfigSchema,
  individual1SecondaryConfigSchema,
  individual2ConfigSchema,
  individual2SecondaryConfigSchema,
  otherConfigSchema,
} from "./schema";

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
  @state() private showGrid = false;
  @state() private showBattery = false;
  @state() private showSolar = false;
  @state() private showHome = false;
  @state() private showNonFossil = false;
  @state() private showIndividual1 = false;
  @state() private showIndividual1Secondary = false;
  @state() private showIndividual2 = false;
  @state() private showIndividual2Secondary = false;
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
        <div class="config-header">
          <h2>Power Flow Card Plus</h2>
          <ha-icon-button @click=${() => window.open("https://github.com/flixlix/power-flow-card-plus", "_blank")}>
            <ha-icon icon="hass:help-circle"></ha-icon>
          </ha-icon-button>
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${generalConfigSchema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>

        <div class="grid config-header sub-header">
          <h3>Grid Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showGrid}
              @change=${(ev) => {
                this.showGrid = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showGrid
          ? html`
              <ha-form
                class="grid-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${gridConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
            `
          : nothing}

        <div class="solar config-header sub-header">
          <h3>Solar Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showSolar}
              @change=${(ev) => {
                this.showSolar = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showSolar
          ? html`
              <ha-form
                class="solar-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${solarConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
            `
          : nothing}

        <div class="battery config-header sub-header">
          <h3>Battery Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showBattery}
              @change=${(ev) => {
                this.showBattery = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showBattery
          ? html`
              <ha-form
                class="battery-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${batteryConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
            `
          : nothing}

        <div class="home config-header sub-header">
          <h3>Home Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showHome}
              @change=${(ev) => {
                this.showHome = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showHome
          ? html`
              <ha-form
                class="home-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${homeConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
            `
          : nothing}

        <div class="non-fossil config-header sub-header">
          <h3>Non-Fossil Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showNonFossil}
              @change=${(ev) => {
                this.showNonFossil = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showNonFossil
          ? html`
              <ha-form
                class="non-fossil-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${nonFossilConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
            `
          : nothing}

        <div class="individual1 config-header sub-header">
          <h3>Individual 1 Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showIndividual1}
              @change=${(ev) => {
                this.showIndividual1 = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showIndividual1
          ? html`
              <ha-form
                class="individual1-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${individual1ConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
              <div class="individual1 config-header sub-header">
                <h4>Secondary Information</h4>
                <ha-formfield label="Show Configuration">
                  <ha-switch
                    .checked=${this.showIndividual1Secondary}
                    @change=${(ev) => {
                      this.showIndividual1Secondary = ev.target.checked;
                      this._valueChanged(ev);
                    }}
                  ></ha-switch>
                </ha-formfield>
              </div>
              ${this.showIndividual1Secondary
                ? html`
                    <ha-form
                      class="individual1-secondary-config"
                      .hass=${this.hass}
                      .data=${data}
                      .schema=${individual1SecondaryConfigSchema}
                      .computeLabel=${this._computeLabelCallback}
                      @value-changed=${this._valueChanged}
                    ></ha-form>
                  `
                : nothing}
            `
          : nothing}

        <div class="individual2 config-header sub-header">
          <h3>Individual 2 Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showIndividual2}
              @change=${(ev) => {
                this.showIndividual2 = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showIndividual2
          ? html`
              <ha-form
                class="individual2-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${individual2ConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
              <div class="individual2 config-header sub-header">
                <h4>Secondary Information</h4>
                <ha-formfield label="Show Configuration">
                  <ha-switch
                    .checked=${this.showIndividual2Secondary}
                    @change=${(ev) => {
                      this.showIndividual2Secondary = ev.target.checked;
                      this._valueChanged(ev);
                    }}
                  ></ha-switch>
                </ha-formfield>
              </div>
              ${this.showIndividual2Secondary
                ? html`
                    <ha-form
                      class="individual2-secondary-config"
                      .hass=${this.hass}
                      .data=${data}
                      .schema=${individual2SecondaryConfigSchema}
                      .computeLabel=${this._computeLabelCallback}
                      @value-changed=${this._valueChanged}
                    ></ha-form>
                  `
                : nothing}
            `
          : nothing}

        <div class="other config-header sub-header">
          <h3>Advanced Configuration</h3>
          <ha-formfield label="Show Configuration">
            <ha-switch
              .checked=${this.showOther}
              @change=${(ev) => {
                this.showOther = ev.target.checked;
                this._valueChanged(ev);
              }}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${this.showOther
          ? html`
              <ha-form
                class="other-config"
                .hass=${this.hass}
                .data=${data}
                .schema=${otherConfigSchema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
              ></ha-form>
            `
          : nothing}
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

      ha-icon-button {
        align-self: center;
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

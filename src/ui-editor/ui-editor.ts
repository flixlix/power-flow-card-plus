/* eslint-disable no-use-before-define */
/* eslint-disable import/extensions */
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EntityConfig, fireEvent, HASSDomEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { assert } from "superstruct";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { cardConfigStruct, generalConfigSchema, entitiesSchema, advancedOptionsSchema } from "./schema/_schema-all";
import localize from "../localize/localize";
import { defaultValues } from "../utils/get-default-config";
import { EditSubElementEvent, LovelaceRowConfig, OpenSubElementPage, SubElementEditorConfig } from "./types/entity-rows";
import "./components/individual-devices-editor";
import "./components/link-subpage";
import { loadHaForm } from "./utils/loadHAForm";
import { processEditorEntities } from "./components/individual-devices-editor";

@customElement("power-flow-card-plus-editor")
export class PowerFlowCardPlusEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: PowerFlowCardPlusConfig;
  @state() private _configEntities?: LovelaceRowConfig[] = [];
  @state() private _subElementEditorConfig?: boolean;

  public async setConfig(config: PowerFlowCardPlusConfig): Promise<void> {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  connectedCallback(): void {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    loadHaForm();
  }

  private _editDetailElement(ev: HASSDomEvent<OpenSubElementPage>): void {
    this._subElementEditorConfig = ev.detail.open;
  }

  private _goBack(): void {
    this._subElementEditorConfig = false;
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    const data = {
      ...this._config,
      display_zero_lines: {
        mode: this._config.display_zero_lines?.mode ?? defaultValues.displayZeroLines.mode,
        transparency: this._config.display_zero_lines?.transparency ?? defaultValues.displayZeroLines.transparency,
        grey_color: this._config.display_zero_lines?.grey_color ?? defaultValues.displayZeroLines.grey_color,
      },
    };

    if (this._subElementEditorConfig) {
      return html`
        <individual-devices-editor
          .hass=${this.hass}
          .config=${this._config}
          @go-back=${this._goBack}
          style="width: 100%;"
          @config-changed=${this._handleSubElementChanged}
        ></individual-devices-editor>
      `;
    }

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
        <link-subpage
          path="individual"
          header="${localize("editor.individual")}"
          style="width: 100%;"
          @open-sub-element-editor=${this._editDetailElement}
        >
        </link-subpage>
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
          .schema=${advancedOptionsSchema(localize, data.display_zero_lines?.mode)}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }

  private _handleSubElementChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this._config || !this.hass) {
      return;
    }

    const value = ev.detail.config;

    const newConfigEntities = this._configEntities!.concat();

    this._config = { ...this._config!, ...newConfigEntities };
    this._configEntities = processEditorEntities(this._config!.entities);

    fireEvent(this, "config-changed", { config: this._config });
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

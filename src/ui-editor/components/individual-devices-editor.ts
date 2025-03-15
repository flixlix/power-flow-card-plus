import { ActionConfig, HASSDomEvent, HomeAssistant, fireEvent } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit-element";
import { EditSubElementEvent, LovelaceRowConfig, SubElementEditorConfig } from "../types/entity-rows";
import { individualDevicesSchema } from "../schema/_schema-all";
import localize from "@/localize/localize";
import { IndividualDeviceType } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import "./individual-row-editor";

export interface GUIModeChangedEvent {
  guiMode: boolean;
  guiModeAvailable: boolean;
}

export interface EditorTarget extends EventTarget {
  value?: string;
  index?: number;
  checked?: boolean;
  configValue?: string;
  type?: HTMLInputElement["type"];
  config: ActionConfig;
}

export function processEditorEntities(entities): IndividualDeviceType[] {
  return entities.map((entityConf) => {
    if (typeof entityConf === "string") {
      return { entity: entityConf };
    }
    return entityConf;
  });
}

@customElement("individual-devices-editor")
export class IndividualDevicesEditor extends LitElement {
  public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: PowerFlowCardPlusConfig;

  @state() private _subElementEditorConfig?: SubElementEditorConfig;

  @state() private _configEntities?: LovelaceRowConfig[];

  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
      return html`<div>no config</div>`;
    }

    this._configEntities = this.config.entities.individual;

    if (this._subElementEditorConfig) {
      return html`
        <ha-form
          .hass=${this.hass}
          @value-changed=${this._valueChanged}
          .data=${this.config}
          .schema=${individualDevicesSchema(this.hass)}
          .computeLabel=${this._computeLabelCallback}
        ></ha-form>
      `;
    }

    return html`
      <individual-row-editor
        .hass=${this.hass}
        .config=${this.config}
        .entities=${this._configEntities || []}
        @open-sub-element-editor=${this._editDetailElement}
        @entities-changed=${this._entitiesChanged}
        style="width: 100%;"
      ></individual-row-editor>
    `;
  }

  private _valueChanged(ev: any): void {
    let config = ev.detail.value || "";

    if (!this.config || !this.hass) {
      return;
    }

    fireEvent(this, "config-changed", { config });
  }

  private _entitiesChanged(ev: CustomEvent): void {
    let config = this.config!;

    config = {
      ...config,
      entities: {
        ...config.entities,
        individual: ev.detail.entities,
      },
    };
    this._configEntities = processEditorEntities(config.entities.individual);

    fireEvent(this, "config-changed", { config });
  }

  private _computeLabelCallback = (schema: any) =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) || localize(`editor.${schema?.name}`);

  private _editDetailElement(ev: HASSDomEvent<EditSubElementEvent>): void {
    this._subElementEditorConfig = ev.detail.subElementConfig;
  }

  static get styles(): CSSResultGroup {
    return css``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "individual-devices-editor": IndividualDevicesEditor;
  }
}

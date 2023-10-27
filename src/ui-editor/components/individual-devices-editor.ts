import { mdiArrowLeft, mdiCodeBraces, mdiListBoxOutline } from "@mdi/js";
import { ActionConfig, EntityConfig, HASSDomEvent, HomeAssistant, fireEvent } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit-element";
import { EditSubElementEvent, LovelaceRowConfig, OpenSubElementPage, SubElementEditorConfig } from "../types/entity-rows";
import { cardConfigStruct, entitiesSchema, indvidualDevicesSchema } from "../schema/_schema-all";
import localize from "../../localize/localize";
import { IndividualDeviceType } from "../../type";
import { ConfigEntities, IndividualField, PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";
import { assert } from "superstruct";
import "./individual-row-editor";
import { loadHaForm } from "../utils/loadHAForm";

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

declare global {
  interface HASSDomEvents {
    "go-back": undefined;
  }
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

  @query(".editor") private _editorElement?: any;

  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
      return html`<div>no config</div>`;
    }
    this._configEntities = this.config.entities.individual;

    if (this._subElementEditorConfig) {
      return html`
        <ha-form .data=${this.config} .schema=${indvidualDevicesSchema(this.hass)} .computeLabel=${(label) => localize(`editor.${label}`)}></ha-form>
      `;
    }

    return html`
      <div class="header">
        <div class="back-title">
          <ha-icon-button .label=${"Go Back"} .path=${mdiArrowLeft} @click=${this._goBack}></ha-icon-button>
          <span>${localize(`editor.individual`)}</span>
        </div>
      </div>
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

  private _goBack(): void {
    fireEvent(this, "go-back");
  }

  private _editDetailElement(ev: HASSDomEvent<EditSubElementEvent>): void {
    this._subElementEditorConfig = ev.detail.subElementConfig;
  }

  static get styles(): CSSResultGroup {
    return css`
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .back-title {
        display: flex;
        align-items: center;
        font-size: 18px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "individual-devices-editor": IndividualDevicesEditor;
  }
}

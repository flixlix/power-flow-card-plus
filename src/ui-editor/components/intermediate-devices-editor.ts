import { HomeAssistant, fireEvent } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit-element";
import { LovelaceRowConfig } from "../types/entity-rows";
import localize from "@/localize/localize";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import "./intermediate-row-editor";

@customElement("intermediate-devices-editor")
export class IntermediateDevicesEditor extends LitElement {
  public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: PowerFlowCardPlusConfig;

  @state() private _configEntities?: LovelaceRowConfig[];

  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
      return html`<div>no config</div>`;
    }

    this._configEntities = (this.config.entities.intermediate || []) as LovelaceRowConfig[];

    return html`
      <intermediate-row-editor
        .hass=${this.hass}
        .config=${this.config}
        .entities=${this._configEntities}
        @entities-changed=${this._entitiesChanged}
        style="width: 100%;"
      ></intermediate-row-editor>
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
        intermediate: ev.detail.entities,
      },
    };
    this._configEntities = (config.entities.intermediate || []) as LovelaceRowConfig[];

    fireEvent(this, "config-changed", { config });
  }

  private _computeLabelCallback = (schema: any) =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) || localize(`editor.${schema?.name}`);

  static get styles(): CSSResultGroup {
    return css``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "intermediate-devices-editor": IntermediateDevicesEditor;
  }
}

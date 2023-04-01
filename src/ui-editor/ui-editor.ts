/* eslint-disable no-use-before-define */
/* eslint-disable import/extensions */

import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { any, assert, assign, boolean, object, optional, refine, string } from "superstruct";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

export const baseLovelaceCardConfig = object({
  type: string(),
  view_layout: any(),
});

const isEntityId = (value: string): boolean => value.includes(".");

export const entityId = () => refine(string(), "entity ID (domain.entity)", isEntityId);

const cardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    entity: optional(entityId()),
    title: optional(string()),
    show_name: optional(boolean()),
    icon: optional(string()),
    show_icon: optional(boolean()),
    icon_height: optional(string()),
    theme: optional(string()),
    show_state: optional(boolean()),
  })
);

const SCHEMA = [
  { name: "title", selector: { text: {} } },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "entity", selector: { entity: {} } },
      {
        name: "icon",
        selector: {
          icon: {},
        },
        context: {
          icon_entity: "entity",
        },
      },
    ],
  },
  {
    name: "",
    type: "grid",
    column_min_width: "100px",
    schema: [
      { name: "show_name", selector: { boolean: {} } },
      { name: "show_state", selector: { boolean: {} } },
      { name: "show_icon", selector: { boolean: {} } },
    ],
  },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "icon_height", selector: { text: { suffix: "px" } } },
      { name: "theme", selector: { theme: {} } },
    ],
  },
  {
    name: "tap_action",
    selector: { "ui-action": {} },
  },
  {
    name: "hold_action",
    selector: { "ui-action": {} },
  },
] as const;

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
      show_name: true,
      show_icon: true,
      ...this._config,
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabelCallback}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
  private _valueChanged(ev: any): void {
    const config = ev.detail.value;
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
    fireEvent(this, "config-changed", { config });
  }

  private _computeLabelCallback = (schema) => this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
}

declare global {
  interface HTMLElementTagNameMap {
    "power-flow-card-plus-editor": PowerFlowCardPlusEditor;
  }
}

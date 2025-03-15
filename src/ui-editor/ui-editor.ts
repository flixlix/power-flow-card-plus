/* eslint-disable no-use-before-define */
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { assert } from "superstruct";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { cardConfigStruct, generalConfigSchema, advancedOptionsSchema } from "./schema/_schema-all";
import localize from "../localize/localize";
import { defaultValues } from "../utils/get-default-config";
import { LovelaceRowConfig } from "./types/entity-rows";
import "./components/individual-devices-editor";
import "./components/link-subpage";
import "./components/subpage-header";
import { loadHaForm } from "./utils/loadHAForm";
import { gridSchema } from "./schema/grid";
import { solarSchema } from "./schema/solar";
import { batterySchema } from "./schema/battery";
import { nonFossilSchema } from "./schema/fossil_fuel_percentage";
import { homeSchema } from "./schema/home";
import { ConfigPage } from "./types/config-page";

const CONFIG_PAGES: {
  page: ConfigPage;
  icon?: string;
  schema?: any;
}[] = [
  {
    page: "grid",
    icon: "mdi:transmission-tower",
    schema: gridSchema,
  },
  {
    page: "solar",
    icon: "mdi:solar-power",
    schema: solarSchema,
  },
  {
    page: "battery",
    icon: "mdi:battery-high",
    schema: batterySchema,
  },
  {
    page: "fossil_fuel_percentage",
    icon: "mdi:leaf",
    schema: nonFossilSchema,
  },
  {
    page: "home",
    icon: "mdi:home",
    schema: homeSchema,
  },
  {
    page: "individual",
    icon: "mdi:dots-horizontal-circle-outline",
  },
  {
    page: "advanced",
    icon: "mdi:cog",
    schema: advancedOptionsSchema,
  },
];

type ConfigPages = typeof CONFIG_PAGES;

@customElement("power-flow-card-plus-editor")
export class PowerFlowCardPlusEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: PowerFlowCardPlusConfig;
  @state() private _configEntities?: LovelaceRowConfig[] = [];
  @state() private _currentConfigPage: ConfigPage = null;

  public async setConfig(config: PowerFlowCardPlusConfig): Promise<void> {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  connectedCallback(): void {
    super.connectedCallback();
    loadHaForm();
  }

  private _editDetailElement(pageClicked: ConfigPage): void {
    this._currentConfigPage = pageClicked;
  }

  private _goBack(): void {
    this._currentConfigPage = null;
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

    if (this._currentConfigPage !== null) {
      if (this._currentConfigPage === "individual") {
        return html`
          <subpage-header @go-back=${this._goBack} page=${this._currentConfigPage}> </subpage-header>
          <individual-devices-editor .hass=${this.hass} .config=${this._config} @config-changed=${this._valueChanged}></individual-devices-editor>
        `;
      }

      const currentPage = this._currentConfigPage;
      const schema =
        currentPage === "advanced"
          ? advancedOptionsSchema(localize, this._config.display_zero_lines?.mode ?? defaultValues.displayZeroLines.mode)
          : CONFIG_PAGES.find((page) => page.page === currentPage)?.schema;
      const dataForForm = currentPage === "advanced" ? data : data.entities[currentPage];

      return html`
        <subpage-header @go-back=${this._goBack} page=${this._currentConfigPage}> </subpage-header>
        <ha-form
          .hass=${this.hass}
          .data=${dataForForm}
          .schema=${schema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
      `;
    }

    const renderLinkSubpage = (page: ConfigPage, fallbackIcon: string | undefined = "mdi:dots-horizontal-circle-outline") => {
      if (page === null) return html``;
      const getIconToUse = () => {
        if (page === "individual" || page === "advanced") return fallbackIcon;
        return this?._config?.entities[page]?.icon || fallbackIcon;
      };
      const icon = getIconToUse();
      return html`
        <link-subpage
          path=${page}
          header="${localize(`editor.${page}`)}"
          @open-sub-element-editor=${() => this._editDetailElement(page)}
          icon=${icon}
        >
        </link-subpage>
      `;
    };

    const renderLinkSubPages = () => {
      return CONFIG_PAGES.map((page) => renderLinkSubpage(page.page, page.icon));
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
        ${renderLinkSubPages()}
      </div>
    `;
  }

  private _valueChanged(ev: any): void {
    let config = ev.detail.value || "";

    if (!this._config || !this.hass) {
      return;
    }

    if (this._currentConfigPage !== null && this._currentConfigPage !== "advanced" && this._currentConfigPage !== "individual") {
      config = {
        ...this._config,
        entities: {
          ...this._config.entities,
          [this._currentConfigPage]: config,
        },
      };
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
        gap: 1.5rem;
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

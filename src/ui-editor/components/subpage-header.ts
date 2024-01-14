import { mdiArrowLeft, mdiCodeBraces, mdiListBoxOutline } from "@mdi/js";
import { ActionConfig, EntityConfig, HASSDomEvent, HomeAssistant, fireEvent } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit-element";
import { EditSubElementEvent, LovelaceRowConfig, OpenSubElementPage, SubElementEditorConfig } from "../types/entity-rows";
import { cardConfigStruct, entitiesSchema, individualDevicesSchema } from "../schema/_schema-all";
import localize from "../../localize/localize";
import { IndividualDeviceType } from "../../type";
import { ConfigEntities, IndividualField, PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";
import { ConfigPage } from "../types/config-page";

declare global {
  interface HASSDomEvents {
    "go-back": undefined;
  }
}

@customElement("subpage-header")
export class SubpageHeader extends LitElement {
  public hass!: HomeAssistant;
  @property({ attribute: false }) public config!: PowerFlowCardPlusConfig;
  @property() protected page?: ConfigPage;

  protected render(): TemplateResult {
    return html`
      <div class="header">
        <div class="back-title">
          <ha-icon-button .label=${"Go Back"} .path=${mdiArrowLeft} @click=${this._goBack}></ha-icon-button>
          <span>${localize(`editor.${this.page}`)}</span>
        </div>
      </div>
    `;
  }

  private _goBack(): void {
    fireEvent(this, "go-back");
  }

  static get styles(): CSSResultGroup {
    return css`
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
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
    "subpage-header": SubpageHeader;
  }
}

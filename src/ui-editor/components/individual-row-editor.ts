import { mdiClose, mdiDrag, mdiPencil } from "@mdi/js";
import { HomeAssistant } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { SortableEvent } from "sortablejs";
import { EditSubElementEvent, EntityConfig, LovelaceRowConfig } from "../types/entity-rows";
import { fireEvent } from "../utils/fire_event";
import { sortableStyles } from "../utils/sortable_styles";
import { loadSortable, SortableInstance } from "../utils/sortable.ondemand";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { loadHaForm } from "@/ui-editor/utils/loadHAForm";
import { individualSchema } from "@/ui-editor/schema/individual";
import localize from "@/localize/localize";

declare global {
  interface HASSDomEvents {
    "entities-changed": {
      entities: LovelaceRowConfig[];
    };
    "edit-detail-element": EditSubElementEvent;
  }

  interface HassEvent {
    "edit-detail-element": EditSubElementEvent;
  }
}

@customElement("individual-row-editor")
export class IndividualRowEditor extends LitElement {
  @property({ attribute: false }) protected hass?: HomeAssistant;

  @property({ attribute: false }) protected config?: PowerFlowCardPlusConfig;

  @property({ attribute: false }) protected entities?: LovelaceRowConfig[];

  @property() protected label?: string;

  @state() protected _indexBeingEdited: number = -1;

  private _entityKeys = new WeakMap<LovelaceRowConfig, string>();

  private _sortable?: SortableInstance;

  public connectedCallback(): void {
    super.connectedCallback();
    void loadHaForm();
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._destroySortable();
  }

  private _editRowElement(index: number): void {
    this._indexBeingEdited = index;
  }

  private _getKey(action: LovelaceRowConfig) {
    if (!this._entityKeys.has(action)) {
      this._entityKeys.set(action, Math.random().toString());
    }

    return this._entityKeys.get(action)!;
  }

  protected render() {
    if (!this.entities || !this.hass) {
      return html` <p>No entities configured.</p> `;
    }

    if (this._indexBeingEdited !== -1) {
      return html`
        <div class="individual-header">
          <h4>${this._indexBeingEdited + 1} / ${this.entities.length} ${localize("editor.individual")}</h4>
          <ha-icon-button
            .label=${this.hass!.localize("ui.components.entity.entity-picker.clear")}
            .path=${mdiClose}
            class="remove-icon"
            @click=${() => (this._indexBeingEdited = -1)}
          ></ha-icon-button>
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${this.entities[this._indexBeingEdited]}
          .schema=${individualSchema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._configChanged}
        ></ha-form>
      `;
    }

    return html`
      <div class="entities">
        ${repeat(
          this.entities,
          (entityConf) => this._getKey(entityConf),
          (entityConf, index) => html`
            <div class="entity">
              <div class="handle">
                <ha-svg-icon .path=${mdiDrag}></ha-svg-icon>
              </div>
              ${entityConf.type
                ? html`
                    <div class="special-row">
                      <div>
                        <span> ${this.hass!.localize(`ui.panel.lovelace.editor.card.entities.entity_row.${entityConf.type}`)} </span>
                        <span class="secondary">${this.hass!.localize("ui.panel.lovelace.editor.card.entities.edit_special_row")}</span>
                      </div>
                    </div>
                  `
                : html`
                    <ha-entity-picker
                      allow-custom-entity
                      hideClearIcon
                      .hass=${this.hass}
                      .value=${(entityConf as EntityConfig).entity}
                      .index=${index}
                      @value-changed=${this._valueChanged}
                    ></ha-entity-picker>
                  `}
              <ha-icon-button
                .label=${this.hass!.localize("ui.components.entity.entity-picker.clear")}
                .path=${mdiClose}
                class="remove-icon"
                .index=${index}
                @click=${this._removeRow}
              ></ha-icon-button>
              <ha-icon-button
                .label=${this.hass!.localize("ui.components.entity.entity-picker.edit")}
                .path=${mdiPencil}
                class="edit-icon"
                .index=${index}
                @click=${() => this._editRowElement(index)}
              ></ha-icon-button>
            </div>
          `
        )}
      </div>
      <ha-entity-picker class="add-entity" .hass=${this.hass} @value-changed=${this._addEntity}></ha-entity-picker>
    `;
  }

  private _configChanged(ev: any): void {
    const newRowConfig = ev.detail.value || "";

    if (!this.config || !this.hass) {
      return;
    }

    if (!Array.isArray(this.config.entities.individual)) {
      this.config.entities.individual = [];
    }
    const individualConfig = [...this.config.entities.individual];
    if (!individualConfig) return;

    individualConfig[this._indexBeingEdited] = newRowConfig;

    const config = {
      ...this.config,
      entities: {
        ...this.config.entities,
        individual: individualConfig,
      },
    };

    fireEvent(this, "config-changed", { config });
  }

  protected firstUpdated(): void {
    this._createSortable();
  }

  private _computeLabelCallback = (schema: any) =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) || localize(`editor.${schema?.name}`);

  private async _createSortable() {
    const Sortable = await loadSortable();
    this._sortable = new Sortable(this.shadowRoot!.querySelector(".entities")!, {
      animation: 150,
      fallbackClass: "sortable-fallback",
      handle: ".handle",
      onChoose: (evt: SortableEvent) => {
        (evt.item as any).placeholder = document.createComment("sort-placeholder");
        evt.item.after((evt.item as any).placeholder);
      },
      onEnd: (evt: SortableEvent) => {
        // put back in original location
        if ((evt.item as any).placeholder) {
          (evt.item as any).placeholder.replaceWith(evt.item);
          delete (evt.item as any).placeholder;
        }
        this._rowMoved(evt);
      },
    });
  }

  private _destroySortable() {
    this._sortable?.destroy();
    this._sortable = undefined;
  }

  private async _addEntity(ev: CustomEvent): Promise<void> {
    const value = ev.detail.value;
    if (value === "") {
      return;
    }

    const newConfigEntities = this.entities!.concat({
      entity: value as string,
    });
    (ev.target as any).value = "";
    fireEvent(this, "entities-changed", { entities: newConfigEntities });
  }

  private _rowMoved(ev: SortableEvent): void {
    if (ev.oldIndex === ev.newIndex) {
      return;
    }

    const newEntities = this.entities!.concat();

    newEntities.splice(ev.newIndex!, 0, newEntities.splice(ev.oldIndex!, 1)[0]);

    fireEvent(this, "entities-changed", { entities: newEntities });
  }

  private _removeRow(ev: CustomEvent): void {
    const index = (ev.currentTarget as any).index;
    const newConfigEntities = this.entities!.concat();

    newConfigEntities.splice(index, 1);

    fireEvent(this, "entities-changed", { entities: newConfigEntities });
  }

  private _valueChanged(ev: CustomEvent): void {
    const value = ev.detail.value;
    const index = (ev.target as any).index;
    const newConfigEntities = this.entities!.concat();

    if (value === "" || value === undefined) {
      newConfigEntities.splice(index, 1);
    } else {
      newConfigEntities[index] = {
        ...newConfigEntities[index],
        entity: value!,
      };
    }

    fireEvent(this, "entities-changed", { entities: newConfigEntities });
  }

  private _editRow(ev: CustomEvent): void {
    const index = (ev.currentTarget as any).index;
    fireEvent(this, "edit-detail-element", {
      subElementConfig: {
        index,
        type: "row",
        elementConfig: this.entities![index],
      },
    });
  }

  static get styles(): CSSResultGroup {
    return [
      sortableStyles,
      css`
        ha-entity-picker {
          margin-top: 8px;
        }

        .individual-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-inline: 0.2rem;
          margin-bottom: 1rem;
        }

        .add-entity {
          display: block;
          margin-left: 31px;
          margin-right: 71px;
          margin-inline-start: 31px;
          margin-inline-end: 71px;
          direction: var(--direction);
        }
        .entity {
          display: flex;
          align-items: center;
        }

        .entity .handle {
          padding-right: 8px;
          cursor: move;
          padding-inline-end: 8px;
          padding-inline-start: initial;
          direction: var(--direction);
        }
        .entity .handle > * {
          pointer-events: none;
        }

        .entity ha-entity-picker {
          flex-grow: 1;
        }

        .special-row {
          height: 60px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-grow: 1;
        }

        .special-row div {
          display: flex;
          flex-direction: column;
        }

        .remove-icon,
        .edit-icon {
          --mdc-icon-button-size: 36px;
          color: var(--secondary-text-color);
        }

        .secondary {
          font-size: 12px;
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "individual-row-editor": IndividualRowEditor;
  }
}

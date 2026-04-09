import { mdiClose, mdiPencil } from "@mdi/js";
import { fireEvent, HomeAssistant } from "custom-card-helpers";
import { css, html, LitElement, nothing, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { STICKERS_CONFIG_CHANGED_EVENT, STICKERS_EDITOR_ACTIVE_ATTRIBUTE, StickersConfigChangedDetail } from "@/stickers-events";
import localize from "@/localize/localize";
import { StickerConfig } from "@/type";
import { getStickerSchema } from "@/ui-editor/schema/sticker";
import { loadHaForm } from "@/ui-editor/utils/load-ha-form";
import { isStickerAnchor } from "@/utils/sticker-anchor";

const DEFAULT_SCALE = 100;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const normalizeAnchor = (anchor: unknown): StickerConfig["anchor"] => (isStickerAnchor(anchor) ? anchor : undefined);
const toOptionalNumber = (value: unknown): number | undefined => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const getStickerIcon = (hass: HomeAssistant, entityId: string): string =>
  hass.states[entityId]?.attributes?.icon || "mdi:circle-outline";

const getStickerName = (hass: HomeAssistant, entityId: string): string =>
  hass.states[entityId]?.attributes?.friendly_name || entityId;

const getNormalizedStickerIcon = (hass: HomeAssistant, sticker: StickerConfig): string => {
  if (sticker.icon === "" || sticker.icon === " ") return "";
  if (typeof sticker.icon === "string") return sticker.icon;
  return getStickerIcon(hass, sticker.entity);
};

@customElement("stickers-editor")
export class StickersEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public config!: PowerFlowCardPlusConfig;

  @state() private _editingIndex: number = -1;

  @state() private _draftStickers: StickerConfig[] = [];

  public connectedCallback(): void {
    super.connectedCallback();
    void loadHaForm();
    document.body?.setAttribute(STICKERS_EDITOR_ACTIVE_ATTRIBUTE, "true");
    window.addEventListener(STICKERS_CONFIG_CHANGED_EVENT, this._handlePreviewDragConfigChanged as EventListener);
  }

  public disconnectedCallback(): void {
    document.body?.removeAttribute(STICKERS_EDITOR_ACTIVE_ATTRIBUTE);
    window.removeEventListener(STICKERS_CONFIG_CHANGED_EVENT, this._handlePreviewDragConfigChanged as EventListener);
    super.disconnectedCallback();
  }

  protected willUpdate(changedProps: PropertyValues): void {
    if (changedProps.has("config") && this.hass) {
      this._syncDraftStickers();
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.config || !this.hass) {
      return nothing;
    }

    const stickers = this._draftStickers;
    const editingSticker = this._editingIndex !== -1 ? stickers[this._editingIndex] : undefined;

    if (editingSticker) {
      return html`
        <div class="editor-header">
          <div>
            <h4>${this._getStickerTitle(editingSticker, this._editingIndex)}</h4>
            <p>${localize("editor.stickers")}</p>
          </div>
          <ha-icon-button
            .label=${this.hass.localize("ui.components.entity.entity-picker.clear")}
            .path=${mdiClose}
            @click=${this._closeEditor}
          ></ha-icon-button>
        </div>

        <ha-form
          .hass=${this.hass}
          .data=${editingSticker}
          .schema=${getStickerSchema(this.config, this.hass)}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._stickerConfigChanged}
        ></ha-form>
        <p class="preview-copy">${localize("editor.stickers_preview_copy") || "Drag stickers directly in the card preview on the right."}</p>
      `;
    }

    return html`
      <div class="entities">
        ${stickers.length
          ? stickers.map(
              (sticker, index) => html`
                <div class="entity">
                  <div class="handle">
                    ${getNormalizedStickerIcon(this.hass, sticker) ? html`<ha-icon .icon=${getNormalizedStickerIcon(this.hass, sticker)}></ha-icon>` : nothing}
                  </div>
                  <button class="entity-main" type="button" @click=${() => this._openEditor(index)}>
                    <span class="entity-title">${this._getStickerTitle(sticker, index)}</span>
                  </button>
                  <ha-icon-button
                    .label=${this.hass.localize("ui.components.entity.entity-picker.edit")}
                    .path=${mdiPencil}
                    @click=${() => this._openEditor(index)}
                  ></ha-icon-button>
                  <ha-icon-button
                    .label=${this.hass.localize("ui.components.entity.entity-picker.clear")}
                    .path=${mdiClose}
                    @click=${() => this._removeSticker(index)}
                  ></ha-icon-button>
                </div>
              `
            )
          : html`<p class="empty-state">${localize("editor.no_stickers") || "No stickers configured yet."}</p>`}
      </div>

      <ha-entity-picker class="add-entity" .hass=${this.hass} @value-changed=${this._addSticker}></ha-entity-picker>
    `;
  }

  private _syncDraftStickers(): void {
    const stickers = this.config?.stickers || [];
    this._draftStickers = stickers.map((sticker, index) => this._normalizeSticker(sticker, index));

    if (this._editingIndex >= this._draftStickers.length) {
      this._editingIndex = this._draftStickers.length - 1;
    }
  }

  private _normalizeSticker(sticker: StickerConfig, index: number): StickerConfig {
    return {
      entity: sticker.entity,
      name: sticker.name ?? "",
      icon: getNormalizedStickerIcon(this.hass, sticker),
      anchor: normalizeAnchor(sticker.anchor),
      hide_with_anchor: sticker.hide_with_anchor !== false,
      offset_x: toOptionalNumber(sticker.offset_x) ?? 0,
      offset_y: toOptionalNumber(sticker.offset_y) ?? 0,
      name_inside_circle: sticker.name_inside_circle !== false,
      show_circle: sticker.show_circle !== false,
      inherit_circle_color: sticker.inherit_circle_color !== false,
      unit_white_space: sticker.unit_white_space !== false,
      x_position: clamp(Number(sticker.x_position ?? 24 + (index % 4) * 16), 0, 100),
      y_position: clamp(Number(sticker.y_position ?? 24 + (index % 3) * 18), 0, 100),
      scale: clamp(Number(sticker.scale ?? DEFAULT_SCALE), 1, 100),
    };
  }

  private _emitConfig(stickers: StickerConfig[] = this._draftStickers): void {
    if (!this.config) {
      return;
    }

    fireEvent(this, "config-changed", {
      config: {
        ...this.config,
        stickers,
      },
    });
  }

  private _openEditor(index: number): void {
    this._editingIndex = index;
  }

  private _closeEditor = (): void => {
    this._editingIndex = -1;
  };

  private _addSticker(ev: CustomEvent): void {
    const value = ev.detail.value as string;
    if (!value) {
      return;
    }

    const next = [
      ...this._draftStickers,
      this._normalizeSticker(
        {
          entity: value,
        },
        this._draftStickers.length
      ),
    ];

    this._draftStickers = next;
    this._editingIndex = next.length - 1;
    (ev.target as any).value = "";
    this._emitConfig(next);
  }

  private _removeSticker(index: number): void {
    const next = this._draftStickers.filter((_, currentIndex) => currentIndex !== index);
    this._draftStickers = next;

    if (this._editingIndex === index) {
      this._editingIndex = -1;
    } else if (this._editingIndex > index) {
      this._editingIndex -= 1;
    }

    this._emitConfig(next);
  }

  private _stickerConfigChanged(ev: CustomEvent): void {
    if (this._editingIndex === -1) {
      return;
    }

    const currentSticker = this._draftStickers[this._editingIndex];
    const value = ev.detail.value || {};
    let normalizedValue =
      "icon" in value && !value.icon
        ? {
            ...value,
            icon: "",
          }
        : value;

    if ("entity" in normalizedValue && normalizedValue.entity && normalizedValue.entity !== currentSticker?.entity && !("icon" in value)) {
      normalizedValue = {
        ...normalizedValue,
        icon: getStickerIcon(this.hass, normalizedValue.entity),
      };
    }

    if ("anchor" in normalizedValue) {
      const nextAnchor = normalizeAnchor(normalizedValue.anchor);
      normalizedValue = nextAnchor
        ? {
            ...normalizedValue,
            anchor: nextAnchor,
            offset_x: currentSticker?.anchor ? (toOptionalNumber(currentSticker.offset_x) ?? 0) : 0,
            offset_y: currentSticker?.anchor ? (toOptionalNumber(currentSticker.offset_y) ?? 0) : 0,
          }
        : {
            ...normalizedValue,
            anchor: undefined,
            offset_x: undefined,
            offset_y: undefined,
          };
    }

    const next = [...this._draftStickers];
    next[this._editingIndex] = this._normalizeSticker(
      {
        ...currentSticker,
        ...normalizedValue,
      },
      this._editingIndex
    );

    this._draftStickers = next;
    this._emitConfig(next);
  }

  private _computeLabelCallback = (schema: any) => {
    const customLabelKey = `editor.${schema?.name}`;
    const customLabel = localize(customLabelKey);

    return (
      schema?.label ||
      this.hass.localize(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) ||
      (customLabel !== customLabelKey ? customLabel : undefined) ||
      schema?.name
    );
  };

  private _getStickerTitle(sticker: StickerConfig, index: number): string {
    return sticker.name || getStickerName(this.hass, sticker.entity) || sticker.entity || `Sticker ${index + 1}`;
  }

  private _handlePreviewDragConfigChanged = (event: Event): void => {
    const customEvent = event as CustomEvent<StickersConfigChangedDetail>;
    const stickers = customEvent.detail?.stickers;
    if (!stickers?.length && stickers?.length !== 0) {
      return;
    }

    this._draftStickers = stickers.map((sticker, index) => this._normalizeSticker(sticker, index));
    if (typeof customEvent.detail?.index === "number") {
      this._editingIndex = customEvent.detail.index;
    }
    this._emitConfig(this._draftStickers);
  };

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .entities {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .entity {
        display: grid;
        grid-template-columns: 32px 1fr auto auto;
        gap: 8px;
        align-items: center;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 8px;
      }

      .entity-main {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        background: none;
        border: 0;
        color: inherit;
        cursor: pointer;
        padding: 0;
        text-align: left;
      }

      .entity-title {
        font-weight: 600;
      }

      .secondary,
      .empty-state,
      .editor-header p,
      .preview-copy {
        color: var(--secondary-text-color);
      }

      .handle {
        display: flex;
        justify-content: center;
        color: var(--secondary-text-color);
      }

      .add-entity {
        width: 100%;
      }

      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .editor-header h4,
      .editor-header p {
        margin: 0;
      }

      .preview-copy {
        margin: 0;
        line-height: 1.4;
      }

    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "stickers-editor": StickersEditor;
  }
}

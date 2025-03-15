import { mdiChevronRight } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit-element";
import { fireEvent } from "custom-card-helpers";

@customElement("link-subpage")
export class LinkSubpage extends LitElement {
  @property({ type: String }) path!: string;

  @property({ type: Boolean, reflect: true }) outlined = false;

  @property({ type: Boolean, reflect: true }) leftChevron = false;

  @property() header?: string;

  @property({ type: String }) icon = "mdi:format-list-bulleted-type";

  @property() secondary?: string;

  @query(".container") private _container!: HTMLDivElement;

  protected render(): TemplateResult {
    return html`
      <div
        class="link-subpage"
        @click=${this._openSubElementPage}
        @keydown=${this._openSubElementPage}
        @focus=${this._focusChanged}
        @blur=${this._focusChanged}
        role="button"
      >
        <ha-icon icon=${this.icon} class="summary-icon"></ha-icon>
        <slot name="header">
          <div class="header">
            ${this.header}
            <slot class="secondary" name="secondary">${this.secondary}</slot>
          </div>
        </slot>
        <ha-svg-icon .path=${mdiChevronRight} class="summary-icon-right"></ha-svg-icon>
      </div>
    `;
  }

  private _focusChanged(ev) {
    this.shadowRoot!.querySelector(".top")!.classList.toggle("focused", ev.type === "focus");
  }

  private _openSubElementPage(): void {
    fireEvent(this, "open-sub-element-editor", { open: true });
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }

      :host([outlined]) {
        box-shadow: none;
        border-width: 1px;
        border-style: solid;
        border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
        border-radius: var(--ha-card-border-radius, 12px);
      }

      :host([leftchevron]) .summary-icon {
        margin-left: 0;
        margin-right: 8px;
      }

      .link-subpage {
        width: 100%;
        display: flex;
        gap: 1rem;
        padding: var(--expansion-panel-summary-padding, 0 8px);
        min-height: 48px;
        align-items: center;
        cursor: pointer;
        overflow: hidden;
        font-weight: 500;
        outline: none;
      }

      .summary-icon {
        transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
        direction: var(--direction);
        color: var(--secondary-text-color);
      }

      .header,
      ::slotted([slot="header"]) {
        flex: 1;
      }

      .container {
        padding: var(--expansion-panel-content-padding, 0 8px);
        overflow: hidden;
        transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1);
        height: 0px;
      }

      .container.expanded {
        height: auto;
      }

      .secondary {
        display: block;
        color: var(--secondary-text-color);
        font-size: 12px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "link-subpage": LinkSubpage;
  }

  // for fire event
  interface HASSDomEvents {
    "open-sub-element-editor": {
      open: boolean;
    };
  }
}

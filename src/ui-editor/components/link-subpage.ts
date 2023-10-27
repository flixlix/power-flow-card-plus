import { mdiChevronRight } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit-element";
import { fireEvent } from "custom-card-helpers";
import { IndividualField } from "../../power-flow-card-plus-config";

const afterNextRender = (cb: (value: unknown) => void): void => {
  requestAnimationFrame(() => setTimeout(cb, 0));
};

const nextRender = () =>
  new Promise((resolve) => {
    afterNextRender(resolve);
  });

@customElement("link-subpage")
export class LinkSubpage extends LitElement {
  @property({ type: String }) path!: string;

  @property({ type: Boolean, reflect: true }) outlined = false;

  @property({ type: Boolean, reflect: true }) leftChevron = false;

  @property() header?: string;

  @property() secondary?: string;

  @query(".container") private _container!: HTMLDivElement;

  protected render(): TemplateResult {
    return html`
      <div class="top">
        <div
          id="summary"
          @click=${this._openSubElementPage}
          @keydown=${this._openSubElementPage}
          @focus=${this._focusChanged}
          @blur=${this._focusChanged}
          role="button"
        >
          <slot name="header">
            <div class="header">
              ${this.header}
              <slot class="secondary" name="secondary">${this.secondary}</slot>
            </div>
          </slot>
          <ha-svg-icon .path=${mdiChevronRight} class="summary-icon-right"></ha-svg-icon>
        </div>
        <slot name="icons"></slot>
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

      .top {
        display: flex;
        align-items: center;
        border-radius: var(--ha-card-border-radius, 12px);
      }

      .top.expanded {
        border-bottom-left-radius: 0px;
        border-bottom-right-radius: 0px;
      }

      .top.focused {
        background: var(--input-fill-color);
      }

      :host([outlined]) {
        box-shadow: none;
        border-width: 1px;
        border-style: solid;
        border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
        border-radius: var(--ha-card-border-radius, 12px);
      }

      .summary-icon {
        margin-left: 8px;
      }

      :host([leftchevron]) .summary-icon {
        margin-left: 0;
        margin-right: 8px;
      }

      #summary {
        flex: 1;
        display: flex;
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
      }

      .summary-icon.expanded {
        transform: rotate(180deg);
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

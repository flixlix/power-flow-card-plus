import { html } from "lit";
import { PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";
import { PowerFlowCardPlus } from "../../power-flow-card-plus";

type BaseSecondarySpan = {
  main: PowerFlowCardPlus;
  className: string;
  template?: string;
  value?: string;
  entityId?: string;
  icon?: string;
};

export const baseSecondarySpan = ({ main, className, template, value, entityId, icon }: BaseSecondarySpan) => {
  if (value || template) {
    return html`<span
      class="secondary-info ${className}"
      @click=${(e: { stopPropagation: () => void }) => {
        main.openDetails(e, entityId);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
        if (e.key === "Enter") {
          main.openDetails(e, entityId);
        }
      }}
    >
      ${icon ? html`<ha-icon class="secondary-info small" .icon=${icon}></ha-icon>` : ""} ${template ?? value}</span
    >`;
  }
  return html``;
};

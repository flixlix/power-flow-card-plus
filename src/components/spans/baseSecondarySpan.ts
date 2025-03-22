import { html } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { offlineStr } from "@/type";
import { ActionConfig } from "custom-card-helpers";

type BaseSecondarySpan = {
  main: PowerFlowCardPlus;
  className: string;
  template?: string;
  value?: string;
  entityId?: string;
  icon?: string;
  tap_action?: ActionConfig;
};

export const baseSecondarySpan = ({ main, className, template, value, entityId, icon, tap_action }: BaseSecondarySpan) => {
  if (value && offlineStr.includes(value)) return html``;
  if (value || template) {
    return html`<span
      class="secondary-info ${className}"
      @click=${(e: { stopPropagation: () => void; key?: string | undefined; target: HTMLElement }) => {
        main.openDetails(e, tap_action, entityId);
      }}
      @keyDown=${(e: { stopPropagation: () => void; key?: string | undefined; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, tap_action, entityId);
        }
      }}
    >
      ${icon ? html`<ha-icon class="secondary-info small" .icon=${icon}></ha-icon>` : ""} ${template ?? value}</span
    >`;
  }
  return html``;
};

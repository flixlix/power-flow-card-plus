import { html, nothing } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { ActionConfigSet, offlineStr } from "@/type";

type BaseSecondarySpan = {
  main: PowerFlowCardPlus;
  className: string;
  template?: string;
  value?: string;
  entityId?: string;
  icon?: string;
  actions?: ActionConfigSet;
};

export const baseSecondarySpan = ({ main, className, template, value, entityId, icon, actions }: BaseSecondarySpan) => {
  if (value && offlineStr.includes(value)) return nothing;
  if (value || template) {
    return html`<span
      class="secondary-info ${className}"
      @click=${(e: MouseEvent) => {
        e.stopPropagation();
        main.onEntityClick(e, actions, entityId);
      }}
      @dblclick=${(e: MouseEvent) => {
        e.stopPropagation();
        main.onEntityDoubleClick(e, actions, entityId);
      }}
      @pointerdown=${(e: PointerEvent) => {
        e.stopPropagation();
        main.onEntityPointerDown(e, actions, entityId);
      }}
      @pointerup=${(e: PointerEvent) => {
        e.stopPropagation();
        main.onEntityPointerUp(e);
      }}
      @pointercancel=${(e: PointerEvent) => {
        e.stopPropagation();
        main.onEntityPointerUp(e);
      }}
      @keyDown=${(e: { stopPropagation: () => void; key?: string | undefined; target: HTMLElement }) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          main.openDetails(e, actions, entityId, "tap");
        }
      }}
    >
      ${icon ? html`<ha-icon class="secondary-info small" .icon=${icon}></ha-icon>` : nothing} ${template ?? value}</span
    >`;
  }
  return nothing;
};

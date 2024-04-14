import { html } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { ConfigEntities, PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { displayValue } from "../utils/displayValue";

export const batteryElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  {
    battery,
    entities,
  }: {
    battery: any;
    entities: ConfigEntities;
  }
) => {
  return html`<div class="circle-container battery">
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void }) => {
        const target = entities.battery?.state_of_charge!
          ? entities.battery?.state_of_charge!
          : typeof entities.battery?.entity === "string"
          ? entities.battery?.entity!
          : entities.battery?.entity!.production;
        main.openDetails(e, target);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
        if (e.key === "Enter") {
          const target = entities.battery?.state_of_charge!
            ? entities.battery?.state_of_charge!
            : typeof entities.battery!.entity === "string"
            ? entities.battery!.entity!
            : entities.battery!.entity!.production;
          main.openDetails(e, target);
        }
      }}
    >
      ${battery.state_of_charge.state !== null
        ? html` <span
            @click=${(e: { stopPropagation: () => void }) => {
              main.openDetails(e, entities.battery?.state_of_charge!);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
              if (e.key === "Enter") {
                main.openDetails(e, entities.battery?.state_of_charge!);
              }
            }}
            id="battery-state-of-charge-text"
          >
            ${displayValue(
              main.hass,
              battery.state_of_charge.state,
              entities?.battery?.state_of_charge_unit ?? battery.unit ?? "%",
              entities?.battery?.state_of_charge_unit_white_space,
              entities?.battery?.state_of_charge_decimals,
              undefined,
              config.watt_threshold
            )}
          </span>`
        : null}
      <ha-icon
        .icon=${battery.icon}
        @click=${(e: { stopPropagation: () => void }) => {
          main.openDetails(e, entities.battery?.state_of_charge!);
        }}
        @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
          if (e.key === "Enter") {
            main.openDetails(e, entities.battery?.state_of_charge!);
          }
        }}
      ></ha-icon>
      ${entities.battery?.display_state === "two_way" ||
      entities.battery?.display_state === undefined ||
      (entities.battery?.display_state === "one_way_no_zero" && battery.state.toBattery > 0) ||
      (entities.battery?.display_state === "one_way" && battery.state.toBattery !== 0)
        ? html`<span
            class="battery-in"
            @click=${(e: { stopPropagation: () => void }) => {
              const target = typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.production!;

              main.openDetails(e, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
              if (e.key === "Enter") {
                const target = typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.production!;

                main.openDetails(e, target);
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-down"}></ha-icon>
            ${displayValue(
              main.hass,
              battery.state.toBattery,
              battery.unit,
              battery.unit_white_space,
              battery.decimals,
              undefined,
              config.watt_threshold
            )}</span
          >`
        : ""}
      ${entities.battery?.display_state === "two_way" ||
      entities.battery?.display_state === undefined ||
      (entities.battery?.display_state === "one_way_no_zero" && battery.state.fromBattery > 0) ||
      (entities.battery?.display_state === "one_way" && (battery.state.toBattery === 0 || battery.state.fromBattery !== 0))
        ? html`<span
            class="battery-out"
            @click=${(e: { stopPropagation: () => void }) => {
              const target = typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.consumption!;

              main.openDetails(e, target);
            }}
            @keyDown=${(e: { key: string; stopPropagation: () => void }) => {
              if (e.key === "Enter") {
                const target = typeof entities.battery!.entity === "string" ? entities.battery!.entity! : entities.battery!.entity!.consumption!;

                main.openDetails(e, target);
              }
            }}
          >
            <ha-icon class="small" .icon=${"mdi:arrow-up"}></ha-icon>
            ${displayValue(
              main.hass,
              battery.state.fromBattery,
              battery.unit,
              battery.unit_white_space,
              battery.decimals,
              undefined,
              config.watt_threshold
            )}</span
          >`
        : ""}
    </div>
    <span class="label">${battery.name}</span>
  </div>`;
};

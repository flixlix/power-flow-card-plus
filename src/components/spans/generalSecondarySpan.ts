import { html } from "lit";
import { baseSecondarySpan } from "./baseSecondarySpan";
import { ActionConfig, HomeAssistant } from "custom-card-helpers";
import { displayValue } from "@/utils/displayValue";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { TemplatesObj } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";

export const generalSecondarySpan = (
  hass: HomeAssistant,
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  templatesObj: TemplatesObj,
  field: {
    secondary: {
      has: any;
      template: any;
      entity: any;
      icon: any;
      state: string | number | null;
      unit: string | undefined;
      unit_white_space: boolean | undefined;
      decimals: number | undefined;
      accept_negative: boolean | undefined;
      tap_action?: ActionConfig | undefined;
    };
  },
  key: string
) => {
  return html` ${field?.secondary?.has || field?.secondary?.template
    ? html` ${baseSecondarySpan({
        main,
        className: key,
        entityId: field.secondary.entity,
        icon: field.secondary.icon,
        value: displayValue(hass, config, field.secondary.state, {
          unit: field.secondary.unit,
          unitWhiteSpace: field.secondary.unit_white_space,
          decimals: field.secondary.decimals,
          accept_negative: field.secondary.accept_negative,
          watt_threshold: config.watt_threshold,
        }),
        tap_action: field.secondary.tap_action,
        template: templatesObj[`${key}Secondary`],
      })}`
    : ""}`;
};

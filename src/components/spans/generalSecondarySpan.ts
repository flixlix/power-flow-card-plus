import { html } from "lit";
import { baseSecondarySpan } from "./baseSecondarySpan";
import { HomeAssistant } from "custom-card-helpers";
import { displayValue } from "../../utils/displayValue";
import { PowerFlowCardPlus } from "../../power-flow-card-plus";
import { TemplatesObj } from "../../type";
import { PowerFlowCardPlusConfig } from "../../power-flow-card-plus-config";

export const generalSecondarySpan = (
  hass: HomeAssistant,
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  templatesObj: TemplatesObj,
  field,
  key: string
) => {
  return html` ${field?.secondary?.has || field?.secondary?.template
    ? html` ${baseSecondarySpan({
        main,
        className: key,
        entityId: field.secondary.entity,
        icon: field.secondary.icon,
        value: displayValue({
          hass,
          value: field.secondary.state,
          unit: field.secondary.unit,
          unitWhiteSpace: field.secondary.unit_white_space,
          decimals: field.secondary.decimals,
          watt_threshold: config.watt_threshold,
        }),
        template: templatesObj[`${key}Secondary`],
      })}`
    : ""}`;
};

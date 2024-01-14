import { html } from "lit";
import { baseSecondarySpan } from "./baseSecondarySpan";
import { HomeAssistant } from "custom-card-helpers";
import { displayValue } from "../../utils/displayValue";
import { PowerFlowCardPlus } from "../../power-flow-card-plus";
import { TemplatesObj } from "../../type";

export const generalSecondarySpan = (hass: HomeAssistant, main: PowerFlowCardPlus, templatesObj: TemplatesObj, field, key: string) => {
  return html` ${field?.secondary?.has || field?.secondary?.template
    ? html` ${baseSecondarySpan({
        main,
        className: key,
        entityId: field.secondary.entity,
        icon: field.secondary.icon,
        value: displayValue(hass, field.secondary.state, field.secondary.unit, field.secondary.unit_white_space, field.secondary.decimals),
        template: templatesObj[`${key}Secondary`],
      })}`
    : ""}`;
};

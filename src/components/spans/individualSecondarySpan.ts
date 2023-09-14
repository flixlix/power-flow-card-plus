import { HomeAssistant } from "custom-card-helpers";
import { html } from "lit";
import { PowerFlowCardPlus } from "../../power-flow-card-plus";
import { TemplatesObj } from "../../type";
import { displayValue } from "../../utils/displayValue";
import { isNumberValue } from "../../utils/utils";
import { baseSecondarySpan } from "./baseSecondarySpan";


export const individualSecondarySpan = (
  hass: HomeAssistant,
  main: PowerFlowCardPlus,
  templatesObj: TemplatesObj,
  individual: {
    [key: string]: any;
  },
  key: string
) => {
  const templateResult: string = templatesObj[`${key}Secondary`];
  const value = individual.secondary.has
    ? displayValue(hass, individual.secondary.state, individual.secondary.unit, individual.secondary.unit_white_space, individual.secondary.decimals)
    : undefined;
  const passesDisplayZeroCheck =
    individual.secondary.displayZero !== false ||
    (isNumberValue(individual.secondary.state) ? (Number(individual.secondary.state) ?? 0) > (individual.secondary.displayZeroTolerance ?? 0) : true);
  return html` ${(individual.secondary.has && passesDisplayZeroCheck) || templateResult
    ? html`${baseSecondarySpan({
        main: main,
        className: key,
        entityId: individual.secondary.entity,
        icon: individual.secondary.icon,
        value,
        template: templatesObj[`${key}Secondary`],
      })}`
    : ""}`;
};

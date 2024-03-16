import { HomeAssistant } from "custom-card-helpers";
import { html } from "lit";
import { PowerFlowCardPlus } from "../../power-flow-card-plus";
import { TemplatesObj } from "../../type";
import { displayValue } from "../../utils/displayValue";
import { isNumberValue } from "../../utils/utils";
import { baseSecondarySpan } from "./baseSecondarySpan";
import { IndividualObject } from "../../states/raw/individual/getIndividualObject";

export type IndividualKey = `left-top` | `left-bottom` | `right-top` | `right-bottom`;

export const individualSecondarySpan = (
  hass: HomeAssistant,
  main: PowerFlowCardPlus,
  templatesObj: TemplatesObj,
  individual: IndividualObject,
  index: number,
  key: IndividualKey
) => {
  const templateResult: string | undefined = templatesObj.individual[index];

  const value = individual?.secondary?.has
    ? displayValue(
        hass,
        individual?.secondary?.state,
        {
          unit: individual?.secondary?.unit || undefined,
          unitWhiteSpace: individual?.secondary.unit_white_space,
          decimals: individual?.secondary.decimals || 0,
        }
      )
    : undefined;

  const shouldShowSecondary = () => {
    if (!!templateResult) return true;
    if (!individual?.secondary?.state) return false;
    if (!isNumberValue(individual?.secondary?.state)) return true;
    if (individual?.secondary?.displayZero === true) return true;

    const toleranceSet = individual?.secondary?.displayZeroTolerance ?? 0;
    return Number(individual.secondary.state) >= toleranceSet;
  };

  return html` ${shouldShowSecondary()
    ? html`${baseSecondarySpan({
        main: main,
        className: key,
        entityId: individual?.secondary.entity || undefined,
        icon: individual?.secondary?.icon || undefined,
        value,
        template: templatesObj.individual[index] || undefined,
      })}`
    : ""}`;
};

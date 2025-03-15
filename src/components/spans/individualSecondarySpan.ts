import { HomeAssistant } from "custom-card-helpers";
import { html } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { TemplatesObj } from "@/type";
import { displayValue } from "@/utils/displayValue";
import { isNumberValue } from "@/utils/utils";
import { baseSecondarySpan } from "./baseSecondarySpan";
import { IndividualObject } from "@/states/raw/individual/getIndividualObject";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";

export type IndividualKey = `left-top` | `left-bottom` | `right-top` | `right-bottom`;

export const individualSecondarySpan = (
  hass: HomeAssistant,
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  templatesObj: TemplatesObj,
  individual: IndividualObject,
  index: number,
  key: IndividualKey
) => {
  const templateResult: string | undefined = templatesObj.individual[index];

  const value = individual?.secondary?.has
    ? displayValue(hass, config, individual?.secondary?.state, {
        unit: individual?.secondary?.unit || undefined,
        unitWhiteSpace: individual?.secondary?.unit_white_space,
        decimals: individual?.secondary?.decimals || 0,
        accept_negative: individual?.secondary?.accept_negative || false,
        watt_threshold: config.watt_threshold,
      })
    : undefined;

  const shouldShowSecondary = () => {
    if (!!templateResult) return true;
    if (individual?.secondary?.displayZero === true) return true;
    if (!individual?.secondary?.state) return false;
    if (!isNumberValue(individual?.secondary?.state)) return true;

    const toleranceSet = individual?.secondary?.displayZeroTolerance ?? 0;
    return (
      Number(individual.secondary.state) >= toleranceSet ||
      (individual.secondary.accept_negative && typeof Number(+individual.secondary.state) === "number")
    );
  };

  return html` ${shouldShowSecondary()
    ? html`${baseSecondarySpan({
        main: main,
        className: key,
        entityId: individual?.secondary.entity || undefined,
        icon: individual?.secondary?.icon || undefined,
        value,
        template: templatesObj.individual[index] || undefined,
        tap_action: individual?.secondary?.tap_action || undefined,
      })}`
    : ""}`;
};

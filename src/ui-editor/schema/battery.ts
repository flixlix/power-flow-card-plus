/* eslint-disable import/extensions */
import { getEntityCombinedSelectionSchema, getEntitySeparatedSelectionSchema, getBaseMainConfigSchema } from "./_schema-base";

export const batterySchema = [
  getEntityCombinedSelectionSchema("Battery"),
  getEntitySeparatedSelectionSchema("Battery"),
  {
    name: "state_of_charge",
    label: "State of Charge Entity",
    selector: { entity: {} },
  },
  getBaseMainConfigSchema("battery"),
] as const;

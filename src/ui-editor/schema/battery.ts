/* eslint-disable import/extensions */
import { getEntityCombinedSelectionSchema, getEntitySeparatedSelectionSchema, getBaseMainConfigSchema, customColorsSchema } from "./_schema-base";

const mainSchema = {
  ...getBaseMainConfigSchema("battery"),
  schema: [
    ...getBaseMainConfigSchema("battery").schema,
    {
      name: "color_state_of_charge_value",
      label: "Color State of Charge Value",
      selector: {
        select: {
          options: [
            { value: false, label: "Do Not Color" },
            { value: true, label: "Color dynamically" },
            { value: "consumption", label: "Consumption" },
            { value: "production", label: "Production" },
          ],
          custom_value: true,
        },
      },
    },
    {
      name: "invert_state",
      label: "Invert State",
      selector: { boolean: {} },
    },
  ],
};

export const batterySchema = [
  getEntityCombinedSelectionSchema("battery"),
  getEntitySeparatedSelectionSchema("battery"),
  {
    name: "state_of_charge",
    label: "State of Charge Entity",
    selector: { entity: {} },
  },
  mainSchema,
  customColorsSchema,
] as const;

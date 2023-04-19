/* eslint-disable import/extensions */
import { getBaseMainConfigSchema, secondaryInfoSchema } from "./_schema-base";

const mainSchema = {
  ...getBaseMainConfigSchema(),
  schema: [
    ...getBaseMainConfigSchema().schema,
    {
      name: "color_value",
      label: "Color Value",
      selector: {
        select: {
          options: [
            { value: "true", label: "True" },
            { value: "false", label: "False" },
            { value: "solar", label: "Solar" },
            { value: "grid", label: "Grid" },
            { value: "battery", label: "Battery" },
          ],
          custom_value: true,
        },
      },
    },
    {
      name: "color_icon",
      label: "Color Icon",
      selector: {
        select: {
          options: [
            { value: "true", label: "True" },
            { value: "false", label: "False" },
            { value: "solar", label: "Solar" },
            { value: "grid", label: "Grid" },
            { value: "battery", label: "Battery" },
          ],
          custom_value: true,
        },
      },
    },
    {
      name: "subtract_individual",
      label: "Subtract Individual",
      selector: { boolean: {} },
    },
    {
      name: "override_state",
      label: "Override State (With Home Entity)",
      selector: { boolean: {} },
    },
    {
      name: "display_zero_state",
      label: "Display State When Zero?",
      selector: { boolean: {} },
    }
  ],
};

export const homeSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  mainSchema,
  {
    title: "Secondary Info",
    name: "secondary_info",
    type: "expandable",
    schema: secondaryInfoSchema,
  },
] as const;

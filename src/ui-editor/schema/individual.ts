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
      selector: { boolean: {} },
    },
    {
      name: "unit_of_measurement",
      label: "Unit of Measurement",
      selector: { string: {} },
    },
    {
      name: "display_zero",
      label: "Display Zero",
      selector: { boolean: {} },
    },

    {
      name: "inverted_animation",
      label: "Invert Animation",
      selector: { boolean: {} },
    },
    {
      name: "display_zero_tolerance",
      label: "Display Zero Tolerance",
      selector: { number: { mode: "box", min: 0, max: 1000000, step: 0.1 } },
    },
  ],
};

export const individualSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  mainSchema,
  {
    name: "color",
    label: "Color",
    selector: { color_rgb: {} },
  },
  {
    title: "Secondary Info",
    name: "secondary_info",
    type: "expandable",
    schema: secondaryInfoSchema,
  },
] as const;

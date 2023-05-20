/* eslint-disable import/extensions */
import { getBaseMainConfigSchema, secondaryInfoSchema } from "./_schema-base";

const mainSchema = {
  ...getBaseMainConfigSchema(),
  schema: [
    ...getBaseMainConfigSchema().schema,
    {
      name: "color_value",
      label: "Color Value",
      selector: { boolean: {} },
    },
    {
      name: "color_icon",
      label: "Color Icon",
      selector: { boolean: {} },
    },
    {
      name: "unit_of_measurement",
      label: "Unit of Measurement",
      selector: { text: {} },
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
    {
      name: "display_zero_state",
      label: "Display Zero State",
      selector: { boolean: {} },
    },
    {
      name: "decimals",
      label: "Decimals",
      selector: { number: { mode: "box", min: 0, max: 4, step: 1 } },
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

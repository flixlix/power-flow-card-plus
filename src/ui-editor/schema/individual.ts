import { getBaseMainConfigSchema, secondaryInfoSchema, tapActionSchema } from "./_schema-base";
import localize from "@/localize/localize";

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
      name: "display_zero",
      label: "Display Zero",
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
      name: "unit_of_measurement",
      label: "Unit of Measurement",
      selector: { text: {} },
    },
    {
      name: "calculate_flow_rate",
      label: "Calculate Flow Rate",
      selector: { boolean: {} },
    },
    {
      name: "decimals",
      label: "Decimals",
      selector: { number: { mode: "box", min: 0, max: 4, step: 1 } },
    },
    {
      name: "inverted_animation",
      label: "Invert Animation",
      selector: { boolean: {} },
    },
    {
      name: "show_direction",
      label: "Show Direction",
      selector: { boolean: {} },
    },
    {
      name: "unit_white_space",
      label: "Unit White Space",
      default: true,
      selector: { boolean: {} },
    },
    {
      name: "use_metadata",
      label: "Use Metadata",
      selector: { boolean: {} },
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
    title: localize("editor.secondary_info"),
    name: "secondary_info",
    type: "expandable",
    schema: secondaryInfoSchema,
  },
  {
    title: localize("editor.tap_action"),
    name: "",
    type: "expandable",
    schema: tapActionSchema,
  },
] as const;

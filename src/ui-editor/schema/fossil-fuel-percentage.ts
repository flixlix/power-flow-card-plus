import { secondaryInfoSchema, getBaseMainConfigSchema, actionSchema } from "./_schema-base";
import localize from "@/localize/localize";

const mainSchema = {
  ...getBaseMainConfigSchema(),
  schema: [
    ...getBaseMainConfigSchema().schema,
    {
      name: "state_type",
      label: "State Type",
      selector: {
        select: {
          options: [
            { value: "power", label: "Power" },
            { value: "percentage", label: "Percentage" },
          ],
          mode: "dropdown",
        },
      },
    },
    {
      name: "color_value",
      label: "Color Value",
      default: true,
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
      default: true,
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
      default: true,
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

export const nonFossilSchema = [
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
    title: localize("editor.action"),
    name: "",
    type: "expandable",
    schema: actionSchema,
  },
] as const;

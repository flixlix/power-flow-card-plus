import { getBaseMainConfigSchema, secondaryInfoSchema, tapActionSchema } from "./_schema-base";
import localize from "@/localize/localize";

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
            { value: true, label: "Color dynamically" },
            { value: false, label: "Do Not Color" },
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
            { value: true, label: "Color dynamically" },
            { value: false, label: "Do Not Color" },
            { value: "solar", label: "Solar" },
            { value: "grid", label: "Grid" },
            { value: "battery", label: "Battery" },
          ],
          custom_value: true,
        },
      },
    },
    {
      name: "circle_animation",
      label: "Circle Animation",
      default: true,
      selector: { boolean: {} },
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
      name: "use_metadata",
      label: "Use Metadata",
      selector: { boolean: {} },
    },
    {
      name: "hide",
      label: "Hide Home",
      selector: { boolean: {} },
    },
  ],
};

export const homeSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  mainSchema,
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

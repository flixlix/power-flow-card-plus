import { secondaryInfoSchema, tapActionSchema } from "./_schema-base";
import localize from "@/localize/localize";

export const intermediateSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  {
    type: "grid",
    column_min_width: "200px",
    schema: [
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "color_circle", label: "Color of Circle", selector: { color_rgb: {} } },
    ],
  },
  {
    name: "color",
    title: localize("editor.custom_colors"),
    type: "expandable",
    schema: [
      {
        type: "grid",
        column_min_width: "200px",
        schema: [
          { name: "consumption", label: "Consumption", selector: { color_rgb: {} } },
          { name: "production", label: "Production", selector: { color_rgb: {} } },
        ],
      },
    ],
  },
  {
    title: "Flow Entities",
    name: "",
    type: "expandable",
    schema: [
      {
        name: "flowFromGridHouse",
        label: localize("editor.flowFromGridHouse"),
        selector: { entity: {} },
      },
      {
        name: "flowFromGridMain",
        label: localize("editor.flowFromGridMain"),
        selector: { entity: {} },
      },
    ],
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

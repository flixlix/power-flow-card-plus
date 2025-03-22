import {
  getEntitySeparatedSelectionSchema,
  getBaseMainConfigSchema,
  customColorsSchema,
  getEntityCombinedSelectionSchema,
  tapActionSchema,
} from "./_schema-base";
import localize from "@/localize/localize";

const mainSchema = {
  ...getBaseMainConfigSchema("battery"),

  schema: [
    ...getBaseMainConfigSchema("battery").schema,
    {
      name: "invert_state",
      label: "Invert State",
      selector: { boolean: {} },
    },
    {
      name: "color_value",
      label: "Color of Value",
      selector: { boolean: {} },
    },
    {
      name: "use_metadata",
      label: "Use Metadata",
      selector: { boolean: {} },
    },
  ],
};

const stateOfChargeSchema = [
  {
    name: "state_of_charge",
    label: "State of Charge Entity",
    selector: { entity: {} },
  },
  {
    name: "",
    type: "grid",
    column_min_width: "200px",
    schema: [
      {
        name: "state_of_charge_unit",
        label: "Unit",
        selector: { text: {} },
      },
      {
        name: "state_of_charge_unit_white_space",
        label: "Unit White Space",
        default: true,
        selector: { boolean: {} },
      },
      {
        name: "state_of_charge_decimals",
        label: "Decimals",
        selector: { number: { mode: "box", min: 0, max: 4, step: 1 } },
      },
      {
        name: "show_state_of_charge",
        label: "Show State of Charge",
        selector: { boolean: {} },
      },
      {
        name: "color_state_of_charge_value",
        label: "Color of Value",
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
    ],
  },
];

export const batterySchema = [
  getEntityCombinedSelectionSchema(),
  getEntitySeparatedSelectionSchema(),
  {
    title: localize("editor.state_of_charge"),
    name: "",
    type: "expandable",
    schema: stateOfChargeSchema,
  },
  mainSchema,
  customColorsSchema,
  {
    title: localize("editor.tap_action"),
    name: "",
    type: "expandable",
    schema: tapActionSchema,
  },
] as const;

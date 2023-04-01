import { any, assign, boolean, integer, object, optional, refine, string } from "superstruct";

const isEntityId = (value: string): boolean => value.includes(".");
const entityId = () => refine(string(), "entity ID (domain.entity)", isEntityId);

const baseLovelaceCardConfig = object({
  type: string(),
  view_layout: any(),
});

export const cardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    entity: optional(entityId()),
    title: optional(string()),
    theme: optional(string()),
    show_state: optional(boolean()),
    dashboard_link: optional(string()),
    inverted_entities: optional(any()),
    kw_decimals: optional(integer()),
    min_flow_rate: optional(integer()),
    max_flow_rate: optional(integer()),
    max_expected_flow_w: optional(integer()),
    w_decimals: optional(integer()),
    watt_threshold: optional(integer()),
    clickable_entities: optional(boolean()),
    entities: optional(
      object({
        battery: optional(
          object({
            entity: entityId(),
            state_of_charge: optional(entityId()),
            name: optional(string()),
            icon: optional(string()),
            color: optional(
              object({
                consumption: optional(string()),
                production: optional(string()),
              })
            ),
            color_icon: optional(string() || boolean()),
            display_state: optional(string()),
            state_of_charge_unit_white_space: optional(boolean()),
          })
        ),
      })
    ),
  })
);

export const SCHEMA = [
  { name: "title", selector: { text: {} } },
  {
    /* battery entity picker */
    name: "entities",

    type: "grid",
    schema: [
      {
        name: "battery",
        type: "grid",
        schema: [
          {
            name: "entity",
            label: "Battery Entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          {
            name: "state_of_charge",
            label: "State of Charge Entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          { name: "name", label: "Battery Name", selector: { text: {} } },
          { name: "icon", label: "Battery Icon", selector: { icon: {} } },
          {
            name: "color_icon",
            label: "Color Icon",
            selector: {
              select: {
                options: [
                  { value: true, label: "Color dynamically" },
                  { value: false, label: "Do not Color" },
                  { value: "production", label: "Color of Production" },
                  { value: "consumption", label: "Color of Consumption" },
                ],
                custom_value: true,
                translation_key: "ui-editor.color_icon",
                localizeValue: true,
              },
            },
          },
          {
            name: "display_state",
            label: "Display State",
            selector: {
              select: {
                options: [
                  { value: "two_way", label: "Two Way" },
                  { value: "one_way", label: "One Way" },
                  { value: "one_way_no_zero", label: "One Way (Show Zero)" },
                ],
                custom_value: true,
              },
            },
          },
          {
            name: "state_of_charge_unit_white_space",
            label: "State of Charge Unit White Space",
            selector: { boolean: {} },
          },
        ],
      },
    ],
  },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "w_decimals", label: "Watt Decimals", selector: { number: { min: 0, max: 4, step: 1, mode: "box" } } },
      {
        name: "kw_decimals",
        label: "Kilowatt Decimals",
        selector: { number: { min: 0, max: 4, step: 1, mode: "box" } },
      },
    ],
  },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "min_flow_rate", label: "Min Flow Rate", selector: { text: {} } },
      { name: "max_flow_rate", label: "Max Flow Rate", selector: { text: {} } },
    ],
  },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "max_expected_flow_w", label: "Max Expected Power", selector: { text: { suffix: "W" } } },
      { name: "watt_threshold", label: "Watt Threshold", selector: { text: { suffix: "W" } } },
    ],
  },
  {
    name: "",
    type: "grid",
    column_min_width: "100px",
    schema: [
      { name: "dashboard_link", label: "Dashboard Link", selector: { navigation: {} } },
      { name: "clickable_entities", label: "Clickable Entities?", selector: { boolean: {} } },
    ],
  },
  {
    name: "",
    type: "grid",
    schema: [{ name: "theme", selector: { theme: {} } }],
  },
] as const;

/* eslint-disable import/extensions */
import { any, assign, boolean, integer, number, object, optional, string } from "superstruct";
import { gridSchema } from "./grid";
import { batterySchema } from "./battery";
import { solarSchema } from "./solar";
import { individualSchema } from "./individual";
import { nonFossilSchema } from "./fossil_fuel_percentage";
import { homeSchema } from "./home";

const baseLovelaceCardConfig = object({
  type: string(),
  view_layout: any(),
});

export const cardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    title: optional(string()),
    theme: optional(string()),
    dashboard_link: optional(string()),
    dashboard_link_label: optional(string()),
    inverted_entities: optional(any()),
    w_decimals: optional(integer()),
    kw_decimals: optional(integer()),
    min_flow_rate: optional(number()),
    max_flow_rate: optional(number()),
    min_expected_power: optional(number()),
    max_expected_power: optional(number()),
    watt_threshold: optional(number()),
    clickable_entities: optional(boolean()),
    display_zero_lines: optional(boolean()),
    use_new_flow_rate_model: optional(boolean()),
    entities: object({
      battery: optional(any()),
      grid: optional(any()),
      solar: optional(any()),
      home: optional(any()),
      fossil_fuel_percentage: optional(any()),
      individual1: optional(any()),
      individual2: optional(any()),
    }),
  })
);

export const generalConfigSchema = [
  {
    name: "title",
    label: "Title",
    selector: { text: {} },
  },
] as const;

export const entitiesSchema = [
  {
    name: "entities",
    type: "grid",
    column_min_width: "400px",
    schema: [
      {
        title: "Grid",
        name: "grid",
        type: "expandable",
        schema: gridSchema,
      },
      {
        title: "Solar",
        name: "solar",
        type: "expandable",
        schema: solarSchema,
      },
      {
        title: "Battery",
        name: "battery",
        type: "expandable",
        schema: batterySchema,
      },
      {
        title: "Non-Fossil",
        name: "fossil_fuel_percentage",
        type: "expandable",
        schema: nonFossilSchema,
      },
      {
        title: "Home",
        name: "home",
        type: "expandable",
        schema: homeSchema,
      },
      {
        title: "Individual 1",
        name: "individual1",
        type: "expandable",
        schema: individualSchema,
      },
      {
        title: "Individual 2",
        name: "individual2",
        type: "expandable",
        schema: individualSchema,
      },
    ],
  },
];

export const advancedOptionsSchema = [
  {
    title: "Advanced Options",
    type: "expandable",
    schema: [
      {
        type: "grid",
        column_min_width: "200px",
        schema: [
          {
            name: "dashboard_link",
            label: "Dashboard Link",
            selector: { navigation: {} },
          },
          {
            name: "dashboard_link_label",
            label: "Dashboard Link Label",
            selector: { text: {} },
          },
          {
            name: "w_decimals",
            label: "Watt Decimals",
            selector: { number: { mode: "box", min: 0, max: 5, step: 1 } },
          },
          {
            name: "kw_decimals",
            label: "kW Decimals",
            selector: { number: { mode: "box", min: 0, max: 5, step: 1 } },
          },
          {
            name: "max_flow_rate",
            label: "Max Flow Rate (Sec/Dot)",
            selector: { number: { mode: "box", min: 0, max: 1000000, step: 0.01 } },
          },
          {
            name: "min_flow_rate",
            label: "Min Flow Rate (Sec/Dot)",
            selector: { number: { mode: "box", min: 0, max: 1000000, step: 0.01 } },
          },
          {
            name: "max_expected_power",
            label: "Max Expected Power (in Watts)",
            selector: { number: { mode: "box", min: 0, max: 1000000, step: 0.01 } },
          },
          {
            name: "min_expected_power",
            label: "Min Expected Power (in Watts)",
            selector: { number: { mode: "box", min: 0, max: 1000000, step: 0.01 } },
          },
          {
            name: "watt_threshold",
            label: "Watt to Kilowatt Threshold",
            selector: { number: { mode: "box", min: 0, max: 1000000, step: 1 } },
          },
          {
            name: "display_zero_lines",
            label: "Display Zero Lines",
            selector: { boolean: {} },
          },
          {
            name: "clickable_entities",
            label: "Clickable Entities",
            selector: { boolean: {} },
          },
          {
            name: "use_new_flow_rate_model",
            label: "New Flow Model?",
            selector: { boolean: {} },
          },
        ],
      },
      {
        name: "inverted_entities",
        label: "Inverted Entities",
        selector: { code_editor: {} },
      },
    ],
  },
];

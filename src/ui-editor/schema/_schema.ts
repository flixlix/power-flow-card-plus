/* eslint-disable import/extensions */
import { any, assign, boolean, integer, object, optional, string } from "superstruct";
import { gridSchema } from "./grid";
import { batterySchema } from "./battery";
import { solarSchema } from "./solar";
import { individualSchema } from "./individual";
import { nonFossilSchema } from "./fossil_fuel_percentage";

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
    kw_decimals: optional(integer()),
    min_flow_rate: optional(integer()),
    max_flow_rate: optional(integer()),
    max_expected_flow_w: optional(integer()),
    w_decimals: optional(integer()),
    watt_threshold: optional(integer()),
    clickable_entities: optional(boolean()),
    display_zero_lines: optional(boolean()),
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
        title: "Battery",
        name: "battery",
        type: "expandable",
        schema: batterySchema,
      },
      {
        title: "Solar",
        name: "solar",
        type: "expandable",
        schema: solarSchema,
      },
      {
        title: "Non-Fossil",
        name: "fossil_fuel_percentage",
        type: "expandable",
        schema: nonFossilSchema,
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
        name: "inverted_entities",
        label: 'Invert Entities (comma separated, eg: "battery, grid")',
        selector: { template: {} },
      },
      {
        name: "kw_decimals",
        label: "KW Decimals",
        selector: { number: { min: 0, max: 10, step: 1, mode: "box" } },
      },
      {
        name: "w_decimals",
        label: "W Decimals",
        selector: { number: { min: 0, max: 10, step: 1, mode: "box" } },
      },
      {
        name: "dashboard_link",
        label: "Dashboard Link",
        selector: { navigator: {} },
      },
    ],
  },
];

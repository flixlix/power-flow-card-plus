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
    entities: optional(
      object({
        battery: optional(
          object({
            entity: optional(entityId()),
            state_of_charge: optional(entityId()),
            name: optional(string()),
            icon: optional(string()),
            color: optional(
              object({
                consumption: optional(string()),
                production: optional(string()),
              })
            ),
            color_icon: optional(any()),
            display_state: optional(string()),
            state_of_charge_unit_white_space: optional(boolean()),
          })
        ),
        grid: optional(
          object({
            entity: optional(entityId() || object()),
            name: optional(string()),
            icon: optional(string()),
            color: optional(
              object({
                consumption: optional(string()),
                production: optional(string()),
              })
            ),
            color_icon: optional(any()),
            display_state: optional(string()),
          })
        ),
        solar: optional(
          object({
            entity: optional(entityId()),
            name: optional(string()),
            icon: optional(string()),
            color: optional(string()),
            color_icon: optional(boolean()),
          })
        ),
        home: optional(
          object({
            entity: optional(entityId()),
            name: optional(string()),
            icon: optional(string()),
            color_icon: optional(any()),
          })
        ),
        fossil_fuel_percentage: optional(
          object({
            entity: optional(entityId()),
            name: optional(string()),
            icon: optional(string()),
            color: optional(string()),
            state_type: optional(string()),
            color_icon: optional(boolean()),
            display_zero: optional(boolean()),
            display_zero_tolerance: optional(integer()),
          })
        ),
        individual1: optional(
          object({
            entity: optional(entityId()),
            name: optional(string()),
            icon: optional(string()),
            color: optional(string()),
            color_icon: optional(boolean()),
            inverted_animation: optional(boolean()),
            unit_of_measurement: optional(string()),
            display_zero: optional(boolean()),
            display_zero_tolerance: optional(integer()),
            secondary_info: optional(
              object({
                entity: optional(entityId()),
                unit_of_measurement: optional(string()),
                icon: optional(string()),
                display_zero: optional(boolean()),
                unit_white_space: optional(boolean()),
                display_zero_tolerance: optional(integer()),
              })
            ),
          })
        ),
        individual2: optional(
          object({
            entity: optional(entityId()),
            name: optional(string()),
            icon: optional(string()),
            color: optional(string()),
            color_icon: optional(boolean()),
            inverted_animation: optional(boolean()),
            unit_of_measurement: optional(string()),
            display_zero: optional(boolean()),
            display_zero_tolerance: optional(integer()),
            secondary_info: optional(
              object({
                entity: optional(entityId()),
                unit_of_measurement: optional(string()),
                icon: optional(string()),
                display_zero: optional(boolean()),
                unit_white_space: optional(boolean()),
                display_zero_tolerance: optional(integer()),
              })
            ),
          })
        ),
      })
    ),
  })
);

export const generalConfigSchema = [
  {
    name: "title",
    label: "Title",
    selector: { text: {} },
  },
] as const;
export const gridConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "grid",
        type: "grid",
        schema: [
          {
            name: "entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          {
            name: "color_icon",
            label: "Color of Icon",
            selector: {
              select: {
                options: [
                  { value: false, label: "Do not Color" },
                  { value: true, label: "Color dynamically" },
                  { value: "production", label: "Color of Production" },
                  { value: "consumption", label: "Color of Consumption" },
                ],
                custom_value: true,
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
        ],
      },
    ],
  },
] as const;
export const batteryConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "battery",
        type: "grid",
        schema: [
          {
            name: "entity",
            label: "Entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          {
            name: "state_of_charge",
            label: "State of Charge Entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          {
            name: "color_icon",
            label: "Color of Icon",
            selector: {
              select: {
                options: [
                  { value: true, label: "Color dynamically" },
                  { value: false, label: "Do not Color" },
                  { value: "production", label: "Color of Production" },
                  { value: "consumption", label: "Color of Consumption" },
                ],
                custom_value: true,
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
            label: "White-Space for State of Charge Unit?",
            selector: { boolean: {} },
          },
        ],
      },
    ],
  },
] as const;
export const solarConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "solar",
        type: "grid",
        schema: [
          {
            name: "entity",
            label: "Entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          {
            name: "color_icon",
            label: "Color of Icon",
            selector: {
              select: {
                options: [
                  { value: true, label: "Color dynamically" },
                  { value: false, label: "Do not Color" },
                ],
                custom_value: true,
              },
            },
          },
        ],
      },
    ],
  },
] as const;
export const homeConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "home",
        type: "grid",
        schema: [
          {
            name: "entity",
            label: "Entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          {
            name: "color_icon",
            label: "Color of Icon",
            selector: {
              select: {
                options: [
                  { value: true, label: "Color dynamically" },
                  { value: false, label: "Do not Color" },
                  { value: "grid", label: "Color of Grid" },
                  { value: "solar", label: "Color of Solar" },
                  { value: "battery", label: "Color of Battery" },
                ],
                custom_value: true,
              },
            },
          },
        ],
      },
    ],
  },
] as const;
export const nonFossilConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "fossil_fuel_percentage",
        type: "grid",
        schema: [
          {
            name: "entity",
            label: "Entity",
            selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
          },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          {
            name: "color_icon",
            label: "Color of Icon",
            selector: {
              select: {
                options: [
                  { value: true, label: "Color dynamically" },
                  { value: false, label: "Do not Color" },
                ],
                custom_value: true,
              },
            },
          },
          {
            name: "display_zero",
            label: "Display Zero",
            selector: { boolean: {} },
          },
        ],
      },
    ],
  },
] as const;

const baseIndividualConfigSchema = [
  {
    name: "entity",
    selector: { entity: { domain: ["counter", "input_number", "number", "sensor"] } },
  },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  {
    name: "color_icon",
    label: "Color of Icon",
    selector: {
      select: {
        options: [
          { value: true, label: "Color dynamically" },
          { value: false, label: "Do not Color" },
        ],
        custom_value: true,
      },
    },
  },
  {
    name: "display_zero_tolerance",
    label: "Display Zero with Tolerance",
    selector: {
      number: {
        min: 0,
        max: 1000000,
        step: 1,
        mode: "box",
      },
    },
  },
];

const baseIndividualSecondaryConfigSchema = [
  {
    name: "secondary_info",
    type: "grid",
    schema: [
      {
        name: "entity",
        selector: { entity: {} },
      },
      {
        name: "name",
        label: "Name",
        selector: { text: {} },
      },
      {
        name: "unit_of_measurement",
        label: "Unit of Measurement",
        selector: { text: {} },
      },
      {
        name: "unit_white_space",
        label: "White-Space for Unit?",
        selector: { boolean: {} },
      },
      {
        name: "display_zero",
        label: "Display Zero",
        selector: { boolean: {} },
      },
      {
        name: "display_zero_tolerance",
        label: "Display Zero with Tolerance",
        selector: {
          number: {
            min: 0,
            max: 1000000,
            step: 1,
            mode: "box",
          },
        },
      },
    ],
  },
] as const;

export const individual1SecondaryConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "individual1",
        type: "grid",
        schema: baseIndividualSecondaryConfigSchema,
      },
    ],
  },
] as const;

export const individual2SecondaryConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "individual2",
        type: "grid",
        schema: baseIndividualSecondaryConfigSchema,
      },
    ],
  },
] as const;

export const individual1ConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "individual1",
        type: "grid",
        schema: baseIndividualConfigSchema,
      },
    ],
  },
] as const;

export const individual2ConfigSchema = [
  {
    name: "entities",
    type: "grid",
    schema: [
      {
        name: "individual2",
        type: "grid",
        schema: baseIndividualConfigSchema,
      },
    ],
  },
] as const;

export const otherConfigSchema = [
  {
    name: "",
    type: "grid",
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
    ],
  },
  {
    name: "inverted_entities",
    label: "Inverted Entities (e.g.: 'grid, battery')",
    selector: { object(): any {} },
  },
  {
    name: "watt_threshold",
    label: "Watt Threshold",
    selector: {
      number: {
        min: 0,
        max: 10000000,
        step: 1,
        unit_of_measurement: "W",
        mode: "box",
      },
    },
  },
  {
    name: "",
    type: "grid",
    schema: [
      {
        name: "w_decimals",
        label: "Watt Decimal Places",
        selector: {
          number: {
            min: 0,
            max: 10,
            step: 1,
            mode: "box",
          },
        },
      },
      {
        name: "kw_decimals",
        label: "Kilowatt Decimal Places",
        selector: {
          number: {
            min: 0,
            max: 10,
            step: 1,
            mode: "box",
          },
        },
      },
    ],
  },
  {
    name: "max_expected_flow_w",
    label: "Maximum Expected Power (Used in Flow Rate Calculation)",
    selector: {
      number: {
        min: 0,
        max: 10000000,
        step: 1,
        unit_of_measurement: "W",
        mode: "box",
      },
    },
  },
  {
    name: "",
    type: "grid",
    schema: [
      {
        name: "min_flow_rate",
        label: "Lowest Flow Rate",
        selector: {
          number: {
            min: 0,
            max: 10000000,
            step: 1,
            mode: "box",
          },
        },
      },
      {
        name: "max_flow_rate",
        label: "Highest Flow Rate",
        selector: {
          number: {
            min: 0,
            max: 10000000,
            step: 1,
            mode: "box",
          },
        },
      },
    ],
  },
] as const;

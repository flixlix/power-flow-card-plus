export const entityCombinedSelectionSchema = {
  type: "expandable",
  title: "Combined Grid Entity (positive & negative values)",
  schema: [
    {
      name: "entity",
      selector: { entity: {} },
    },
  ],
} as const;

export const entitySeparatedSelectionSchema = {
  type: "expandable",
  name: "entity",
  title: "Separated Grid Entities (One for production, one for consumption)",
  schema: [
    {
      name: "production",
      label: "Production Entity",
      selector: { entity: {} },
    },
    {
      name: "consumption",
      label: "Consumption Entity",
      selector: { entity: {} },
    },
  ],
} as const;

export const secondaryInfoSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  {
    name: "template",
    label: "Template (overrides entity)",
    selector: { template: {} },
  },
  {
    type: "grid",
    schema: [
      { name: "icon", selector: { icon: {} } },
      { name: "unit_of_measurement", label: "Unit of Measurement", selector: { text: {} } },
      { name: "display_zero", label: "Display Zero", selector: { boolean: {} } },
      { name: "display_zero_tolerance", label: "Display Zero Tolerance", selector: { number: { min: 0, max: 1000000, step: 1, mode: "box" } } },
      {
        name: "color_value",
        label: "Color of State",
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
        name: "unit_white_space",
        label: "Unit White Space",
        selector: { boolean: {} },
      },
    ],
  },
] as const;

export function getBaseMainConfigSchema({
  name,
  icon,
  colorIcon,
  colorCircle,
  displayZeroTolerance,
  displayState,
}: {
  name?: boolean;
  icon?: boolean;
  colorIcon?: boolean;
  colorCircle?: boolean;
  displayZeroTolerance?: boolean;
  displayState?: boolean;
}) {
  return {
    type: "grid",
    schema: [
      name && { name: "name", selector: { text: {} } },
      icon && { name: "icon", selector: { icon: {} } },
      colorIcon && {
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
      colorCircle && {
        name: "color_circle",
        label: "Color of Circle",
        selector: {
          select: {
            options: [
              { value: true, label: "Color dynamically" },
              { value: false, label: "Color of Consumption" },
              { value: "production", label: "Color of Production" },
            ],
            custom_value: true,
          },
        },
      },
      displayZeroTolerance && {
        name: "display_zero_tolerance",
        label: "Display Zero Tolerance",
        selector: {
          number: {
            min: 0,
            max: 1000000,
            step: 1,
            mode: "box",
          },
        },
      },
      displayState && {
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
  };
}

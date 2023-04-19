/* eslint-disable import/extensions */
import { secondaryInfoSchema } from "./_schema-base";

const mainConfigSchema = {
  type: "grid",
  schema: [
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
    {
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
} as const;

export const individualSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  mainConfigSchema,
  {
    title: "Secondary Info",
    name: "secondary_info",
    type: "expandable",
    schema: secondaryInfoSchema,
  },
] as const;

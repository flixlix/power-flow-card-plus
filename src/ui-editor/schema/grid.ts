/* eslint-disable import/extensions */
import { entityCombinedSelectionSchema, entitySeparatedSelectionSchema, secondaryInfoSchema, getBaseMainConfigSchema } from "./_schema-base";

const mainConfigSchema = getBaseMainConfigSchema({
  name: true,
  icon: true,
  colorIcon: true,
  colorCircle: true, 
  displayZeroTolerance: true,
  displayState: true,
  
});

const powerOutageGridSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  {
    type: "grid",
    schema: [
      { name: "label_alert", label: "Outage Label", selector: { text: {} } },
      { name: "icon_alert", selector: { icon: {} } },
      { name: "state_alert", label: "Outage State", selector: { text: {} } },
    ],
  },
] as const;

export const gridSchema = [
  entityCombinedSelectionSchema,
  entitySeparatedSelectionSchema,
  mainConfigSchema,
  {
    title: "Secondary Info",
    name: "secondary_info",
    type: "expandable",
    schema: secondaryInfoSchema,
  },
  {
    title: "Power Outage",
    name: "power_outage",
    type: "expandable",
    schema: powerOutageGridSchema,
  },
] as const;

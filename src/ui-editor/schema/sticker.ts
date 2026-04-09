import localize from "@/localize/localize";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { HomeAssistant } from "custom-card-helpers";
import { makeIndividualStickerAnchor } from "@/utils/sticker-anchor";

export const getStickerAnchorOptions = (config: PowerFlowCardPlusConfig, hass: HomeAssistant) => {
  const options = [{ value: "", label: localize("editor.free") || "Free" }];

  if (config.entities.grid?.entity) {
    options.push({ value: "grid", label: localize("editor.grid") || "Grid" });
  }
  if (config.entities.solar?.entity) {
    options.push({ value: "solar", label: localize("editor.solar") || "Solar" });
  }
  if (config.entities.battery?.entity) {
    options.push({ value: "battery", label: localize("editor.battery") || "Battery" });
  }
  if (config.entities.home?.hide !== true) {
    options.push({ value: "home", label: localize("editor.home") || "Home" });
  }

  config.entities.individual?.forEach((individual) => {
    if (!individual?.entity) {
      return;
    }

    const label = individual.name || hass.states[individual.entity]?.attributes?.friendly_name || individual.entity;
    options.push({
      value: makeIndividualStickerAnchor(individual.entity),
      label,
    });
  });

  return options;
};

export const getStickerSchema = (config: PowerFlowCardPlusConfig, hass: HomeAssistant) => {
  return [
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
        {
          name: "anchor",
          label: localize("editor.anchor"),
          selector: {
            select: {
              options: getStickerAnchorOptions(config, hass),
              mode: "dropdown",
            },
          },
        },
        {
          name: "hide_with_anchor",
          label: localize("editor.hide_with_anchor"),
          default: true,
          selector: { boolean: {} },
        },
        {
          name: "name_inside_circle",
          label: localize("editor.name_inside_circle"),
          default: true,
          selector: { boolean: {} },
        },
        {
          name: "show_circle",
          label: localize("editor.show_circle"),
          default: true,
          selector: { boolean: {} },
        },
        {
          name: "inherit_circle_color",
          label: localize("editor.inherit_circle_color"),
          default: true,
          selector: { boolean: {} },
        },
        {
          name: "unit_white_space",
          label: localize("editor.unit_white_space"),
          default: true,
          selector: { boolean: {} },
        },
        {
          name: "scale",
          label: `${localize("editor.scale")} (%)`,
          selector: { number: { mode: "box", min: 1, max: 100, step: 1 } },
        },
        {
          name: "x_position",
          label: `${localize("editor.x_position")} (%)`,
          selector: { number: { mode: "box", min: 0, max: 100, step: 0.1 } },
        },
        {
          name: "y_position",
          label: `${localize("editor.y_position")} (%)`,
          selector: { number: { mode: "box", min: 0, max: 100, step: 0.1 } },
        },
      ],
    },
  ] as const;
};

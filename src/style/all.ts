import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { convertColorListToHex } from "../utils/convertColor";
import { computeColor } from "./colors";

export const allDynamicStyles = (
  main: PowerFlowCardPlus,
  {
    grid,
    solar,
    entities,
    individual1,
    individual2,
    battery,
    homeSources,
    homeLargestSource,
    nonFossil,
    display_zero_lines_transparency,
    display_zero_lines_grey_color,
    isCardWideEnough,
  }
) => {
  // Grid
  main.style.setProperty(
    "--icon-grid-color",
    grid.color.icon_type === "consumption"
      ? "var(--energy-grid-consumption-color)"
      : grid.color.icon_type === "production"
      ? "var(--energy-grid-return-color)"
      : grid.color.icon_type === true
      ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
        ? "var(--energy-grid-consumption-color)"
        : "var(--energy-grid-return-color)"
      : "var(--primary-text-color)"
  );

  main.style.setProperty(
    "--circle-grid-color",
    grid.color.circle_type === "consumption"
      ? "var(--energy-grid-consumption-color)"
      : grid.color.circle_type === "production"
      ? "var(--energy-grid-return-color)"
      : grid.color.circle_type === true
      ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
        ? "var(--energy-grid-consumption-color)"
        : "var(--energy-grid-return-color)"
      : "var(--energy-grid-consumption-color)"
  );

  if (grid.color.fromGrid !== undefined) {
    if (typeof grid.color.fromGrid === "object") {
      grid.color.fromGrid = convertColorListToHex(grid.color.fromGrid);
    }
    main.style.setProperty("--energy-grid-consumption-color", grid.color.fromGrid || "#a280db");
  }

  if (grid.color.toGrid !== undefined) {
    if (typeof grid.color.toGrid === "object") {
      grid.color.toGrid = convertColorListToHex(grid.color.toGrid);
    }
    main.style.setProperty("--energy-grid-return-color", grid.color.toGrid || "#a280db");
  }

  main.style.setProperty(
    "--secondary-text-grid-color",
    grid.secondary.color.type === "consumption"
      ? "var(--energy-grid-consumption-color)"
      : grid.secondary.color.type === "production"
      ? "var(--energy-grid-return-color)"
      : grid.secondary.color.type === true
      ? (grid.state.fromGrid ?? 0) >= (grid.state.toGrid ?? 0)
        ? "var(--energy-grid-consumption-color)"
        : "var(--energy-grid-return-color)"
      : "var(--primary-text-color)"
  );

  if (entities.grid?.color_value === false) {
    main.style.setProperty("--text-grid-consumption-color", "var(--primary-text-color)");
    main.style.setProperty("--text-grid-return-color", "var(--primary-text-color)");
  } else {
    main.style.setProperty("--text-grid-consumption-color", "var(--energy-grid-consumption-color)");
    main.style.setProperty("--text-grid-return-color", "var(--energy-grid-return-color)");
  }

  // Solar
  main.style.setProperty("--text-solar-color", entities.solar?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)");

  main.style.setProperty(
    "--secondary-text-solar-color",
    entities.solar?.secondary_info?.color_value ? "var(--energy-solar-color)" : "var(--primary-text-color)"
  );

  // Individual 1
  if (individual1.color !== undefined) {
    if (typeof individual1.color === "object") individual1.color = convertColorListToHex(individual1.color);
    main.style.setProperty("--individualone-color", individual1.color);
  }
  main.style.setProperty("--icon-individualone-color", entities.individual1?.color_icon ? "var(--individualone-color)" : "var(--primary-text-color)");
  main.style.setProperty(
    "--text-individualone-color",
    entities.individual1?.color_value ? "var(--individualone-color)" : "var(--primary-text-color)"
  );
  main.style.setProperty(
    "--secondary-text-individualone-color",
    entities.individual1?.secondary_info?.color_value ? "var(--individualone-color)" : "var(--primary-text-color)"
  );

  // Individual 2
  if (individual2.color !== undefined) {
    if (typeof individual2.color === "object") individual2.color = convertColorListToHex(individual2.color);
    main.style.setProperty("--individualtwo-color", individual2.color);
  }
  main.style.setProperty("--icon-individualtwo-color", entities.individual2?.color_icon ? "var(--individualtwo-color)" : "var(--primary-text-color)");
  main.style.setProperty(
    "--text-individualtwo-color",
    entities.individual2?.color_value ? "var(--individualtwo-color)" : "var(--primary-text-color)"
  );
  main.style.setProperty(
    "--secondary-text-individualtwo-color",
    entities.individual2?.secondary_info?.color_value ? "var(--individualtwo-color)" : "var(--primary-text-color)"
  );

  // Battery
  if (battery.color.fromBattery !== undefined) {
    if (typeof battery.color.fromBattery === "object") battery.color.fromBattery = convertColorListToHex(battery.color.fromBattery);
    main.style.setProperty("--energy-battery-out-color", battery.color.fromBattery || "#4db6ac");
  }
  if (battery.color.toBattery !== undefined) {
    if (typeof battery.color.toBattery === "object") battery.color.toBattery = convertColorListToHex(battery.color.toBattery);
    main.style.setProperty("--energy-battery-in-color", battery.color.toBattery || "#a280db");
  }
  battery.color.icon_type = entities.battery?.color_icon;
  main.style.setProperty(
    "--icon-battery-color",
    battery.color.icon_type === "consumption"
      ? "var(--energy-battery-in-color)"
      : battery.color.icon_type === "production"
      ? "var(--energy-battery-out-color)"
      : battery.color.icon_type === true
      ? battery.state.fromBattery >= battery.state.toBattery
        ? "var(--energy-battery-out-color)"
        : "var(--energy-battery-in-color)"
      : "var(--primary-text-color)"
  );
  const batteryStateOfChargeColorType = entities.battery?.color_state_of_charge_value;
  main.style.setProperty(
    "--text-battery-state-of-charge-color",
    batteryStateOfChargeColorType === "consumption"
      ? "var(--energy-battery-in-color)"
      : batteryStateOfChargeColorType === "production"
      ? "var(--energy-battery-out-color)"
      : batteryStateOfChargeColorType === true
      ? battery.state.fromBattery >= battery.state.toBattery
        ? "var(--energy-battery-out-color)"
        : "var(--energy-battery-in-color)"
      : "var(--primary-text-color)"
  );
  main.style.setProperty(
    "--circle-battery-color",
    battery.color.circle_type === "consumption"
      ? "var(--energy-battery-in-color)"
      : battery.color.circle_type === "production"
      ? "var(--energy-battery-out-color)"
      : battery.color.circle_type === true
      ? battery.state.fromBattery >= battery.state.toBattery
        ? "var(--energy-battery-out-color)"
        : "var(--energy-battery-in-color)"
      : "var(--energy-battery-in-color)"
  );
  if (entities.battery?.color_value === false) {
    main.style.setProperty("--text-battery-in-color", "var(--primary-text-color)");
    main.style.setProperty("--text-battery-out-color", "var(--primary-text-color)");
  } else {
    main.style.setProperty("--text-battery-in-color", "var(--energy-battery-in-color)");
    main.style.setProperty("--text-battery-out-color", "var(--energy-battery-out-color)");
  }

  // Non-fossil
  if (nonFossil.color !== undefined) {
    if (typeof nonFossil.color === "object") nonFossil.color = convertColorListToHex(nonFossil.color);
    main.style.setProperty("--non-fossil-color", nonFossil.color || "var(--energy-non-fossil-color)");
  }
  main.style.setProperty(
    "--icon-non-fossil-color",
    entities.fossil_fuel_percentage?.color_icon ? "var(--non-fossil-color)" : "var(--primary-text-color)" || "var(--non-fossil-color)"
  );
  main.style.setProperty(
    "--text-non-fossil-color",
    entities.fossil_fuel_percentage?.color_value ? "var(--non-fossil-color)" : "var(--primary-text-color)"
  );
  main.style.setProperty(
    "--secondary-text-non-fossil-color",
    entities.fossil_fuel_percentage?.secondary_info?.color_value ? "var(--non-fossil-color)" : "var(--primary-text-color)"
  );

  // Home
  main.style.setProperty(
    "--secondary-text-home-color",
    entities.home?.secondary_info?.color_value ? "var(--text-home-color)" : "var(--primary-text-color)"
  );
  main.style.setProperty("--icon-home-color", computeColor(entities.home?.color_icon, homeSources, homeLargestSource));
  main.style.setProperty("--text-home-color", computeColor(entities.home?.color_value, homeSources, homeLargestSource));

  //   Battery-Grid line
  main.style.setProperty(
    "--battery-grid-line",
    grid.state.toBattery || 0 > 0 ? "var(--energy-grid-consumption-color)" : "var(--energy-grid-return-color)"
  );

  // Transparencies
  main.style.setProperty("--transparency-unused-lines", display_zero_lines_transparency ? display_zero_lines_transparency.toString() : "0");

  if (display_zero_lines_grey_color !== undefined) {
    let greyColor = display_zero_lines_grey_color;
    if (typeof greyColor === "object") greyColor = convertColorListToHex(greyColor);
    main.style.setProperty("--greyed-out--line-color", greyColor);
  }

  if (solar.has) {
    if (battery.has) {
      // has solar, battery and grid
      main.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "106%" : "102%");
      main.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-3%" : "-1%");
      main.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 160px)" : "calc(100% - 160px)");
    } else {
      // has solar but no battery
      main.style.setProperty("--lines-svg-not-flat-line-height", isCardWideEnough ? "104%" : "102%");
      main.style.setProperty("--lines-svg-not-flat-line-top", isCardWideEnough ? "-2%" : "-1%");
      main.style.setProperty("--lines-svg-flat-width", isCardWideEnough ? "calc(100% - 154px)" : "calc(100% - 157px)");
      main.style.setProperty("--lines-svg-not-flat-width", isCardWideEnough ? "calc(103% - 172px)" : "calc(103% - 169px)");
    }
  }
};

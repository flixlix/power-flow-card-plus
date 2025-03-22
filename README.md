# Power Flow Card Plus

[![ko-fi support](https://img.shields.io/badge/support-me-ff5e5b?style=flat-square&logo=ko-fi)](https://ko-fi.com/flixlix)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=flat-square)](https://github.com/hacs/integration)
![GitHub total downloads](https://img.shields.io/github/downloads/flixlix/power-flow-card-plus/total?style=flat-square)
![commit_activity](https://img.shields.io/github/commit-activity/y/flixlix/power-flow-card-plus?color=brightgreen&label=Commits&style=flat-square)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/flixlix/power-flow-card-plus?style=flat-square)

![2023-03-26-13-04-07](https://user-images.githubusercontent.com/61006057/227771568-78497ecc-e863-46f2-b29e-e15c7c20a154.gif)

> [!TIP]  
> Version 0.2.0 is out now! ✨ Check out the [new features](https://github.com/flixlix/power-flow-card-plus/releases/tag/v0.2.0)!

## Additional Features / Enhancements

- UI Editor!!! 🥳
- Multiple Language support (🇺🇸, 🇩🇪, 🇵🇹, 🇪🇸, 🇧🇷, 🇳🇱, 🇮🇹, 🇫🇷, 🇷🇺, 🇫🇮, 🇵🇱, 🇩🇰, 🇸🇰, 🇨🇿)
- Bidirectional Individual Entities ↕️
- Secondary Information for all circles ℹ️
- Display Grid Power Outage ⚡️
- Template functionality 📙

<details>
<summary>... and More:</summary>

- Option for card full size
- Add Grid Tolerance for small values, to not display the battery correcting grid values
- New and improved Flow Rate Model
- Choose wether or not to color icons, text, etc.
- Display Individual power entities
- Customize Individual entities's label, icon and color
- Configure wether to hide Individual Entity when state is 0 or unavailable
- Clickable entities (including home)
- Fixed crooked lines
- Have curved lines connect to the Circles
- Keep color of battery to grid line, even when not returning
- Display Low Carbon Energy from the grid
- Customize Low Carbon Energy label, icon, circle color, icon color and state type
- Customize Battery, Solar and Home's color, icon, color of icon and label

</details>

## Goal

The Goal of this card is to provide an easy to understand and visualize way of displaying the current Power Distribution coming from and to different sources, such as solar, grid, home batteries etc. Furthermore, this card aims to expose a lot of customizability and control of its behavior to the configuration, allowing users to tailor it to their specific requirements.

## Scope

This card **does not** aim to display Energy Values (Meaning accumulated power over 1 day, for example).
If this is your goal, check out the [Energy Flow Card Plus](https://github.com/flixlix/energy-flow-card-plus).

## Guides

In case you want to watch a tutorial instead of reading through this very long readme 😅, I recommend the following videos:

- [Power Flow Card Plus in Home Assistant - Jetzt noch besser? Anleitung from Smartzeug](https://youtu.be/PUOU5qdhMro) - _in german_, up to date with version 0.2.2
- [Power Flow Card Plus for Home Assistant from Speak to the Geek](https://youtu.be/C4Zh35E9wJE?si=REuWZxmfF91G0Ht7) - _changes in indvidual configuration_

## Installation

### HACS (recommended)

This card is directly available through [HACS](https://hacs.xyz). To install HACS, follow these [instructions](https://hacs.xyz/docs/setup/prerequisites).
After having HACS installed, simply search for "Power Flow Card Plus" and download it using the UI 🙂

<details>
<summary>Manual install</summary>

1. Download and copy `power-flow-card-plus.js` from the [latest release](https://github.com/flixlix/power-flow-card-plus/releases/latest) into your `config/www` directory.

2. Add the resource reference as decribed below.

### Add resource reference

If you configure Dashboards via YAML, add a reference to `power-flow-card-plus.js` inside your `configuration.yaml`:

```yaml
resources:
  - url: /local/power-flow-card-plus.js
    type: module
```

Else, if you prefer the graphical editor, use the menu to add the resource:

1. Make sure, advanced mode is enabled in your user profile (click on your user name to get there)
2. Navigate to Settings -> Dashboards
3. Click three dot icon
4. Select Resources
5. Hit (+ ADD RESOURCE) icon
6. Enter URL `/local/power-flow-card-plus.js` and select type "JavaScript Module".
   (Use `/hacsfiles/power-flow-card-plus/power-flow-card-plus.js` and select "JavaScript Module" for HACS install if HACS didn't do it already)

</details>

## Usage

> [!WARNING]  
> This card offers a **LOT** of configuration options. Don't worry, if you want your card's appearance to match the oficial Energy Flow Card, you will only need to setup the entities. The rest of the options only enable further customization. If this is your goal, please go to [Minimal Configuration](#minimal-configuration)

### Options

#### Card options

| Name                        | Type      |                 Default                  | Description                                                                                                                                                                                                              |
| --------------------------- | --------- | :--------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| type                        | `string`  |               **required**               | `custom:power-flow-card-plus`.                                                                                                                                                                                           |
| entities                    | `object`  |               **required**               | One or more sensor entities, see [entities object](#entities-object) for additional entity options.                                                                                                                      |
| title                       | `string`  |                                          | Shows a title at the top of the card.                                                                                                                                                                                    |
| dashboard_link              | `string`  |                                          | Shows a link to an Energy Dashboard. Should be a url path to location of your choice. If you wanted to link to the built-in dashboard you would enter `/energy` for example.                                             |
| dashboard_link_label        | `string`  | Go To Energy Dashboard (auto-translates) | If set, overrides the default link label to go to a different dashboard.                                                                                                                                                 |
| second_dashboard_link       | `string`  |                                          | Shows another link to an Energy Dashboard. Should be a url path to location of your choice. If you wanted to link to the built-in dashboard you would enter `/energy` for example. (Only available in the YAML Editor)   |
| second_dashboard_link_label | `string`  | Go To Energy Dashboard (auto-translates) | If set, overrides the second default link label to go to a different dashboard.                                                                                                                                          |
| kw_decimals                 | `number`  |                    1                     | Number of decimals rounded to when kilowatts are displayed.                                                                                                                                                              |
| w_decimals                  | `number`  |                    1                     | Number of decimals rounded to when watts are displayed.                                                                                                                                                                  |
| min_flow_rate               | `number`  |                   .75                    | Represents how much time it takes for the quickest dot to travel from one end to the other in seconds.                                                                                                                   |
| max_flow_rate               | `number`  |                    6                     | Represents how much time it takes for the slowest dot to travel from one end to the other in seconds.                                                                                                                    |
| watt_threshold              | `number`  |                    0                     | The number of watts to display before converting to and displaying kilowatts. Setting of 0 will always display in kilowatts.                                                                                             |
| clickable_entities          | `boolean` |                  false                   | If true, clicking on the entity will open the entity's more info dialog.                                                                                                                                                 |
| min_expected_power          | `number`  |                   0.01                   | Represents the minimum amount of power (in Watts) expected to flow through the system at a given moment. Only used in the [New Flow Formula](#new-flow-formula).                                                         |
| max_expected_power          | `number`  |                   2000                   | Represents the maximum amount of power (in Watts) expected to flow through the system at a given moment. Only used in the [New Flow Formula](#new-flow-formula).                                                         |
| display_zero_lines          | `object`  |             `{mode: "show"}`             | Check [Display Zero Lines](#display-zero-lines)                                                                                                                                                                          |
| full_size                   | `boolean` |                  false                   | Warning: This option is experimental. To use this option, you must set your view to panel mode. If set to true, the card will take up the full height of the screen. And the Card should go to the center of the screen. |
| style_ha_card               | `css`     |                                          | [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) Styling to apply to the container of the card (border and background of the card).                                                                               |
| style_card_content          | `css`     |                                          | [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) Styling to apply to the content of the card (all circles and lines of the card).                                                                                 |
| use_new_flow_rate_model     | `boolean` |                  false                   | If set to true, the card will use the [New Flow Formula](#new-flow-formula).                                                                                                                                             |

#### Entities object

At least one of _grid_, _battery_, or _solar_ is required. All entites (except _battery_charge_) should have a `unit_of_measurement` attribute of W(watts) or kW(kilowatts).

| Name                   | Type     | Description                                                                      |
| ---------------------- | :------- | -------------------------------------------------------------------------------- |
| grid                   | `object` | Check [Grid Configuration](#grid-configuration) for more information.            |
| solar                  | `object` | Check [Solar Configuration](#solar-configuration) for more information.          |
| battery                | `object` | Check [Battery Configuration](#battery-configuration) for more information.      |
| individual             | `array`  | Check [Individual Devices](#individual-configuration) for more information.      |
| home                   | `object` | Check [Home Configuration](#home-configuration) for more information.            |
| fossil_fuel_percentage | `object` | Check [Fossil Fuel Percentage](#fossil-fuel-configuration) for more information. |

#### Grid Configuration

| Name                   | Type                                        | Default                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity                 | `string` or `object`                        | `undefined` required                                                                                         | Entity ID of a sensor supporting a single state with negative values for production and positive values for consumption or an object for [split entites](#split-entities). Examples of both can be found below.                                                                                                                                                                               |
| name                   | `string`                                    | `Grid`                                                                                                       | If you don't populate this option, the label will continue to update based on the language selected.                                                                                                                                                                                                                                                                                          |
| icon                   | `string`                                    | `mdi:transmission-tower`                                                                                     | Icon path for the icon inside the Grid Circle.                                                                                                                                                                                                                                                                                                                                                |
| color                  | `object`                                    |                                                                                                              | Check [Color Objects](#color-object) for more information.                                                                                                                                                                                                                                                                                                                                    |
| color_icon             | `boolean` or "production" or "consumption"  | `false`                                                                                                      | If set to `true`, icon color will match the highest value. If set to `production`, icon color will match the production. If set to `consumption`, icon color will match the consumption.                                                                                                                                                                                                      |
| display_state          | "two_way" or "one_way" or "one_way_no_zero" | `two_way`                                                                                                    | If set to `two_way` the production will always be shown simultaneously, no matter the state. If set to `one_way` only the direction that is active will be shown (since this card only shows instantaneous power, there will be no overlaps ✅). If set to `one_way_no_zero` the behavior will be the same as `one_way` but you will still the consumption direction when every state is `0`. |
| color_circle           | `boolean` or "production" or "consumption"  | `false`                                                                                                      | If set to `true`, the color of the grid circle changes depending on if you are consuming from the grid or returning to it. If set to `production`, circle color will match the production. If set to `consumption`, circle color will match the consumption. If set to `false`, circle color will match the consumption.                                                                      |
| secondary_info         | `object`                                    | `undefined`                                                                                                  | Check [Secondary Info Object](#secondary-info-configuration)                                                                                                                                                                                                                                                                                                                                  |
| display_zero_tolerance | `number`                                    | `0`                                                                                                          | If the state of the entity is less than this number, it will be considered zero. This is to avoid having the grid circle show a small amount of consumption when the battery is trying to correct itself to the grid.                                                                                                                                                                         |
| power_outage           | `object`                                    | `undefined`                                                                                                  | Configure how the card handles a power outage. Check [Power Outage](#power-outage) for more info.                                                                                                                                                                                                                                                                                             |
| color_value            | `boolean`                                   | Default is `true`. If set to `false`, the values of power will not be colored according to input and output. |                                                                                                                                                                                                                                                                                                                                                                                               |
| invert_state           | `boolean`                                   | `false`                                                                                                      | If set to true the direction as well as the values will be inverted, meaning a positive value will be shown as production and a negative value will be shown as consumption.                                                                                                                                                                                                                  |

#### Solar Configuration

| Name               | Type      | Default              | Description                                                                                                                                                        |
| ------------------ | --------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| entity             | `string`  | `undefined` required | Entity ID providing a state with the value of solar production.                                                                                                    |
| name               | `string`  | `Solar`              | Label for the solar option. If you don't populate this option, the label will continue to update based on the language selected.                                   |
| icon               | `string`  | `mdi:solar-power`    | Icon path for the icon inside the Solar Circle.                                                                                                                    |
| color              | `string`  |                      | HEX value of the color for circles labels and lines of solar production.                                                                                           |
| color_icon         | `boolean` | `false`              | If set to `true`, icon color will match the circle's color. If set to `false`, icon color will match the text's color.                                             |
| color_value        | `boolean` | `false`              | If set to `true`, text color of the state will match the circle's color. If set to `false`, text color of the state will be your primary text color.               |
| secondary_info     | `object`  | `undefined`          | Check [Secondary Info Object](#secondary-info-configuration)                                                                                                       |
| display_zero_state | `boolean` | `true`               | If set to `true`, the state will be shown even if it is `0`. If set to `false`, the state will be hidden if it is `0`.                                             |
| invert_state       | `boolean` | `false`              | If set to true the direction as well as the values will be inverted, meaning a negative value will be shown as production and a negative value will be shown as 0. |

#### Battery Configuration

| Name                             | Type                                        | Default                                                | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity                           | `string` or `object`                        | `undefined` required                                   | Entity ID of a sensor supporting a single state with negative values for production and positive values for consumption or an object for [split entities](#split-entities). Examples of both can be found below.                                                                                                                                                                              |
| state_of_charge                  | `string`                                    | `undefined` required                                   | Entity ID providing a state with the state of charge of the battery in percent (state of `100` for a full battery).                                                                                                                                                                                                                                                                           |
| state_of_charge_unit             | `string`                                    | `%`                                                    | Unit of the state of charge.                                                                                                                                                                                                                                                                                                                                                                  |
| state_of_charge_unit_white_space | `boolean`                                   | `true`                                                 | If set to `false`, the unit of the state of charge will not have a white space in front of it.                                                                                                                                                                                                                                                                                                |
| state_of_charge_decimals         | `number`                                    | `0`                                                    | Number of decimals to show for the state of charge.                                                                                                                                                                                                                                                                                                                                           |
| name                             | `string`                                    | `Battery`                                              | Label for the battery option. If you don't populate this option, the label will continue to update based on the language selected.                                                                                                                                                                                                                                                            |
| icon                             | `string`                                    | `mdi:battery` or dynamic based on state of the battery | Icon path for the icon inside the Battery Circle.                                                                                                                                                                                                                                                                                                                                             |
| color                            | `object`                                    |                                                        | Check [Color Objects](#color-object) for more information.                                                                                                                                                                                                                                                                                                                                    |
| color_icon                       | `boolean` or "production" or "consumption"  | `false`                                                | If set to `true`, icon color will match the highest value. If set to `production`, icon color will match the production. If set to `consumption`, icon color will match the consumption.                                                                                                                                                                                                      |
| display_state                    | "two_way" or "one_way" or "one_way_no_zero" | `two_way`                                              | If set to `two_way` the production will always be shown simultaneously, no matter the state. If set to `one_way` only the direction that is active will be shown (since this card only shows instantaneous power, there will be no overlaps ✅). If set to `one_way_no_zero` the behavior will be the same as `one_way` but you will still the consumption direction when every state is `0`. |
| state_of_charge_unit_white_space | `boolean`                                   | `true`                                                 | If set to `false`, there will be no white space between the state of charge and the unit of the state of charge.                                                                                                                                                                                                                                                                              |
| color_state_of_charge_value      | `boolean` or "production" or "consumption"  | `false`                                                | If set to `true`, state of charge text color will match the highest value. If set to `production`, state of charge text color will match the production. If set to `consumption`, state of charge text color will match the consumption.                                                                                                                                                      |
| color_circle                     | `boolean` or "production" or "consumption"  | `true`                                                 | If set to `true`, circle color will match the highest value. If set to `production`, circle color will match the production. If set to `consumption`, circle text color will match the consumption.                                                                                                                                                                                           |
| color_value                      | `boolean`                                   | `true`                                                 | If set to `false`, the values of power will not be colored according to input and output.                                                                                                                                                                                                                                                                                                     |
| invert_state                     | `boolean`                                   | `false`                                                | If set to true the direction as well as the values will be inverted, meaning a positive value will be shown as production and a negative value will be shown as consumption.                                                                                                                                                                                                                  |

#### Individual Configuration

The Individual fields must be an array of objects. Each object must follow the following structure:

| Name                   | Type      | Default                                        | Description                                                                                                                                                                          |
| ---------------------- | --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| entity                 | `string`  | `undefined` required                           | Entity ID providing a state with the value of an individual consumption.                                                                                                             |
| name                   | `string`  | `Car` or `Motorcycle`                          | Label for the individual device option. If you don't populate this option, the label will continue to update based on the language selected.                                         |
| icon                   | `string`  | `mdi:car-electric` or `mdi:motorbike-electric` | Icon path for the icon inside the Individual Device Circle.                                                                                                                          |
| color                  | `string`  | `#d0cc5b` or `#964cb5`                         | HEX value of the color for circles labels and lines of the individual device.                                                                                                        |
| color_icon             | `boolean` | `false`                                        | If set to `true`, icon color will match the circle's color. If set to `false`, icon color will match the text's color.                                                               |
| unit_of_measurement    | `string`  | `W`or `kW` (dynamic)                           | Sets the unit of measurement to show in the corresponding circle                                                                                                                     |
| inverted_animation     | `boolean` | `false`                                        | If set to true, the small dots will flow in the opposite direction.                                                                                                                  |
| secondary_info         | `object`  | `undefined`                                    | Check [Secondary Info Object](#secondary-info-configuration). The `secondary_info` entity can provide a number or a string (eg: EV State `charging` and `discharging`).              |
| display_zero           | `boolean` | `false`                                        | If set to `true`, the device will be displayed even if the entity state is `0` or not a number (eg: `unavailable`). Otherwise, the non-fossil section will be hidden.                |
| display_zero_tolerance | `number`  | `0`                                            | If set, the device will be displayed if the state is greater than the tolerance set (This is also available for the secondary info). No need to set `display_zero` property to true. |
| display_zero_state     | `boolean` | `true`                                         | If set to `true`, the state will be shown even if it is `0`. If set to `false`, the state will be hidden if it is `0`.                                                               |
| color_value            | `boolean` | `false`                                        | If set to `true`, state text color will match the circle's color. If set to `false`, state text color will be the primary text color.                                                |
| decimals               | `number`  | `0`                                            | Number of decimals to show in the corresponding state.                                                                                                                               |

#### Home Configuration

| Name                | Type                                        | Default              | Description                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity              | `string`                                    | `undefined` required | Entity ID providing a state with the value of your home's consumption. Note that this entity will not be displayed and will only be used for the more info dialog when clicking the home section.                                                                                                           |
| name                | `string`                                    | `Home`               | Label for the home option. If you don't populate this option, the label will continue to update based on the language selected.                                                                                                                                                                             |
| icon                | `string`                                    | `mdi:home`           | Icon path for the icon inside the Home Circle.                                                                                                                                                                                                                                                              |
| color_icon          | `boolean` or "solar" or "grid" or "battery" | `false`              | If set to `true`, icon color will match the highest value. If set to `solar`, icon color will match the color of solar. If set to `grid`, icon color will match the color of the grid consumption. If set to `battery`, icon color will match the color of the battery consumption.                         |
| color_value         | `boolean` or "solar" or "grid" or "battery" | `false`              | If set to `true`, state text color will match the highest value. If set to `solar`, state text color will match the color of solar. If set to `grid`, state text color will match the color of the grid consumption. If set to `battery`, state text color will match the color of the battery consumption. |
| secondary_info      | `object`                                    | `undefined`          | Check [Secondary Info Object](#secondary-info-configuration)                                                                                                                                                                                                                                                |
| subtract_individual | `boolean`                                   | false                | If set to `true`, the home consumption will be calculated by subtracting the sum of the individual devices from the home consumption.                                                                                                                                                                       |
| override_state      | `boolean`                                   | `false`              | If set to `true`, the home consumption will be the state of the entity provided. By default the home consumption is caluclated by adding up all sources. This is useful, when for example you are using an inverter and it has power losses.                                                                |

#### Fossil Fuel Configuration

| Name                | Type                  | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity              | `string`              | `none` required | Entity ID providing a state with the value of the percentage of fossil fuel consumption. The state should be `100` when all the energy from the grid comes from high emission sources and `0` when all the energy from the grid comes from low emission sources. It is recommended to use the CO2 Signal integration, which provides this sensor out of the box without any additional templating. This will also be the entity used in the more-info dialogs. |
| name                | `string`              | Low-carbon      | Name to appear as a label on top of the circle.                                                                                                                                                                                                                                                                                                                                                                                                                |
| icon                | `string`              | `mdi:leaf`      | Icon path (eg: `mdi:home`) to display inside the circle of the device.                                                                                                                                                                                                                                                                                                                                                                                         |
| color               | `string`              | `#0f9d58`       | HEX Value of a color to display as the stroke of the circle and line connecting to the grid.                                                                                                                                                                                                                                                                                                                                                                   |
| color_icon          | `boolean`             | `false`         | If `true`, the icon will be colored with the color property. Otherwise it will be the same color as all other icons.                                                                                                                                                                                                                                                                                                                                           |
| display_zero        | `boolean`             | `true`          | If set to `true`, the device will be displayed even if the entity state is `0` or not a number (eg: `unavailable`). Otherwise, the non-fossil section will be hidden.                                                                                                                                                                                                                                                                                          |
| display_zero_state  | `boolean`             | `true`          | If set to `true`, the state will be shown even if it is `0`. If set to `false`, the state will be hidden if it is `0`.                                                                                                                                                                                                                                                                                                                                         |
| state_type          | `string`              | `power`         | The type of state to use for the entity. Can be `power` or `percentage`. When set to `power` the state will be the amount of power from the grid that is low-carbon. When set to `percentage` the state will be the percentage of power from the grid that is low-carbon.                                                                                                                                                                                      |
| unit_white_space    | `boolean`             | `true`          | If set to `false` will not add any whitespace between unit and state. Otherwise, white space will be added.                                                                                                                                                                                                                                                                                                                                                    |
| calculate_flow_rate | `boolean` or `number` | `false`         | If set to `true`, the flow rate will be calculated by using the flow rate formula (either the new or the old one, depending on your configuration). If set to a number, the flow rate will be set to that number. For example, defining the value `10` will ensure one dot will flow every 10 seconds.                                                                                                                                                         |

#### Color Object

| Name        | Type     | Description                                                         |
| ----------- | -------- | ------------------------------------------------------------------- |
| production  | `string` | HEX value of the color for circles labels and lines of production.  |
| consumption | `string` | HEX value of the color for circles labels and lines of consumption. |

#### Split entities

Can be use with either Grid or Battery configuration. The same `unit_of_measurement` rule as above applies.

| Name        | Type     | Description                                                                                       |
| ----------- | -------- | ------------------------------------------------------------------------------------------------- |
| consumption | `string` | Entity ID providing a state value for consumption, this is required if using a split grid object. |
| production  | `string` | Entity ID providing a state value for production                                                  |

#### Secondary Info Configuration

This Feature allows you to configure an additional small text for each Individual Device. Here you can put , for example, the state of charge of an electric car.

| Name                   | Type              | Description                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| entity                 | `string` required | Entity ID providing a state value that is going to be displayed.                                                                                                                                                                                                                                                                                                                                             |
| unit_of_measurement    | `string`          | A string to be used as the unit of measurement. (Important: don't forget surrounding string with quotes)                                                                                                                                                                                                                                                                                                     |
| icon                   | `string`          | An icon path to be displayed next to the state of the individual device. This is optional, meaning if you don't use this, no icon will be displayed.                                                                                                                                                                                                                                                         |
| unit_white_space       | `boolean`         | Default is `true`. If set to `false` will not add any whitespace between unit and state. Otherwise, white space will be added.                                                                                                                                                                                                                                                                               |
| display_zero           | `boolean`         | Default is `false`. If set to `true` info will still be displayed if state of the entity is `0` or `unavailable`.                                                                                                                                                                                                                                                                                            |
| display_zero_tolerance | `number`          | If set, the device will be displayed if the state is greater than the tolerance set. No need to set `display_zero` property to true.                                                                                                                                                                                                                                                                         |
| decimals               | `number`          | The number of decimal places to round the value to.                                                                                                                                                                                                                                                                                                                                                          |
| template               | `string`          | Here you can enter a [HA Template](https://www.home-assistant.io/docs/configuration/templating/). The output of the template will be displayed. Space is limited inside the circle and too much text will result in overflow using ellipsis, so use with caution. Will update automatically in case one of the provided entities inside the template updates. Can only be used in case `entity` was not set. |
| accept_negative        | `boolean`         | Default is `false`. If set to `true`, negative values will be displayed as negative, otherwise they will be transformed to positive                                                                                                                                                                                                                                                                          |

#### Power Outage

This feature allows you to configure how the card handles a Grid Power Outage scenario.

| Name                | Type                  | Description                                                                                                                                                                               |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | 
| entity              | `string` required     | Entity ID providing a state that changes when there is a Power Outage. (eg: `binary_sensor.grid_connection_status`). Doesn't need to be a binary_sensor.                                  |
| entity_generator    | `string`              | Entity ID providing the power of a Generator. (eg: `sensor.generator_power`). This is optional, meaning if you don't use this, the card will assume the grid is the only source of power. |
| state_alert         | `string`              | The state the provided entity is at when there is a power outage. Default is `on`, meaning if the entity's state is `on` the card will assume there is a power outage.                    |
| icon_alert          | `string`              | An icon path to be override the grid icon when there is a power outage. Default is `mdi:transmission-tower-off`.                                                                          |
| label_alert         | `string`              | A text that will be displayed below the icon when there is a power outage.                                                                                                                |
| calculate_flow_rate | `boolean` or `number` | `false`                                                                                                                                                                                   | 
|                     |                       | If set to `true`, the flow rate will be calculated by using the flow rate formula (either the new or the old one, depending on your configuration). If set to a number, the flow rate will be set to that number. For example, defining the value `10` will ensure one dot will flow every 10 seconds. |

#### Display Zero Lines

This object allows you to control the behavior of the flow lines that are inactive.

| Name         | Type                          | Description                                                                                                                                                                                 |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mode         | string                        | Valid Options are: `show`, `hide`, `transparency`, `grey_out`, `custom`                                                                                                                     |
| transparency | number                        | A number between 0 and 100. 100 means the line doesn't show at all. 0 means the line shows in full opacity. Default is 50. Will be used when the mode is either `transparency` or `custom`. |
| grey_color   | `string` or `list of numbers` | Either a HEX Code or a List of three numbers between 0 and 255 in RGB order. Will be used when the mode is either `grey_out` or `custom`.                                                   |

### Minimal Configuration

> Don't forget to change the entity ids

The following configurations will allow you to achieve your results with the least amount of lines of code / complexity.
In these examples I decided to use the Split entities option, but feel free to use the combined entity option. [More Info](#split-entities)

#### Only Grid

```yaml
type: custom:power-flow-card-plus
entities:
  grid:
    entity: sensor.grid_power
    power_outage:
      entity: sensor.power_outage
    display_state: one_way
    color_circle: true
watt_threshold: 10000
```

This should give you something like this:

![demo_only_grid-2](https://user-images.githubusercontent.com/61006057/232316687-70962cf8-3a94-4e01-a556-f4cf7d978969.gif)

##### Grid and Solar

```yaml
type: custom:power-flow-card-plus
entities:
  grid:
    entity:
      consumption: sensor.grid_consumption
      production: sensor.grid_production
      display_state: one_way
      color_circle: true
  solar:
    entity: sensor.solar_production
```

This should give you something like this:

![demo_solar_and_grid](https://user-images.githubusercontent.com/61006057/232317682-e20c83e9-9b51-45b0-bcf5-13447d2e93b1.gif)

##### Grid, Solar and Battery

```yaml
type: custom:power-flow-card-plus
entities:
  grid:
    entity:
      consumption: sensor.grid_consumption
      production: sensor.grid_production
    display_state: one_way
    color_circle: true
  solar:
    entity: sensor.solar_production
  battery:
    entity:
      consumption: sensor.battery_consumption
      production: sensor.battery_production
    state_of_charge: sensor.battery_state_of_charge
    display_state: one_way
    color_circle: true
  home:
    color_icon: true
watt_threshold: 10000
```

This should give you something like this:

![demo_grid_solar_bat-2](https://user-images.githubusercontent.com/61006057/232319141-06ac61c7-daed-461e-9fdb-5ce84606bde6.gif)

### Mix & Match Config aka "Full Config"

> This Configuration is a little bit random, it's just here to demonstrate the capabilities of this card.

```yaml
type: custom:power-flow-card-plus
entities:
  home:
    entity: sensor.home_consumption
    color_icon: solar
  fossil_fuel_percentage:
    entity: sensor.fossil_fuel_percentage
    icon: mdi:pine-tree
    color_icon: true
    display_zero: true
    name: Non Fossil
    state_type: power
  grid:
    icon: mdi:ab-testing
    name: Provider
    entity:
      production: sensor.grid_production
      consumption: sensor.grid_consumption
  solar:
    icon: mdi:solar-panel-large
    entity: sensor.solar_production
  battery:
    name: Bateria
    icon: mdi:bat
    entity:
      consumption: sensor.battery_consumption
      production: sensor.battery_production
  individual:
    - entity: sensor.car_power
      icon: mdi:car-electric
      color: "#80b8ff"
      name: Denim Flash
      color_icon: false
    - entity: sensor.motorbike_power
      name: Qivi
      color_icon: true
      display_zero: true
      color: "#ff8080"
      icon: mdi:motorbike-electric
w_decimals: 0
kw_decimals: 2
min_flow_rate: 0.9
max_flow_rate: 6
watt_threshold: 10000
clickable_entities: true
title: Power Flow Card Plus
```

This should give you something like this:
![minimal_config_full](https://user-images.githubusercontent.com/61006057/227789815-41f15dd4-3d24-4eb8-96ca-c7f7f01a4f46.png)

### Random Configurations

![2023-03-26-13-04-07](https://user-images.githubusercontent.com/61006057/227771568-78497ecc-e863-46f2-b29e-e15c7c20a154.gif)
![recording_multi_indiv](https://github.com/flixlix/power-flow-card-plus/assets/61006057/337b921c-306c-4447-9c6f-1b4b72579731)
![demo](https://user-images.githubusercontent.com/61006057/232316110-eff64095-e147-4462-abfc-961c88d5ada8.gif)
![demo_grid_solar_bat](https://user-images.githubusercontent.com/61006057/233212881-89af5af0-4b25-4a7c-9da1-008801129130.png)

### UI Editor (available in version 0.2)

> [!TIP]
> I've made a lot of improvements in version 0.2 for the UI-Editor. Now each field has its own subpage, meaning there is now much less scrolling.
> The biggest change in the editor is the fact that you can now add up to 4 individual devices, all through the UI! 🥳

![ui-editor](https://github.com/flixlix/power-flow-card-plus/assets/61006057/a5d0cbb4-f430-4ba0-9c6f-8c93689206d7)

### Flow Formula

This formula is based on the official formula used by the Energy Distribution card.

```js
max - (value / totalLines) * (max - min);
// max = max_flow_rate
// min = min_flow_rate
// value = line value, solar to grid for example
// totalLines = gridConsumption + solarConsumption + solarToBattery +
//   solarToGrid + batteryConsumption + batteryFromGrid + batteryToGrid
```

### New Flow Formula

In contrast to the old flow formula, this formula calculates the flow rate independently from other lines, making it more intuitive to interpret the perceived power. This means that a state of `10W` will always flow with the same velocity, no matter what other lines are doing. In other words this flow rate is calculated in absolute and not relative values.

To get this new Flow Formula to work, simply set `use_new_flow_rate_model` in the main configuration to true. You may want to play around with the `max_expected_power`, `min_expected_power`, `max_flow_rate` and `min_flow_rate` to get the speeds that you wish

```js
if (value > maxIn) return maxOut; // In case power exceeds maximum expected power, use the fastest speed and ignore the rest.
return ((value - minIn) * (maxOut - minOut)) / (maxIn - minIn) + minOut;

// value = value of the current line to calculate (eg: grid to home)
//
// minIn = amount of watts at which the lowest speed will be selected.
//   ↳ In your configuration this is `min_expected_power`
//   ↳ eg: setting this at `100` means that at `100` watts, the dots will still flow at the lowest speed
// maxIn = amount of watts at which the highest speed will be selected.
//   ↳ In your configuration this is `max_expected_power`
//   ↳ eg: setting this at `2000` means that everything more than `2000` will flow at the highest speed selected
//
// minOut = amount of watts at which the lowest speed will be selected.
//   ↳ In your configuration this is `max_flow_rate`
//   ↳ eg: setting this at `5` means that one dot will take `5` second to travel
// maxOut = amount of watts at which the highest speed will be selected.
//   ↳ In your configuration this is `min_flow_rate`
//   ↳ eg: setting this at `1` means that one dot will take `1` second to travel
```

The following video aims to show the diffence between the two flow formulas:

<https://user-images.githubusercontent.com/61006057/231479254-91d6c625-8f38-4abb-b9ba-8dd24d6395f3.mp4>

Notice that when the Power changes to only coming from the sun, the old formula accelerates to maintain a constant amount of dots/second.
Using the new formula is more intuitive, since you can immediately see that the Solar Power is relatively low since the dots are flowing very slowly.
On the old Flow Formula you might think that the sun is producing a lot of power, which in this case is not true.

At the end of the day these are two options and depending on what you're interested, one might suit you better than the other, that's why I kept the old formula, you have the choice. 🙂

### To-Do List

Here is my to-do list containing a few enhancements I am planning in adding. The ones at the top are bigger priorities, so they’ll probably be available before the ones at the bottom.

- [x] Change Tap Action Behavior to be compatible with Browser Mod
- Fill the circles [#89](https://github.com/flixlix/power-flow-card-plus/issues/89)
- [x] More than two Individual Devices [#54](https://github.com/flixlix/power-flow-card-plus/issues/54)
- More than one solar source [#23](https://github.com/flixlix/power-flow-card-plus/issues/23)
- Display Connected/Disconnected status [#111](https://github.com/flixlix/power-flow-card-plus/issues/111)
- Grid Feed In Circle [#119](https://github.com/flixlix/power-flow-card-plus/issues/119)
- Improve performance [#144](https://github.com/flixlix/power-flow-card-plus/issues/144)

I am still just one person working on this project and obviously have other things going on in my life, so feel free to contribute to the project. You can also feel free to create a PR with a new feature and I'll try my best to review it 😊

# Power Flow Card Plus

![GitHub release (latest by date)](https://img.shields.io/github/v/release/flixlix/power-flow-card-plus?style=flat-square)
![GitHub all releases](https://img.shields.io/github/downloads/flixlix/power-flow-card-plus/total?style=flat-square)
[![ko-fi support](https://img.shields.io/badge/support-me-ff5e5b?style=flat-square&logo=ko-fi)](https://ko-fi.com/flixlix)

<img src="https://user-images.githubusercontent.com/61006057/227745087-3ec4b137-1954-46a9-9a13-9091b9f43fea.png" width="100%" />

## Additional Features / Enhancements

- Display Individual power entities
- Customize Individual entities's label, icon and color (Unit of measurement is on the To-Do List)
- Configure wether to hide Individual Entity when state is 0 or unavailable
- Clickable entities (including home)
- Fixed crooked lines [PR #4](https://github.com/flixlix/power-flow-card-plus/pull/4)
- Keep color of battery to grid line, even when not returning
- Display Low Carbon Energy from the grid
- Customize Low Carbon Energy label, icon, circle color, icon color and state type

## Goal/Scope

Display current power, gas, and water usage in a display that matches the the official Energy Distribution card included with [Home Assistant](https://home-assistant.io/) as much as possible.




## Install

### HACS (recommended)

This card is not direclty available in [HACS](https://hacs.xyz/) (Home Assistant Community Store).
_HACS is a third party community store and is not included in Home Assistant out of the box._
To install this:

- Go to HACS
- Click on `Frontend`
- Click on the overflow Menu (three vertical dots)
- Click on `Custom Repositories`
- Type this URL [https://github.com/flixlix/power-flow-card-plus](https://github.com/flixlix/power-flow-card-plus)
- In "Category", select `lovelace`
- Install via UI

### Manual install

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

## Using the card

I recommend looking at the [Example usage section](#example-usage) to understand the basics to configure this card.
(also) pay attention to the **required** options mentioned below.

### Options

#### Card options

| Name               | Type      |   Default    | Description                                                                                                                                                                  |
| ------------------ | --------- | :----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type               | `string`  | **required** | `custom:power-flow-card-plus`.                                                                                                                                                    |
| entities           | `object`  | **required** | One or more sensor entities, see [entities object](#entities-object) for additional entity options.                                                                          |
| title              | `string`  |              | Shows a title at the top of the card.                                                                                                                                        |
| dashboard_link     | `string`  |              | Shows a link to an Energy Dashboard. Should be a url path to location of your choice. If you wanted to link to the built-in dashboard you would enter `/energy` for example. |
| inverted_entities  | `string`  |              | Comma seperated list of entities that should be inverted (negative for consumption and positive for production). See [example usage](#inverted-entities-example).            |
| kw_decimals        | `number`  |      1       | Number of decimals rounded to when kilowatts are displayed.                                                                                                                  |
| w_decimals         | `number`  |      1       | Number of decimals rounded to when watts are displayed.                                                                                                                      |
| min_flow_rate      | `number`  |     .75      | Represents the fastest amount of time in seconds for a flow dot to travel from one end to the other, see [flow formula](#flow-formula).                                      |
| max_flow_rate      | `number`  |      6       | Represents the slowest amount of time in seconds for a flow dot to travel from one end to the other, see [flow formula](#flow-formula).                                      |
| watt_threshold     | `number`  |      0       | The number of watts to display before converting to and displaying kilowatts. Setting of 0 will always display in kilowatts.                                                 |
| clickable_entities | `boolean` |    false     | If true, clicking on the entity will open the entity's more info dialog.                                                                                                     |

#### Entities object

At least one of _grid_, _battery_, or _solar_ is required. All entites (except _battery_charge_) should have a `unit_of_measurement` attribute of W(watts) or kW(kilowatts).

| Name           | Type                | Description                                                                                                                                                                                                     |
| -------------- | :------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| grid           | `string` / `object` | Entity ID of a sensor supporting a single state with negative values for production and positive values for consumption or an object for [split entites](#split-entities). Examples of both can be found below. |
| battery        | `string` / `object` | Entity ID of a sensor supporting a single state with negative values for production and positive values for consumption or an object for [split entites](#split-entities). Examples of both can be found below. |
| battery_charge | `string`            | Entity ID providing a state with the current percentage of charge on the battery.                                                                                                                               |
| solar          | `string`            | Entity ID providing a state with the value of generation.                                                                                                                                                       |
| individual1    | `object`            | Check [Individual Devices](#individual-devices) for more information. |
| individual2    | `object`            | Check [Individual Devices](#individual-devices) for more information. |
| home          | `string`            | Entity ID providing a state with the value of home consumption. This value will not be displayed in the card. It is only responsible for the dialog that opens when clicking on the home icon |
| fossil_fuel_percentage | `object`            | Check [Fossil Fuel Percentage](#fossil-fuel-percentage) for more information. |


#### Split entities

Can be use with either Grid or Battery configuration. The same `unit_of_measurement` rule as above applies.

| Name        | Type     | Description                                                                                       |
| ----------- | -------- | ------------------------------------------------------------------------------------------------- |
| consumption | `string` | Entity ID providing a state value for consumption, this is required if using a split grid object. |
| production  | `string` | Entity ID providing a state value for production                                                  |

### Example usage

#### Combined Entites Example

Using combined entities for grid, battery and solor that support positive state values for consumption and negative state values for production.

```yaml
type: custom:power-flow-card-plus
entities:
  battery: sensor.battery_in_out
  battery_charge: sensor.battery_percent
  grid: sensor.grid_in_out
  solar: sensor.solar_out
```

#### Inverted Entities Example

Using combined entites as above but where the battery and grid entities are inverted (negative = consumption and positive = production).

```yaml
type: custom:power-flow-card-plus
entities:
  battery: sensor.battery_in_out
  battery_charge: sensor.battery_percent
  grid: sensor.grid_in_out
  solar: sensor.solar_out
inverted_entities: battery, grid
```

#### Split Entites Example

Using split entities for grid and battery where each consumption and production entity state has a positive value.

```yaml
type: custom:power-flow-card-plus
entities:
  battery:
    consumption: sensor.battery_out
    production: sensor.battery_in
  battery_charge: sensor.battery_percent
  grid:
    consumption: sensor.grid_out
    production: sensor.grid_in
  solar: sensor.solar_out
```

#### Individual Devices

Using individual devices for consumption.

| Name           | Type              | Default   | Description                                                                                                                                                                                                     |
| -------------- | :------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity           | `string` | `none` | Entity ID of a sensor supporting a single state. |
| name        | `string` | Car / Motorcycle | Name to appear as a label next to the circle. |
| icon | `string`            | `mdi:car-electric` / `mdi:motorbike-electric` | Icon path (eg: `mdi:home`) to display inside the circle of the device. |
| color          | `string`        | `#d0cc5b` / `#964cb5` |  HEX Value of a color to display as the stroke of the circle and line connecting to your home. |
| display_zero | `boolean` | `false` | If true, the device will be displayed even if the entity state is 0 or not a number (eg: unavailable). |

![image](https://user-images.githubusercontent.com/61006057/227382826-7918ecdc-f578-421e-8d5e-6400e366802e.png)

##### Example using individual devices

```yaml
type: custom:power-flow-card-plus
entities:
  grid:
    production:
      - sensor.grid_out_power
    consumption:
      - sensor.grid_in_power
  solar:
    - sensor.solar_power
  battery_charge:
    - sensor.battery_state_of_charge
  battery:
    production:
      - sensor.battery_in_power
    consumption:
      - sensor.battery_out_power
  individual1:
    entity: sensor.heater_power
    name: Heater
    icon: mdi:radiator
    color: "#ff0000"
  individual2:
    entity: sensor.fridge_power
    name: Fridge
    icon: mdi:fridge
    color: "#0000ff"
```

### Flow Formula

This formula is based on the offical formula used by the Energy Distribution card.

```js
max - (value / totalLines) * (max - min);
// max = max_flow_rate
// min = min_flow_rate
// value = line value, solar to grid for example
// totalLines = gridConsumption + solarConsumption + solarToBattery +
//   solarToGrid + batteryConsumption + batteryFromGrid + batteryToGrid
```

I'm not 100% happy with this. I'd prefer to see the dots travel slower when flow is low, but faster when flow is high. For example if the only flow is Grid to Home, I'd like to see the dot move faster if the flow is 15kW, but slower if it's only 2kW. Right now the speed would be the same. If you have a formula you'd like to propose please submit a PR.

### Fossil Fuel Percentage


| Name           | Type              | Default   | Description                                                                                                                                                                                                     |
| -------------- | :------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity           | `string` | `none` | Entity ID providing a state with the value of the percentage of fossil fuel consumption. The state should be `100` when all the energy from the grid comes from high emission sources and `0` when all the energy from the grid comes from low emission sources. It is recommended to use the CO2 Signal integration, which provides this sensor out of the box without any additional templating. This will also be the entity used in the more-info dialogs. |
| name        | `string` | Low-carbon | Name to appear as a label on top of the circle. |
| icon | `string`            | `mdi:leaf` | Icon path (eg: `mdi:home`) to display inside the circle of the device. |
| color          | `string`        | `#0f9d58` |  HEX Value of a color to display as the stroke of the circle and line connecting to the grid. |
| color_icon | `boolean` | `false` | If `true`, the icon will be colored with the color property. Otherwise it will be the same color as all other icons. |
| display_zero | `boolean` | `false` | If `true`, the device will be displayed even if the entity state is `0` or not a number (eg: `unavailable`). Otherwise, the non-fossil section will be hidden. |
| state_type | `string` | `power` | The type of state to use for the entity. Can be `power` or `percentage`. When set to `power` the state will be the amount of power from the grid that is low-carbon. When set to `percentage` the state will be the percentage of power from the grid that is low-carbon. |

### Full Example

This example aims to show you what is possible using this card, I don't recommend copying and pasting it without understanding what each property does.

```yaml
type: custom:power-flow-card-plus
entities:
  grid:
    production:
      - sensor.grid_out_power
    consumption:
      - sensor.grid_in_power
  solar:
    - sensor.solar_power
  battery_charge:
    - sensor.battery_state_of_charge
  battery:
    production:
      - sensor.battery_in_power
    consumption:
      - sensor.battery_out_power
  individual1:
    entity: sensor.heater_power
    name: Heater
    icon: mdi:radiator
    color: "#ff0000"
    display_zero: true
  individual2:
    entity: sensor.fridge_power
    name: Fridge
    icon: mdi:fridge
    color: "#0000ff"
    display_zero: false
  fossil_fuel_percentage:
    entity: sensor.co2signal_co2_intensity
    name: Low-carbon
    icon: mdi:leaf
    color: "#0f9d58"
    color_icon: false
    display_zero: false
    state_type: power
title: Power Flow
dashboard_link: '/energy'
w_decimals: 0
kw_decimals: 2
min_flow_rate: 1
max_flow_rate: 3
watt_threshold: 10000
clickable_entities: true
```

#### Credits

- [power-flow-card](https://github.com/ulic75/power-flow-card) by [ulic75](https://github.com/ulic75)

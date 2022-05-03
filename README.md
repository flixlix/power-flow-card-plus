# Power Distribution Card

[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=flat-square)](https://github.com/hacs/integration)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/ulic75/power-distribution-card?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ulic75/power-distribution-card/CI?style=flat-square)
![GitHub all releases](https://img.shields.io/github/downloads/ulic75/power-distribution-card/total?style=flat-square)

This card for [Home Assistant](https://github.com/home-assistant/home-assistant) Dashboards is designed to provide power distribution in an identical style to the Official Energy Distribution card included by Home Assistant.

![realtime-distribution-preview](https://user-images.githubusercontent.com/5641964/165636264-dc2e02ed-e550-4167-9ce4-3dcbd7a84272.png)

## Install

### HACS (recommended)

This card is available in [HACS](https://hacs.xyz/) (Home Assistant Community Store).
<small>_HACS is a third party community store and is not included in Home Assistant out of the box._</small>

### Manual install

1. Download and copy `power-distribution-card.js` from the [latest release](https://github.com/ulic75/power-distribution-card/releases/latest) into your `config/www` directory.

2. Add the resource reference as decribed below.

### Add resource reference

If you configure Dashboards via YAML, add a reference to `power-distribution-card.js` inside your `configuration.yaml`:

```yaml
resources:
  - url: /local/power-distribution-card.js
    type: module
```

Else, if you prefer the graphical editor, use the menu to add the resource:

1. Make sure, advanced mode is enabled in your user profile (click on your user name to get there)
2. Navigate to Configuration -> Dashboards -> Resources Tab. Hit (+ ADD RESOURCE) icon
3. Enter URL `/local/power-distribution-card.js` and select type "JavaScript Module".
   (Use `/hacsfiles/power-distribution-card/power-distribution-card.js` and select "JavaScript Module" for HACS install if HACS didn't do it already)

## Using the card

I recommend looking at the [Example usage section](#example-usage) to understand the basics to configure this card.
(also) pay attention to the **required** options mentioned below.

### Options

#### Card options

| Name          | Type     |   Default    | Description                                                                                                                             |
| ------------- | -------- | :----------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| type          | `string` | **required** | `custom:power-distribution-card`.                                                                                                       |
| entities      | `object` | **required** | One or more sensor entities, see [entities object](#entities-object) for additional entity options.                                     |
| min_flow_rate | `number` |     .75      | Represents the fastest amount of time in seconds for a flow dot to travel from one end to the other, see [flow formula](#flow-formula). |
| max_flow_rate | `number` |      6       | Represents the slowest amount of time in seconds for a flow dot to travel from one end to the other, see [flow formula](#flow-formula). |

#### Entities object

| Name           | Type                | Default      | Description                                                                                                                                                                                                     |
| -------------- | :------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| grid           | `string` / `object` | **required** | Entity ID of a sensor supporting a single state with negative values for production and positive values for consumption or an object for [split entites](#split-entities). Examples of both can be found below. |
| battery        | `string` / `object` |              | Entity ID of a sensor supporting a single state with negative values for production and positive values for consumption or an object for [split entites](#split-entities). Examples of both can be found below. |
| battery_charge | `string`            |              | Entity ID providing a state with the current percentage of charge on the battery.                                                                                                                               |
| solar          | `string`            |              | Entity ID providing a state with the value of generation.                                                                                                                                                       |

#### Split entities

Can be use with either Grid or Battery configuration

| Name        | Type     | Default               | Description                                                                                       |
| ----------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| consumption | `string` | **required** for grid | Entity ID providing a state value for consumption, this is required if using a split grid object. |
| production  | `string` |                       | Entity ID providing a state value for production                                                  |

### Example usage

#### Using combined entities for grid and battery that support positive state values for consumption and negative state values for production.

```yaml
type: custom:power-distribution-card
title: Realtime Distribution
entities:
  battery: sensor.battery_in_out
  battery_charge: sensor.battery_percent
  grid: sensor.grid_in_out
  solar: sensor.solar_out
max_flow_rate: 10
```

#### Using split entities for grid and battery where each consumption and production entity state has a positive value.

```yaml
type: custom:power-distribution-card
title: Realtime Distribution
entities:
  battery:
    consumption: sensor.battery_out
    production: sensor.battery_in
  battery_charge: sensor.battery_percent
  grid:
    consumption: sensor.grid_out
    production: sensor.grid_in
  solar: sensor.solar_out
max_flow_rate: 10
```

### Flow Formula

This formula is based on the offical formula used by the Energy Distribution card.

```js
max - (value / total) * (max - min);
```

I'm not 100% happy with this. I'd prefer to see the dots travel slower when flow is low, but faster when flow is high. For example if the only flow is Grid to Home, I'd like to see the dot move faster if the flow is 15kW, but slower if it's only 2kW. Right now the speed would be the same. If you have a formula you'd like to propose please submit a PR.

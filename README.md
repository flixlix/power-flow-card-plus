# Realtime Energy Distribution Card

This card for [Home Assistant](https://github.com/home-assistant/home-assistant) Dashboard card is designed to mimic the historic distribution card included by Home Assistant.

The card works with entities from within the **sensor** & **binary_sensor** domain and displays the sensors current state as well as a line graph representation of the history.

![realtime-distribution-preview](https://user-images.githubusercontent.com/5641964/165636264-dc2e02ed-e550-4167-9ce4-3dcbd7a84272.png)

## Install

### HACS (recommended)

This card is available in [HACS](https://hacs.xyz/) (Home Assistant Community Store).
<small>_HACS is a third party community store and is not included in Home Assistant out of the box._</small>

### Manual install

1. Download and copy `realtime-energy-distribution-card.js` from the [latest release](https://github.com/ulic75/realtime-energy-distribution-card/releases/latest) into your `config/www` directory.

2. Add the resource reference as decribed below.

### Add resource reference

If you configure Dashboards via YAML, add a reference to `realtime-energy-distribution-card.js` inside your `configuration.yaml`:

```yaml
resources:
  - url: /local/realtime-energy-distribution-card.js
    type: module
```

Else, if you prefer the graphical editor, use the menu to add the resource:

1. Make sure, advanced mode is enabled in your user profile (click on your user name to get there)
2. Navigate to Configuration -> Dashboards -> Resources Tab. Hit (+ ADD RESOURCE) icon
3. Enter URL `/local/realtime-energy-distribution-card.js` and select type "JavaScript Module".
   (Use `/hacsfiles/realtime-energy-distribution-card/realtime-energy-distribution-card.js` and select "JavaScript Module" for HACS install)
4. Restart Home Assistant.

## Using the card

We recommend looking at the [Example usage section](#example-usage) to understand the basics to configure this card.
(also) pay attention to the **required** options mentioned below.

### Options

#### Card options

| Name                      | Type   | Default | Description                                                                                             |
| ------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------- |
| type **_(required)_**     | string |         | `custom:realtime-energy-distribution-card`.                                                             |
| entities **_(required)_** | map    |         | One or more sensor entities in a list, see [entities map](#entities-map) for additional entity options. |
|                           |

#### Entities map

| Name                     | Unit | Description                                                                            |
| ------------------------ | :--: | -------------------------------------------------------------------------------------- |
| battery **_(required)_** |  kW  | Entity providing a positive value when charging and a negative value when discharging. |
| battery_charge           |  %   | Entity providing the current percentage of charge on the battery.                      |
| grid **_(required)_**    |  kW  | Entity providing a positive value when consuming and a negative value when producting. |
| solar **_(required)_**   |  kW  | Entity providing a value of generation.                                                |

### Example usage

```yaml
type: custom:realtime-energy-distribution-card
title: Realtime Distribution
entities:
  battery: sensor.powerwall_battery_now
  battery_charge: sensor.powerwall_charge
  grid: sensor.powerwall_site_now
  solar: sensor.powerwall_solar_now
```

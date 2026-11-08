# power-flow-card-plus

## 0.4.0

### Minor Changes

- [#431](https://github.com/flixlix/flixlix-cards/pull/431) [`a3b6a42`](https://github.com/flixlix/flixlix-cards/commit/a3b6a42ebda4bb29c344b7c471e5e96dd5b3068d) Thanks [@flixlix](https://github.com/flixlix)! - Default dot speed is back to how it was before 0.4.0-beta.0: the time per dot shrinks linearly with power (with the defaults, 1000 W takes 3.4 s per dot again). The faster speed-based curve from 0.4.0-beta.0, where twice the power looks about twice as fast, is available with `flow_rate_model: speed`, and `flow_rate_model: relative` selects the relative formula. The option replaces the "New Flow Model?" toggle in the editor with a select. `use_new_flow_rate_model` still works as the older alias (`false` is `relative`); `flow_rate_model` wins when both are set. Energy Flow Card Plus always uses the relative formula and ignores `flow_rate_model`.

- [#423](https://github.com/flixlix/flixlix-cards/pull/423) [`9954453`](https://github.com/flixlix/flixlix-cards/commit/995445387c5b3ab9b6936aa0f02eee5d3b9d27aa) Thanks [@flixlix](https://github.com/flixlix)! - New `accept_negative` option on individual devices. With it, a negative reading means the device feeds power to the home (e.g. an EV discharging with V2G): the value keeps its minus sign and the dots and direction arrow flip. Without it, nothing changes: the sign is dropped as before.

- [#370](https://github.com/flixlix/flixlix-cards/pull/370) [`ef34736`](https://github.com/flixlix/flixlix-cards/commit/ef3473652a831b05b9cbbf967c9a487ae3dce5f7) Thanks [@flixlix](https://github.com/flixlix)! - Flows are now worked out the same way on both cards, in the order the Home Assistant energy dashboard uses, so the same readings always draw the same lines. Flows never go negative and never carry more than a source produces or a sink takes: for example, solar can no longer appear to export more than it generates. When the grid is hidden or during a power outage, solar and battery flows are recalculated instead of losing the part that went to the grid, and Energy Flow Card Plus now shows battery flows during an outage too. With a home entity using `override_state`, the card still shows its reading, while the lines and the home circle stay balanced.

  Power Flow Card Plus readings whose flows change:

  | Readings                                                                              | Before                                                                        | Now                                                                                                    |
  | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
  | Import 200 W, export 600 W, solar 500 W, battery discharging 150 W and charging 200 W | Solar → grid 600 W, grid → battery 200 W, battery → grid 0 W, grid → home 0 W | Solar → grid 450 W, solar → battery 50 W, grid → battery 150 W, battery → grid 150 W, grid → home 50 W |
  | Grid/battery exchange below the larger of the grid and battery zero tolerances        | Dropped                                                                       | Shown unless below the node's own tolerance                                                            |
  | Outage with the battery charging                                                      | Grid → battery from the live grid reading                                     | Grid → battery from the generator                                                                      |

### Patch Changes

- [#448](https://github.com/flixlix/flixlix-cards/pull/448) [`3832579`](https://github.com/flixlix/flixlix-cards/commit/38325798e825932acf04997758d54fd88e99c309) Thanks [@flixlix](https://github.com/flixlix)! - The card no longer draws over overlays on the page, such as a floating navigation bar. Its circles are layered inside the card only.

- [#370](https://github.com/flixlix/flixlix-cards/pull/370) [`2634c20`](https://github.com/flixlix/flixlix-cards/commit/2634c20f63aa3fcd3e3a93ae0a0bc42f4f4afc34) Thanks [@flixlix](https://github.com/flixlix)! - Fix: the home circle no longer breaks (NaN segments) when nothing is being consumed. Energy Flow Card Plus now honours `invert_state` on single grid and battery entities, reads non-fossil and grid values from the selected energy period instead of live sensor states, and individual devices with a numeric `calculate_flow_rate` animate consistently in every position.

- [#435](https://github.com/flixlix/flixlix-cards/pull/435) [`f2000f8`](https://github.com/flixlix/flixlix-cards/commit/f2000f8eb73cbf021bb8c07da6fb8d7f0cca32d3) Thanks [@flixlix](https://github.com/flixlix)! - Flow dots use far less CPU and battery: the browser now moves them on the GPU instead of redrawing the card every frame. Dots also keep their place on the line when their speed changes, including the dots of individual devices and the low-carbon circle, instead of jumping.

- [#432](https://github.com/flixlix/flixlix-cards/pull/432) [`9ac9962`](https://github.com/flixlix/flixlix-cards/commit/9ac9962716bfe6e7f32d2a7ad94c01d5a95789cf) Thanks [@flixlix](https://github.com/flixlix)! - The version line each card writes to the browser console has a new look.

- [#424](https://github.com/flixlix/flixlix-cards/pull/424) [`aa5071c`](https://github.com/flixlix/flixlix-cards/commit/aa5071cddc83e1ab995a56c96355791811457cd9) Thanks [@flixlix](https://github.com/flixlix)! - The UI editor no longer shows "Display Zero" switched on for individual devices and the non-fossil node when the option is not set. The card hides those nodes at zero unless `display_zero: true` is set, and the editor now shows the toggle off to match. The non-fossil documentation now gives the default as `false`.

- [#437](https://github.com/flixlix/flixlix-cards/pull/437) [`2adc500`](https://github.com/flixlix/flixlix-cards/commit/2adc500721e3e0f14d5de847e3c1495211754829) Thanks [@flixlix](https://github.com/flixlix)! - Visual editor: filling in a "Separated" consumption/production field while `entity` held a single sensor no longer saves that sensor split into characters (`'0': s`, `'1': e`, …). Configs already saved that way are cleaned the next time the entity's page is edited.

- [#446](https://github.com/flixlix/flixlix-cards/pull/446) [`e7f784e`](https://github.com/flixlix/flixlix-cards/commit/e7f784ea5c545594effe25dbc517b7d6b261ba1c) Thanks [@flixlix](https://github.com/flixlix)! - A node whose entity was cleared in the visual editor is no longer drawn. Clearing the field leaves an empty entity (`entity: ""`) in the config, and solar and the grid still showed it with a value of 0; now a node is drawn only with a real entity, as the battery already was.

- [#348](https://github.com/flixlix/flixlix-cards/pull/348) [`0eb74c9`](https://github.com/flixlix/flixlix-cards/commit/0eb74c9c0aa098144741b366d1974232419427bc) Thanks [@bramkragten](https://github.com/bramkragten)! - Resolve field names through `hass.formatEntityName` so they follow Home Assistant's registry-based naming instead of `friendly_name`. A field's `name` now also accepts a structured name, letting you compose it from the entity, device, area or floor. Requires Home Assistant 2026.4; older versions keep the previous behaviour.

- [#296](https://github.com/flixlix/flixlix-cards/pull/296) [`f8bed9e`](https://github.com/flixlix/flixlix-cards/commit/f8bed9ed8f3b87eaefe019444bd6b37a98856966) Thanks [@flixlix](https://github.com/flixlix)! - Fix: individual devices with negative readings are no longer hidden when display_zero is off

- [#433](https://github.com/flixlix/flixlix-cards/pull/433) [`a4c4856`](https://github.com/flixlix/flixlix-cards/commit/a4c48565b9e97bd68209bdc2d80c018d05d05edc) Thanks [@flixlix](https://github.com/flixlix)! - Flow lines meet the circles exactly at every card width: on narrow cards they no longer run into the solar and battery circles or stop short of the grid and home, and they are centred on each circle. Wide cards keep the same curves.

- [#419](https://github.com/flixlix/flixlix-cards/pull/419) [`90f01f4`](https://github.com/flixlix/flixlix-cards/commit/90f01f4ce1b72b8e47b07ccad3e033f04bf2a85c) Thanks [@flixlix](https://github.com/flixlix)! - Docs now state the real flow-rate defaults (no behaviour change): Power Flow Card Plus uses the new flow formula unless `use_new_flow_rate_model: false`, Energy Flow Card Plus always uses the relative formula (so `use_new_flow_rate_model`, `min_expected_power` and `max_expected_power` don't apply to it), and an unset `calculate_flow_rate` uses the calculated rate.

- [#368](https://github.com/flixlix/flixlix-cards/pull/368) [`7cc309d`](https://github.com/flixlix/flixlix-cards/commit/7cc309d9d5a8f44c644e0c1160b93c67df588f54) Thanks [@flixlix](https://github.com/flixlix)! - Built against the same Lit and Home Assistant websocket versions as the current Home Assistant frontend.

- [#423](https://github.com/flixlix/flixlix-cards/pull/423) [`ed57230`](https://github.com/flixlix/flixlix-cards/commit/ed57230af97753932fdd58449b05b29298dfa2c8) Thanks [@flixlix](https://github.com/flixlix)! - The direction arrow of an individual device in the right-bottom slot now points the way its dots move. It used to point up while the dots moved from the home down to the device.

- [#427](https://github.com/flixlix/flixlix-cards/pull/427) [`8a0df59`](https://github.com/flixlix/flixlix-cards/commit/8a0df5973c604ab0d6dcf264916e9d777294d604) Thanks [@flixlix](https://github.com/flixlix)! - Fix: an individual device's secondary info now shows text states such as "heating", as grid and home already did. Unavailable or unknown states stay hidden.

- [#370](https://github.com/flixlix/flixlix-cards/pull/370) [`35fae9f`](https://github.com/flixlix/flixlix-cards/commit/35fae9fee82bafb9038c91b06bda2476438a8e65) Thanks [@flixlix](https://github.com/flixlix)! - Fix: with `clickable_entities` on, nodes can be reached with Tab and opened with Enter, which never worked before. Holding a node's value no longer runs its hold action twice (a `toggle` hold action used to cancel itself out).

- [#426](https://github.com/flixlix/flixlix-cards/pull/426) [`7dba4d6`](https://github.com/flixlix/flixlix-cards/commit/7dba4d63a8cd32d75ddd2e126749c43a4f819639) Thanks [@flixlix](https://github.com/flixlix)! - Cards load again on Google Cast displays (Chromecast, Nest Hub) and other older browsers and wall-panel webviews that Home Assistant itself still supports (Chromium 67 and newer). Before, the cards shipped optional chaining (`?.`) and nullish coalescing (`??`), which those browsers cannot read, so the card stayed empty or showed "Configuration Error". The cards are about 5% larger as a result.

- [#430](https://github.com/flixlix/flixlix-cards/pull/430) [`24ecd05`](https://github.com/flixlix/flixlix-cards/commit/24ecd05fff4f659621eafe00416e126aa92e3540) Thanks [@flixlix](https://github.com/flixlix)! - Individual device dots and the grid → battery dot no longer run backwards on older Chromium-based browsers, such as Amazon Fire tablets. The cards also no longer stay blank on browsers older than Chrome 92. Nothing changes on current browsers.

- [#384](https://github.com/flixlix/flixlix-cards/pull/384) [`71c1005`](https://github.com/flixlix/flixlix-cards/commit/71c10057789be2164b533a87a2f39995cb3769fc) Thanks [@flixlix](https://github.com/flixlix)! - With the new flow rate model, dot speed now grows in step with power: twice the power looks about twice as fast. Before, the time per dot shrank in step with power, so most of the range crawled and only values close to `max_expected_power` looked fast. `min_expected_power` still gives the slowest dots (`max_flow_rate`) and `max_expected_power` the fastest (`min_flow_rate`). In between, dots now move faster than before: with the defaults, a flow at half of `max_expected_power` takes 1.3 s per dot instead of 3.4 s. Values below `min_expected_power` no longer move slower than `max_flow_rate`. The old flow rate model (`use_new_flow_rate_model: false`) is unchanged.

  `calculate_flow_rate` set to a number now does what the documentation says: a line moves one dot every that many seconds. Before, the number was only used when no flow rate could be calculated.

- [#382](https://github.com/flixlix/flixlix-cards/pull/382) [`002654f`](https://github.com/flixlix/flixlix-cards/commit/002654f94eaecc53066db0cf3178c0db0d8eef39) Thanks [@flixlix](https://github.com/flixlix)! - Fix: `unit_of_measurement`, `unit_white_space` and `decimals` set on grid, solar or battery are now applied to their values. A custom unit shows the reading as is, without converting it to k/M, so the card can show non-electrical flows such as water in L/min.

  The grid, solar and battery pages of the visual editor now offer these three fields.

- [#368](https://github.com/flixlix/flixlix-cards/pull/368) [`7cc309d`](https://github.com/flixlix/flixlix-cards/commit/7cc309d9d5a8f44c644e0c1160b93c67df588f54) Thanks [@flixlix](https://github.com/flixlix)! - The non-fossil node now appears based on the grid's actual non-fossil share instead of a miscalculated value.

- [#381](https://github.com/flixlix/flixlix-cards/pull/381) [`f8dbfb4`](https://github.com/flixlix/flixlix-cards/commit/f8dbfb4d9bfa59453444a77edb16720be4802cac) Thanks [@flixlix](https://github.com/flixlix)! - Fix: the non-fossil node is now hidden while grid import is within the grid's `display_zero_tolerance`, the same as when the grid reads exactly 0 (unless `fossil_fuel_percentage.display_zero` is on).

- [#436](https://github.com/flixlix/flixlix-cards/pull/436) [`a2bf4c9`](https://github.com/flixlix/flixlix-cards/commit/a2bf4c9eb725ae192c48597858c1ba029959f5d6) Thanks [@flixlix](https://github.com/flixlix)! - The non-fossil node is labelled "Low-carbon" in your language, like Home Assistant's energy distribution card. Without a `name` its label used to be empty.

- [#428](https://github.com/flixlix/flixlix-cards/pull/428) [`8ad6715`](https://github.com/flixlix/flixlix-cards/commit/8ad6715c1e4bb58f85e47258e0fd203b7a807e42) Thanks [@flixlix](https://github.com/flixlix)! - On right-to-left Home Assistant languages (Arabic, Hebrew, Persian, …) the flow lines connect the circles again. Before, the circles swapped sides while the lines did not, so grid and home ended up at the wrong ends of their lines. The card layout now stays the same as in left-to-right languages; text inside the circles still reads right to left.

- [#379](https://github.com/flixlix/flixlix-cards/pull/379) [`ef910cc`](https://github.com/flixlix/flixlix-cards/commit/ef910cca8825a64e7bae4f8d274b94a3deeef6c6) Thanks [@flixlix](https://github.com/flixlix)! - Cards no longer recalculate and redraw when an entity they don't show changes in Home Assistant, which lowers CPU and battery use on dashboards, especially on phones and tablets. Numbers are formatted with reused formatters, and the flow cards no longer measure their width on every update.

- [#383](https://github.com/flixlix/flixlix-cards/pull/383) [`a9f14aa`](https://github.com/flixlix/flixlix-cards/commit/a9f14aa2ab48ded8ec8a99eb6c9a0eb7031fe592) Thanks [@flixlix](https://github.com/flixlix)! - Individual devices are now sorted by their value, largest first, when `sort_individual_devices` is not set, as the documentation has always said. Until now an unset option left them in config order. Devices are compared in watts (or watt-hours), so a `3.8 kW` charger now ranks above a `20 W` light.

  If you have not set this option, your devices may move to a different slot, and on a card that shows only some of them, a different set may be visible. To keep your configured order, add `sort_individual_devices: false` to the card.

- [#368](https://github.com/flixlix/flixlix-cards/pull/368) [`7cc309d`](https://github.com/flixlix/flixlix-cards/commit/7cc309d9d5a8f44c644e0c1160b93c67df588f54) Thanks [@flixlix](https://github.com/flixlix)! - Secondary-info templates for individual devices and the non-fossil node are now unsubscribed when the card is removed, and cards with more than four individual devices show the correct template for each one.

- [#425](https://github.com/flixlix/flixlix-cards/pull/425) [`7f71466`](https://github.com/flixlix/flixlix-cards/commit/7f714668a7918d19bc8a221ee0974b3f95dc5041) Thanks [@flixlix](https://github.com/flixlix)! - Fix: only W and Wh units with an SI prefix are scaled. A water meter in m³ now shows 348.9 m³ instead of 348,900,000 m³, and a sensor in mW is read as milliwatts instead of megawatts. A `unit_of_measurement` of `kW`, `MW`, `kWh` or `MWh` on a node or individual device now shows the reading in that unit (1.5 kW instead of 1,500 kW); any other unit still shows the value as read from the entity.

- [#441](https://github.com/flixlix/flixlix-cards/pull/441) [`08b3465`](https://github.com/flixlix/flixlix-cards/commit/08b3465933a4b9636e44d84a61b40d40e67f31d3) Thanks [@flixlix](https://github.com/flixlix)! - The card follows its width again after Home Assistant takes it out and puts it back while a dashboard loads; until a sensor changed, it kept the width it had while it was out.

## 0.4.0-beta.1

### Minor Changes

- [#431](https://github.com/flixlix/flixlix-cards/pull/431) [`a3b6a42`](https://github.com/flixlix/flixlix-cards/commit/a3b6a42ebda4bb29c344b7c471e5e96dd5b3068d) Thanks [@flixlix](https://github.com/flixlix)! - Default dot speed is back to how it was before 0.4.0-beta.0: the time per dot shrinks linearly with power (with the defaults, 1000 W takes 3.4 s per dot again). The faster speed-based curve from 0.4.0-beta.0, where twice the power looks about twice as fast, is available with `flow_rate_model: speed`, and `flow_rate_model: relative` selects the relative formula. The option replaces the "New Flow Model?" toggle in the editor with a select. `use_new_flow_rate_model` still works as the older alias (`false` is `relative`); `flow_rate_model` wins when both are set. Energy Flow Card Plus always uses the relative formula and ignores `flow_rate_model`.

- [#423](https://github.com/flixlix/flixlix-cards/pull/423) [`9954453`](https://github.com/flixlix/flixlix-cards/commit/995445387c5b3ab9b6936aa0f02eee5d3b9d27aa) Thanks [@flixlix](https://github.com/flixlix)! - New `accept_negative` option on individual devices. With it, a negative reading means the device feeds power to the home (e.g. an EV discharging with V2G): the value keeps its minus sign and the dots and direction arrow flip. Without it, nothing changes: the sign is dropped as before.

### Patch Changes

- [#432](https://github.com/flixlix/flixlix-cards/pull/432) [`9ac9962`](https://github.com/flixlix/flixlix-cards/commit/9ac9962716bfe6e7f32d2a7ad94c01d5a95789cf) Thanks [@flixlix](https://github.com/flixlix)! - The version line each card writes to the browser console has a new look.

- [#424](https://github.com/flixlix/flixlix-cards/pull/424) [`aa5071c`](https://github.com/flixlix/flixlix-cards/commit/aa5071cddc83e1ab995a56c96355791811457cd9) Thanks [@flixlix](https://github.com/flixlix)! - The UI editor no longer shows "Display Zero" switched on for individual devices and the non-fossil node when the option is not set. The card hides those nodes at zero unless `display_zero: true` is set, and the editor now shows the toggle off to match. The non-fossil documentation now gives the default as `false`.

- [#419](https://github.com/flixlix/flixlix-cards/pull/419) [`90f01f4`](https://github.com/flixlix/flixlix-cards/commit/90f01f4ce1b72b8e47b07ccad3e033f04bf2a85c) Thanks [@flixlix](https://github.com/flixlix)! - Docs now state the real flow-rate defaults (no behaviour change): Power Flow Card Plus uses the new flow formula unless `use_new_flow_rate_model: false`, Energy Flow Card Plus always uses the relative formula (so `use_new_flow_rate_model`, `min_expected_power` and `max_expected_power` don't apply to it), and an unset `calculate_flow_rate` uses the calculated rate.

- [#423](https://github.com/flixlix/flixlix-cards/pull/423) [`ed57230`](https://github.com/flixlix/flixlix-cards/commit/ed57230af97753932fdd58449b05b29298dfa2c8) Thanks [@flixlix](https://github.com/flixlix)! - The direction arrow of an individual device in the right-bottom slot now points the way its dots move. It used to point up while the dots moved from the home down to the device.

- [#427](https://github.com/flixlix/flixlix-cards/pull/427) [`8a0df59`](https://github.com/flixlix/flixlix-cards/commit/8a0df5973c604ab0d6dcf264916e9d777294d604) Thanks [@flixlix](https://github.com/flixlix)! - Fix: an individual device's secondary info now shows text states such as "heating", as grid and home already did. Unavailable or unknown states stay hidden.

- [#426](https://github.com/flixlix/flixlix-cards/pull/426) [`7dba4d6`](https://github.com/flixlix/flixlix-cards/commit/7dba4d63a8cd32d75ddd2e126749c43a4f819639) Thanks [@flixlix](https://github.com/flixlix)! - Cards load again on Google Cast displays (Chromecast, Nest Hub) and other older browsers and wall-panel webviews that Home Assistant itself still supports (Chromium 67 and newer). Before, the cards shipped optional chaining (`?.`) and nullish coalescing (`??`), which those browsers cannot read, so the card stayed empty or showed "Configuration Error". The cards are about 5% larger as a result.

- [#430](https://github.com/flixlix/flixlix-cards/pull/430) [`24ecd05`](https://github.com/flixlix/flixlix-cards/commit/24ecd05fff4f659621eafe00416e126aa92e3540) Thanks [@flixlix](https://github.com/flixlix)! - Individual device dots and the grid → battery dot no longer run backwards on older Chromium-based browsers, such as Amazon Fire tablets. The cards also no longer stay blank on browsers older than Chrome 92. Nothing changes on current browsers.

- [#428](https://github.com/flixlix/flixlix-cards/pull/428) [`8ad6715`](https://github.com/flixlix/flixlix-cards/commit/8ad6715c1e4bb58f85e47258e0fd203b7a807e42) Thanks [@flixlix](https://github.com/flixlix)! - On right-to-left Home Assistant languages (Arabic, Hebrew, Persian, …) the flow lines connect the circles again. Before, the circles swapped sides while the lines did not, so grid and home ended up at the wrong ends of their lines. The card layout now stays the same as in left-to-right languages; text inside the circles still reads right to left.

- [#425](https://github.com/flixlix/flixlix-cards/pull/425) [`7f71466`](https://github.com/flixlix/flixlix-cards/commit/7f714668a7918d19bc8a221ee0974b3f95dc5041) Thanks [@flixlix](https://github.com/flixlix)! - Fix: only W and Wh units with an SI prefix are scaled. A water meter in m³ now shows 348.9 m³ instead of 348,900,000 m³, and a sensor in mW is read as milliwatts instead of megawatts. A `unit_of_measurement` of `kW`, `MW`, `kWh` or `MWh` on a node or individual device now shows the reading in that unit (1.5 kW instead of 1,500 kW); any other unit still shows the value as read from the entity.

## 0.4.0-beta.0

### Minor Changes

- [#370](https://github.com/flixlix/flixlix-cards/pull/370) [`ef34736`](https://github.com/flixlix/flixlix-cards/commit/ef3473652a831b05b9cbbf967c9a487ae3dce5f7) Thanks [@flixlix](https://github.com/flixlix)! - Flows are now worked out the same way on both cards, in the order the Home Assistant energy dashboard uses, so the same readings always draw the same lines. Flows never go negative and never carry more than a source produces or a sink takes: for example, solar can no longer appear to export more than it generates. When the grid is hidden or during a power outage, solar and battery flows are recalculated instead of losing the part that went to the grid, and Energy Flow Card Plus now shows battery flows during an outage too. With a home entity using `override_state`, the card still shows its reading, while the lines and the home circle stay balanced.

  Power Flow Card Plus readings whose flows change:

  | Readings                                                                              | Before                                                                        | Now                                                                                                    |
  | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
  | Import 200 W, export 600 W, solar 500 W, battery discharging 150 W and charging 200 W | Solar → grid 600 W, grid → battery 200 W, battery → grid 0 W, grid → home 0 W | Solar → grid 450 W, solar → battery 50 W, grid → battery 150 W, battery → grid 150 W, grid → home 50 W |
  | Grid/battery exchange below the larger of the grid and battery zero tolerances        | Dropped                                                                       | Shown unless below the node's own tolerance                                                            |
  | Outage with the battery charging                                                      | Grid → battery from the live grid reading                                     | Grid → battery from the generator                                                                      |

### Patch Changes

- [#370](https://github.com/flixlix/flixlix-cards/pull/370) [`2634c20`](https://github.com/flixlix/flixlix-cards/commit/2634c20f63aa3fcd3e3a93ae0a0bc42f4f4afc34) Thanks [@flixlix](https://github.com/flixlix)! - Fix: the home circle no longer breaks (NaN segments) when nothing is being consumed. Energy Flow Card Plus now honours `invert_state` on single grid and battery entities, reads non-fossil and grid values from the selected energy period instead of live sensor states, and individual devices with a numeric `calculate_flow_rate` animate consistently in every position.

- [#296](https://github.com/flixlix/flixlix-cards/pull/296) [`f8bed9e`](https://github.com/flixlix/flixlix-cards/commit/f8bed9ed8f3b87eaefe019444bd6b37a98856966) Thanks [@flixlix](https://github.com/flixlix)! - Fix: individual devices with negative readings are no longer hidden when display_zero is off

- [#368](https://github.com/flixlix/flixlix-cards/pull/368) [`7cc309d`](https://github.com/flixlix/flixlix-cards/commit/7cc309d9d5a8f44c644e0c1160b93c67df588f54) Thanks [@flixlix](https://github.com/flixlix)! - Built against the same Lit and Home Assistant websocket versions as the current Home Assistant frontend.

- [#370](https://github.com/flixlix/flixlix-cards/pull/370) [`35fae9f`](https://github.com/flixlix/flixlix-cards/commit/35fae9fee82bafb9038c91b06bda2476438a8e65) Thanks [@flixlix](https://github.com/flixlix)! - Fix: with `clickable_entities` on, nodes can be reached with Tab and opened with Enter, which never worked before. Holding a node's value no longer runs its hold action twice (a `toggle` hold action used to cancel itself out).

- [#384](https://github.com/flixlix/flixlix-cards/pull/384) [`71c1005`](https://github.com/flixlix/flixlix-cards/commit/71c10057789be2164b533a87a2f39995cb3769fc) Thanks [@flixlix](https://github.com/flixlix)! - With the new flow rate model, dot speed now grows in step with power: twice the power looks about twice as fast. Before, the time per dot shrank in step with power, so most of the range crawled and only values close to `max_expected_power` looked fast. `min_expected_power` still gives the slowest dots (`max_flow_rate`) and `max_expected_power` the fastest (`min_flow_rate`). In between, dots now move faster than before: with the defaults, a flow at half of `max_expected_power` takes 1.3 s per dot instead of 3.4 s. Values below `min_expected_power` no longer move slower than `max_flow_rate`. The old flow rate model (`use_new_flow_rate_model: false`) is unchanged.

  `calculate_flow_rate` set to a number now does what the documentation says: a line moves one dot every that many seconds. Before, the number was only used when no flow rate could be calculated.

- [#382](https://github.com/flixlix/flixlix-cards/pull/382) [`002654f`](https://github.com/flixlix/flixlix-cards/commit/002654f94eaecc53066db0cf3178c0db0d8eef39) Thanks [@flixlix](https://github.com/flixlix)! - Fix: `unit_of_measurement`, `unit_white_space` and `decimals` set on grid, solar or battery are now applied to their values. A custom unit shows the reading as is, without converting it to k/M, so the card can show non-electrical flows such as water in L/min.

  The grid, solar and battery pages of the visual editor now offer these three fields.

- [#368](https://github.com/flixlix/flixlix-cards/pull/368) [`7cc309d`](https://github.com/flixlix/flixlix-cards/commit/7cc309d9d5a8f44c644e0c1160b93c67df588f54) Thanks [@flixlix](https://github.com/flixlix)! - The non-fossil node now appears based on the grid's actual non-fossil share instead of a miscalculated value.

- [#381](https://github.com/flixlix/flixlix-cards/pull/381) [`f8dbfb4`](https://github.com/flixlix/flixlix-cards/commit/f8dbfb4d9bfa59453444a77edb16720be4802cac) Thanks [@flixlix](https://github.com/flixlix)! - Fix: the non-fossil node is now hidden while grid import is within the grid's `display_zero_tolerance`, the same as when the grid reads exactly 0 (unless `fossil_fuel_percentage.display_zero` is on).

- [#379](https://github.com/flixlix/flixlix-cards/pull/379) [`ef910cc`](https://github.com/flixlix/flixlix-cards/commit/ef910cca8825a64e7bae4f8d274b94a3deeef6c6) Thanks [@flixlix](https://github.com/flixlix)! - Cards no longer recalculate and redraw when an entity they don't show changes in Home Assistant, which lowers CPU and battery use on dashboards, especially on phones and tablets. Numbers are formatted with reused formatters, and the flow cards no longer measure their width on every update.

- [#383](https://github.com/flixlix/flixlix-cards/pull/383) [`a9f14aa`](https://github.com/flixlix/flixlix-cards/commit/a9f14aa2ab48ded8ec8a99eb6c9a0eb7031fe592) Thanks [@flixlix](https://github.com/flixlix)! - Individual devices are now sorted by their value, largest first, when `sort_individual_devices` is not set, as the documentation has always said. Until now an unset option left them in config order. Devices are compared in watts (or watt-hours), so a `3.8 kW` charger now ranks above a `20 W` light.

  If you have not set this option, your devices may move to a different slot, and on a card that shows only some of them, a different set may be visible. To keep your configured order, add `sort_individual_devices: false` to the card.

- [#368](https://github.com/flixlix/flixlix-cards/pull/368) [`7cc309d`](https://github.com/flixlix/flixlix-cards/commit/7cc309d9d5a8f44c644e0c1160b93c67df588f54) Thanks [@flixlix](https://github.com/flixlix)! - Secondary-info templates for individual devices and the non-fossil node are now unsubscribed when the card is removed, and cards with more than four individual devices show the correct template for each one.

## 0.3.7

### Patch Changes

- [#251](https://github.com/flixlix/flixlix-cards/pull/251) [`59ec2b7`](https://github.com/flixlix/flixlix-cards/commit/59ec2b72f4ed12702af89ada19db5d78e146c2ee) Thanks [@flixlix](https://github.com/flixlix)! - refactor: extract ui-editor into shared package

- Updated dependencies [[`59ec2b7`](https://github.com/flixlix/flixlix-cards/commit/59ec2b72f4ed12702af89ada19db5d78e146c2ee), [`378c6e1`](https://github.com/flixlix/flixlix-cards/commit/378c6e10b9d9860ff4f2621f869f1fd82f7cda0b), [`cab9296`](https://github.com/flixlix/flixlix-cards/commit/cab92965b23aff7f66952fda8f862cc48485e0ad), [`a942417`](https://github.com/flixlix/flixlix-cards/commit/a94241772bef92995336ea65f61ea2a342ffc13f), [`1fbf1d7`](https://github.com/flixlix/flixlix-cards/commit/1fbf1d786bfe27e8ce0fe1778970217063c38c49)]:
  - @flixlix-cards/shared@0.0.5

## 0.3.6

### Patch Changes

- [#242](https://github.com/flixlix/flixlix-cards/pull/242) [`ac02bd5`](https://github.com/flixlix/flixlix-cards/commit/ac02bd53e35e758e58abc9de71b1bd3fb4ebbe71) Thanks [@flixlix](https://github.com/flixlix)! - feat: autofix legacy individual devices

- [#243](https://github.com/flixlix/flixlix-cards/pull/243) [`b6216bd`](https://github.com/flixlix/flixlix-cards/commit/b6216bd01c350238c3a579f38dc5a7bf2cf65775) Thanks [@flixlix](https://github.com/flixlix)! - feat: add display zero to battery and grid

- [#242](https://github.com/flixlix/flixlix-cards/pull/242) [`e8b27c5`](https://github.com/flixlix/flixlix-cards/commit/e8b27c56be76fa140bf2427567175e7d90b8c8a6) Thanks [@flixlix](https://github.com/flixlix)! - feat: autofix and alert legacy config ui editor

- Updated dependencies [[`ac02bd5`](https://github.com/flixlix/flixlix-cards/commit/ac02bd53e35e758e58abc9de71b1bd3fb4ebbe71), [`b6216bd`](https://github.com/flixlix/flixlix-cards/commit/b6216bd01c350238c3a579f38dc5a7bf2cf65775), [`e8b27c5`](https://github.com/flixlix/flixlix-cards/commit/e8b27c56be76fa140bf2427567175e7d90b8c8a6)]:
  - @flixlix-cards/shared@0.0.4

## 0.3.5

### Patch Changes

- [#227](https://github.com/flixlix/flixlix-cards/pull/227) [`b8ce9e2`](https://github.com/flixlix/flixlix-cards/commit/b8ce9e2a428b97a595ef4e3816f5a6f055678e49) Thanks [@flixlix](https://github.com/flixlix)! - refactor: kilo_threshold avoid redundancy in displayValue func

- [#227](https://github.com/flixlix/flixlix-cards/pull/227) [`e9181b2`](https://github.com/flixlix/flixlix-cards/commit/e9181b2cd8c88400d1283aa84d3c26bf1016696b) Thanks [@flixlix](https://github.com/flixlix)! - feat: allow megawatt and MWh units with threshold and decimals

- [#233](https://github.com/flixlix/flixlix-cards/pull/233) [`f1766aa`](https://github.com/flixlix/flixlix-cards/commit/f1766aa1f5cc06bfc24cdde0720f7284a4b31349) Thanks [@flixlix](https://github.com/flixlix)! - fix: home label incorrect translation in some languages.
  apply editor.home label for home component
- Updated dependencies [[`b8ce9e2`](https://github.com/flixlix/flixlix-cards/commit/b8ce9e2a428b97a595ef4e3816f5a6f055678e49), [`5d493fc`](https://github.com/flixlix/flixlix-cards/commit/5d493fc659d6cb8152fc944876d7e31017b25ce3), [`8894f43`](https://github.com/flixlix/flixlix-cards/commit/8894f435d4996a2d31efb03cd4228f3959170943), [`5d493fc`](https://github.com/flixlix/flixlix-cards/commit/5d493fc659d6cb8152fc944876d7e31017b25ce3), [`44f66ae`](https://github.com/flixlix/flixlix-cards/commit/44f66ae8b0c4fd29c4af753bfa85d89516611284), [`46c3785`](https://github.com/flixlix/flixlix-cards/commit/46c3785435d1188b2d780fd02da5b548e3148a9b), [`e9181b2`](https://github.com/flixlix/flixlix-cards/commit/e9181b2cd8c88400d1283aa84d3c26bf1016696b)]:
  - @flixlix-cards/shared@0.0.3

## 0.3.3

### Patch Changes

- 71cac7d: fix home label not showing
- 06b53c1: fix circle color when no activity
- 71cac7d: clickable entities cursor true by default
- c26189b: fix support for older browsers by targeting es2020 in the final bundle
- 71cac7d: fix home not clickable when action was defined
- Updated dependencies [06b53c1]
- Updated dependencies [71cac7d]
- Updated dependencies [34aa17d]
- Updated dependencies [71cac7d]
  - @flixlix-cards/shared@0.0.2

## 0.3.2

### Patch Changes

- 76ca44c: refactor ui editor default toggle boolean options and mode for selector select
- 76ca44c: fix home clickable logic
- 76ca44c: add no_labels option

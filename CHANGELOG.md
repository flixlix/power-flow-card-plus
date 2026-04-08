## 0.3.1

### Patch Changes

- [#968](https://github.com/flixlix/power-flow-card-plus/pull/968) [`4569f3b`](https://github.com/flixlix/power-flow-card-plus/commit/4569f3b27d8ec270872447b85586017f8a8cced1) Thanks [@flixlix](https://github.com/flixlix)! - fix: :bug: individual device color icon color value field not applied

- [#970](https://github.com/flixlix/power-flow-card-plus/pull/970) [`03daece`](https://github.com/flixlix/power-flow-card-plus/commit/03daeceb9324190fb78f281c5091849cb608fba8) Thanks [@flixlix](https://github.com/flixlix)! - always allow 4 individual devices, even with visual layout break

- [#979](https://github.com/flixlix/power-flow-card-plus/pull/979) [`c685d83`](https://github.com/flixlix/power-flow-card-plus/commit/c685d83c2a6cc87c10767d6c543020748b8ffe32) Thanks [@flixlix](https://github.com/flixlix)! - add ripples

- [`920ae91`](https://github.com/flixlix/power-flow-card-plus/commit/920ae91a3290e34223ceec157b8f674afb5290c5) Thanks [@flixlix](https://github.com/flixlix)! - ### Breaking Change

  `color_icon` and `color_value` on grid and battery fields, now accept `color_dynamically`, `no_color`, `production` or `consumption`, replacing boolean, `production` or `consumption`.

- [#979](https://github.com/flixlix/power-flow-card-plus/pull/979) [`c685d83`](https://github.com/flixlix/power-flow-card-plus/commit/c685d83c2a6cc87c10767d6c543020748b8ffe32) Thanks [@flixlix](https://github.com/flixlix)! - add double tap and hold action and refactored ui editor

- [#976](https://github.com/flixlix/power-flow-card-plus/pull/976) [`1d863ae`](https://github.com/flixlix/power-flow-card-plus/commit/1d863ae5ebcdeae124de441cb12eeae41a4bd3f6) Thanks [@flixlix](https://github.com/flixlix)! - fix-filtering-individual-more-list-long

- [#969](https://github.com/flixlix/power-flow-card-plus/pull/969) [`b7a80ee`](https://github.com/flixlix/power-flow-card-plus/commit/b7a80ee1fedd205e21e0a121840da94e83060f8a) Thanks [@flixlix](https://github.com/flixlix)! - color icon color value grid and battery

- [#973](https://github.com/flixlix/power-flow-card-plus/pull/973) [`de4b2a9`](https://github.com/flixlix/power-flow-card-plus/commit/de4b2a95c6520bdeb13dc5130509815bca8ad6e9) Thanks [@flixlix](https://github.com/flixlix)! - fix indidividual device editor big name overflow

- [#962](https://github.com/flixlix/power-flow-card-plus/pull/962) [`7e31097`](https://github.com/flixlix/power-flow-card-plus/commit/7e3109729f316a582a0fa5001a3f8915f9dc74a1) Thanks [@flixlix](https://github.com/flixlix)! - fix solar secondary display zero state logic

- [#961](https://github.com/flixlix/power-flow-card-plus/pull/961) [`820bee2`](https://github.com/flixlix/power-flow-card-plus/commit/820bee20f570c1cb9738b6f425b870f72dbf7397) Thanks [@flixlix](https://github.com/flixlix)! - return lit nothing instead of empty html template

- [#972](https://github.com/flixlix/power-flow-card-plus/pull/972) [`4b397c8`](https://github.com/flixlix/power-flow-card-plus/commit/4b397c8fe672d8af21975bb858031cf82e869bc7) Thanks [@flixlix](https://github.com/flixlix)! - document sort individual devices

  ### Breaking Change

  Made `sort_individual_devices` default to true.
  This needs to be set to false if you want to keep the devices in the same order as defined in your card config.

- [#975](https://github.com/flixlix/power-flow-card-plus/pull/975) [`570dbb5`](https://github.com/flixlix/power-flow-card-plus/commit/570dbb5872ec07dcf6b70fc77f6677e441873c8d) Thanks [@flixlix](https://github.com/flixlix)! - fix disabled dots not enabling after starting tab

## 0.3.0

### Minor Changes

- [#959](https://github.com/flixlix/power-flow-card-plus/pull/959) [`6cc1651`](https://github.com/flixlix/power-flow-card-plus/commit/6cc16518b1379f17ab12d8d9cf11d2cbb9f86526) Thanks [@flixlix](https://github.com/flixlix)! - Sum solar secondary and primary values for multiple strings

### Patch Changes

- [#947](https://github.com/flixlix/power-flow-card-plus/pull/947) [`3176d09`](https://github.com/flixlix/power-flow-card-plus/commit/3176d09e8ad61727feeb27c23a36d306c01e0ec6) Thanks [@flixlix](https://github.com/flixlix)! - New calcModes from linear to paced & extracted more components

- [#804](https://github.com/flixlix/power-flow-card-plus/pull/804) [`d14bbf7`](https://github.com/flixlix/power-flow-card-plus/commit/d14bbf7b72d26a26cbc5d80f0cbfc1aca3d5f232) Thanks [@SilentButeo2](https://github.com/SilentButeo2)! - flow calculation speed battery-grid

- [#950](https://github.com/flixlix/power-flow-card-plus/pull/950) [`66875a3`](https://github.com/flixlix/power-flow-card-plus/commit/66875a32e6048a129d48889d9aecbcd4d763ebec) Thanks [@bjiirn](https://github.com/bjiirn)! - fix: Secondary Template for nonFossilFuel (Fixes [#618](https://github.com/flixlix/power-flow-card-plus/issues/618))

- [#953](https://github.com/flixlix/power-flow-card-plus/pull/953) [`8902266`](https://github.com/flixlix/power-flow-card-plus/commit/890226653ab978904366ba94e3cd0b595c81a776) Thanks [@flixlix](https://github.com/flixlix)! - Responsive individual devices number based on container width

- [#811](https://github.com/flixlix/power-flow-card-plus/pull/811) [`a098563`](https://github.com/flixlix/power-flow-card-plus/commit/a098563538e28a4395162c51a1929244488c062f) Thanks [@realericmc](https://github.com/realericmc)! - fix individual devices order and color override behaviour

- [#960](https://github.com/flixlix/power-flow-card-plus/pull/960) [`791e976`](https://github.com/flixlix/power-flow-card-plus/commit/791e976dfdf51a4b4158a45e7b2f3b8a0cc09293) Thanks [@flixlix](https://github.com/flixlix)! - fix color dynamic selector ui editor grid and battery

- [#801](https://github.com/flixlix/power-flow-card-plus/pull/801) [`eb06c8d`](https://github.com/flixlix/power-flow-card-plus/commit/eb06c8d37f292c53719f3548ba58a1ce151d3452) Thanks [@jp2237](https://github.com/jp2237)! - fix(display-value): format empty inputs as 0 with unit

## 0.2.7

- Initial baseline for new release workflow.

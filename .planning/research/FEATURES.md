# FEATURES.md — Messkonzept 8 Extension

## Table Stakes (must-have for Messkonzept 8 to be useful)

### Dual Grid Meter Nodes
- `grid_main` node renders visually to the left of `grid_house`
- Both nodes display independently configured entity values (W/kWh)
- Bidirectional animated flow lines between grid_main and grid_house (import and export as separate lines)
- non_fossil bubble attached to `grid_main` (the actual grid connection point)
- Power outage configurable independently on each meter

### Heatpump Consumption Node
- Dedicated heatpump node below `grid_house`
- Displays power consumption from HA entity
- Animated monodirectional line: grid_house → heatpump
- Animated monodirectional line: grid_main → heatpump
- Lines hidden when heatpump power = 0, optional grey-on-zero (respects display_zero_lines config)
- COP displayed as labeled value "COP [value]" above the heatpump icon

### Config Structure
- `entities.grid.house` and `entities.grid.main` nested under a single `grid:` key
- `entities.heatpump` as a new top-level entity key
- Flat `entities.grid` auto-migrated to `entities.grid.house` at runtime
- Deprecation warning logged to console when flat config detected

### Visual Editor (Lovelace)
- `grid_house` editor page (same fields as current grid page)
- `grid_main` editor page (same fields as current grid page)
- `heatpump` editor page (entity, COP entity, display options)
- Editor detects flat `grid` config and offers one-click migration

## Differentiators (makes this better than alternatives)

- Seamless upgrade path — existing configs continue working without YAML changes
- COP display uses a real HA sensor (not static label), so it updates live
- `display_zero_lines` behavior applied consistently to heatpump lines (no special-casing)
- All new fields editable in the visual editor — no YAML-only config

## Anti-features (deliberately NOT in this milestone)

- Multiple heatpump nodes — use `individual[]` for other heat sources
- Messkonzept variants other than 8 — e.g. Messkonzept 7, 11 are out of scope
- Heatpump-to-grid reverse flow (heatpumps don't export; always consumption-only)
- Heatpump-to-battery or solar-to-heatpump direct lines — routed via house bus

## Edge Cases to Handle

| Scenario | Expected behavior |
|----------|-------------------|
| `entities.grid.main` not configured | Card renders exactly as before (zero visual change for non-MK8 users) |
| Heatpump power = 0 | Flow lines hidden; optional grey-on-zero via display_zero_lines |
| COP entity unavailable/unknown | COP label hidden or shows "--"; no crash |
| grid_main outage | grid_main node shows outage icon; heatpump lines still reflect last known state |
| grid_house outage | grid_house node shows outage icon; heatpump lines from grid_house hidden |
| Flat `entities.grid` in editor | Editor shows migration prompt; one-click updates to nested structure |
| Negative heatpump value | Treat as 0 (heatpumps don't export) |

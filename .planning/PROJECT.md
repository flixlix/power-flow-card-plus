# power-flow-card-plus — Messkonzept 8 Extension

## What This Is

power-flow-card-plus (v0.2.6) is a Home Assistant Lovelace custom card that visualizes real-time energy flow between solar, battery, grid, and consumption nodes with animated flow lines. This milestone extends the card to support the German **Messkonzept 8** metering scheme — a cascaded dual-meter configuration where a second meter (`grid_main`) sits upstream of the house meter (`grid_house`) to isolate heatpump consumption for separate tariff measurement. A new dedicated heatpump consumption node is added with COP display and direct connections from both meters.

## Core Value

All existing card functionality and visual editor support must remain fully intact — this is a targeted extension, not a rewrite.

## Requirements

### Validated

- ✓ Solar production node with animated flow lines to home/battery/grid — existing
- ✓ Battery node (charge/discharge) with state-of-charge indicator — existing
- ✓ Home consumption node with multi-source color breakdown — existing
- ✓ Grid node (import/export) with non-fossil percentage bubble — existing
- ✓ Up to 4 individual consumption devices with animated monodirectional lines — existing
- ✓ Lovelace visual card editor with per-node config pages (grid, solar, battery, home, fossil_fuel_percentage, individual, advanced) — existing
- ✓ Animated flow rate proportional to power level — existing
- ✓ `display_zero_lines` mode (show / grey_out / transparency / hide / custom) — existing
- ✓ Template-driven secondary info values — existing
- ✓ Per-entity tap actions — existing
- ✓ Grid power outage detection with visual alert — existing
- ✓ Customizable colors per node (production/consumption split) — existing
- ✓ Secondary info display on main nodes — existing
- ✓ Dashboard link(s) in card — existing
- ✓ TypeScript + Lit + Rollup build pipeline with jest tests — existing

### Active

- [ ] **Cascaded grid meters**: `entities.grid` accepts nested `house:` and `main:` sub-keys; `grid_main` node rendered to the left of `grid_house`
- [ ] **Bidirectional meter connection**: Two animated lines between `grid_main` and `grid_house` — one for import (main→house), one for export/feed-in (house→main)
- [ ] **non_fossil bubble migration**: `fossil_fuel_percentage` bubble moves from `grid_house` to `grid_main` visually
- [ ] **Heatpump consumption node**: New node rendered below `grid_house`, configurable via `entities.heatpump`
- [ ] **COP display on heatpump**: Shows "COP [value]" label above the heatpump icon using a configurable HA entity
- [ ] **Heatpump flow lines**: Monodirectional animated lines from `grid_house`→heatpump and `grid_main`→heatpump; hide when 0W, optional grey-on-zero respecting `display_zero_lines` config
- [ ] **Backward-compatible auto-migration**: Flat `entities.grid` config detected at runtime and transparently remapped to `entities.grid.house`; deprecation warning logged to console
- [ ] **Visual editor — grid_main**: Full editor page for `grid_main` following existing grid schema pattern (entity, colors, secondary_info, power_outage, tap_action)
- [ ] **Visual editor — grid_house**: Full editor page for `grid_house` (same schema as current grid page)
- [ ] **Visual editor — heatpump**: Editor page for heatpump (entity, COP entity, display options)
- [ ] **Visual editor — migration prompt**: Editor detects flat `grid` config and offers one-click migration to nested structure

### Out of Scope

- Multiple heatpump nodes — single heatpump covers Messkonzept 8; multiple consumers use the existing `individual` array
- Mobile-app specific layouts — card renders same in browser and HA companion app
- Messkonzept variants other than 8 — different cascading topologies are out of scope for this milestone

## Context

**Messkonzept 8** (German grid metering scheme): A building has two bidirectional meters — `grid_main` at the grid connection point measures total import/export, and `grid_house` measures only the house loads excluding the heatpump. The heatpump is connected between the two meters so its consumption appears on `grid_main` but not `grid_house`. This allows separate tariff billing for heatpump energy.

**Existing architecture:**
- Config: `entities.grid` → `GridObject` (type.ts); resolved in `src/states/raw/grid.ts`
- Visual editor: `src/ui-editor/ui-editor.ts` routes to per-node schema pages; `src/ui-editor/schema/grid.ts` defines the grid editor form
- Components: `src/components/grid.ts` renders the grid node; flows in `src/components/flows/`
- Individual devices: `entities.individual[]` array — heatpump will be a top-level sibling, not reusing this array
- The `GridObject` type (type.ts:102) has complex state: `fromGrid`, `toGrid`, `toBattery`, `toHome` — renaming must preserve all these paths

**Critical fragility:** The grid node rename (`grid` → `grid.house` + `grid.main`) touches: config types, state resolution, rendering, flow line components, the visual editor schema, and the `cardConfigStruct` validation struct. All must be updated consistently.

## Constraints

- **Tech stack**: TypeScript + Lit v2 + Rollup — no new runtime dependencies without strong justification
- **Backward compat**: Flat `entities.grid` must silently migrate to `entities.grid.house`; no user YAML breakage
- **Editor parity**: Every new config field must be editable in the Lovelace visual editor — no YAML-only fields
- **Test coverage**: Existing jest tests must continue to pass; new state resolution logic should have test coverage
- **Build**: `pnpm typecheck && pnpm format:write && pnpm test` must pass before any commit

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nest grid meters under `entities.grid.house` / `entities.grid.main` | Keeps grid as a semantic grouping; cleaner YAML than two top-level keys | — Pending |
| Heatpump as top-level `entities.heatpump` (not in `individual[]`) | Needs special layout (below grid_house) and COP display not possible in individual array | — Pending |
| Auto-migrate flat `entities.grid` + deprecation warning | No breaking change; users warned to update; log level `warn` in console | — Pending |
| non_fossil bubble on `grid_main` not `grid_house` | In Messkonzept 8, `grid_main` is the actual grid connection — the non-fossil percentage applies there | — Pending |

---
*Last updated: 2026-03-02 after initialization*

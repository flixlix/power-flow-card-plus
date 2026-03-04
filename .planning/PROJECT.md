# power-flow-card-plus — Messkonzept 8 Extension

## What This Is

power-flow-card-plus is a Home Assistant Lovelace custom card that visualizes real-time energy flow between solar, battery, grid, and consumption nodes with animated flow lines. As of v0.2, it supports the German **Messkonzept 8** metering scheme — a cascaded dual-meter configuration with a dedicated heatpump consumption node, COP display, and a full visual editor for all new entities.

## Core Value

All existing card functionality and visual editor support must remain fully intact — this is a targeted extension, not a rewrite.

## Requirements

### Validated

- ✓ Solar production node with animated flow lines to home/battery/grid — existing
- ✓ Battery node (charge/discharge) with state-of-charge indicator — existing
- ✓ Home consumption node with multi-source color breakdown — existing
- ✓ Grid node (import/export) with non-fossil percentage bubble — existing
- ✓ Up to 4 individual consumption devices with animated monodirectional lines — existing
- ✓ Lovelace visual card editor with per-node config pages — existing
- ✓ Animated flow rate proportional to power level — existing
- ✓ `display_zero_lines` mode (show / grey_out / transparency / hide / custom) — existing
- ✓ Template-driven secondary info values — existing
- ✓ Per-entity tap actions — existing
- ✓ Grid power outage detection with visual alert — existing
- ✓ Customizable colors per node (production/consumption split) — existing
- ✓ Secondary info display on main nodes — existing
- ✓ Dashboard link(s) in card — existing
- ✓ TypeScript + Lit + Rollup build pipeline with jest tests — existing
- ✓ Cascaded grid meters (`entities.grid.house` + `entities.grid.main`) — v0.2
- ✓ Bidirectional animated flow lines between grid_main and grid_house — v0.2
- ✓ non_fossil bubble on grid_main — v0.2
- ✓ Heatpump consumption node with COP display — v0.2
- ✓ Heatpump flow lines from grid_house and grid_main — v0.2
- ✓ Backward-compatible auto-migration (flat grid → nested) — v0.2
- ✓ Visual editor pages for grid_house, grid_main, and intermediate entities — v0.2
- ✓ Editor flat-config migration prompt — v0.2
- ✓ Responsive SVG flow lines (dynamic path coordinates) — v0.2
- ✓ Dead overlay flow system removed — v0.2

### Active

(None — next milestone requirements TBD)

### Out of Scope

- Multiple heatpump nodes — single heatpump covers Messkonzept 8; multiple consumers use the existing `individual` array
- Mobile-app specific layouts — card renders same in browser and HA companion app
- Messkonzept variants other than 8 — different cascading topologies deferred to future milestone
- Compact dashboard widget mode (sub-300px) — deferred
- RTL card layout support — deferred

## Context

**Current state (post v0.2):**
- 7,381 LOC TypeScript across `src/`
- Tech stack: TypeScript + Lit v2 + Rollup + Jest + Prettier
- 20 tests passing, full build pipeline green
- All 22 v1 requirements delivered and verified
- Feature branch `feature/inline-curved-flows` ready for merge to main

**Messkonzept 8** (German grid metering scheme): A building has two bidirectional meters — `grid_main` at the grid connection point measures total import/export, and `grid_house` measures only the house loads excluding the heatpump. The heatpump is connected between the two meters so its consumption appears on `grid_main` but not `grid_house`. This allows separate tariff billing for heatpump energy.

**Architecture:**
- Config: `entities.grid` → `GridEntities` with `.house` / `.main` sub-keys (type.ts); auto-migrated from flat format
- State: `src/states/raw/grid.ts` resolves both grid_house and grid_main state independently
- Components: `src/components/` — grid, gridMain, solar, battery, home, heatpump, intermediate
- Flow lines: All inline SVGs with dynamic path coordinates computed from actual card width
- Visual editor: `src/ui-editor/ui-editor.ts` routes to per-node schema pages including grid_house, grid_main, intermediate
- Individual devices: `entities.individual[]` array — heatpump is a separate top-level entity

## Constraints

- **Tech stack**: TypeScript + Lit v2 + Rollup — no new runtime dependencies without strong justification
- **Backward compat**: Flat `entities.grid` silently migrates to `entities.grid.house`; no user YAML breakage
- **Editor parity**: Every config field must be editable in the Lovelace visual editor — no YAML-only fields
- **Test coverage**: Existing jest tests must continue to pass; new features should have test coverage
- **Build**: `pnpm typecheck && pnpm format:write && pnpm test` must pass before any commit

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nest grid meters under `entities.grid.house` / `entities.grid.main` | Keeps grid as a semantic grouping; cleaner YAML than two top-level keys | ✓ Good — clean config, backward compat works |
| Heatpump as top-level `entities.heatpump` (not in `individual[]`) | Needs special layout (below grid_house) and COP display not possible in individual array | ✓ Good — dedicated rendering and COP display |
| Auto-migrate flat `entities.grid` + deprecation warning | No breaking change; users warned to update; log level `warn` in console | ✓ Good — zero breakage for existing users |
| non_fossil bubble on `grid_main` not `grid_house` | In Messkonzept 8, `grid_main` is the actual grid connection — the non-fossil percentage applies there | ✓ Good — matches physical metering topology |
| Inline SVGs in spacer divs (not overlay `.lines` container) | Flex layout naturally centers lines on circles; overlay math breaks at narrow widths | ✓ Good — responsive, simpler, dead code removed |
| Dynamic SVG path coordinates from `this._width` | Hardcoded pixel offsets broke at narrow card widths (HA editor panel); dynamic math adapts | ✓ Good — identical at max width, responsive at narrow |
| Heatpump renamed to "intermediate" entities (generic array) | More flexible than single heatpump; supports up to 2 intermediate devices | ✓ Good — extensible beyond MK8 |

---
*Last updated: 2026-03-04 after v0.2 milestone*

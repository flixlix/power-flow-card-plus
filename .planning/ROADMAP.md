# Roadmap: power-flow-card-plus Messkonzept 8 Extension

## Overview

This roadmap extends the power-flow-card-plus card to support Messkonzept 8 -- a cascaded dual-meter configuration with generic intermediate entity nodes. The work progresses through five phases following a strict dependency chain: types and migration first (zero visual changes), then grid_main node and meter connections, then intermediate entities and flow lines, then visual editor support, and finally polish and regression verification. Every phase after Phase 1 produces visible, testable output. The ordering is non-negotiable: three of six critical pitfalls identified during research must be resolved in Phase 1 before any rendering work begins.

**Post-Phase 3 refactor (2026-03-03):** The original heatpump-specific design was generalized to support arbitrary intermediate entities (e.g., heatpump, EV charger). All flow lines were migrated from absolutely-positioned CSS overlays to inline SVGs within circle-containers. The layout was rewritten for adaptive 4-6 column grids.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Type Foundation and Config Migration** - Extend types, add config migration, update superstruct validation (zero visual changes) (completed 2026-03-02)
- [x] **Phase 2: Grid Main Node and Energy Balance** - Render grid_main node, bidirectional meter connection, corrected energy balance (completed 2026-03-02)
- [x] **Phase 3: Intermediate Entities and Inline Flow Lines** - Intermediate entity nodes with flow lines, generalized from heatpump; all flows migrated to inline SVGs (completed 2026-03-03)
- [ ] **Phase 4: Visual Editor** - Editor pages for grid_house, grid_main, and intermediate entities with migration prompt
- [ ] **Phase 5: Polish and Regression Verification** - Responsive layout, RTL, edge cases, zero-regression confirmation

## Phase Details

### Phase 1: Type Foundation and Config Migration
**Goal**: Config types, migration logic, and superstruct validation are correct and proven by tests -- all downstream phases can build on a stable foundation
**Depends on**: Nothing (first phase)
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05
**Success Criteria** (what must be TRUE):
  1. A YAML config with nested `entities.grid.house` and `entities.grid.main` sub-keys is accepted by `setConfig()` without error
  2. A YAML config with flat `entities.grid` (existing format) is silently migrated to `entities.grid.house` at runtime and a deprecation warning appears in the browser console
  3. A YAML config with `entities.heatpump` is accepted by `setConfig()` without error and the key is not stripped by superstruct validation
  4. Passing an already-migrated config through migration again produces an identical result (idempotency)
  5. `pnpm typecheck && pnpm test` passes with all new and existing tests green
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- TypeScript type definitions (GridEntities, HeatpumpEntity) + grid state accessor fix
- [x] 01-02-PLAN.md -- migrateConfig pure function + full test suite (TDD)
- [x] 01-03-PLAN.md -- superstruct update + wire migrateConfig into both setConfig() calls

### Phase 2: Grid Main Node and Energy Balance
**Goal**: Users with Messkonzept 8 see a grid_main node with animated bidirectional flow to grid_house, and the home consumption balance is correct
**Depends on**: Phase 1
**Requirements**: GRID-01, GRID-02, GRID-03, GRID-04, GRID-05, CONN-01, CONN-02, BAL-01
**Success Criteria** (what must be TRUE):
  1. When `entities.grid.main` is configured, a grid_main node appears to the left of grid_house displaying its power value
  2. Two animated flow lines connect grid_main and grid_house, with direction and speed reflecting actual power values
  3. The non-fossil percentage bubble appears on grid_main (not grid_house) when both meters are configured
  4. When `entities.grid.main` is absent, the card renders identically to v0.2.6 (zero visual regression for non-MK8 users)
  5. Home consumption total uses grid_house power (not grid_main), so the solar/battery/home energy balance remains correct
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Type/state foundation: add gridMainToGridHouse to NewDur, add grid_main state resolvers, fix grid_house invert_state bug
- [x] 02-02-PLAN.md — gridMainElement component, gridMainToGridHouse flow line, flows/index.ts update, grid-main CSS
- [x] 02-03-PLAN.md — Wire gridMain into render(): object construction, middle row slot, newDur, flowElement integration

### Phase 3: Heatpump Node and Flow Lines
**Goal**: Users see a heatpump consumption node with COP display and animated flow lines from both meters, without double-counting in home consumption
**Depends on**: Phase 2
**Requirements**: HP-01, HP-02, HP-03, HP-04, HP-05, HP-06, HP-07, BAL-02
**Success Criteria** (what must be TRUE):
  1. A heatpump node renders below grid_house displaying power consumption and a "COP [value]" label (or "--" when unavailable)
  2. Animated monodirectional flow lines from grid_house and grid_main to heatpump appear when their respective sensor entities report non-zero power
  3. Heatpump flow lines hide (or grey out) when their sensor reads 0W, respecting the card's `display_zero_lines` configuration
  4. Heatpump consumption does not appear in the home node total -- the home energy balance remains correct
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Type foundation + state resolvers + heatpump node element + CSS
- [ ] 03-02-PLAN.md — Curved flow files (gridHouseToHeatpump + gridMainToHeatpump) + flows/index extension
- [ ] 03-03-PLAN.md — Wire heatpump into render(): object construction, bottom row, newDur, flowElement

### Phase 4: Visual Editor
**Goal**: Every new config field is editable through the Lovelace visual editor with no YAML-only fields
**Depends on**: Phase 3
**Requirements**: ED-01, ED-02, ED-03, ED-04, ED-05
**Success Criteria** (what must be TRUE):
  1. The visual editor has separate pages for grid_house and grid_main with all standard grid fields (entity, colors, secondary_info, power_outage, tap_action)
  2. The visual editor has an intermediate page with fields for entity, COP entity, flow_from_grid_house entity, flow_from_grid_main entity, and display options
  3. Editing nested grid config through the editor correctly saves to `entities.grid.house` and `entities.grid.main` (not flattened to top-level keys)
  4. When the editor detects a flat `entities.grid` config, it displays a one-click migration prompt that converts to the nested structure
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Grid House/Grid Main editor pages, ConfigPage type extension, _valueChanged routing, migration banner, localization keys
- [ ] 04-02-PLAN.md — Intermediate entity array editor (intermediate-devices-editor + intermediate-row-editor + intermediateSchema)

### Phase 5: Polish and Regression Verification
**Goal**: The card is visually correct across all layout modes and edge cases, with zero regression for existing users
**Depends on**: Phase 4
**Requirements**: (cross-cutting verification -- validates requirements delivered in Phases 1-4)
**Success Criteria** (what must be TRUE):
  1. Card renders correctly at 300px, 420px, and 600px widths with MK8 config (no overflow, no overlap, no truncation)
  2. Card with no `entities.grid.main` configured is pixel-identical to v0.2.6 output (verified by visual comparison)
  3. Edge case configurations work without errors: no battery, no solar, with individual devices, power outage on each meter independently
  4. `pnpm typecheck && pnpm format:write && pnpm test` passes with full test suite green
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Type Foundation and Config Migration | 3/3 | Complete   | 2026-03-02 |
| 2. Grid Main Node and Energy Balance | 3/3 | Complete   | 2026-03-02 |
| 3. Heatpump Node and Flow Lines | 2/3 | In Progress|  |
| 4. Visual Editor | 0/2 | Not started | - |
| 5. Polish and Regression Verification | 0/? | Not started | - |

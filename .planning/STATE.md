---
gsd_state_version: 1.0
milestone: v0.2
milestone_name: milestone
status: unknown
last_updated: "2026-03-02T19:45:04.421Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 9
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-02)

**Core value:** All existing card functionality and visual editor support must remain fully intact -- this is a targeted extension, not a rewrite.
**Current focus:** Phase 3 in progress: Heatpump Node and Flow Lines (2 of 3 plans complete)

## Current Position

Phase: 3 of 5 (Heatpump Node and Flow Lines)
Plan: 2 of 3 in current phase (03-02 complete)
Status: Phase 3 in progress
Last activity: 2026-03-02 -- Completed 03-02 heatpump flow lines (gridHouseToHeatpump, gridMainToHeatpump)

Progress: [*************-------] 67% (Phase 3: 2/3 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 2.6 min
- Total execution time: 0.22 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-type-foundation-and-config-migration | 3 | 9 min | 3 min |
| 02-grid-main-node-and-energy-balance | 3 | 6 min | 2 min |
| 03-heatpump-node-and-flow-lines | 2/3 | 6 min | 3 min |

**Recent Trend:**
- Last 5 plans: 01-03 (3 min), 02-01 (2 min), 02-02 (2 min), 02-03 (2 min), 03-01 (4 min)
- Trend: stable

*Updated after each plan completion*
| Phase 03-heatpump-node-and-flow-lines P02 | 2 | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Types + migration + superstruct must be atomic in Phase 1 (research finding: 3 of 6 pitfalls are Phase 1 concerns)
- [Roadmap]: Energy balance correction (BAL-01) in Phase 2, not Phase 1, because it depends on grid_house state resolution
- [Roadmap]: Phase 5 is dedicated polish -- edge case interactions only visible after full implementation
- [01-01]: ConfigEntities.grid changed from flat Grid to GridEntities{house?:Grid, main?:Grid} — enforces Messkonzept 8 nested shape at type level
- [01-01]: Phase 1 cast pattern: (entities.grid as any) at all existing call sites to preserve behavior; Phase 2 resolves sub-keys properly
- [01-01]: HeatpumpEntity uses plain string entity field (not ComboEntity) — heatpumps are consume-only
- [01-01]: Grid state accessors now read from .house?.entity — Phase 2 will add grid_main resolution
- [01-02]: migrateConfig detects flat format via 'entity' in grid guard; wraps in { house: originalGrid } spread — idempotency guaranteed by same-reference return
- [01-02]: Deprecation message '[power-flow-card-plus] entities.grid has been migrated to entities.grid.house automatically.' fires once per setConfig call on flat detection
- [01-02]: migrateConfig is a pure function standalone module — call it in setConfig before superstruct assertion (Plan 01-03)
- [01-03]: Both setConfig() signatures changed to unknown — raw input accepted before migration/validation
- [01-03]: Entity guard in card setConfig updated from grid?.entity to (grid as any)?.house?.entity to match GridEntities nested shape
- [01-03]: heatpump added to cardConfigStruct with all four optional string fields (entity, cop, flow_from_grid_house, flow_from_grid_main)
- [02-01]: isEntityInverted removed from grid.ts — confirmed always returns undefined for field='grid'; grid_house and grid_main resolvers now read invert_state directly from sub-config
- [02-01]: gridMainToGridHouse initialized to 0 in newDur placeholder in power-flow-card-plus.ts — Plan 02-03 will assign real computed value
- [Phase 02-02]: gridMain?: any added as optional field to Flows interface to avoid breaking existing flowElement callers until Plan 02-03 wires it in
- [Phase 02-02]: FlowsWithGridMain intersection type (Flows & { gridMain: any }) used locally in gridMainToGridHouse.ts for type safety without polluting the shared Flows interface
- [Phase 02-02]: flowGridMainToGridHouse guarded with 'gridMain ?' in flowElement — safe no-op when gridMain is not yet passed
- [02-03]: grid object in render() changed from gridConfig (flat) to gridHouseConfig (.house sub-key) — completes Phase 1 cast pattern resolution
- [02-03]: gridElement in grid.ts fixed to read from (entities.grid as any)?.house — components must resolve sub-keys directly
- [02-03]: nonFossilElement call unchanged — flex layout handles non-fossil bubble positioning automatically
- [02-03]: totalHomeConsumption formula unchanged (grid.state.toHome + solar + battery) — gridMain state is display-only (BAL-01)
- [02-03]: gridMainToGridHouse uses Math.max(fromGridMain, toGridMain) — bidirectional meter, animate at dominant flow rate
- [03-01]: heatpumpFromGridHouse/Main initialized to 0 in newDur placeholder — Plan 03-03 will compute real flow rates
- [03-01]: tap_action added to HeatpumpEntity interface — required for openDetails click handler in heatpumpElement
- [03-01]: ActionConfig imported from custom-card-helpers in power-flow-card-plus-config.ts to support tap_action in HeatpumpEntity
- [Phase 03-02]: FlowsWithHeatpump intersection type used locally in each flow file (same pattern as FlowsWithGridMain) — keeps Flows interface clean while providing strict typing
- [Phase 03-02]: heatpump?: any added as optional field to Flows interface — existing flowElement callers unchanged until Plan 03-03 passes heatpump
- [Phase 03-02]: Unused parameters removed from flow function destructuring to satisfy noUnusedLocals — callers still pass full Flows object for interface compatibility

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: SVG path coordinates for new flow lines are MEDIUM confidence -- expect visual iteration in Phase 3
- [Research]: `mdiHeatPump` icon constant name unverified in @mdi/js 7.x -- check at Phase 3 start
- [Research]: `isCardWideEnough` threshold (420px) may need adjustment with grid_main added -- Phase 5 concern

## Session Continuity

Last session: 2026-03-02T19:43:58Z
Stopped at: Completed 03-02-PLAN.md (heatpump flow lines)
Resume file: None

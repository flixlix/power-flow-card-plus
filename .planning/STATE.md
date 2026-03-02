# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-02)

**Core value:** All existing card functionality and visual editor support must remain fully intact -- this is a targeted extension, not a rewrite.
**Current focus:** Phase 1: Type Foundation and Config Migration

## Current Position

Phase: 1 of 5 (Type Foundation and Config Migration)
Plan: 1 of ? in current phase
Status: In progress
Last activity: 2026-03-02 -- Completed 01-01 type foundation plan

Progress: [*·········] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 4 min
- Total execution time: 0.07 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-type-foundation-and-config-migration | 1 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min)
- Trend: -

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: SVG path coordinates for new flow lines are MEDIUM confidence -- expect visual iteration in Phase 3
- [Research]: `mdiHeatPump` icon constant name unverified in @mdi/js 7.x -- check at Phase 3 start
- [Research]: `isCardWideEnough` threshold (420px) may need adjustment with grid_main added -- Phase 5 concern
- [01-01]: `isEntityInverted` still uses `config.entities[field]?.invert_state` for field="grid" — returns undefined since GridEntities has no invert_state. Phase 2 should address.

## Session Continuity

Last session: 2026-03-02T12:51:26Z
Stopped at: Completed 01-01-PLAN.md (type foundation and grid state accessors)
Resume file: None

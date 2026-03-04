---
phase: 01-type-foundation-and-config-migration
plan: 03
subsystem: ui
tags: [superstruct, typescript, config-migration, schema, heatpump, grid]

# Dependency graph
requires:
  - phase: 01-type-foundation-and-config-migration
    plan: 01
    provides: "ConfigEntities.grid as GridEntities{house?,main?} and HeatpumpEntity type"
  - phase: 01-type-foundation-and-config-migration
    plan: 02
    provides: "migrateConfig() pure function with idempotent flat->nested grid migration"
provides:
  - "cardConfigStruct.entities.grid validated as strict nested object({house,main})"
  - "cardConfigStruct.entities.heatpump validated as strict object with all four optional string fields"
  - "card setConfig() accepts unknown raw config and calls migrateConfig before processing"
  - "editor setConfig() calls migrateConfig before assert() — ordering enforced"
  - "Phase 1 success criteria fully met: all 6 criteria verifiably true"
affects:
  - 02-grid-main-integration
  - 03-heatpump-implementation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration-before-assertion: migrateConfig(rawConfig) always called before superstruct assert() in both setConfig() call sites"
    - "Unknown input typing: setConfig(rawConfig: unknown) pattern for safe raw config ingestion"

key-files:
  created: []
  modified:
    - src/ui-editor/schema/_schema-all.ts
    - src/power-flow-card-plus.ts
    - src/ui-editor/ui-editor.ts

key-decisions:
  - "Both setConfig() signatures changed from PowerFlowCardPlusConfig to unknown to express that raw untrusted input is accepted before migration"
  - "Entity guard in card setConfig updated from grid?.entity to (grid as any)?.house?.entity to match new nested GridEntities shape"
  - "heatpump added to cardConfigStruct with all four fields (entity, cop, flow_from_grid_house, flow_from_grid_main) as optional strings matching HeatpumpEntity type"

patterns-established:
  - "Migration-before-assertion: migrateConfig runs first, then superstruct validates the normalized result"
  - "raw-config-unknown: setConfig functions accept unknown to signal raw input from HA lovelace runtime"

requirements-completed: [CONF-05]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 1 Plan 03: Wire migrateConfig and Finalize Superstruct Entities Summary

**migrateConfig wired into both setConfig() call sites with strict superstruct validation for grid (nested house/main) and heatpump entities, completing Phase 1**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T13:00:59Z
- **Completed:** 2026-03-02T13:04:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- `cardConfigStruct.entities.grid` updated from `optional(any())` to `optional(object({ house: optional(any()), main: optional(any()) }))` — superstruct now rejects flat legacy grid configs
- `cardConfigStruct.entities.heatpump` added as strict `optional(object({ entity, cop, flow_from_grid_house, flow_from_grid_main }))` — superstruct no longer strips heatpump config
- Both `setConfig()` implementations (card + editor) updated to accept `unknown` and call `migrateConfig()` before any processing/assertion — ordering enforced
- All Phase 1 success criteria verified: `pnpm typecheck` exits 0, `pnpm test` exits 0 (21 tests, 2 suites)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update cardConfigStruct entities in _schema-all.ts** - `28ec3ff` (feat)
2. **Task 2: Wire migrateConfig into card setConfig() and fix entity guard** - `f53d272` (feat)
3. **Task 3: Wire migrateConfig into editor setConfig() before assert()** - `57e309e` (feat)

## Files Created/Modified
- `src/ui-editor/schema/_schema-all.ts` - Updated entities struct: grid is now strict nested object, heatpump added with all four optional string fields
- `src/power-flow-card-plus.ts` - setConfig accepts unknown; migrateConfig called first; import added; entity guard uses house?.entity
- `src/ui-editor/ui-editor.ts` - setConfig accepts unknown; migrateConfig called before assert(); import added

## Decisions Made
- Both setConfig() signatures changed to `unknown` — expresses that raw untrusted input from the HA lovelace runtime is accepted before migration/validation
- Entity guard in card setConfig changed from `(grid as any)?.entity` to `(grid as any)?.house?.entity` to match new GridEntities{house?,main?} nested shape from Plan 01-01
- heatpump fields follow the HeatpumpEntity type defined in Plan 01-01: entity, cop, flow_from_grid_house, flow_from_grid_main — all optional strings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All three changes applied cleanly; typecheck and tests passed immediately after Task 3 with no fixes needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 1 fully complete: types, migration, and struct validation are all consistent
- Phase 2 (grid_main integration) can begin immediately — all grid config shape contracts are now enforced
- Phase 3 (heatpump implementation) can reference the heatpump struct established here
- Known blockers from Phase 1 still tracked in STATE.md: isEntityInverted, SVG coordinates, mdiHeatPump constant name, isCardWideEnough threshold

## Self-Check: PASSED

- FOUND: .planning/phases/01-type-foundation-and-config-migration/01-03-SUMMARY.md
- FOUND: src/ui-editor/schema/_schema-all.ts
- FOUND: src/power-flow-card-plus.ts
- FOUND: src/ui-editor/ui-editor.ts
- FOUND commit: 28ec3ff (Task 1)
- FOUND commit: f53d272 (Task 2)
- FOUND commit: 57e309e (Task 3)

---
*Phase: 01-type-foundation-and-config-migration*
*Completed: 2026-03-02*

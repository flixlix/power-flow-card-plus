---
phase: 01-type-foundation-and-config-migration
plan: 02
subsystem: config
tags: [typescript, migration, tdd, jest, config, grid]

# Dependency graph
requires:
  - phase: 01-01
    provides: GridEntities interface (house/main sub-keys), PowerFlowCardPlusConfig type
provides:
  - migrateConfig pure function — accepts unknown, returns PowerFlowCardPlusConfig with nested grid shape
  - Full migration test suite — 8 test cases covering all behaviors
  - Idempotency guarantee: same object reference returned for already-nested or no-grid configs
  - Deprecation warning on flat config detection
affects:
  - 01-03
  - 02-superstruct-schema-and-validation
  - 03-grid-state-and-energy-balance

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD pattern: RED commit (failing tests) then GREEN commit (implementation) — used for migration logic"
    - "Migration pattern: detect flat format via 'entity' key in grid object; wrap in { house: ... } spread"
    - "Idempotency pattern: guard returns same reference for non-flat configs, enabling safe repeated calls"

key-files:
  created:
    - src/utils/migrate-config.ts
    - __tests__/migrate-config.test.ts
  modified: []

key-decisions:
  - "Migration detection via 'entity' in grid (top-level entity key = flat format) — same guard as CONTEXT.md locked decision"
  - "Idempotency: no-op cases (no grid, or nested grid) return same object reference — enables safe double-call in setConfig"
  - "Type-only import from power-flow-card-plus-config — Babel strips it, so no ESM/CJS issues in Jest"
  - "Deprecation message: '[power-flow-card-plus] entities.grid has been migrated to entities.grid.house automatically. Update your config to suppress this warning.'"

patterns-established:
  - "migrateConfig pattern: pure function, standalone module, independently testable without LitElement coupling"
  - "TDD commit structure: test() commit (RED) followed by feat() commit (GREEN) for each TDD task"

requirements-completed:
  - CONF-02
  - CONF-03

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 1 Plan 02: Config Migration Summary

**Pure migrateConfig function with TDD: flat-to-nested grid migration, idempotency guarantee, and deprecation warning — 8 tests all GREEN**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-02T12:53:52Z
- **Completed:** 2026-03-02T12:55:31Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments

- Wrote 8 failing tests (RED) covering: flat string migration, flat ComboEntity migration, idempotency by reference, double-migration safety, no-grid passthrough, deprecation warning (called / not called), and heatpump preservation
- Implemented `migrateConfig(raw: unknown): PowerFlowCardPlusConfig` with detection via `'entity' in grid`, spread migration to `{ house: originalGrid }`, and same-reference return for no-op cases
- `pnpm typecheck` exits 0, full test suite 21/21 passing (13 i18n + 8 migrate-config)

## Task Commits

TDD task with two commits:

1. **RED: Failing tests** - `90a32ba` (test)
2. **GREEN: Implementation** - `e6109aa` (feat)

## Files Created/Modified

- `src/utils/migrate-config.ts` - Pure migrateConfig function; accepts unknown, returns PowerFlowCardPlusConfig; type-only import from config file
- `__tests__/migrate-config.test.ts` - Full test suite: 8 test cases using jest.spyOn for warn spy, toBe for reference equality, toEqual for deep equality

## Decisions Made

- Split Test 6 from the plan into two separate test cases (`calls console.warn exactly once for flat config` and `does NOT call console.warn for already-nested config`) for clearer failure messages. Total: 8 tests instead of 7.
- Used `as Record<string, unknown>` cast on the grid object for the `'entity' in grid` guard, maintaining type safety without importing non-type-safe dependencies.
- `{ house: grid as any }` in the migration spread — `grid` is the original flat grid record, wrapped as the `house` sub-key. The `as any` cast is needed because `Grid` interface requires non-optional fields (`power_outage`, `color_circle`) that may not be present on a raw flat config.

## Deviations from Plan

None - plan executed exactly as written. The 8th test case (split of Test 6 into two) is a minor test granularity improvement, not a behavioral deviation.

## Issues Encountered

- `pnpm test -- --testPathPattern=migrate-config` flag was not parsed correctly through pnpm's argument forwarding. Used `pnpm exec jest --testPathPattern="migrate-config"` instead. No impact on output.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `migrateConfig` is ready to be called in `setConfig()` in `src/power-flow-card-plus.ts` before superstruct assertion (Plan 01-03 will wire this up)
- Migration function is independently testable with zero coupling to LitElement or HA APIs
- Idempotency confirmed by reference equality test — safe to call unconditionally in setConfig

## Self-Check: PASSED

- FOUND: src/utils/migrate-config.ts
- FOUND: __tests__/migrate-config.test.ts
- FOUND: 01-02-SUMMARY.md
- FOUND: commit 90a32ba (RED tests)
- FOUND: commit e6109aa (GREEN implementation)

---
*Phase: 01-type-foundation-and-config-migration*
*Completed: 2026-03-02*

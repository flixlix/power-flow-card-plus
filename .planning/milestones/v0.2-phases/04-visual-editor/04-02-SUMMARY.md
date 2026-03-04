---
phase: 04-visual-editor
plan: 02
subsystem: ui
tags: [lit-element, ha-form, sortablejs, custom-element, editor]

# Dependency graph
requires:
  - phase: 04-visual-editor plan 01
    provides: ConfigPage type with intermediate, ui-editor routing structure, individual-devices-editor pattern
provides:
  - intermediateSchema for per-item form fields (entity, name, icon, colors, flow entities, secondary_info, tap_action)
  - intermediate-devices-editor custom element for array editing
  - intermediate-row-editor custom element with SortableJS reorder and inline ha-form editing
  - ui-editor.ts intermediate page routing
affects: [05-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [intermediate-editor mirrors individual-editor pattern with simplified devices-editor (no sub-element detail mode)]

key-files:
  created:
    - src/ui-editor/schema/intermediate.ts
    - src/ui-editor/components/intermediate-devices-editor.ts
    - src/ui-editor/components/intermediate-row-editor.ts
  modified:
    - src/ui-editor/schema/_schema-all.ts
    - src/ui-editor/ui-editor.ts

key-decisions:
  - "IntermediateDevicesEditor omits _subElementEditorConfig detail mode -- intermediate items use inline row editing only (simpler than individual pattern)"
  - "IntermediateEntity[] cast to LovelaceRowConfig[] via as-cast to satisfy shared entity-rows typing (same runtime behavior as individual editor)"

patterns-established:
  - "Array entity editor pattern: devices-editor delegates to row-editor with SortableJS, ha-form, and config-changed events"

requirements-completed: [ED-03, ED-04]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 4 Plan 2: Intermediate Editor Summary

**Intermediate entity array editor with SortableJS drag reorder, per-item ha-form editing for entity/name/icon/colors/flow-entities/secondary-info/tap-action**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T12:24:58Z
- **Completed:** 2026-03-04T12:27:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created intermediateSchema with all IntermediateEntity fields including flow entity pickers with localized labels
- Built intermediate-row-editor with SortableJS drag-to-reorder, inline ha-form edit mode, add/remove entity buttons
- Built intermediate-devices-editor delegating to row-editor with config-changed event propagation
- Wired intermediate page routing in ui-editor.ts alongside existing individual editor

## Task Commits

Each task was committed atomically:

1. **Task 1: Create intermediate schema, intermediate-devices-editor, and intermediate-row-editor** - `1f09727` (feat)
2. **Task 2: Wire intermediate editor into ui-editor.ts render() routing** - `fb7902e` (feat)

## Files Created/Modified
- `src/ui-editor/schema/intermediate.ts` - Per-item schema: entity, name, icon, color_circle, color (consumption/production), flowFromGridHouse, flowFromGridMain, secondary_info, tap_action
- `src/ui-editor/components/intermediate-row-editor.ts` - Row editor with SortableJS reorder, inline ha-form edit, add/remove/entity-picker
- `src/ui-editor/components/intermediate-devices-editor.ts` - Array editor component delegating to intermediate-row-editor
- `src/ui-editor/schema/_schema-all.ts` - Added intermediateSchema re-export
- `src/ui-editor/ui-editor.ts` - Added intermediate page routing and import

## Decisions Made
- IntermediateDevicesEditor omits the _subElementEditorConfig detail editing branch (used by individual for per-device schema) -- intermediate items use simpler inline row editing only
- IntermediateEntity[] uses `as LovelaceRowConfig[]` cast to satisfy shared typing -- same runtime pattern as individual editor

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed IntermediateEntity[] type mismatch with LovelaceRowConfig[]**
- **Found during:** Task 1 (intermediate-devices-editor creation)
- **Issue:** `this.config.entities.intermediate` returns `IntermediateEntity[]` which is not assignable to `LovelaceRowConfig[]`
- **Fix:** Added `as LovelaceRowConfig[]` cast in both assignment locations
- **Files modified:** src/ui-editor/components/intermediate-devices-editor.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 1f09727 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type cast necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 (Visual Editor) is complete with both grid sub-page editor (04-01) and intermediate array editor (04-02)
- Ready for Phase 5 (Polish) which handles edge cases and visual tuning

---
*Phase: 04-visual-editor*
*Completed: 2026-03-04*

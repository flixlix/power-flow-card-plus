# Phase 4: Visual Editor - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual editor pages for grid_house, grid_main, and intermediate entities, plus a flat-config migration prompt. Every new config field introduced in Phases 1-3 becomes editable through the Lovelace visual editor with no YAML-only fields. No card rendering changes. No responsive polish (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Grid page structure
- **Two separate top-level page links**: "Grid House" and "Grid Main" in the editor nav sidebar — not tabs or sub-navigation within a single page
- **Always visible**: Both Grid House and Grid Main links show in the nav regardless of whether `entities.grid.main` is configured. User can click in and add the entity.
- **Grid House schema**: Identical to the current `gridSchema` (combined/separated entity, name, icon, invert_state, use_metadata, color_value, colors, secondary_info, power_outage, tap_action). Page header reads "Grid House" instead of "Grid"
- **Grid Main schema**: Identical to Grid House — full parity. Same fields, same structure.
- **_valueChanged routing**: Both grid_house and grid_main need special-case routing in `_valueChanged` to write to `entities.grid.house` and `entities.grid.main` respectively (similar to how `individual` and `advanced` already have special routing)

### Intermediate entity editor
- **Same pattern as individual-devices-editor**: Add/remove/reorder list UI for the `intermediate[]` array. Reuse the proven `individual-devices-editor` component pattern.
- **All fields exposed per item**: entity, name, icon, color (consumption/production), color_circle, tap_action, secondary_info, flowFromGridHouse, flowFromGridMain — full configurability
- **Flow entity labels**: Descriptive human-readable labels ("Flow from Grid House", "Flow from Grid Main") — clear about what each entity controls
- **Nav link**: "Intermediate" as a top-level link in editor nav, with custom handler routing (like individual)

### Migration prompt (ED-05)
- **Banner at top of editor**: Yellow/warning banner on the editor main page (above all nav links), visible immediately when opening the editor
- **Instant migration + save**: One-click "Migrate" button. Rewrites config from flat grid to nested `grid.house`, fires `config-changed` event. Banner disappears. No confirmation dialog.
- **Explanatory text + action**: Banner text explains the situation clearly (e.g., "Your grid config uses the legacy flat format...") with a Migrate button

### Claude's Discretion
- Exact banner HTML/CSS styling (follow HA alert/warning patterns)
- Exact migration button label text
- Whether to create a new `intermediate-devices-editor` component or extend `individual-devices-editor` with a mode parameter
- ConfigPage type updates to accommodate grid_house/grid_main as separate pages
- Localization key naming for new editor labels
- Schema file organization (new files vs extending existing)

</decisions>

<specifics>
## Specific Ideas

- Grid House and Grid Main are separate `ConfigPage` entries — this requires updating the `ConfigPage` type (currently `keyof ConfigEntities | "advanced" | null`) to also include `"grid_house"` and `"grid_main"` as explicit values, since the config key is `grid` (object) not `grid_house`
- The `_valueChanged` handler needs to detect grid_house/grid_main pages and route writes to `entities.grid.house` / `entities.grid.main` — similar complexity to individual's custom handler
- Migration banner only appears when `entities.grid` has flat format (detected by presence of `.entity` at grid object top level, same detection as `migrateConfig()`)
- The intermediate editor mirrors individual-devices-editor: each array item is an expandable card with all its fields

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `individual-devices-editor` (`src/ui-editor/components/individual-devices-editor.ts`): Template for intermediate editor — handles array add/remove/reorder with per-item config forms
- `gridSchema` (`src/ui-editor/schema/grid.ts`): Reuse directly for both grid_house and grid_main pages
- `_schema-base.ts`: `getBaseMainConfigSchema`, `customColorsSchema`, `tapActionSchema`, `secondaryInfoSchema` — all reusable for intermediate entity fields
- `migrateConfig` (`src/utils/migrate-config.ts`): Already has flat-format detection logic — reuse for banner visibility check
- `link-subpage` / `subpage-header` components: Reuse for nav structure

### Established Patterns
- `CONFIG_PAGES` array drives editor nav rendering — add new entries for grid_house, grid_main, intermediate
- `ConfigPage` type = `keyof ConfigEntities | "advanced" | null` — needs extending for grid sub-pages
- `_valueChanged` has special cases for `individual` and `advanced` — add grid_house/grid_main/intermediate
- `dataForForm` reads `data.entities[currentPage]` for entity pages — grid_house/grid_main need `data.entities.grid?.house` / `data.entities.grid?.main`
- Schema files in `src/ui-editor/schema/` — one per entity type

### Integration Points
- `CONFIG_PAGES` array: Replace single "grid" entry with "grid_house" + "grid_main", add "intermediate"
- `ConfigPage` type: Extend union to include "grid_house" | "grid_main" | "intermediate"
- `_valueChanged`: Add routing for grid_house → `entities.grid.house`, grid_main → `entities.grid.main`, intermediate → custom handler
- `render()`: Add migration banner check before nav links, add form data routing for grid sub-pages
- Localization files: Add `editor.grid_house`, `editor.grid_main`, `editor.intermediate` keys

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-visual-editor*
*Context gathered: 2026-03-04*

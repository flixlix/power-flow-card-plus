# Phase 1: Type Foundation and Config Migration - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend TypeScript types, write runtime config migration, and update superstruct validation to support the new Messkonzept 8 nested config shape (`entities.grid.house` / `entities.grid.main` / `entities.heatpump`). Zero visual changes — this phase exists solely to give all downstream phases a stable, proven type foundation.

</domain>

<decisions>
## Implementation Decisions

### Heatpump YAML field naming
- `entities.heatpump.entity` — main power consumption sensor (string only, not ComboEntity — heatpumps are consume-only)
- `entities.heatpump.cop` — COP ratio sensor entity (follows `battery.state_of_charge` naming convention, not `cop_entity`)
- `entities.heatpump.flow_from_grid_house` — entity for house meter → heatpump animated flow
- `entities.heatpump.flow_from_grid_main` — entity for main meter → heatpump animated flow
- All sub-fields are optional (heatpump node renders with whatever is configured)

### Superstruct validation depth
- Make `entities.grid` strict: `object({ house: optional(gridShape), main: optional(gridShape) })`
- Make `entities.heatpump` strict: `object({ entity: optional(string()), cop: optional(string()), flow_from_grid_house: optional(string()), flow_from_grid_main: optional(string()) })`
- Migration runs before superstruct validation in `setConfig()` — so superstruct always sees the migrated (nested) shape
- This means superstruct can be fully strict without needing to handle the legacy flat format

### Deprecation warning message
- `console.warn("[power-flow-card-plus] entities.grid has been migrated to entities.grid.house automatically. Update your config to suppress this warning.")`
- Fires once per `setConfig()` call when flat `entities.grid` (with `.entity` field at top level) is detected

### Migration placement
- Standalone `src/utils/migrate-config.ts` — pure function, independently testable, not coupled to the LitElement
- Signature: `migrateConfig(raw: unknown): PowerFlowCardPlusConfig`
- Migration idempotency: if `entities.grid.house` already exists (or `entities.grid` is undefined), skip migration
- Migration detection: flat format identified by presence of `entities.grid.entity` (string or ComboEntity) at top level of the grid object

### Claude's Discretion
- Where to add `heatpump` to `ConfigEntities` type (alongside battery, grid, solar, home, etc.)
- Whether `Grid` (the existing interface) stays as-is or gets renamed to `GridEntity` for clarity
- Test file structure: `__tests__/migrate-config.test.ts` for migration unit tests
- Whether to use a discriminated union or simple optional-field approach for the nested grid type

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseConfigEntity` in `src/type.ts`: All entity types extend this — reuse for the `GridEntity` sub-type (house/main share the same fields as current `Grid`)
- `Grid` interface in `src/power-flow-card-plus-config.ts`: Current flat grid type — becomes the type for `GridEntities.house` and `GridEntities.main`
- Superstruct imports in `src/ui-editor/schema/_schema-all.ts`: `any, assign, boolean, integer, number, object, optional, string` already imported — add `union, literal` if needed for new types
- `cardConfigStruct` in `_schema-all.ts`: This is the struct to update — currently uses `optional(any())` for all entities

### Established Patterns
- Entity fields: `battery.state_of_charge` (plain name, not `_entity` suffix) — COP field follows same convention as `cop`
- Config entities: All live in `ConfigEntities` type (`src/power-flow-card-plus-config.ts`) and as `optional(any())` in superstruct
- `setConfig()` in `src/power-flow-card-plus.ts`: This is where migration must be called before any config assignment
- No existing migration infrastructure — this is the first migration

### Integration Points
- `ConfigEntities` type needs `heatpump?: HeatpumpEntity` added
- `setConfig()` in `power-flow-card-plus.ts` must call `migrateConfig()` on the raw config before the struct assertion (if any) and before `this._config` assignment
- Superstruct `cardConfigStruct.entities` in `_schema-all.ts` needs `grid` and `heatpump` updated
- Only one existing test file (`__tests__/i18n.test.ts`) — new test file needed for migration tests

</code_context>

<specifics>
## Specific Ideas

- Migration detection via `entities.grid.entity` presence (top-level entity field on grid object = flat format)
- Idempotency: if `entities.grid` is already `{ house: {...} }` (no `.entity` at top level), skip migration entirely
- The `GridEntities` nested type: `{ house?: Grid, main?: Grid }` — both use the exact same existing `Grid` interface

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-type-foundation-and-config-migration*
*Context gathered: 2026-03-02*

# Phase 4: Visual Editor - Research

**Researched:** 2026-03-04
**Domain:** Home Assistant Lovelace card visual editor (LitElement + ha-form schema-driven UI)
**Confidence:** HIGH

## Summary

Phase 4 adds visual editor pages for grid_house, grid_main, and intermediate entities, plus a flat-config migration banner. The existing editor architecture is schema-driven using HA's `ha-form` component with a `CONFIG_PAGES` navigation pattern and special-case routing in `_valueChanged`. All patterns needed already exist in the codebase -- grid_house/grid_main reuse the existing `gridSchema`, intermediate follows the `individual-devices-editor` array-editor pattern, and the migration banner reuses `migrateConfig` detection logic.

The core technical challenge is the `ConfigPage` type: currently `keyof ConfigEntities | "advanced" | null`, which does not include `"grid_house"` or `"grid_main"` as values (the config key is `grid` containing `{house?, main?}`). The type must be extended with explicit string literals. Similarly, `dataForForm` and `_valueChanged` need special-case routing for these synthetic page names that map to nested config paths.

**Primary recommendation:** Extend `ConfigPage` type with `"grid_house" | "grid_main" | "intermediate"` literals, add corresponding `CONFIG_PAGES` entries, and add special-case branches in `render()`/`_valueChanged` for the nested grid paths. Create an `intermediate-devices-editor` component mirroring `individual-devices-editor`. Add a migration banner as HTML before the nav links using `migrateConfig`'s flat-detection logic.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Grid page structure**: Two separate top-level page links "Grid House" and "Grid Main" in the editor nav sidebar -- not tabs or sub-navigation within a single page
- Both Grid House and Grid Main links always visible regardless of whether `entities.grid.main` is configured
- Grid House schema identical to current `gridSchema`; Grid Main schema identical to Grid House (full parity)
- `_valueChanged` routing: Both grid_house and grid_main need special-case routing to write to `entities.grid.house` and `entities.grid.main` respectively
- **Intermediate entity editor**: Same pattern as `individual-devices-editor` -- add/remove/reorder list UI for the `intermediate[]` array
- All fields exposed per intermediate item: entity, name, icon, color (consumption/production), color_circle, tap_action, secondary_info, flowFromGridHouse, flowFromGridMain
- Flow entity labels: Descriptive human-readable labels ("Flow from Grid House", "Flow from Grid Main")
- Nav link: "Intermediate" as a top-level link in editor nav with custom handler routing
- **Migration prompt (ED-05)**: Yellow/warning banner at top of editor main page, above all nav links, visible immediately
- Instant migration + save: One-click "Migrate" button. Rewrites config, fires `config-changed`. No confirmation dialog.
- Explanatory text + action: Banner explains the situation with a Migrate button

### Claude's Discretion
- Exact banner HTML/CSS styling (follow HA alert/warning patterns)
- Exact migration button label text
- Whether to create a new `intermediate-devices-editor` component or extend `individual-devices-editor` with a mode parameter
- ConfigPage type updates to accommodate grid_house/grid_main as separate pages
- Localization key naming for new editor labels
- Schema file organization (new files vs extending existing)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ED-01 | `grid_house` editor page with all current grid fields | Reuse existing `gridSchema` directly; add "grid_house" to `CONFIG_PAGES` with `mdi:transmission-tower` icon; route `dataForForm` to `data.entities.grid?.house` |
| ED-02 | `grid_main` editor page with same schema as grid_house | Identical to ED-01 but with "grid_main" page name; route `dataForForm` to `data.entities.grid?.main`; use same `gridSchema` |
| ED-03 | `intermediate` editor page with entity, name, icon, colors, tap_action, secondary_info, flowFromGridHouse, flowFromGridMain | Create `intermediate-devices-editor` component following `individual-devices-editor` pattern; create `intermediateSchema` for per-item fields |
| ED-04 | Editor's `_valueChanged` handler routes nested grid config correctly | Add `grid_house`/`grid_main` branches in `_valueChanged` to write to `entities.grid.house`/`entities.grid.main`; add `intermediate` branch delegating to sub-component |
| ED-05 | Editor detects flat `grid` config and displays one-click migration prompt | Reuse `migrateConfig` flat-detection logic (`"entity" in grid`); render yellow banner with Migrate button; fire `config-changed` on click |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | ^2.2.2 | LitElement custom elements for editor components | Already used throughout project |
| custom-card-helpers | ^1.9.0 | `fireEvent`, `HomeAssistant` type, `ActionConfig` | Already used for editor event handling |
| superstruct | ^1.0.3 | Config validation | Already used in `cardConfigStruct` |
| @mdi/js | ^7.2.96 | Material Design Icons (nav icons) | Already used for all editor icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sortablejs | ^1.15.0 | Drag-to-reorder for intermediate array items | Needed in intermediate-devices-editor for reordering |
| lit/decorators | (bundled) | `@customElement`, `@property`, `@state` | Standard LitElement decorators |
| lit/directives/repeat | (bundled) | `repeat()` directive for list rendering | Used in row-editor for keyed list rendering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `intermediate-devices-editor` component | Extend `individual-devices-editor` with mode param | **Recommend new component** -- intermediate has different fields (flowFromGridHouse/Main, color_circle, no calculate_flow_rate) and a different config path; a mode parameter would add conditional complexity for minimal code savings |

**Installation:**
No new dependencies needed. All libraries already installed.

## Architecture Patterns

### Recommended Changes to Existing Files

```
src/ui-editor/
├── types/
│   └── config-page.ts          # MODIFY: Extend ConfigPage type
├── schema/
│   ├── grid.ts                 # NO CHANGE: Reuse gridSchema as-is
│   ├── intermediate.ts         # CREATE: intermediateSchema for per-item fields
│   └── _schema-all.ts          # MODIFY: Export intermediateSchema
├── components/
│   ├── intermediate-devices-editor.ts   # CREATE: Array editor for intermediate[]
│   ├── intermediate-row-editor.ts       # CREATE: Per-item editor with reorder
│   ├── individual-devices-editor.ts     # NO CHANGE
│   └── individual-row-editor.ts         # NO CHANGE
└── ui-editor.ts                # MODIFY: CONFIG_PAGES, render(), _valueChanged
```

### Pattern 1: ConfigPage Type Extension
**What:** Extend the `ConfigPage` union type to include synthetic page names that don't map directly to `ConfigEntities` keys
**When to use:** When a config page corresponds to a nested path rather than a top-level entity key
**Example:**
```typescript
// src/ui-editor/types/config-page.ts
import { ConfigEntities } from "@/power-flow-card-plus-config";

export type ConfigPage = keyof ConfigEntities | "grid_house" | "grid_main" | "advanced" | null;
```
**Confidence:** HIGH -- this is the minimal change needed. The current type `keyof ConfigEntities` includes `"grid"` which is no longer needed as a page (replaced by grid_house/grid_main). Remove `"grid"` from CONFIG_PAGES entries but keep it in the type (it's still a valid ConfigEntities key).

### Pattern 2: Nested Config Data Routing in render()
**What:** Map synthetic page names to nested config paths for `dataForForm`
**When to use:** When `ha-form` needs data from `entities.grid.house` or `entities.grid.main` instead of `entities[currentPage]`
**Example:**
```typescript
// In render(), when determining dataForForm:
const getDataForForm = (page: ConfigPage) => {
  if (page === "grid_house") return data.entities.grid?.house ?? {};
  if (page === "grid_main") return data.entities.grid?.main ?? {};
  if (page === "advanced") return data;
  return data.entities[page as keyof ConfigEntities];
};
```
**Confidence:** HIGH -- follows the existing pattern where `advanced` has its own data routing.

### Pattern 3: Nested Config Write Routing in _valueChanged()
**What:** Map synthetic page names to nested config write paths
**When to use:** When form changes must write to `entities.grid.house` or `entities.grid.main`
**Example:**
```typescript
// In _valueChanged():
if (this._currentConfigPage === "grid_house" || this._currentConfigPage === "grid_main") {
  const subKey = this._currentConfigPage === "grid_house" ? "house" : "main";
  config = {
    ...this._config,
    entities: {
      ...this._config.entities,
      grid: {
        ...this._config.entities.grid,
        [subKey]: ev.detail.value,
      },
    },
  };
} else if (this._currentConfigPage !== null && this._currentConfigPage !== "advanced"
           && this._currentConfigPage !== "individual" && this._currentConfigPage !== "intermediate") {
  // existing generic handler
  config = {
    ...this._config,
    entities: {
      ...this._config.entities,
      [this._currentConfigPage]: config,
    },
  };
}
```
**Confidence:** HIGH -- mirrors the existing `individual` and `advanced` special-case pattern.

### Pattern 4: Array Entity Editor (intermediate-devices-editor)
**What:** A LitElement component that manages add/remove/reorder for `intermediate[]` array items
**When to use:** For the intermediate entities editor page
**How it works:**
1. Parent (`ui-editor.ts`) renders `<intermediate-devices-editor>` when `_currentConfigPage === "intermediate"`
2. Component reads `config.entities.intermediate` array
3. List view shows entity pickers with drag handles (via SortableJS), edit buttons, delete buttons
4. Edit view shows `ha-form` with `intermediateSchema` for the selected item
5. Changes fire `config-changed` with updated config object
**Confidence:** HIGH -- directly mirrors `individual-devices-editor` + `individual-row-editor` pattern.

### Pattern 5: Migration Banner
**What:** A warning banner shown at the top of the editor main page when flat grid config is detected
**When to use:** Only when `"entity" in (config.entities.grid as any)` (same check as `migrateConfig`)
**Example:**
```typescript
// In render(), before renderLinkSubPages():
const needsMigration = this._config.entities.grid &&
  "entity" in (this._config.entities.grid as any);

// In template:
${needsMigration ? html`
  <ha-alert alert-type="warning">
    Your grid configuration uses the legacy flat format. Click Migrate to
    update to the new nested format automatically.
    <mwc-button slot="action" @click=${this._migrateConfig}>
      Migrate
    </mwc-button>
  </ha-alert>
` : nothing}
```
**Confidence:** MEDIUM -- `ha-alert` is a standard HA component available in the editor context. If `ha-alert` is not available, fall back to a styled div with yellow background. The `slot="action"` pattern may vary by HA version; a simple button after the text is a safe fallback.

### Anti-Patterns to Avoid
- **Flattening grid writes to top-level keys:** The `_valueChanged` default path does `[this._currentConfigPage]: config` which would create `entities.grid_house` instead of `entities.grid.house`. MUST use special-case routing.
- **Sharing individual-devices-editor with mode param:** The intermediate entity schema differs significantly (flow entities, no calculate_flow_rate, different color structure). A mode parameter would create fragile conditional logic.
- **Modifying migrateConfig for editor migration:** The editor migration should fire a `config-changed` event with the migrated config -- not call `migrateConfig` directly (which returns a new object but doesn't fire events). Instead, replicate the migration logic inline or call `migrateConfig` and then `fireEvent`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema-driven forms | Custom form fields | `ha-form` with schema arrays | HA provides entity pickers, color selectors, action editors for free |
| Drag-and-drop reorder | Custom drag handlers | SortableJS (already in project) | Touch support, animation, accessibility handled |
| Entity picker UI | Custom autocomplete | `ha-entity-picker` component | HA provides full entity search/filtering |
| Tap action editor | Custom action form | `{ selector: { ui_action: {} } }` schema | HA renders the full action editor |
| Alert/warning banner | Custom styled div | `ha-alert` component (if available) | Consistent with HA editor styling |

**Key insight:** The HA editor ecosystem provides nearly all UI components needed. The only custom code is routing logic (which pages exist, how data flows to/from nested config paths) and the intermediate array-editor shell.

## Common Pitfalls

### Pitfall 1: Config Write Path Mismatch
**What goes wrong:** Editing grid_house saves to `entities.grid_house` (flat) instead of `entities.grid.house` (nested)
**Why it happens:** The default `_valueChanged` handler uses `[this._currentConfigPage]` as the entities key, which works for `solar`, `battery`, etc. but NOT for synthetic page names
**How to avoid:** Add explicit `grid_house`/`grid_main` branches in `_valueChanged` BEFORE the generic handler
**Warning signs:** Editor changes don't persist; config reverts on save; extra top-level keys appear in YAML

### Pitfall 2: Empty Object on First Edit
**What goes wrong:** Opening grid_main editor for the first time (when `entities.grid.main` is undefined) causes ha-form to receive `undefined` data and either crashes or shows empty
**Why it happens:** `data.entities.grid?.main` is undefined when grid_main hasn't been configured yet
**How to avoid:** Default to empty object: `data.entities.grid?.main ?? {}`
**Warning signs:** Blank editor page; console errors about accessing properties of undefined

### Pitfall 3: Grid Object Overwrite
**What goes wrong:** Saving grid_house overwrites the entire `entities.grid` object, destroying `grid.main`
**Why it happens:** Using `grid: ev.detail.value` instead of `grid: { ...this._config.entities.grid, house: ev.detail.value }`
**How to avoid:** Always spread the existing grid object and only replace the specific sub-key
**Warning signs:** Editing grid_house causes grid_main config to disappear

### Pitfall 4: ConfigPage Type Errors
**What goes wrong:** TypeScript errors when assigning `"grid_house"` to `ConfigPage`
**Why it happens:** The type is `keyof ConfigEntities | "advanced" | null` and `"grid_house"` is not a key of `ConfigEntities`
**How to avoid:** Extend the union type explicitly with the new page names
**Warning signs:** `tsc --noEmit` fails with type assignment errors

### Pitfall 5: Migration Banner Persists After Migration
**What goes wrong:** After clicking Migrate, the banner doesn't disappear
**Why it happens:** The migration fires `config-changed` but the component's internal `_config` isn't updated until `setConfig` is called by HA
**How to avoid:** The `config-changed` event triggers HA to call `setConfig` again, which runs `migrateConfig`, updating `_config`. The banner check reads from `_config`, so it should auto-resolve. But verify that `setConfig` is called synchronously after `config-changed`.
**Warning signs:** Banner stays visible; user must close and reopen editor

### Pitfall 6: Localization Keys Missing
**What goes wrong:** Editor shows raw keys like `editor.grid_house` instead of "Grid House"
**Why it happens:** New localization keys not added to `en.json` (and other language files)
**How to avoid:** Add `grid_house`, `grid_main`, `intermediate`, `flowFromGridHouse`, `flowFromGridMain` to all language JSON files (at minimum `en.json`)
**Warning signs:** Raw key strings visible in editor UI

## Code Examples

### CONFIG_PAGES Array Update
```typescript
// Source: Direct analysis of src/ui-editor/ui-editor.ts
const CONFIG_PAGES: {
  page: ConfigPage;
  icon?: string;
  schema?: any;
}[] = [
  {
    page: "grid_house",
    icon: "mdi:transmission-tower",
    schema: gridSchema,
  },
  {
    page: "grid_main",
    icon: "mdi:meter-electric",  // distinct icon from grid_house
    schema: gridSchema,          // same schema -- full parity
  },
  {
    page: "solar",
    icon: "mdi:solar-power",
    schema: solarSchema,
  },
  {
    page: "battery",
    icon: "mdi:battery-high",
    schema: batterySchema,
  },
  {
    page: "fossil_fuel_percentage",
    icon: "mdi:leaf",
    schema: nonFossilSchema,
  },
  {
    page: "home",
    icon: "mdi:home",
    schema: homeSchema,
  },
  {
    page: "individual",
    icon: "mdi:dots-horizontal-circle-outline",
  },
  {
    page: "intermediate",
    icon: "mdi:hub-outline",  // or mdi:resistor, mdi:swap-horizontal
  },
  {
    page: "advanced",
    icon: "mdi:cog",
    schema: advancedOptionsSchema,
  },
];
```

### Intermediate Schema (per-item fields)
```typescript
// New file: src/ui-editor/schema/intermediate.ts
import { getBaseMainConfigSchema, secondaryInfoSchema, tapActionSchema } from "./_schema-base";
import localize from "@/localize/localize";

export const intermediateSchema = [
  {
    name: "entity",
    selector: { entity: {} },
  },
  {
    type: "grid",
    column_min_width: "200px",
    schema: [
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "color_circle", label: "Color of Circle", selector: { color_rgb: {} } },
    ],
  },
  {
    name: "color",
    title: localize("editor.custom_colors"),
    type: "expandable",
    schema: [
      {
        type: "grid",
        column_min_width: "200px",
        schema: [
          { name: "consumption", label: "Consumption", selector: { color_rgb: {} } },
          { name: "production", label: "Production", selector: { color_rgb: {} } },
        ],
      },
    ],
  },
  {
    title: "Flow Entities",
    name: "",
    type: "expandable",
    schema: [
      {
        name: "flowFromGridHouse",
        label: "Flow from Grid House",
        selector: { entity: {} },
      },
      {
        name: "flowFromGridMain",
        label: "Flow from Grid Main",
        selector: { entity: {} },
      },
    ],
  },
  {
    title: localize("editor.secondary_info"),
    name: "secondary_info",
    type: "expandable",
    schema: secondaryInfoSchema,
  },
  {
    title: localize("editor.tap_action"),
    name: "",
    type: "expandable",
    schema: tapActionSchema,
  },
] as const;
```

### Migration Banner Implementation
```typescript
// In ui-editor.ts render() method, before renderLinkSubPages():
private _isFlatGridConfig(): boolean {
  const grid = this._config?.entities?.grid as Record<string, unknown> | undefined;
  return grid !== undefined && "entity" in grid;
}

private _migrateConfig(): void {
  if (!this._config) return;
  const migrated = migrateConfig(this._config);
  fireEvent(this, "config-changed", { config: migrated });
}

// In render template:
${this._isFlatGridConfig() ? html`
  <ha-alert alert-type="warning">
    Your grid configuration uses the legacy flat format. Click to migrate
    automatically to the new nested structure.
    <mwc-button slot="action" @click=${this._migrateConfig}>
      Migrate
    </mwc-button>
  </ha-alert>
` : nothing}
```

### Localization Keys to Add (en.json)
```json
{
  "editor": {
    "grid_house": "Grid House",
    "grid_main": "Grid Main",
    "intermediate": "Intermediate",
    "flowFromGridHouse": "Flow from Grid House",
    "flowFromGridMain": "Flow from Grid Main",
    "color_circle": "Color of Circle",
    "migrate_warning": "Your grid configuration uses the legacy flat format.",
    "migrate_button": "Migrate"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single "Grid" editor page | Separate "Grid House" and "Grid Main" pages | Phase 4 | Config writes must route to nested `grid.house`/`grid.main` |
| No intermediate editor | Array editor with add/remove/reorder | Phase 4 | Mirrors individual-devices-editor pattern |
| Flat grid config accepted silently | Migration banner in editor | Phase 4 | Users see a prompt to migrate legacy configs |

**Deprecated/outdated:**
- Flat `entities.grid` format: Still supported at runtime via `migrateConfig()`, but editor now shows migration prompt to encourage adoption of nested format

## Open Questions

1. **`ha-alert` component availability**
   - What we know: `ha-alert` is a standard HA component used throughout the HA frontend for warning/error banners
   - What's unclear: Whether it's guaranteed to be loaded in the card editor context (it may need lazy-loading similar to `ha-form`)
   - Recommendation: Try `ha-alert` first; if not available, use a styled `div` with HA CSS custom properties for consistent theming (`--warning-color`, `--ha-card-border-color`)

2. **`mwc-button` vs `ha-button` in banner**
   - What we know: Both are available in HA. Older cards use `mwc-button`, newer HA frontend uses `ha-button`
   - What's unclear: Which is standard for editor context in current HA versions
   - Recommendation: Use `mwc-button` (already used by other HA cards in editor context); fall back to `ha-button` or plain `<button>` if needed

3. **Grid Main icon differentiation**
   - What we know: Grid House uses `mdi:transmission-tower`. Grid Main needs a visually distinct icon.
   - What's unclear: Best icon choice for "main meter" vs "house meter"
   - Recommendation: Use `mdi:meter-electric` for Grid Main (represents a power meter); `mdi:transmission-tower` stays with Grid House

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 |
| Config file | `jest.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ED-01 | grid_house editor page renders with gridSchema | manual-only | N/A -- LitElement rendering requires browser | N/A |
| ED-02 | grid_main editor page renders with gridSchema | manual-only | N/A -- LitElement rendering requires browser | N/A |
| ED-03 | intermediate editor page with all fields | manual-only | N/A -- LitElement rendering requires browser | N/A |
| ED-04 | _valueChanged routes grid_house to entities.grid.house | unit | `pnpm test -- --testPathPattern=editor-routing` | Wave 0 |
| ED-05 | flat config detection + migration via editor | unit | `pnpm test -- --testPathPattern=migrate-config` | Partial (migrate-config.test.ts exists) |

**Note:** Editor UI components are LitElement custom elements that require a browser DOM (or jsdom with HA component stubs). The existing test infrastructure is Node-based (jest with `testEnvironment: "node"`). Most editor requirements are best validated manually in the HA UI. ED-04 routing logic and ED-05 detection logic can be tested as pure functions if extracted.

### Sampling Rate
- **Per task commit:** `pnpm typecheck`
- **Per wave merge:** `pnpm typecheck && pnpm test`
- **Phase gate:** `pnpm typecheck && pnpm test && pnpm build` (full build validates all imports)

### Wave 0 Gaps
- [ ] No dedicated editor-routing test file -- but routing logic is simple enough to validate with `pnpm typecheck` and manual testing
- [ ] `migrate-config.test.ts` already covers flat detection -- no additional test file needed for ED-05 detection logic
- [ ] Primary validation: `pnpm typecheck` (catches type errors in ConfigPage, _valueChanged routing) + `pnpm build` (catches import/export errors) + manual HA editor testing

*(Editor components are inherently UI-driven. The project's existing test infrastructure validates config logic (migrate-config) and types (typecheck). Visual editor behavior is validated manually in HA.)*

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of `src/ui-editor/ui-editor.ts` -- main editor component, CONFIG_PAGES, render(), _valueChanged
- Direct source code analysis of `src/ui-editor/types/config-page.ts` -- ConfigPage type definition
- Direct source code analysis of `src/ui-editor/schema/grid.ts` -- gridSchema reusable for both grid_house and grid_main
- Direct source code analysis of `src/ui-editor/schema/_schema-base.ts` -- base schema utilities (tapActionSchema, secondaryInfoSchema, customColorsSchema)
- Direct source code analysis of `src/ui-editor/components/individual-devices-editor.ts` -- template for intermediate array editor
- Direct source code analysis of `src/ui-editor/components/individual-row-editor.ts` -- template for intermediate per-item editor
- Direct source code analysis of `src/utils/migrate-config.ts` -- flat detection logic reusable for migration banner
- Direct source code analysis of `src/power-flow-card-plus-config.ts` -- ConfigEntities type with GridEntities and IntermediateEntity

### Secondary (MEDIUM confidence)
- `ha-alert` component availability in editor context -- based on HA frontend codebase knowledge, standard component but not verified in this specific card's editor loading

### Tertiary (LOW confidence)
- `mwc-button` slot="action" pattern in `ha-alert` -- standard HA pattern but exact slot name may differ by HA version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- all patterns already established in codebase (individual-devices-editor, _valueChanged routing, CONFIG_PAGES)
- Pitfalls: HIGH -- identified from direct code analysis of existing routing logic and config structure
- Migration banner: MEDIUM -- ha-alert availability not verified in editor load context

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- internal codebase patterns, no external API dependency)

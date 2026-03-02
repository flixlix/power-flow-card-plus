# Pitfalls Research

**Domain:** Lit/TypeScript Home Assistant custom card extension (Messkonzept 8)
**Researched:** 2026-03-02
**Confidence:** HIGH (based on direct codebase analysis)

## Critical Pitfalls

### Pitfall 1: `EntityType` union blocks `config.entities[field]` for new node types

**What goes wrong:**
The `EntityType` union in `src/type.ts:62` is hardcoded to `"battery" | "grid" | "solar" | "individual1" | "individual2" | "home" | "fossil_fuel_percentage"`. The `getFieldInState`, `getFieldOutState`, and `getSecondaryState` functions in `src/states/raw/base.ts` all index `config.entities[field]` using this type. Adding `"heatpump"` or `"grid_house"` / `"grid_main"` as new field values requires updating `EntityType` AND updating `ConfigEntities` in `src/power-flow-card-plus-config.ts:94` in lockstep. If `EntityType` is extended but `ConfigEntities` is not (or vice versa), TypeScript will silently allow an `undefined` access or refuse to compile depending on the direction of the mismatch.

Furthermore, `isEntityInverted` in `src/states/utils/isEntityInverted.ts` uses `config.entities[entityType]`, which will fail at runtime if a new entity type is in `EntityType` but has no corresponding key in `ConfigEntities`.

**Why it happens:**
`EntityType` and `ConfigEntities` are defined in separate files (`src/type.ts` and `src/power-flow-card-plus-config.ts`) with no compile-time constraint linking them. A developer updating one file may not realize the other must change.

**How to avoid:**
- Derive `EntityType` from `keyof ConfigEntities` instead of maintaining a separate string union. At minimum, add a type-level assertion: `type _Check = EntityType extends keyof ConfigEntities ? true : never;`
- When adding `heatpump` to `ConfigEntities`, immediately add it to `EntityType` in the same commit.
- For nested grid (`grid.house`, `grid.main`), decide whether these are separate `EntityType` values or accessed through a different path. The current `getFieldOutState(hass, config, "grid")` pattern assumes a flat lookup; nested keys like `config.entities.grid.house.entity` cannot use this pattern without a new accessor.

**Warning signs:**
- TypeScript compiles but `getFieldOutState(hass, config, "heatpump")` returns `undefined` at runtime because `entities.heatpump` does not exist yet in `ConfigEntities`.
- TypeScript error "Argument of type 'grid_house' is not assignable to parameter of type 'EntityType'" when calling `getFieldInState`.

**Phase to address:**
Phase 1 (Config types and migration). Must be the first change before any state resolution or rendering work.

---

### Pitfall 2: Superstruct `cardConfigStruct` rejects new config keys, breaking the editor

**What goes wrong:**
The visual editor calls `assert(config, cardConfigStruct)` in `src/ui-editor/ui-editor.ts:73`. The `cardConfigStruct` in `src/ui-editor/schema/_schema-all.ts:47-54` defines `entities` as an `object()` with explicitly listed keys: `battery`, `grid`, `solar`, `home`, `fossil_fuel_percentage`, `individual`. Superstruct's `object()` strips unknown keys by default. If a user's config contains `entities.heatpump` but `cardConfigStruct` does not list it, **superstruct will strip the key during validation**, silently deleting heatpump config every time the editor opens.

Worse: the nested grid migration (`entities.grid.house` / `entities.grid.main`) means the shape of `entities.grid` changes from `Grid` (flat) to a nested structure. The current superstruct schema uses `optional(any())` for grid, which will pass validation but provides no type safety. However, if the migration function runs AFTER `assert()` in the editor's `setConfig`, the pre-migration flat config will be validated against a schema that expects the new nested shape, or vice versa.

**Why it happens:**
Superstruct validation in the editor runs BEFORE any migration logic can transform the config. The editor's `setConfig` (line 72-75) calls `assert` as its first operation. If migration is only implemented in the card's `setConfig` (line 73-95 of `power-flow-card-plus.ts`), the editor receives the raw un-migrated config.

**How to avoid:**
1. Add `heatpump: optional(any())` to the `entities` object in `cardConfigStruct` BEFORE any editor schema work.
2. Implement config migration as a standalone pure function that both the card's `setConfig` and the editor's `setConfig` call before validation.
3. Because the current schema uses `optional(any())` for all entity sub-keys, the shape change for grid (flat to nested) will pass validation -- but only because `any()` is permissive. Do NOT tighten the grid schema to a specific struct until migration is proven stable.
4. Order of operations in editor `setConfig` must be: migrate -> assert -> assign. Never assert before migrate.

**Warning signs:**
- Opening the visual editor silently removes `entities.heatpump` from the config (visible in browser devtools as the `config-changed` event fires without the key).
- Editor shows "Config validation failed" error when a user has old flat `entities.grid` config because the struct now expects nested keys.
- Saving config in the editor loses heatpump settings.

**Phase to address:**
Phase 1 (Config migration). The shared migration function and updated struct must land before any editor UI work.

---

### Pitfall 3: Energy balance double-counting when heatpump is both a grid consumer and a separate node

**What goes wrong:**
The current energy balance calculation in `src/power-flow-card-plus.ts:344-396` computes `totalHomeConsumption` (line 420) as `grid.state.toHome + solar.state.toHome + battery.state.toHome`. This represents all power flowing into the home. In Messkonzept 8, the heatpump sits between `grid_main` and `grid_house`. If `grid_main.fromGrid` includes the heatpump consumption AND the heatpump is displayed as a separate node with its own power reading, the energy balance will either:
- **Double-count:** `grid_main.toHome` already includes heatpump power, AND heatpump power is shown separately.
- **Under-count:** If `grid_house.fromGrid` is used for `totalHomeConsumption` (which excludes heatpump), the heatpump node's power is not added back.

The formula `solar.state.toHome = solar.state.total - grid.state.toGrid - battery.state.toBattery` (line 345) implicitly assumes ALL grid consumption flows to "home". With a heatpump branch, some grid consumption flows to the heatpump instead.

**Why it happens:**
The existing codebase has a single `grid` node and a single `home` node. The entire energy balance is a closed system: solar + grid_in = home + battery_in + grid_out. Adding a heatpump creates a new sink that breaks this equation. The Messkonzept 8 topology is: `grid_main = grid_house + heatpump`, so `fromGridMain = fromGridHouse + heatpumpPower`.

**How to avoid:**
Define the energy balance equation explicitly before writing code:
```
grid_main.fromGrid = grid_house.fromGrid + heatpump.power
totalHomeConsumption = grid_house.toHome + solar.toHome + battery.toHome  (excludes heatpump)
heatpump.power = grid_main.fromGrid - grid_house.fromGrid  (or read directly from heatpump entity)
```
- Use `grid_house` (not `grid_main`) as the source for the home energy balance.
- The heatpump power displayed should be: either a direct entity reading, or `grid_main.fromGrid - grid_house.fromGrid`.
- The `totalLines` calculation (line 455-462) must include heatpump flow lines for flow rate animation to work correctly.
- The `nonFossil.state.power` calculation (line 413) uses `grid.state.toHome`. Decide whether non-fossil applies to `grid_main.toHome` (total including heatpump) or `grid_house.toHome` (house only). For Messkonzept 8, non-fossil logically belongs on `grid_main`.

**Warning signs:**
- The sum of all displayed consumption values does not match `grid_main.fromGrid + solar.total` (the total power entering the system).
- Heatpump shows power but home consumption does not decrease by the same amount (or vice versa).
- Flow animation speeds are disproportionate because `totalLines` does not account for heatpump flows.

**Phase to address:**
Phase 2 (State resolution and energy balance). Must be designed on paper before implementation. Write unit tests that verify the closed-system equation with sample power values.

---

### Pitfall 4: Editor `_valueChanged` handler flattens nested config keys

**What goes wrong:**
The editor's `_valueChanged` in `src/ui-editor/ui-editor.ts:166-184` takes the form output and writes it back under `config.entities[currentConfigPage]`. For the current flat entity pages (`grid`, `solar`, `battery`, etc.), this works because `ha-form` returns the entity's config object and `_valueChanged` sets `config.entities.grid = formOutput`.

For a nested config like `entities.grid.house` and `entities.grid.main`, this pattern breaks in two ways:
1. If `grid_house` is a separate `ConfigPage`, then `config.entities["grid_house"] = formOutput` creates a top-level `grid_house` key instead of nesting under `config.entities.grid.house`.
2. If the page is still `"grid"` but the form contains both `house` and `main` sub-objects, the `ha-form` component will not automatically manage nested object hierarchies -- it flattens them.

**Why it happens:**
The `_valueChanged` handler has a simple one-level nesting model: `config.entities[page] = value`. The `ConfigPage` type is `keyof ConfigEntities | "advanced" | null`, meaning adding "grid_house" and "grid_main" as separate pages requires them to be keys in `ConfigEntities`. But the design calls for `entities.grid.house` and `entities.grid.main` as nested keys under a single `grid` parent.

**How to avoid:**
Two options (pick one, not both):
1. **Separate pages approach:** Make `grid_house` and `grid_main` top-level keys in `ConfigEntities` (i.e., `entities.grid_house`, `entities.grid_main` not nested under `entities.grid`). This preserves the existing editor pattern but changes the YAML structure from the planned nested format.
2. **Nested pages approach:** Keep `entities.grid.house` and `entities.grid.main` in config. Add special-case handling in `_valueChanged` for grid sub-pages, similar to how `"individual"` and `"advanced"` already have special handling (lines 104, 173). Create new `ConfigPage` values like `"grid_house"` and `"grid_main"` and add a mapping: `"grid_house" -> config.entities.grid.house`, `"grid_main" -> config.entities.grid.main`.

The nested approach is consistent with the YAML design but requires modifying the `_valueChanged` handler, the `ConfigPage` type, the `dataForForm` extraction (line 116), and the `CONFIG_PAGES` array. All four must be updated consistently.

**Warning signs:**
- Editing grid_house in the UI creates `config.entities.grid_house` instead of `config.entities.grid.house` (visible in YAML editor).
- Saving grid_main config in the editor overwrites the entire `grid` object, deleting `grid.house` config.
- TypeScript error on `ConfigPage` type when adding sub-page strings.

**Phase to address:**
Phase 3 (Editor extension). But the `ConfigEntities` type decision must be made in Phase 1 because it determines the config structure all other phases depend on.

---

### Pitfall 5: SVG flow line coordinates are hardcoded magic numbers coupled to the grid-home layout position

**What goes wrong:**
Every flow line SVG in `src/components/flows/` uses hardcoded coordinates like `d="M0,50 H100"` (gridToHome, line 23) and `d="M0,56 H100"` (without battery). The Y-coordinate (50 vs 56) depends on whether other nodes are present (battery, solar). The CSS in `src/style.ts` uses hardcoded pixel offsets like `bottom: 100px`, `height: 156px`, `left: calc(var(--size-circle-entity) + 2%)` with multiple `--lines-svg-*` custom properties.

Adding `grid_main` to the left of `grid_house` and `heatpump` below `grid_house` means:
- The grid circle must shift right (or a new column added to the left).
- New flow lines are needed: `grid_main` <-> `grid_house` (bidirectional), `grid_house` -> `heatpump`, `grid_main` -> `heatpump`.
- Existing flow line coordinates (grid-to-home path) must change because the grid position shifts.
- The `.row` flexbox layout has 3 columns (left node / spacer / right node). Adding `grid_main` to the left of `grid_house` requires either a 4th column or absolute positioning.

**Why it happens:**
The SVG layout was built for a fixed topology (solar top, grid left, home right, battery bottom). The coordinates are hardcoded rather than computed from element positions. Any positional change cascades through multiple files.

**How to avoid:**
- Map out the new grid layout on paper first: which `.row` contains which nodes, how many columns each row needs.
- Consider rendering `grid_main` and `grid_house` as a single "grid section" container with internal layout, rather than as two fully independent circle-containers in the row.
- New flow lines should follow the existing pattern files in `src/components/flows/`. Create separate files: `flowGridMainToGridHouse.ts`, `flowGridHouseToHeatpump.ts`, `flowGridMainToHeatpump.ts`.
- Test the layout at multiple card widths. The existing code has a `420px` breakpoint (`isCardWideEnough` in `src/style/all.ts:207`). The new layout with more nodes will be wider and may need a wider minimum.
- Do NOT modify existing flow line coordinates until the new node positions are finalized.

**Warning signs:**
- Flow lines visually disconnected from circles (endpoints don't touch the circle borders).
- Layout breaks when specific nodes are hidden (e.g., no battery, no solar) because conditional Y-coordinates change.
- Right-to-left (`:dir(rtl)`) layout is broken because it has separate CSS rules.

**Phase to address:**
Phase 3 (SVG layout). Should be preceded by a design phase that produces exact coordinate specifications.

---

### Pitfall 6: Migration runs in `setConfig` but `setConfig` is called on every editor change, creating an infinite loop

**What goes wrong:**
The card's `setConfig` is called every time the editor fires `config-changed`. If the migration function transforms `entities.grid` (flat) into `entities.grid.house` (nested) and writes back via `config-changed`, the editor receives the migrated config and fires another `config-changed`. If the migration is not idempotent (i.e., it transforms already-migrated config again), this creates an infinite loop. Even if idempotent, if migration produces a new object reference each time, Lit's change detection triggers re-renders indefinitely.

**Why it happens:**
The existing `setConfig` in `src/power-flow-card-plus.ts:73-95` modifies the config object (spreads and overrides values). If migration also creates a new object, and the editor stores this and fires `config-changed` again, the cycle repeats. Lit components re-render when `@state()` properties change, and `this._config = { ...config, ... }` always produces a new reference.

**How to avoid:**
1. Make migration **idempotent**: if config is already in the new format, return the SAME object reference (not a spread copy).
2. Add a guard: `if (config.entities.grid && 'house' in config.entities.grid) return config;` -- skip migration if already nested.
3. Migration should run once and early. Both the card and editor `setConfig` should call the same migration function, and the editor should NOT fire `config-changed` for migration (it should only apply migration internally for rendering).
4. Consider a config version field (`_config_version: 2`) to make migration detection explicit rather than relying on shape sniffing.

**Warning signs:**
- Browser tab freezes when opening the card or editor (infinite render loop).
- Console shows hundreds of `config-changed` events per second.
- `setConfig` called thousands of times (add a `console.count("setConfig")` during development).

**Phase to address:**
Phase 1 (Config migration). Must be tested with both old and new config formats before any editor work.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `optional(any())` for all entity sub-keys in superstruct | Avoids struct breakage when adding new entity config fields | No editor-side validation; malformed configs pass silently | During this milestone (tighten later once config shape stabilizes) |
| Hardcoded SVG coordinates for flow lines | Quick to implement, pixel-perfect control | Every new node or layout change requires manual coordinate recalculation across multiple files | During this milestone. Refactor to computed coordinates in a future milestone if more Messkonzept variants are added |
| Duplicating grid component/schema for `grid_house` vs `grid_main` | Avoids premature abstraction; each grid meter can diverge | Two copies of similar code to maintain | Acceptable if the two grids meaningfully diverge (different secondary info, different color schemes). Extract shared parts only if they stay identical after the feature stabilizes |
| Putting migration in `setConfig` instead of a separate preprocessing step | Minimal code change to existing architecture | Migration runs on every render cycle, migration logic mixed with config normalization | Never -- extract migration to a standalone function called once |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `ha-form` nested objects | Passing `data.entities.grid` to `ha-form` when form schema expects `grid.house` sub-object: `ha-form` does not auto-navigate nested paths | Either flatten the data before passing to `ha-form` (use `data.entities.grid.house` directly), or use a form schema that matches the full nested shape |
| `fireEvent(this, "config-changed", { config })` | Firing config-changed with a partially migrated config that still has old keys AND new keys | Always produce a clean config with only one format (old or new). Remove old keys after migration: delete `config.entities.grid.entity` if it has been moved to `config.entities.grid.house.entity` |
| `getEntityStateWatts` for heatpump | Using the same consumption/production pattern (positive/negative) for heatpump even though heatpump is always consumption-only | Heatpump should use a simpler state accessor that always returns a positive value (consumption), not the `getFieldOutState`/`getFieldInState` pattern designed for bidirectional entities |
| `localize()` for editor labels | Forgetting to add translation keys for new editor pages (`editor.grid_house`, `editor.grid_main`, `editor.heatpump`) | Add all localization keys in the same commit as the editor page. Check `src/localize/` for the translation file structure |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Migration running on every `render()` call | Sluggish card updates, high CPU in devtools profiler | Make migration idempotent and cache the result; only re-migrate when `config` reference changes | Immediately noticeable with fast-updating entities (1s polling) |
| Additional SVG flow lines causing layout reflows | Janky animation on lower-end devices (HA companion app on tablets) | Use `will-change: transform` on new SVG containers; minimize DOM nodes by hiding unused flow lines with `display: none` rather than conditional rendering that adds/removes DOM | Noticeable with 6+ animated flow lines on mobile |
| `allDynamicStyles` setting CSS properties for every node on every render | Style recalculation cost grows linearly with node count | Group style updates; only set properties that actually changed | With 8+ nodes and fast entity updates, each render triggers ~50 `style.setProperty` calls |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing `grid_main` and `grid_house` with identical default names ("Grid") | User cannot distinguish between the two meters | Default name for `grid_main` should be "Grid Main" / "Hauptzahler" and `grid_house` should be "Grid House" / "Hauszahler". Use distinct default icons (`mdi:transmission-tower` vs `mdi:meter-electric`) |
| Deprecation warning only in console.log | Users never open browser console; they will not see the migration warning | Also show a persistent `ha-alert` warning banner in the card itself (like the existing power outage alert), and show a migration prompt in the visual editor |
| Heatpump node visible even when not configured | Breaks the clean layout for users who do not have Messkonzept 8 | Heatpump node, flow lines, and editor page should only render when `entities.heatpump` is configured. Same conditional pattern as `battery.has` in existing code |
| Editor shows grid_house/grid_main pages even for users with flat grid config | Confuses users who do not need dual-meter setup | Show a single "Grid" page by default. Only show split grid_house/grid_main pages after the user enables dual-meter mode (or after auto-migration) |

## "Looks Done But Isn't" Checklist

- [ ] **Config migration:** Test with config that has ONLY `entities.grid.entity` (string form), ONLY `entities.grid.entity.consumption`/`.production` (ComboEntity form), and already-nested `entities.grid.house` form. All three must work.
- [ ] **Energy balance:** Verify that `solar.total + grid_main.fromGrid = home.consumption + heatpump.consumption + battery.toBattery + grid_main.toGrid` for at least 5 different power distribution scenarios (all solar to home, all solar to grid, battery charging, battery discharging, zero solar).
- [ ] **Editor round-trip:** Open editor, change one heatpump field, save, re-open editor. Verify NO other config fields were lost or changed. Especially check that `grid.house` and `grid.main` sub-configs survive.
- [ ] **Display zero lines:** Verify all new flow lines (grid_main-grid_house, grid_house-heatpump, grid_main-heatpump) respect the `display_zero_lines` mode setting in all 5 modes (show, grey_out, transparency, hide, custom).
- [ ] **Power outage:** When `grid.power_outage` is active, verify heatpump shows 0W and its flow lines are hidden. Decide which grid node owns the power outage detection (likely `grid_main` since it is the grid connection).
- [ ] **Tap actions:** Verify tap_action works for all new elements: grid_main circle, grid_house circle, heatpump circle, and all new flow lines.
- [ ] **RTL layout:** Verify right-to-left layout still works with the new nodes. The existing CSS has `:dir(rtl)` rules.
- [ ] **No heatpump config:** When `entities.heatpump` is undefined, verify the card renders identically to the current v0.2.6 release. Pixel-comparison test recommended.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Superstruct strips heatpump config | LOW | Add `heatpump: optional(any())` to `cardConfigStruct`. All user configs stored in HA dashboard YAML are unaffected; only the in-memory validated config loses the key. |
| Energy balance double-counting | MEDIUM | Requires re-deriving the balance equations and updating `power-flow-card-plus.ts` render method. No config change needed, but may require state resolution changes in `src/states/raw/grid.ts`. |
| Editor infinite loop from migration | HIGH | Users cannot open the editor at all. Recovery requires a hotfix release. Prevent by testing migration idempotency in CI before merge. |
| SVG layout broken after node addition | MEDIUM | Requires adjusting hardcoded coordinates in flow files and CSS custom properties. Tedious but localized. Can be fixed without config changes. |
| Config migration creates invalid state | HIGH | Users with old config see broken cards. Must ship a patch release with corrected migration. Prevent by testing migration with snapshot tests against real-world config samples. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| EntityType / ConfigEntities mismatch | Phase 1: Config types | `pnpm typecheck` passes with new entity types; unit test indexing `config.entities["heatpump"]` returns expected shape |
| Superstruct strips new keys | Phase 1: Config types | Unit test: `assert(configWithHeatpump, cardConfigStruct)` does not throw and preserves the key |
| Energy balance double-counting | Phase 2: State resolution | Unit tests with known power values verify closed-system equation. Manual test with HA demo entities |
| Editor _valueChanged flattens nested keys | Phase 3: Editor extension | Integration test: change grid_house field in editor, verify `config.entities.grid.house` is set (not `config.entities.grid_house`) |
| SVG flow line coordinates broken | Phase 3: SVG layout | Visual regression test (screenshot comparison) at multiple card widths (300px, 420px, 600px) |
| Migration infinite loop | Phase 1: Config migration | Unit test: call `setConfig(migratedConfig)` twice, verify no re-migration. Integration test: open editor with old config, verify no console flood |

## Sources

- Direct codebase analysis of `power-flow-card-plus` v0.2.6 (commit `0fcd3d2`)
- `src/power-flow-card-plus.ts` -- card `setConfig` and `render` method with energy balance logic
- `src/ui-editor/ui-editor.ts` -- editor `setConfig` with `assert(config, cardConfigStruct)` and `_valueChanged` handler
- `src/ui-editor/schema/_schema-all.ts` -- superstruct `cardConfigStruct` and entity schema definitions
- `src/states/raw/base.ts` -- `getFieldInState`/`getFieldOutState` using `EntityType` to index `config.entities`
- `src/type.ts` -- `EntityType` union, `GridObject` type with state shape
- `src/power-flow-card-plus-config.ts` -- `ConfigEntities` type and `Grid` interface
- `src/components/flows/gridToHome.ts` -- hardcoded SVG path coordinates and conditional layout logic
- `src/style.ts` -- CSS custom properties for line positioning with hardcoded pixel values

---
*Pitfalls research for: power-flow-card-plus Messkonzept 8 extension*
*Researched: 2026-03-02*

# Phase 1: Type Foundation and Config Migration - Research

**Researched:** 2026-03-02
**Domain:** TypeScript types, superstruct validation, config migration — power-flow-card-plus v0.2.6
**Confidence:** HIGH (primary source: direct codebase analysis)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Heatpump YAML field naming:**
- `entities.heatpump.entity` — main power consumption sensor (string only, not ComboEntity — heatpumps are consume-only)
- `entities.heatpump.cop` — COP ratio sensor entity (follows `battery.state_of_charge` naming convention, not `cop_entity`)
- `entities.heatpump.flow_from_grid_house` — entity for house meter → heatpump animated flow
- `entities.heatpump.flow_from_grid_main` — entity for main meter → heatpump animated flow
- All sub-fields are optional (heatpump node renders with whatever is configured)

**Superstruct validation depth:**
- Make `entities.grid` strict: `object({ house: optional(gridShape), main: optional(gridShape) })`
- Make `entities.heatpump` strict: `object({ entity: optional(string()), cop: optional(string()), flow_from_grid_house: optional(string()), flow_from_grid_main: optional(string()) })`
- Migration runs before superstruct validation in `setConfig()` — so superstruct always sees the migrated (nested) shape
- This means superstruct can be fully strict without needing to handle the legacy flat format

**Deprecation warning message:**
- `console.warn("[power-flow-card-plus] entities.grid has been migrated to entities.grid.house automatically. Update your config to suppress this warning.")`
- Fires once per `setConfig()` call when flat `entities.grid` (with `.entity` field at top level) is detected

**Migration placement:**
- Standalone `src/utils/migrate-config.ts` — pure function, independently testable, not coupled to the LitElement
- Signature: `migrateConfig(raw: unknown): PowerFlowCardPlusConfig`
- Migration idempotency: if `entities.grid.house` already exists (or `entities.grid` is undefined), skip migration
- Migration detection: flat format identified by presence of `entities.grid.entity` (string or ComboEntity) at top level of the grid object

### Claude's Discretion

- Where to add `heatpump` to `ConfigEntities` type (alongside battery, grid, solar, home, etc.)
- Whether `Grid` (the existing interface) stays as-is or gets renamed to `GridEntity` for clarity
- Test file structure: `__tests__/migrate-config.test.ts` for migration unit tests
- Whether to use a discriminated union or simple optional-field approach for the nested grid type

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONF-01 | `entities.grid` accepts nested `house:` and `main:` sub-keys (both optional) | Type change: `ConfigEntities.grid` becomes `GridEntities \| Grid`; superstruct `object({ house: optional(...), main: optional(...) })` |
| CONF-02 | Flat `entities.grid` silently auto-migrates to `entities.grid.house` at runtime | `migrateConfig()` pure function, called in `setConfig()` before `this._config` assignment; detection via `'entity' in grid` check |
| CONF-03 | Deprecation warning logged to console when flat grid config is detected | `console.warn("[power-flow-card-plus] ...")` inside migration path in `migrateConfig()` |
| CONF-04 | `entities.heatpump` added as new top-level entity key with entity, cop, flow_from_grid_house, flow_from_grid_main fields | New `HeatpumpEntity` interface; add to `ConfigEntities`; add to `cardConfigStruct` as `heatpump: optional(object({...}))` |
| CONF-05 | `CardConfigStruct` (superstruct) updated to validate new nested config shape — migration runs before validation in `setConfig()` | Update `cardConfigStruct.entities` in `_schema-all.ts`; update editor `setConfig()` to call `migrateConfig()` before `assert()` |
</phase_requirements>

---

## Summary

Phase 1 is a pure-TypeScript change with no visual impact. It has three atomic sub-tasks that must land together: (1) update TypeScript types in `power-flow-card-plus-config.ts`, (2) write and test `src/utils/migrate-config.ts`, and (3) update the superstruct `cardConfigStruct` in `src/ui-editor/schema/_schema-all.ts`. All three are prerequisites for every downstream phase.

The critical ordering constraint is: **migration must run before superstruct validation in both `setConfig()` locations** — the card (`src/power-flow-card-plus.ts`) and the editor (`src/ui-editor/ui-editor.ts`). Currently the editor calls `assert(config, cardConfigStruct)` as its very first line without any migration. This must change.

The existing test infrastructure is Jest 29 + Babel (TypeScript transpiled, not ts-jest). There is exactly one test file (`__tests__/i18n.test.ts`). Migration logic is a pure function with no DOM or HA dependencies, making it straightforward to unit-test with the existing setup.

**Primary recommendation:** Write and test `migrateConfig()` first, then update types and superstruct in parallel commits, then wire migration into both `setConfig()` calls in a single final commit.

---

## Standard Stack

### Core (Already In Use — Do Not Change)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| TypeScript | ^4.9.5 (installed 4.9.5) | Type checking | `pnpm typecheck` runs `tsc --noEmit` |
| superstruct | ^1.0.3 (installed 1.0.4) | Config validation | `assert()`, `object()`, `optional()`, `string()` |
| Jest | ^29.7.0 | Unit tests | `pnpm test` runs `jest` |
| Babel | `@babel/preset-typescript` | TS transpilation for Jest | No ts-jest — Babel strips types, does NOT type-check in tests |

### No New Dependencies

All Phase 1 work uses existing dependencies. No `npm install` needed.

### superstruct 1.0.4 API Confirmation

Functions already imported in `_schema-all.ts`: `any, assign, boolean, integer, number, object, optional, string`.

For Phase 1 we need: `object()`, `optional()`, `string()` — all already imported.

Note: superstruct `object()` strips unknown keys by default (called "mask" behavior). This is the exact bug we're fixing for heatpump — adding `heatpump: optional(object({...}))` to `cardConfigStruct` prevents stripping.

---

## Architecture Patterns

### Existing File Locations (Authoritative)

```
src/
├── power-flow-card-plus-config.ts   # ConfigEntities, Grid, Battery, etc. — UPDATE HERE
├── type.ts                           # BaseConfigEntity, EntityType — UPDATE EntityType
├── power-flow-card-plus.ts          # Card setConfig() — WIRE migrateConfig() HERE
├── ui-editor/
│   ├── ui-editor.ts                  # Editor setConfig() — WIRE migrateConfig() HERE
│   ├── types/config-page.ts          # ConfigPage = keyof ConfigEntities | "advanced" | null
│   └── schema/
│       └── _schema-all.ts            # cardConfigStruct — UPDATE entities object
└── utils/
    ├── (existing utils)
    └── migrate-config.ts             # NEW FILE — pure migration function

__tests__/
├── i18n.test.ts                      # Existing (untouched)
└── migrate-config.test.ts            # NEW FILE — migration unit tests
```

### Pattern 1: ConfigEntities Extension

**What:** Add `HeatpumpEntity` interface and `GridEntities` nested type alongside existing `Battery`, `Grid`, `Solar` etc. in `power-flow-card-plus-config.ts`. Update `ConfigEntities` to use new types.

**Key decision (Claude's discretion):** Use simple optional-field approach for nested grid. A discriminated union adds no value here since migration ensures superstruct always sees the nested shape.

```typescript
// Source: src/power-flow-card-plus-config.ts (current pattern observed)

// NEW: nested grid container type
interface GridEntities {
  house?: Grid;  // existing Grid interface reused as-is
  main?: Grid;   // same Grid interface
}

// NEW: heatpump type (string-only entity, consume-only)
interface HeatpumpEntity {
  entity?: string;              // NOT ComboEntity — heatpumps are consume-only
  cop?: string;                 // COP sensor entity (follows battery.state_of_charge convention)
  flow_from_grid_house?: string; // entity for house meter → heatpump animated flow
  flow_from_grid_main?: string;  // entity for main meter → heatpump animated flow
}

// UPDATED ConfigEntities:
export type ConfigEntities = {
  battery?: Battery;
  grid?: GridEntities;           // was: Grid — now nested-only (migration ensures this)
  solar?: Solar;
  home?: Home;
  fossil_fuel_percentage?: FossilFuelPercentage;
  individual?: IndividualField;
  heatpump?: HeatpumpEntity;     // NEW
};
```

**Impact on EntityType:** `EntityType` in `src/type.ts` currently = `"battery" | "grid" | "solar" | "individual1" | "individual2" | "home" | "fossil_fuel_percentage"`. Add `"heatpump"` to this union in Phase 1. Do NOT add `"grid_house"` or `"grid_main"` to `EntityType` — those are Phase 2 concerns (state resolution). The existing `getFieldInState(hass, config, "grid")` callers in Phase 2 will need updating anyway since `ConfigEntities.grid` no longer has `.entity` directly.

### Pattern 2: Migration Pure Function

**What:** `src/utils/migrate-config.ts` exports a single pure function called by both setConfig locations.

```typescript
// Source: Decision from CONTEXT.md + codebase analysis of setConfig() in power-flow-card-plus.ts

export function migrateConfig(raw: unknown): PowerFlowCardPlusConfig {
  // Cast to working type (raw is unknown from YAML parser)
  const config = raw as PowerFlowCardPlusConfig;

  // Check if grid is in flat format: presence of 'entity' at top-level of grid object
  // signals the pre-MK8 format. 'entity' can be a string or ComboEntity.
  const grid = config?.entities?.grid as any;
  if (grid !== undefined && 'entity' in grid) {
    // Flat format detected — migrate to nested
    console.warn(
      "[power-flow-card-plus] entities.grid has been migrated to entities.grid.house automatically. " +
      "Update your config to suppress this warning."
    );
    return {
      ...config,
      entities: {
        ...config.entities,
        grid: {
          house: grid,  // entire flat grid object becomes 'house'
        },
      },
    } as PowerFlowCardPlusConfig;
  }

  // Already nested (or no grid) — return same reference for idempotency
  return config;
}
```

**Idempotency guarantee:** If `entities.grid` has no `entity` key at top level (i.e., it's already `{ house: {...} }` or `{ main: {...} }`), the guard `'entity' in grid` is false and the function returns the original config reference unchanged. Calling it twice on already-migrated config produces the same object reference.

**Signature:** `migrateConfig(raw: unknown): PowerFlowCardPlusConfig` — accepts `unknown` because YAML config is untyped when received from HA.

### Pattern 3: superstruct Struct Update

**What:** Update `cardConfigStruct` in `src/ui-editor/schema/_schema-all.ts` to use strict schemas for `grid` and `heatpump`. Because migration runs BEFORE `assert()`, superstruct will only ever see the nested shape.

```typescript
// Source: src/ui-editor/schema/_schema-all.ts (current file analyzed)
// Current: grid: optional(any())
// New: strict nested object

// Define the grid entity shape (mirrors existing Grid interface fields)
// Keep this as optional(any()) for nested sub-fields since Grid itself has many
// optional fields that would require a very long struct definition:
const gridEntityShape = optional(any());  // OR define fully strict shape

// Locked decision from CONTEXT.md — use strict objects:
entities: object({
  battery: optional(any()),
  grid: optional(object({
    house: optional(any()),   // gridShape — any() preserves flexibility for Grid's many fields
    main: optional(any()),
  })),
  solar: optional(any()),
  home: optional(any()),
  fossil_fuel_percentage: optional(any()),
  individual: optional(any()),
  heatpump: optional(object({
    entity: optional(string()),
    cop: optional(string()),
    flow_from_grid_house: optional(string()),
    flow_from_grid_main: optional(string()),
  })),
}),
```

**Note:** The locked decision says "make entities.grid strict: `object({ house: optional(gridShape), main: optional(gridShape) })`". The `gridShape` itself — whether it's `any()` or a full struct — is an implementation detail. Using `any()` for `gridShape` is acceptable (and consistent with all other entities using `any()`) and avoids duplicating all of `Grid`'s interface fields into superstruct.

### Pattern 4: Wire Migration into setConfig() Calls

**Card setConfig (src/power-flow-card-plus.ts line 73):**

```typescript
// BEFORE (current):
setConfig(config: PowerFlowCardPlusConfig): void {
  if ((config.entities as any).individual1 || ...) { ... }
  ...
  this._config = { ...config, ... };
}

// AFTER:
setConfig(rawConfig: unknown): void {
  const config = migrateConfig(rawConfig);  // migration first
  if ((config.entities as any).individual1 || ...) { ... }
  ...
  this._config = { ...config, ... };
}
```

**Editor setConfig (src/ui-editor/ui-editor.ts line 72):**

```typescript
// BEFORE (current):
public async setConfig(config: PowerFlowCardPlusConfig): Promise<void> {
  assert(config, cardConfigStruct);  // assert FIRST — BUG: fails on old flat config
  this._config = config;
}

// AFTER:
public async setConfig(rawConfig: unknown): Promise<void> {
  const config = migrateConfig(rawConfig);  // migration BEFORE assert
  assert(config, cardConfigStruct);
  this._config = config;
}
```

### Anti-Patterns to Avoid

- **Calling migrateConfig after assert in editor setConfig:** assert will reject old flat grid config if the struct is now strict for `grid`. Migration must come first.
- **Mutating the config object in migrateConfig:** Return a new spread object OR the original reference. Never mutate in place (breaks idempotency detection via reference equality).
- **Tightening gridShape to a full struct:** The `Grid` interface has ~10 optional fields. Writing all as superstruct validators duplicates the TypeScript interface and breaks easily. Use `optional(any())` for the `house`/`main` sub-values.
- **Adding grid_house/grid_main to EntityType in Phase 1:** Phase 2 handles state resolution. Adding them now without accessor functions will cause TypeScript errors in `base.ts`.
- **Changing ConfigEntities.grid to `Grid | GridEntities` union:** A union approach means TypeScript code accessing `config.entities.grid.house` needs a type narrowing guard everywhere. Since migration ensures only nested shape reaches downstream code, simply replacing `Grid` with `GridEntities` (the nested type) is cleaner.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config object validation | Custom validator with if-checks | superstruct `object()`, `optional()`, `string()` | Already in project, handles unknown keys correctly |
| TypeScript type narrowing for Grid union | Manual `if ('entity' in grid)` in every consumer | Perform migration once in `setConfig()` so all consumers get `GridEntities` | Single migration point; no guards needed downstream |
| Test framework | Jest setup from scratch | Existing Jest 29 + babel.config.js | Already works for `i18n.test.ts` — no config changes needed |

**Key insight:** The existing `optional(any())` pattern is intentional in this codebase — it allows the config to evolve without updating the struct for every field. The Phase 1 task is to add structure at the *container level* (`grid` must be `{ house?, main? }`) while leaving the entity-level validation as `any()`.

---

## Common Pitfalls

### Pitfall 1: Editor setConfig asserts before migration (CRITICAL)

**What goes wrong:** The editor's `setConfig` currently calls `assert(config, cardConfigStruct)` as its FIRST line (line 73 of `ui-editor.ts`). If the struct now expects `grid: object({ house:..., main:... })` but the user's YAML has the old flat `grid: { entity: "sensor.foo" }`, the assert throws and the editor crashes for all users with legacy configs.

**Why it happens:** Migration only exists in the card's `setConfig`, not the editor's. The two paths are separate.

**How to avoid:** Add `const config = migrateConfig(rawConfig)` BEFORE `assert(config, cardConfigStruct)` in the editor `setConfig`. Make the editor `setConfig` accept `unknown` parameter type (same as card's change).

**Warning signs:** Editor throws "Assertion failed" when opening with old config. Card works but editor is broken.

### Pitfall 2: Migration infinite loop via editor config-changed

**What goes wrong:** If migration produces a new object reference every call (even when input is already migrated), the editor's `setConfig` is called -> migration runs -> produces new object -> editor fires `config-changed` -> `setConfig` called again -> loop.

**Why it happens:** The `{ ...config, entities: { ...config.entities, grid: {...} } }` spread always creates a new object reference. If the migration check fires on already-migrated config (e.g., the guard `'entity' in grid` accidentally passes on `{ house: {...} }`), the loop starts.

**How to avoid:** The guard `'entity' in grid` is safe because nested GridEntities `{ house?: Grid, main?: Grid }` do NOT have an `entity` key at the top level. Verify this: `{ house: { entity: "sensor.foo" } }` — the top-level grid object has `house` key, not `entity` key. The guard correctly returns false and returns the original reference.

**Test to add:** Call `migrateConfig(migrateConfig(flatConfig))` and assert the result equals `migrateConfig(flatConfig)` by deep equality AND by reference equality (same object returned on 2nd call).

### Pitfall 3: TypeScript noUnusedParameters breaks setConfig signature change

**What goes wrong:** Changing `setConfig(config: PowerFlowCardPlusConfig)` to `setConfig(rawConfig: unknown)` with `tsconfig.json` having `"noUnusedParameters": true` — if any code inside `setConfig` still references `config` by the old name before renaming, TypeScript errors.

**Why it happens:** `tsconfig.json` has `"noUnusedParameters": true`. Renaming a parameter but not all its usages inside the function body causes "parameter declared but never used" errors on the OLD name.

**How to avoid:** Rename consistently: `rawConfig` as input, `config` as the migrated result variable inside the function. The existing body of `setConfig` uses `config` throughout — just reassign: `const config = migrateConfig(rawConfig)` and keep all internal references as `config`.

### Pitfall 4: Jest/Babel strips types — migration must be testable without real HA types

**What goes wrong:** The existing test uses `@jest/globals` (Jest 29). Babel is the transpiler (not ts-jest), so TypeScript type errors are NOT caught during `pnpm test`. Only `pnpm typecheck` catches them. Test code that imports from HA-specific packages (like `custom-card-helpers`) may fail because those packages have ESM-only exports.

**Why it happens:** `babel.config.js` uses `@babel/preset-env` with `targets: { node: 'current' }` and `@babel/preset-typescript`. Babel strips types but does not type-check. The `i18n.test.ts` works because it only imports JSON files.

**How to avoid:** The `migrate-config.ts` pure function should have no imports from `custom-card-helpers`, `lit`, or `home-assistant-js-websocket`. It should only import from `./power-flow-card-plus-config` (the type file). Types are stripped by Babel, so the test only needs the JS logic to work — type imports are fine.

**Test the pure JS logic:** Pass a plain object literal `{ entities: { grid: { entity: "sensor.foo" } } }` to `migrateConfig()` and assert the output shape. No HA environment needed.

### Pitfall 5: Superstruct strips heatpump config (existing behavior without fix)

**What goes wrong:** The current `cardConfigStruct.entities` does NOT include `heatpump`. Superstruct's `object()` strips unknown keys. Any config with `entities.heatpump` will have that key silently deleted when the editor validates it.

**Why it happens:** Superstruct `object()` is designed to strip unrecognized keys (safe default). The current code uses `optional(any())` for known entities, but does not list `heatpump`.

**How to avoid:** Add `heatpump: optional(object({ entity: optional(string()), cop: optional(string()), flow_from_grid_house: optional(string()), flow_from_grid_main: optional(string()) }))` to the `entities` object in `cardConfigStruct`. This is CONF-04/CONF-05.

**Warning sign:** Open editor with a config that has `entities.heatpump`, save, and inspect the fired `config-changed` event. The `heatpump` key is missing from the config payload.

---

## Code Examples

### migrate-config.ts Full Implementation Pattern

```typescript
// File: src/utils/migrate-config.ts
// Source: Decision from CONTEXT.md + analysis of power-flow-card-plus.ts setConfig()

import type { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";

/**
 * Migrates legacy flat entities.grid config to the nested MK8 format.
 * Safe to call multiple times (idempotent).
 * Returns the same object reference if no migration was needed.
 */
export function migrateConfig(raw: unknown): PowerFlowCardPlusConfig {
  const config = raw as PowerFlowCardPlusConfig;

  const grid = (config?.entities?.grid) as Record<string, unknown> | undefined;

  // Flat format: top-level 'entity' key on the grid object
  // Nested format: only 'house' and/or 'main' keys (no 'entity' at top level)
  if (grid !== undefined && 'entity' in grid) {
    console.warn(
      "[power-flow-card-plus] entities.grid has been migrated to entities.grid.house automatically. " +
      "Update your config to suppress this warning."
    );
    return {
      ...config,
      entities: {
        ...config.entities,
        grid: {
          house: grid as any,
        },
      },
    } as PowerFlowCardPlusConfig;
  }

  // Already nested or no grid configured — return original reference (idempotent)
  return config;
}
```

### cardConfigStruct entities update

```typescript
// File: src/ui-editor/schema/_schema-all.ts
// Source: Direct analysis of existing _schema-all.ts + CONTEXT.md locked decisions

entities: object({
  battery: optional(any()),
  grid: optional(object({
    house: optional(any()),
    main: optional(any()),
  })),
  solar: optional(any()),
  home: optional(any()),
  fossil_fuel_percentage: optional(any()),
  individual: optional(any()),
  heatpump: optional(object({
    entity: optional(string()),
    cop: optional(string()),
    flow_from_grid_house: optional(string()),
    flow_from_grid_main: optional(string()),
  })),
}),
```

### Migration unit test pattern

```typescript
// File: __tests__/migrate-config.test.ts
// Source: Existing __tests__/i18n.test.ts as pattern; jest.config.ts for test discovery

import { describe, expect, test } from "@jest/globals";
import { migrateConfig } from "../src/utils/migrate-config";

describe("migrateConfig", () => {
  test("migrates flat string entity to grid.house", () => {
    const flat = { entities: { grid: { entity: "sensor.grid" } } };
    const result = migrateConfig(flat);
    expect(result.entities.grid).toEqual({ house: { entity: "sensor.grid" } });
  });

  test("migrates flat ComboEntity to grid.house", () => {
    const flat = { entities: { grid: { entity: { consumption: "sensor.a", production: "sensor.b" } } } };
    const result = migrateConfig(flat);
    expect((result.entities.grid as any).house.entity).toEqual({ consumption: "sensor.a", production: "sensor.b" });
  });

  test("does not migrate already-nested config", () => {
    const nested = { entities: { grid: { house: { entity: "sensor.grid" } } } };
    const result = migrateConfig(nested);
    expect(result).toBe(nested);  // same reference — idempotent
  });

  test("idempotent: migrating twice returns same object as migrating once", () => {
    const flat = { entities: { grid: { entity: "sensor.grid" } } };
    const once = migrateConfig(flat);
    const twice = migrateConfig(once);
    expect(twice).toBe(once);  // second call returns same reference
  });

  test("passes through config with no grid entity", () => {
    const config = { entities: { solar: { entity: "sensor.solar" } } };
    const result = migrateConfig(config);
    expect(result).toBe(config);
  });

  test("emits deprecation warning on flat config", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    migrateConfig({ entities: { grid: { entity: "sensor.grid" } } });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[power-flow-card-plus]"));
    warnSpy.mockRestore();
  });

  test("does NOT emit warning on nested config", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    migrateConfig({ entities: { grid: { house: { entity: "sensor.grid" } } } });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test("heatpump config is preserved untouched", () => {
    const config = {
      entities: {
        grid: { house: { entity: "sensor.grid" } },
        heatpump: { entity: "sensor.hp", cop: "sensor.cop" },
      },
    };
    const result = migrateConfig(config);
    expect((result.entities as any).heatpump).toEqual({ entity: "sensor.hp", cop: "sensor.cop" });
  });
});
```

### HeatpumpEntity type definition

```typescript
// File: src/power-flow-card-plus-config.ts
// Source: CONTEXT.md locked decisions

interface HeatpumpEntity {
  entity?: string;               // string only (not ComboEntity) — heatpumps are consume-only
  cop?: string;                  // COP ratio sensor entity (follows battery.state_of_charge naming)
  flow_from_grid_house?: string; // entity for house meter → heatpump animated flow
  flow_from_grid_main?: string;  // entity for main meter → heatpump animated flow
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat `entities.grid.entity` | Nested `entities.grid.house` + `entities.grid.main` | Phase 1 (this phase) | All code that reads `config.entities.grid.entity` will break after Phase 1 — Phase 2 must update state accessors |
| `ConfigEntities.grid?: Grid` | `ConfigEntities.grid?: GridEntities` | Phase 1 (this phase) | TypeScript will flag all direct `.entity` accesses on `config.entities.grid` — good: forces Phase 2 to update them |
| superstruct strips unknown entity keys | superstruct preserves `heatpump` and validates grid shape | Phase 1 (this phase) | Editor round-trip is now safe for heatpump config |

**Existing technical debt to be aware of:**
- `EntityType` in `src/type.ts` is a manual string union, not derived from `keyof ConfigEntities`. After adding `heatpump` to `ConfigEntities`, `EntityType` must also be updated manually. There is no compile-time linkage. (Documented in project PITFALLS.md — Phase 1 concern.)
- `tsconfig.json` has `"noImplicitAny": false` — means some type errors are not caught. Rely on explicit types in new code.

---

## Open Questions

1. **GridEntities vs Grid union type for ConfigEntities.grid**
   - What we know: CONTEXT.md says migration ensures superstruct always sees the nested shape. The locked decision makes superstruct strict for `{ house?, main? }` only.
   - What's unclear: Should `ConfigEntities.grid` be typed as `GridEntities` (nested only, migration ensures this) or `Grid | GridEntities` (union for documentation of both shapes)?
   - Recommendation: Use `GridEntities` only (no union). Since migration runs before any TypeScript code uses the config, the type correctly reflects what downstream code will see. A union type would require type guards everywhere.

2. **Existing `getGridConsumptionState` / `getGridProductionState` will break after this phase**
   - What we know: These call `getFieldInState(hass, config, "grid")` which reads `config.entities.grid?.entity`. After Phase 1, `config.entities.grid` is `GridEntities = { house?: Grid, main?: Grid }` — no `.entity` at the top level.
   - What's unclear: Should Phase 1 also update the grid state accessors (creating a Phase 2 gap)?
   - Recommendation: Phase 1 DOES NOT update grid state accessors. Accept that `getGridConsumptionState` will be broken by the type change (TypeScript will error). Phase 2 is explicitly responsible for fixing state resolution. The Phase 1 planner should NOT include state accessor changes in scope. The `pnpm typecheck` failure on the grid state accessors is expected and acceptable at end of Phase 1 IF AND ONLY IF the success criteria say "all tests green" means the migration tests pass and typecheck covers only the new code. Check: the CONTEXT success criteria says `pnpm typecheck && pnpm test` must pass — this means the grid state accessors MUST also typecheck. Phase 1 may need to temporarily cast `config.entities.grid as any` in the accessor callsites, or Phase 1 scope must include updating the accessors to use `.house?.entity` as the primary fallback.

   **This is the most important open question for the planner.** One resolution: Phase 1 updates `getGridConsumptionState` and `getGridProductionState` to read from `config.entities.grid?.house?.entity` as a temporary fallback, preserving existing behavior for non-MK8 users. Phase 2 then adds the `grid_main` state resolution on top.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `power-flow-card-plus` v0.2.6 — all key files read and cross-referenced
  - `src/power-flow-card-plus-config.ts` — ConfigEntities, Grid, Battery interfaces
  - `src/type.ts` — BaseConfigEntity, EntityType union
  - `src/power-flow-card-plus.ts` — card setConfig() implementation (lines 73-95)
  - `src/ui-editor/ui-editor.ts` — editor setConfig() with assert() at line 73
  - `src/ui-editor/schema/_schema-all.ts` — cardConfigStruct with entities object
  - `src/ui-editor/types/config-page.ts` — ConfigPage = keyof ConfigEntities | "advanced" | null
  - `src/states/raw/base.ts` — getFieldInState/getFieldOutState using EntityType
  - `__tests__/i18n.test.ts` — existing test pattern
  - `jest.config.ts` + `babel.config.js` — test infrastructure
  - `package.json` + `pnpm-lock.yaml` — exact dependency versions
  - `tsconfig.json` — compiler options (noUnusedParameters: true, noImplicitAny: false, strict: true)
- `.planning/phases/01-type-foundation-and-config-migration/01-CONTEXT.md` — locked decisions
- `.planning/research/PITFALLS.md` — project-level pitfall research (HIGH confidence, same codebase)
- `.planning/research/STACK.md` — project-level stack research (HIGH confidence)

### Secondary (MEDIUM confidence)
- `pnpm-lock.yaml` — superstruct installed at 1.0.4 (package.json specifies ^1.0.3)
- superstruct 1.0.x `object()` strips unknown keys — confirmed by pitfalls research which identified this as the exact mechanism causing heatpump config loss

---

## Metadata

**Confidence breakdown:**
- Type changes (ConfigEntities, HeatpumpEntity, GridEntities): HIGH — direct analysis of existing interface patterns
- Migration function logic: HIGH — detection heuristic verified against both flat string and ComboEntity formats
- superstruct struct updates: HIGH — exact API used throughout existing _schema-all.ts
- Test patterns: HIGH — existing i18n.test.ts shows exact import and describe/test structure
- Open question (typecheck passing): MEDIUM — requires planner to decide scope of grid state accessor updates

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable codebase, no external dependencies changing)

# Project Research Summary

**Project:** power-flow-card-plus — Messkonzept 8 Extension
**Domain:** Home Assistant Lovelace custom card (Lit/TypeScript SVG power flow visualization)
**Researched:** 2026-03-02
**Confidence:** HIGH (all research derived from direct codebase analysis of v0.2.6)

## Executive Summary

This project extends an existing Lit/TypeScript Home Assistant custom card to support Messkonzept 8, a dual-meter energy topology where a main grid meter (`grid_main`) feeds both a house sub-meter (`grid_house`) and a heatpump. The codebase is a mature, well-structured Lit 2 web component with seven established patterns (node object construction, component element functions, SVG animated flow lines, state resolution via base accessors, editor schema routing, dynamic CSS custom properties, and CSS grid layout). No new runtime dependencies are needed — all planned features are achievable within the existing stack.

The recommended approach is a strict dependency-ordered, four-phase implementation: Phase 1 locks down types, config migration, and state resolution (zero visual changes); Phase 2 adds the `grid_main` node and its flow line to prove the layout extension; Phase 3 adds the heatpump node and its two flow lines; Phase 4 extends the visual editor. The central architectural decision — use separate SVG containers for new flow lines rather than widening the existing overlay — isolates new code from the fragile existing coordinate system and avoids any regression for the majority of users not using Messkonzept 8.

The dominant risk is not implementation complexity but ordering: three of the six critical pitfalls must be resolved in Phase 1 before any other work begins. Specifically, the `EntityType`/`ConfigEntities` synchronization, superstruct key preservation, and migration idempotency must all be proven correct with unit tests before the visual phases start. An editor infinite loop or superstruct stripping of heatpump config are HIGH-recovery-cost failures that have caused hotfix releases in similar HA card projects.

## Key Findings

### Recommended Stack

The stack is fixed — this is an extension of an existing project, not a greenfield choice. TypeScript 4.9.5 with Lit 2.2.2, bundled by Rollup, with superstruct for config validation and custom-card-helpers for HA integration glue. `pnpm 10.6.3` is enforced as the package manager. No new runtime dependencies should be added; the entire Messkonzept 8 feature set is achievable within this stack.

The only stack-level decision to make is confirming `mdi:heat-pump` exists in `@mdi/js ^7.2.96` (HIGH confidence it does; MEDIUM confidence on the exact icon name — check `mdiHeatPump` constant at implementation time).

**Core technologies:**
- TypeScript 4.9.5 — type safety across node objects, config, and state resolution
- Lit 2.2.2 — `html`/`svg` tagged template rendering for all node and flow components
- superstruct 1.0.3 — config validation in both card and editor `setConfig`; must be kept permissive (`optional(any())`) for entity sub-keys during this milestone
- Rollup 2.70.2 — single-file bundle output; no changes needed
- Jest 29.7.0 — unit tests for config migration and state resolution (critical for Phase 1)

### Expected Features

The Messkonzept 8 feature set is narrow and well-defined. Scope creep must be actively resisted: other Messkonzept variants, multiple heatpump nodes, and reverse heatpump flows are explicitly out of scope.

**Must have (table stakes):**
- `grid_main` node rendered left of `grid_house` with independent entity binding and bidirectional animated flow line between them
- `heatpump` node below `grid_house` with monodirectional flow lines from `grid_house` and optionally from `grid_main`
- Flat `entities.grid` auto-migrated to `entities.grid.house` at runtime with deprecation warning
- Visual editor pages for `grid_house`, `grid_main`, and `heatpump` with one-click migration prompt
- Non-fossil bubble correctly bound to `grid_main.fromGrid` (the actual grid connection point)
- COP displayed as a live HA sensor value, hidden gracefully when unavailable
- Zero regression for users without `entities.grid.main` configured

**Should have (differentiators):**
- Seamless upgrade path — existing YAML configs continue working without user changes
- `display_zero_lines` behavior applied consistently to all new heatpump flow lines
- Distinct default names and icons for `grid_main` vs `grid_house` to avoid user confusion
- Deprecation warning visible in the card UI (not just browser console)

**Defer (v2+):**
- Multiple heatpump nodes (use existing `individual[]` for other heat sources)
- Messkonzept 7, 11, or other variants
- Heatpump export / reverse flow
- Solar-to-heatpump or battery-to-heatpump direct connections

### Architecture Approach

The architecture follows a strict "extend, don't modify" principle. The existing 3-row flexbox layout is extended conditionally: when `entities.grid.main` is configured (MK8 mode), `grid_main` is inserted as the new leftmost node in Row 2 and `heatpump` is inserted in Row 3. When `entities.grid.main` is absent, rendering is identical to the current release. New flow lines are implemented as separate SVG containers (the nonFossil inline SVG pattern), avoiding any changes to the existing 6 flow line coordinate systems. All state computation lives in the main card's `render()` method following the existing pattern of inline object literals.

**Major components:**
1. `src/power-flow-card-plus.ts` — extend `setConfig()` with migration and extend `render()` with conditional MK8 layout and new node object construction
2. `src/components/gridMain.ts` (new) — renders `grid_main` circle; clone of `grid.ts` bound to `gridMain` state
3. `src/components/heatpump.ts` (new) — renders heatpump circle with COP secondary display
4. `src/components/flows/gridMainToGridHouse.ts` (new) — bidirectional horizontal flow using the `batteryGrid` two-circle pattern
5. `src/components/flows/gridHouseToHeatpump.ts` (new) — monodirectional vertical flow (inline SVG, nonFossil pattern)
6. `src/components/flows/gridMainToHeatpump.ts` (new) — monodirectional curved flow (separate SVG container)
7. `src/states/raw/gridMain.ts` + `src/states/raw/heatpump.ts` (new) — thin wrappers on `base.ts` accessors
8. Three new editor schema files + updated `ui-editor.ts` routing with nested `_valueChanged` handling

### Critical Pitfalls

1. **EntityType/ConfigEntities out-of-sync** — Adding new entity types to one file but not the other causes silent `undefined` access at runtime. Fix: derive `EntityType` from `keyof ConfigEntities`, or add a compile-time assertion. Must be done in Phase 1.

2. **Superstruct strips unknown config keys** — If `heatpump` is not added to `cardConfigStruct`, every editor open silently deletes the user's heatpump configuration. Fix: add `heatpump: optional(any())` to `cardConfigStruct` before any editor work. Phase 1.

3. **Energy balance double-counting** — `grid_main.fromGrid` includes heatpump consumption; using it for home balance double-counts. Fix: use `grid_house` (not `grid_main`) for the solar/battery/home balance; heatpump power is a separate sink. The closed-system equation is: `grid_main.fromGrid = grid_house.fromGrid + heatpump.power`. Phase 2.

4. **Migration infinite loop** — Non-idempotent migration in `setConfig` triggers repeated `config-changed` events, freezing the browser tab. Fix: guard migration with `if ('house' in config.entities.grid) return config;` and extract migration to a pure standalone function called by both card and editor `setConfig`. Phase 1.

5. **Editor `_valueChanged` flattens nested grid keys** — The existing handler writes `config.entities[page] = value`, which would create `config.entities.grid_house` instead of `config.entities.grid.house`. Fix: add special-case handling for grid sub-pages in `_valueChanged`, mirroring the existing `individual`/`advanced` special cases. Phase 4.

6. **SVG coordinates are hardcoded and fragile** — Any change to existing flow paths risks breaking layouts for all users. Fix: never modify existing SVG `d` attributes; add all new flows as separate containers. Phase 3.

## Implications for Roadmap

Based on research, the dependency chain is clear and non-negotiable: types must precede state, state must precede rendering, rendering must precede the editor. The suggested 5-phase structure maps directly from the architecture build order identified in ARCHITECTURE.md.

### Phase 1: Type Foundation and Config Migration

**Rationale:** Three of six critical pitfalls are Phase 1 concerns. Everything downstream — state resolution, rendering, the editor — depends on correct types and a proven migration function. This phase has zero visual output, making it safe to validate purely through unit tests before any user-facing work.

**Delivers:** Extended `ConfigEntities` and `EntityType`, `GridMainObject`/`HeatpumpObject` types, `NestedGridConfig` type, flat-to-nested migration function, updated `cardConfigStruct` with `heatpump: optional(any())`, unit tests for migration (all three flat-config variants) and idempotency.

**Addresses:** Dual grid meter config structure, heatpump config structure, backward compatibility requirement.

**Avoids:** EntityType/ConfigEntities mismatch (Pitfall 1), superstruct key stripping (Pitfall 2), migration infinite loop (Pitfall 6).

### Phase 2: Grid Main Node and Energy Balance

**Rationale:** The `grid_main` node is the most prominent new visual element. Proving that the layout extension works — a new leftmost column in Row 2 — validates the architectural approach before adding the heatpump. The energy balance equation must be redesigned and unit-tested in this phase because `grid_house` (not `grid_main`) becomes the source for the home balance.

**Delivers:** `gridMain` state resolution, corrected energy balance using `grid_house` for home consumption, `gridMain` node object construction in `render()`, `src/components/gridMain.ts`, bidirectional `gridMainToGridHouse` flow line, non-fossil rebinding to `grid_main.fromGrid`, CSS for grid_main.

**Uses:** TypeScript node object pattern (Pattern 1), component function pattern (Pattern 2), SVG animated dots with bidirectional keyPoints (Pattern 3), `base.ts` state accessors (Pattern 4).

**Avoids:** Energy balance double-counting (Pitfall 3).

### Phase 3: Heatpump Node and Flow Lines

**Rationale:** Heatpump depends on Phase 2 because `grid_main -> heatpump` flow requires the `gridMain` node to exist. SVG geometry for the new flow lines is the highest-uncertainty area (MEDIUM confidence on exact coordinates) and should be treated as iterative.

**Delivers:** `src/states/raw/heatpump.ts`, `heatpump` node object with COP secondary display, `src/components/heatpump.ts`, three new flow line components (`gridHouseToHeatpump`, `gridMainToHeatpump`), updated `flowElement()` index, new `NewDur` keys, CSS for heatpump, `display_zero_lines` integration for all new flows.

**Avoids:** Modifying existing SVG path geometry (Pitfall 5), always-rendering anti-pattern (Architecture Anti-Pattern 2).

### Phase 4: Visual Editor

**Rationale:** The editor configures what already exists — it must come last. The `_valueChanged` nested key problem (Pitfall 4) must be solved here with explicit special-case handling. The migration prompt in the editor is a UX requirement for existing users.

**Delivers:** `src/ui-editor/schema/grid-house.ts`, `src/ui-editor/schema/grid-main.ts`, `src/ui-editor/schema/heatpump.ts`, updated `CONFIG_PAGES` array, `_valueChanged` special handling for grid sub-pages, migration detection and one-click migration prompt, localization keys for all 16 language files.

**Uses:** Editor schema pattern (Pattern 5), `memoizeOne` for new schemas, `getBaseMainConfigSchema` reuse for grid_house/grid_main.

**Avoids:** Editor _valueChanged flattening nested keys (Pitfall 4).

### Phase 5: Polish and Regression Verification

**Rationale:** The MK8 layout is wider and interacts with existing conditional behaviors (battery, solar, individual devices, RTL, card width). These interactions cannot be fully anticipated until Phases 2-4 are complete. A dedicated polish phase prevents these edge cases from being shipped without verification.

**Delivers:** Responsive layout validation at 300px/420px/600px card widths, RTL layout verification, visual regression screenshots comparing v0.2.6 to new release with no MK8 config (zero-diff expected), edge case verification (no battery, no solar, with individual devices, power outage on each meter), `isCardWideEnough` threshold review.

### Phase Ordering Rationale

- Phase 1 must be first because TypeScript types and migration correctness are preconditions for all other work; failures here are HIGH-recovery-cost
- Phase 2 before Phase 3 because `grid_main -> heatpump` flow depends on the `gridMain` node and its state being present
- Phase 4 last because the editor configures features that must already render correctly
- Phase 5 last because edge case interactions only become visible after the full feature is implemented

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (SVG geometry):** The exact SVG path coordinates for new flow lines are estimated at MEDIUM confidence. The actual `d` attribute strings and CSS positioning will require visual iteration. Plan time for screenshot-driven tuning.
- **Phase 3 (heatpump icon):** Confirm `mdiHeatPump` constant name in `@mdi/js 7.x` before implementation; fallback is `mdi:heat-pump` as a string literal.
- **Phase 5 (RTL):** The existing `:dir(rtl)` CSS rules have not been analyzed for MK8 compatibility. Plan a dedicated RTL review.

Phases with standard patterns (skip additional research):
- **Phase 1:** Config type extension and superstruct patterns are fully documented in the codebase.
- **Phase 2:** Node object construction and flow line patterns are HIGH-confidence and directly observable.
- **Phase 4:** Editor schema and `CONFIG_PAGES` pattern is well-understood from the existing 6 entity pages.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct `package.json` and source analysis; no inference required |
| Features | HIGH | Scope is tightly defined; FEATURES.md derived from direct analysis of MK8 topology requirements |
| Architecture | HIGH | Existing patterns are clear; extension approach is well-grounded; SVG geometry is MEDIUM |
| Pitfalls | HIGH | All 6 pitfalls derived from actual code paths, not speculation |

**Overall confidence:** HIGH

### Gaps to Address

- **SVG path coordinates for new flows:** Starting-point geometry is provided in STACK.md and ARCHITECTURE.md but labeled MEDIUM confidence. Treat as initial estimates; expect 1-2 iterations of visual tuning per flow line. Address during Phase 3 planning by prototyping coordinates against the live card.
- **`mdiHeatPump` icon constant name:** Verify against `@mdi/js` 7.x at implementation start. Fallback: use the string literal `"mdi:heat-pump"` if the JS constant has a different name.
- **`isCardWideEnough` threshold:** Currently 420px. With `grid_main` added, the minimum usable width increases. Determine the new threshold empirically during Phase 5.
- **RTL layout impact:** The existing `:dir(rtl)` CSS rules have not been analyzed for MK8. Flag for explicit review in Phase 5.
- **`display_zero_lines` custom mode for new flows:** The `custom` mode allows per-line configuration. Verify that the existing per-line config structure accommodates three new line identifiers without structural changes.

## Sources

### Primary (HIGH confidence)
- Direct source analysis, `power-flow-card-plus` v0.2.6 (commit `0fcd3d2`) — all patterns, types, and energy balance logic
- `src/power-flow-card-plus.ts` — main card class, `setConfig`, `render`, energy balance (lines 344-408)
- `src/ui-editor/ui-editor.ts` — editor `setConfig`, `assert()`, `_valueChanged` handler
- `src/ui-editor/schema/_schema-all.ts` — `cardConfigStruct` and entity schema definitions
- `src/states/raw/base.ts` — `EntityType`, `getFieldInState`/`getFieldOutState` pattern
- `src/type.ts` — `GridObject`, `NewDur`, and entity type definitions
- `src/power-flow-card-plus-config.ts` — `ConfigEntities` and `Grid` interface
- `src/components/flows/*.ts` — all 6 existing flow line SVG implementations
- `src/style.ts` + `src/style/all.ts` — CSS custom properties and dynamic color computation
- `package.json` — exact dependency versions

### Secondary (MEDIUM confidence)
- SVG path geometry estimates in STACK.md — starting-point coordinates, not visually verified
- MDI icon availability (`mdi:heat-pump`) — present in MDI 7.x, constant name unverified

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*

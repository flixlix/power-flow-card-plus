# Phase 3: Heatpump Node and Flow Lines - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Render a heatpump consumption node with COP display and two animated monodirectional flow lines (from grid_house and from grid_main), without double-counting heatpump in the home node total. Existing solar/battery/home energy balance must stay correct. No editor work (Phase 4). No responsive polish (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Layout position
- Heatpump node goes in the **existing bottom row**, positioned visually centered between the grid_main and grid_house columns
- The bottom row becomes: `[spacer] | [heatpump] | [battery] | [individual-left-bottom]`
- Heatpump is inserted between the spacer and battery — no new row needed, battery stays in its current slot
- When only heatpump is present (no battery), heatpump occupies the same slot pattern

### Flow line geometry and style
- Both flow lines use the **curved SVG style** (like existing battery/solar lines) — not the flat-line style used by gridMain→gridHouse
- `grid_house → heatpump`: curved line arcing down from grid_house to the centered heatpump below
- `grid_main → heatpump`: curved line arcing down-right from grid_main to the centered heatpump (diagonal)
- The visual arrangement forms a triangle: grid_main and grid_house at top, heatpump at the apex below between them

### Home balance (BAL-02)
- **No auto-subtraction** — the home entity is expected to already exclude heatpump consumption
- No card logic change to the home calculation; heatpump is treated like any external consumer
- This matches Option B from discussion: user configures their home entity accordingly

### COP display format
- COP displayed as a `<span>` inside the heatpump circle — same pattern as `state_of_charge` in battery element
- **1 decimal place** (e.g. "COP 3.2")
- **Hidden entirely** when COP entity is unavailable or unknown (not "--", just hidden)
- The COP label is prefixed with "COP " (e.g. "COP 3.2")
- Click behavior: fully configurable `tap_action` like all other entities; defaults to opening the COP entity if no tap_action configured

### Flow line visibility
- Follows existing `showLine` util + `display_zero_lines` config (HP-07)
- Each line independently hides/greys based on its sensor value (0W = hidden or greyed per config)
- `flow_from_grid_house` and `flow_from_grid_main` are separate optional sensors — if an entity is not configured, no line is drawn for that direction

### NewDur entries
- Two new duration fields added to `NewDur`: `heatpumpFromGridHouse` and `heatpumpFromGridMain`
- Flow rates computed from the respective sensor values

### Claude's Discretion
- Exact SVG path geometry for the two curved lines (shape of arcs, control points)
- CSS class names for heatpump element and flow lines
- Exact positioning of heatpump node within the bottom row to achieve visual centering between grid columns
- Default icon for heatpump node (`mdi:heat-pump` or similar)

</decisions>

<specifics>
## Specific Ideas

- The centered-between-grids position creates an inverted triangle/pyramid visual: `grid_main` and `grid_house` at the same level, `heatpump` below and centered between them — both curved lines arc inward and downward
- COP display mirrors `state_of_charge` in battery.ts exactly (span at top of circle, click handler, displayValue call)
- No tap_action defaults discussed for the main heatpump entity click — follow existing grid/battery pattern (opens main entity)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `battery.ts`: Direct template for heatpump element — use same `state_of_charge` span pattern for COP display, same circle structure
- `gridMain.ts`: Template for new node element structure (circle-container, circle, click handlers)
- `gridMainToGridHouse.ts`: Template for new flow line files — adapt for monodirectional curved lines
- `showLine()` in `src/utils/showLine.ts`: Already handles display_zero_lines config; use for both heatpump flow lines
- `computeFlowRate()` in `src/utils/computeFlowRate.ts`: Use for `heatpumpFromGridHouse` and `heatpumpFromGridMain` NewDur values
- `displayValue()`: Use for COP with 1 decimal override
- `generalSecondarySpan`: Not needed for heatpump (no secondary_info in HeatpumpEntity config)

### Established Patterns
- All nodes are function components (not classes): `(main, config, { ... }) => html\`...\``
- Flow lines are standalone files in `src/components/flows/`; registered in `flows/index.ts`
- `NewDur` type in `src/type.ts` needs two new fields
- State resolver functions live in `src/states/raw/` — need `src/states/raw/heatpump.ts`

### Integration Points
- `src/type.ts`: Add `heatpumpFromGridHouse: number` and `heatpumpFromGridMain: number` to `NewDur`
- `src/components/flows/index.ts`: Import and call new heatpump flow functions
- `src/power-flow-card-plus.ts` render(): Add heatpump object construction, insert heatpumpElement into bottom row between spacer and battery, add heatpump flow lines to flowElement call, compute new NewDur entries
- `HeatpumpEntity` config type already exists in `power-flow-card-plus-config.ts` — no config changes needed

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-heatpump-node-and-flow-lines*
*Context gathered: 2026-03-02*

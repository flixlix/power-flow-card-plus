# Phase 5: Polish and Regression Verification - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure the card is visually correct across all layout modes (3-6 columns) and edge cases, with zero regression for existing non-MK8 users. Fix known flow line misalignment bugs. Verify responsive behavior at 300px, 420px, and 600px widths. Run full test suite clean. No new features.

</domain>

<decisions>
## Implementation Decisions

### Flow line alignment
- User reported: battery→grid passes into col B instead of C; gridMain→gridHouse starts left of main and ends right of grid — likely scaling issue at smaller card widths
- Not yet confirmed whether size-specific or all sizes — investigate first
- All remaining curved flow lines (solarToHome, solarToGrid, batteryToHome, batteryToGrid, gridHouseToIntermediate, gridMainToIntermediate) still use the old `FlowGeometry` overlay approach
- Straight lines (solar↔battery vertical, gridMain→grid horizontal, grid→home horizontal) already work as inline SVGs

### Responsive breakpoints
- `isCardWideEnough` threshold currently hardcoded at 420px — may need adjustment for 5-6 column MK8 layouts
- No compact mode below 300px — 300px is minimum supported width (anything below clips)
- Compact dashboard widget mode is explicitly out of scope (deferred)

### Edge case configs
- Must test realistic key combos, not all 32 permutations: full MK8, MK8 no battery, MK8 no solar, standard no-gridMain, minimal grid+home
- Power outage: each meter independently configurable (grid_house can be down while grid_main is up)
- Intermediate visibility when all flows are 0W: follow existing individual device pattern for consistency

### Claude's Discretion
- Choice of dynamic SVG scaling vs fixed paths per layout mode vs inline SVG conversion for curved lines — pick whichever reliably fixes alignment
- Responsive strategy: whether to scale down, hide elements, or adjust thresholds — pick what works visually
- Minimum circle sizes at narrow widths
- Whether empty intermediate columns collapse or preserve spacing
- Regression verification approach (manual checklist vs code audit vs automated screenshots)
- Which non-MK8 configs to test (at least standard full, no battery, minimal)
- Whether to run `pnpm format:write` as first task or only if format check fails
- Whether to clean up ROADMAP Phase 3 status (currently shows 2/3 In Progress despite being functionally complete)

</decisions>

<specifics>
## Specific Ideas

- The flow line misalignment was noticed during Phase 4 approval testing — the card was rendered at a smaller-than-usual size in the HA editor panel
- Straight inline SVGs in spacer divs (established in Phase 3 refactor) work reliably because flex layout naturally centers them — this pattern is the reference for any curved line fixes
- `FlowGeometry` computes `rowMaxWidth = numCols * 140 - 60` which determines the `.lines` overlay width — if the actual rendered width differs (e.g., CSS max-width kicks in), overlay paths will be offset

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeFlowGeometry()` in `src/utils/flowGeometry.ts`: Computes column layout, rowMaxWidth, and column assignments based on hasGridMain/hasRightSection
- `showLine()` in `src/utils/showLine.ts`: Handles display_zero_lines config for flow visibility
- `styleLine()` in `src/utils/styleLine.ts`: Handles transparency/grey-out for zero-value lines
- Inline SVG pattern in `solar.ts`, `battery.ts`, and spacer divs in `power-flow-card-plus.ts` — working reference for naturally-positioned flow lines

### Established Patterns
- All straight lines use inline SVGs in flex-positioned containers (circle-containers or spacer divs)
- Curved lines use absolutely-positioned SVGs in a `.lines` overlay container, positioned via `FlowGeometry` calculations
- `isCardWideEnough` (line 642) gates some layout behavior — single threshold for all layouts
- `--row-max-width` CSS custom property set from `geo.rowMaxWidth` (line 669)

### Integration Points
- `src/components/flows/*.ts`: Individual flow components — curved ones (solarToHome, solarToGrid, batteryToHome, batteryGrid, gridHouseToIntermediate, gridMainToIntermediate) need alignment fixes
- `src/utils/flowGeometry.ts`: FlowGeometry interface and compute function — may need updates if responsive strategy changes
- `src/style.ts`: CSS `.lines` container styles — overlay positioning may need adjustment
- `src/power-flow-card-plus.ts` render(): Where all flow lines are composed into the template

</code_context>

<deferred>
## Deferred Ideas

- Compact dashboard widget mode (sub-300px) — future phase if demand exists
- RTL card layout support (editor has some RTL CSS, card does not) — separate phase

</deferred>

---

*Phase: 05-polish-and-regression-verification*
*Context gathered: 2026-03-04*

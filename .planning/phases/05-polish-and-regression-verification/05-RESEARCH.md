# Phase 5: Polish and Regression Verification - Research

**Researched:** 2026-03-04
**Domain:** SVG flow line alignment, responsive CSS layout, LitElement visual regression
**Confidence:** HIGH

## Summary

Phase 5 is a cross-cutting verification and polish phase. All 22 v1 requirements have been implemented in Phases 1-4, and all flow lines (straight and curved) have been migrated to inline SVGs. The primary work is: (1) fixing known flow line misalignment bugs caused by hardcoded SVG path pixel offsets that don't scale with card width, (2) running `pnpm format:write` to fix 11 files with formatting issues, (3) verifying edge case configurations render without errors, and (4) confirming non-MK8 configs remain visually identical to pre-MK8 behavior.

The codebase is in good shape. `pnpm typecheck` and `pnpm test` already pass. The `.lines` CSS class and `flowGeometry` functions (`flowStyle`, `flowStyleVertical`, `flowPixelWidth`) are dead code since all flows now use inline SVGs. The `isCardWideEnough` variable is computed but `allDynamicStyles` never reads it. These are cleanup opportunities.

**Primary recommendation:** Fix SVG path pixel coordinates to use the spacer's 80px coordinate system consistently, run formatter, remove dead code, then systematically verify all layout modes at 300/420/600px widths.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Flow line misalignment bugs: battery-to-grid passes into col B instead of C; gridMain-to-gridHouse starts left of main and ends right of grid -- likely scaling issue at smaller card widths. Investigate first to confirm whether size-specific or all sizes.
- All remaining curved flow lines (solarToHome, solarToGrid, batteryToHome, batteryToGrid, gridHouseToIntermediate, gridMainToIntermediate) still use the old FlowGeometry overlay approach -- ACTUALLY, investigation reveals ALL have been migrated to inline SVGs already. The flow files in src/components/flows/*.ts all return empty strings.
- Responsive breakpoints: isCardWideEnough threshold currently hardcoded at 420px. No compact mode below 300px -- 300px is minimum supported width.
- Edge case configs: must test realistic key combos, not all 32 permutations: full MK8, MK8 no battery, MK8 no solar, standard no-gridMain, minimal grid+home.
- Power outage: each meter independently configurable (grid_house can be down while grid_main is up).
- Intermediate visibility when all flows are 0W: follow existing individual device pattern for consistency.

### Claude's Discretion
- Choice of dynamic SVG scaling vs fixed paths per layout mode vs inline SVG conversion for curved lines -- pick whichever reliably fixes alignment
- Responsive strategy: whether to scale down, hide elements, or adjust thresholds -- pick what works visually
- Minimum circle sizes at narrow widths
- Whether empty intermediate columns collapse or preserve spacing
- Regression verification approach (manual checklist vs code audit vs automated screenshots)
- Which non-MK8 configs to test (at least standard full, no battery, minimal)
- Whether to run pnpm format:write as first task or only if format check fails
- Whether to clean up ROADMAP Phase 3 status (currently shows 2/3 In Progress despite being functionally complete)

### Deferred Ideas (OUT OF SCOPE)
- Compact dashboard widget mode (sub-300px) -- future phase if demand exists
- RTL card layout support (editor has some RTL CSS, card does not) -- separate phase
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | ^2.2.2 | Web component rendering | LitElement is the project's component framework |
| TypeScript | ^4.9.5 | Type checking | `pnpm typecheck` runs `tsc --noEmit` |
| Jest | ^29.7.0 | Unit testing | Existing test framework, `pnpm test` |
| Prettier | 2.8.8 | Code formatting | `pnpm format:write` / `pnpm format:check` |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| pnpm | Package manager | All commands use `pnpm` prefix |
| rollup | Build bundler | `pnpm build` for dist/ output |
| eslint | Linting | `pnpm lint` (not in success criteria but good practice) |

## Architecture Patterns

### Current Layout Structure
```
3-col (no gridMain, <=2 individuals):
  Col 0: nonFossil/grid     Col 1: solar/battery     Col 2: individuals/home

5-col (with gridMain, <=2 individuals):
  Col 0: nonFossil/gridMain  Col 1: intermediate  Col 2: grid  Col 3: solar/battery  Col 4: individuals/home

6-col (with gridMain, >2 individuals):
  Col 0-4: same as 5-col    Col 5: right-side individuals
```

### Inline SVG Flow Line Pattern (Established)
**What:** All flow lines are rendered as `<svg>` elements positioned absolutely within spacer `<div>` elements or within circle-container elements. The SVG viewBox defaults to `width="80" height="80"` matching the spacer's CSS width of `var(--size-circle-entity)` = `79.99px`.

**How coordinates work:**
- Each SVG is placed at `position:absolute; top:0; left:0` inside a `position:relative` spacer div
- The SVG has `overflow:visible` so paths can extend beyond the 80x80 box
- Path coordinates use pixel values relative to the SVG's origin (top-left of spacer)
- Horizontal lines: e.g., `M-100 40 h280` starts 100px left of spacer, draws 280px right (spanning the circles on either side)
- Curved lines: e.g., `M45 -80 V-5 A40,40 0 0,0 85 35 H160` starts above the spacer (in the solar circle area), curves right, and extends past the right edge into the home circle

**Key insight:** These hardcoded pixel values (e.g., `-100`, `280`, `160`, `-120`, `-80`) assume a fixed inter-column gap. The flex layout with `justify-content: space-between` distributes circles evenly, but the SVG origin is always at the spacer's top-left. When `--row-max-width` changes (e.g., 3-col = 360px, 5-col = 640px, 6-col = 780px), the actual pixel distance between circle centers changes, but the SVG path coordinates do not.

### Row Width Calculation
```
rowMaxWidth = numCols * 140 - 60
  3-col: 360px
  4-col: 500px
  5-col: 640px
  6-col: 780px

Circle diameter: 80px
Space-between gap (at max width): (rowMaxWidth - numCols * 80) / (numCols - 1)
  3-col: (360 - 240) / 2 = 60px gap
  5-col: (640 - 400) / 4 = 60px gap
  6-col: (780 - 480) / 5 = 60px gap
```

At max width, all layouts have 60px gaps between circles, so the spacer div is 80px wide and the circle center-to-center distance is 140px. The hardcoded SVG paths assume this 140px center-to-center distance.

### Why Misalignment Happens
When the card renders **narrower than rowMaxWidth** (e.g., in a HA editor panel that's only 400px wide for a 5-col layout):
1. The flex `space-between` compresses the gaps between circles proportionally
2. The spacer div shrinks (it's a flex item, not fixed-width because `.spacer` only sets `width: var(--size-circle-entity)` which is a suggestion, not enforced when flex compresses)
3. But the SVG paths still use hardcoded pixel offsets (e.g., `M-100 40 h280` assumes circle centers are 140px apart)
4. Result: lines extend too far left/right, overshooting or undershooting the target circles

**This is the root cause of the reported bugs:**
- "battery-to-grid line passes into col B instead of col C" -- the `H-120` endpoint overshoots because the actual gap is narrower than assumed
- "gridMain-to-gridHouse flow starts left of main and ends right of grid" -- `M-100 40 h280` overshoots on both ends

### Recommended Fix: Relative SVG Coordinates via viewBox

**Approach:** Instead of hardcoded pixel offsets, use SVG `viewBox` and percentage-based calculations that scale with the actual rendered spacer width. However, since `overflow:visible` is needed and SVG viewBox doesn't affect overflow rendering, a better approach is:

**Approach (recommended):** Keep the inline SVG pattern but adjust the path coordinates to be computed dynamically based on the spacer's actual width relative to circle spacing. Since all spacers are `80px` wide at max width with `60px` gaps, and the SVG paths need to reach to circle centers (40px into adjacent circles), the total horizontal span for a straight line crossing one spacer is: `40px (half circle) + gap + 40px (half circle)` = `80 + gap`. At max width this is 140px.

The simplest reliable fix: **set the spacer div to a fixed width and use CSS `calc()` for the SVG transform scale.** Or even simpler: **compute the path coordinates dynamically in the render function based on the actual `this._width` value** (already available as `this._width`).

### Pattern: Dynamic SVG Path Coordinates

```typescript
// In render(), compute the actual inter-column spacing
const actualRowWidth = Math.min(this._width, geo.rowMaxWidth);
const gapBetweenCircles = (actualRowWidth - geo.numCols * 80) / (geo.numCols - 1);
const spacerWidth = 80; // CSS width of .spacer
const halfCircle = 40;

// Distance from spacer left edge to left circle center
const leftReach = halfCircle + (gapBetweenCircles - spacerWidth) / 2 + halfCircle;
// This simplifies to: gapBetweenCircles + 40
// At max width: 60 + 40 = 100 (matches the current M-100 offset!)

// Horizontal line spanning one spacer gap:
const lineStart = -leftReach; // e.g., -100 at max width
const lineLength = 2 * leftReach + spacerWidth; // e.g., 280 at max width
// Path: `M${lineStart} 40 h${lineLength}`
```

This means at max width the coordinates are identical to the current hardcoded values, but at narrower widths they adapt.

**Alternative simpler approach:** If the card always renders at `rowMaxWidth` (the `.card-content` and `.row` have `max-width: var(--row-max-width)`), then the paths would never be wrong. The issue might be that the card container itself is narrower than `rowMaxWidth`. In that case, using `min-width: var(--row-max-width)` or allowing horizontal scroll would "fix" the issue but create usability problems. The dynamic path approach is better.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG animation | Custom JS animation loop | SVG `<animateMotion>` with `<mpath>` | Already used throughout; native SVG animation is smoother and zero-JS |
| Responsive layout | Media queries per breakpoint | Flex `space-between` + dynamic `--row-max-width` | Already the established pattern; works for 3-6 columns |
| Code formatting | Manual formatting | `pnpm format:write` (Prettier) | 11 files need it; one command fixes all |
| Visual regression testing | Pixel-diff screenshots | Manual visual checklist + code audit | No screenshot infrastructure exists; building one is out of scope for a 5-plan-or-fewer phase |

## Common Pitfalls

### Pitfall 1: SVG overflow:visible Coordinate Confusion
**What goes wrong:** SVG elements with `overflow:visible` draw beyond their bounding box, making it seem like coordinates are "absolute" when they're actually relative to the SVG element's position.
**Why it happens:** The SVG `<path>` coordinates like `M-100 40` are relative to the SVG's own coordinate system (0,0 = top-left of the SVG element), not the card or the row.
**How to avoid:** Always think in terms of "distance from the spacer div's top-left corner." The spacer is 80px wide. Circle centers in adjacent columns are at `x = -gapWidth/2 - 40` (left) and `x = 80 + gapWidth/2 + 40` (right).
**Warning signs:** Lines "work at one width but not another."

### Pitfall 2: isCardWideEnough Dead Code
**What goes wrong:** The `isCardWideEnough` variable (line 642) is computed and passed to `allDynamicStyles` but never used inside that function. Removing it could cause a regression if some downstream consumer reads it.
**Why it happens:** Progressive migration from old overlay-based flow system to inline SVGs left this variable orphaned.
**How to avoid:** Grep for all usages before removing. Currently: defined on line 642, passed on line 654, destructured in `allDynamicStyles` signature. The `allDynamicStyles` function in `src/style/all.ts` accepts `[key: string]: any` so it silently accepts but ignores it.
**Warning signs:** If removal breaks build or tests.

### Pitfall 3: Format-Write Changes During Active Development
**What goes wrong:** Running `pnpm format:write` reformats 11 files, creating a large diff that makes subsequent code changes hard to review.
**How to avoid:** Run format:write as the FIRST task in the phase, committed separately. All subsequent commits have clean diffs.

### Pitfall 4: `.spacer` Width Not Being Enforced
**What goes wrong:** The `.spacer` CSS class sets `width: var(--size-circle-entity)` (79.99px), but in a flex container with `justify-content: space-between`, flex items can shrink below their specified width if the container is narrower than the sum of items.
**Why it happens:** `.spacer` has no `min-width` or `flex-shrink: 0` set.
**How to avoid:** Add `flex-shrink: 0` to `.spacer` and `.circle-container` to prevent them from compressing below 80px. If the card is too narrow, it should clip/scroll rather than compress circles.
**Warning signs:** Circles overlapping at narrow widths; spacer divs becoming 0-width.

### Pitfall 5: Duplicate SVG Element IDs
**What goes wrong:** Multiple SVGs in the same shadow DOM use the same `id` for path elements (e.g., `#grid-to-home`). `<animateMotion>` references these by ID via `<mpath xlink:href>`. If IDs collide, animations can reference the wrong path.
**Why it happens:** Inline SVGs all live in the same shadow root.
**How to avoid:** Verify all SVG path IDs are unique across the entire render output. Current code already uses unique IDs (grid-main-to-grid, grid-to-home, solar-to-home, solar-to-grid, battery-to-home, battery-grid, solar-to-battery, battery-from-solar, grid-house-intermediate-0/1, grid-main-intermediate-0/1, ind-right-top-to-home, ind-right-bottom-to-home). This is fine.

### Pitfall 6: `.lines` CSS is Dead Code
**What goes wrong:** The `.lines` and `.lines svg` CSS rules in `src/style.ts` (lines 87-96) are no longer referenced by any template. They add 10 lines of dead CSS shipped to users.
**Why it happens:** Migration to inline SVGs eliminated all uses of the `.lines` container.
**How to avoid:** Remove the dead CSS rules. Grep the codebase to confirm no remaining references.

## Code Examples

### Current SVG Path Pattern (Spacer-Relative)
```typescript
// Source: src/power-flow-card-plus.ts, line 828
// Horizontal line in Col D spacer (between grid/solar column and home column)
<svg width="80" height="80" style="position:absolute;top:0;left:0;overflow:visible;pointer-events:none">
  <path d="M-100 40 h280" id="grid-to-home"
    class="grid ${styleLine(grid.state.toHome || 0, this._config)}"
    vector-effect="non-scaling-stroke" />
</svg>
```

### Dynamic Path Coordinates (Recommended Fix)
```typescript
// Compute actual gap at current card width
const actualWidth = Math.min(this._width || geo.rowMaxWidth, geo.rowMaxWidth);
const gap = geo.numCols > 1
  ? (actualWidth - geo.numCols * 80) / (geo.numCols - 1)
  : 0;
const reach = gap / 2 + 40; // distance from spacer edge to adjacent circle center
const lineStart = -reach;
const lineEnd = 80 + reach; // 80 = spacer width
const lineLength = lineEnd - lineStart;

// Straight horizontal path
`M${lineStart} 40 h${lineLength}`

// Curved path (e.g., solar-to-home: top-right diagonal)
// Start above (solar column = left of spacer), curve right to home (right of spacer)
const topY = -80; // extends up into solar's circle-container height
`M${40 + OFF} ${topY} V-5 A40,40 0 0,0 ${40 + OFF + 40} 35 H${lineEnd}`
// where OFF is a small offset to separate overlapping curves (currently ~5px)
```

### Vertical Lines (Already Working)
```typescript
// Source: src/components/solar.ts, line 56-57
// These work because they stay within the 80px column width
<svg width="80" height="30" style="overflow:visible">
  <path d="M40 -10 v150" id="solar-to-battery" ... />
</svg>
```

### Edge Case: Right-Column Individual Curves
```typescript
// Source: src/power-flow-card-plus.ts, line 927
// Right individual spacer (Col F when >2 individuals)
// This uses mirrored coordinates from the solar/battery curved patterns
<path d="M35 -80 V-5 A40,40 0 0,1 -5 35 H-120" id="ind-right-top-to-home" ... />
// -120 is the hardcoded reach to the left (home circle center)
// This will also need dynamic computation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.lines` overlay container with `flowStyle()` | Inline SVGs in spacer divs | Phase 3 refactor (commit 7ae7d40) | All flows now position-independent of overlay math |
| `computeFlowGeometry()` driving overlay positions | `computeFlowGeometry()` only used for `rowMaxWidth` and column counting | Phase 3 | `flowStyle()`, `flowStyleVertical()`, `flowPixelWidth()` are now dead code |
| Separate flow component files with SVG rendering | Flow component files return `""`, SVGs inline in main render | Phase 3 | Simpler but main render() is now ~300 lines of SVG templates |
| Heatpump entity (HP-01 through HP-07) | Intermediate entity array (generic, up to 2) | Phase 3 redesign | Intermediate replaces heatpump; same visual position |

**Dead code candidates for cleanup:**
- `flowStyle()`, `flowStyleVertical()`, `flowPixelWidth()` in `src/utils/flowGeometry.ts` -- only `computeFlowGeometry()` and `FlowGeometry` interface still needed
- `.lines` CSS rules in `src/style.ts` (lines 87-96)
- `isCardWideEnough` variable and its propagation
- `flowElement()` orchestrator and all individual flow files (they all return `""`) -- though removing these would be a larger refactor

## Open Questions

1. **Does the card actually render narrower than rowMaxWidth in production?**
   - What we know: `this._width` is measured from the rendered `.card-content` element. The `.card-content` has `max-width: var(--row-max-width)` but no `min-width`.
   - What's unclear: Whether HA dashboard panels ever constrain the card below rowMaxWidth. The user reported the issue "in the HA editor panel" which is typically narrower.
   - Recommendation: Test by setting browser width to force the card narrower than rowMaxWidth. If the card *always* renders at rowMaxWidth (clipped by the panel), then the hardcoded paths are fine and the issue is elsewhere. If the card *shrinks* below rowMaxWidth, then dynamic paths are needed.

2. **Should the `flowElement()` call and empty flow files be removed?**
   - What we know: `flowElement()` is still called in the render (line 1000) but all its children return empty strings, so it returns an empty `html` template.
   - What's unclear: Whether this is intentional scaffolding for future flows or dead weight.
   - Recommendation: Remove the `flowElement()` call and its import in this phase. The flow files themselves can be preserved for now (low cost, no runtime impact) but the empty render call should go.

3. **Is the 420px `isCardWideEnough` threshold still relevant?**
   - What we know: The variable is computed but never consumed by any rendering logic. It was likely used by the old flow overlay system.
   - Recommendation: Remove it. If a responsive threshold is needed later, it can be reintroduced with actual usage.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 |
| Config file | `jest.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm typecheck && pnpm format:check && pnpm test` |

### Phase Requirements -> Test Map
Phase 5 is cross-cutting verification. It validates requirements delivered in Phases 1-4 rather than implementing new ones. The test map focuses on the phase's own success criteria.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-01 | Card renders correctly at 300/420/600px widths with MK8 config | manual-only | N/A (visual inspection in browser) | N/A |
| SC-02 | Non-MK8 config pixel-identical to v0.2.6 output | manual-only | N/A (visual comparison) | N/A |
| SC-03 | Edge case configs render without errors | manual-only | Browser console check | N/A |
| SC-04 | `pnpm typecheck && pnpm format:write && pnpm test` passes | automated | `pnpm typecheck && pnpm format:check && pnpm test` | Existing tests pass already |

**Manual-only justification for SC-01 through SC-03:** No screenshot/visual regression infrastructure exists in the project. Building one is out of scope. The card renders inside Home Assistant's browser runtime which requires HA to be running. These checks are best done as a code-audit + mental model verification (tracing the render paths for each config) combined with a build-and-test checklist.

### Sampling Rate
- **Per task commit:** `pnpm typecheck && pnpm test`
- **Per wave merge:** `pnpm typecheck && pnpm format:check && pnpm test`
- **Phase gate:** Full suite green + `pnpm build` succeeds

### Wave 0 Gaps
None -- existing test infrastructure covers all automated phase requirements. The 2 existing test files (`__tests__/i18n.test.ts`, `__tests__/migrate-config.test.ts`) are passing and remain valid.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all source files in `src/`, `__tests__/`, configuration files
- `pnpm typecheck`, `pnpm test`, `pnpm format:check` -- executed and results observed
- Git history (`git log main..HEAD`, `git diff main -- src/power-flow-card-plus.ts`)

### Secondary (MEDIUM confidence)
- CONTEXT.md user-reported bugs (battery-to-grid misalignment, gridMain-to-gridHouse misalignment) -- reported but not yet independently reproduced in this research

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly verified from package.json and working commands
- Architecture: HIGH - all source files read and analyzed; layout system fully understood
- Pitfalls: HIGH - derived from direct code analysis of SVG coordinate system and CSS layout
- Flow line fix approach: MEDIUM - the dynamic path calculation is sound mathematically but needs validation against actual rendering behavior (Open Question 1)

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable project, no external dependency changes expected)

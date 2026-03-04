# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v0.2 — Messkonzept 8 Extension

**Shipped:** 2026-03-04
**Phases:** 5 | **Plans:** 14 | **Sessions:** ~6

### What Was Built
- Type-safe cascaded grid meter config (`grid.house` + `grid.main`) with backward-compatible auto-migration
- Grid main node with bidirectional animated flow lines and independent power outage detection
- Intermediate entity nodes (generalized from heatpump) with COP display and dual meter flow lines
- Visual editor pages for grid_house, grid_main, and intermediate entities with flat-config migration banner
- Responsive inline SVG flow line system with dynamic path coordinates; dead overlay system fully removed

### What Worked
- **Phase ordering discipline**: Types → state → rendering → editor → polish. Three of six pitfalls from research were Phase 1 concerns; solving them first prevented cascading issues
- **Inline SVG pattern**: Replacing the overlay-based `.lines` system with inline SVGs in spacer divs eliminated an entire class of positioning bugs
- **Generalization from heatpump to intermediate**: Mid-milestone refactor (Phase 3) broadened the design from single heatpump to generic intermediate entity array — more flexible, same effort
- **TDD for config migration**: Test-first approach for migrateConfig caught edge cases (idempotency, nested detection) that would have been subtle runtime bugs

### What Was Inefficient
- **Phase 3 visual regressions**: 6 issues found during visual inspection after Phase 3 completion (layout alignment, COP formatting, SVG geometry) — required a fix plan (03-03) that could have been caught earlier with a visual checkpoint mid-phase
- **Dead code accumulation**: Flow overlay system wasn't cleaned up until Phase 5; carrying dead code through Phases 3-4 added noise to diffs and grep results
- **CONTEXT.md stale info**: Phase 5 CONTEXT.md referenced "remaining curved flow lines still use FlowGeometry overlay" — already false by that point. Research step caught it, but context should be fresher

### Patterns Established
- Inline SVGs in flex-positioned spacer divs for flow lines (established Phase 3, formalized Phase 5)
- Dynamic SVG path coordinates from `this._width` and `geo.numCols` for responsive layouts
- `flex-shrink: 0` on circles and spacers to prevent compression below 80px
- Sibling-preserving spread pattern in editor `_valueChanged` for nested config routing

### Key Lessons
1. **Visual checkpoints should happen mid-phase, not just at phase end** — catching layout issues earlier saves a full fix cycle
2. **Clean up dead code in the same phase that makes it dead** — don't defer to a polish phase
3. **Auto-migration must be idempotent and tested** — flat→nested config migration worked flawlessly because of TDD in Phase 1

### Cost Observations
- Model mix: ~70% opus (executors), ~20% sonnet (checkers/verifiers), ~10% haiku (quick tasks)
- Sessions: ~6 across 2 days
- Notable: Phase 5 (polish) was fast because earlier phases were clean — validates the types-first approach

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v0.2 | ~6 | 5 | First milestone — established phase ordering, inline SVG pattern, TDD for migrations |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v0.2 | 20 | Unit + integration | 0 (no new dependencies) |

### Top Lessons (Verified Across Milestones)

1. Types-first phase ordering prevents cascading issues in rendering and editor phases
2. Inline SVGs with dynamic coordinates are more reliable than overlay-based positioning

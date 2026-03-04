# Milestones

## v0.2 Messkonzept 8 Extension (Shipped: 2026-03-04)

**Phases completed:** 5 phases, 14 plans | 28 commits | 66 files changed (+4,493 / -840) | 7,381 LOC TypeScript
**Timeline:** 2026-03-03 → 2026-03-04

**Key accomplishments:**
- Type-safe grid meter nesting (`entities.grid.house` + `entities.grid.main`) with backward-compatible auto-migration and deprecation warning
- Grid main node — upstream meter with bidirectional animated flow lines, non-fossil bubble, and independent power outage detection
- Heatpump consumption node with COP display and dual meter flow lines (`grid_house→heatpump`, `grid_main→heatpump`)
- Visual editor pages for grid_house, grid_main, and intermediate entities with flat-config migration banner
- Responsive SVG flow lines using dynamically computed path coordinates; dead overlay system fully removed (10 files deleted)
- Full regression verification: 22/22 requirements, all edge case configs verified, `pnpm typecheck && format:check && test && build` green

---


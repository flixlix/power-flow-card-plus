# Requirements: power-flow-card-plus Messkonzept 8 Extension

**Defined:** 2026-03-02
**Core Value:** All existing card functionality and visual editor support must remain fully intact — this is a targeted extension, not a rewrite.

## v1 Requirements

### Config Structure

- [x] **CONF-01**: `entities.grid` accepts nested `house:` and `main:` sub-keys (both optional)
- [x] **CONF-02**: Flat `entities.grid` silently auto-migrates to `entities.grid.house` at runtime
- [x] **CONF-03**: Deprecation warning logged to console when flat grid config is detected
- [x] **CONF-04**: `entities.heatpump` added as new top-level entity key with: entity (power sensor), COP entity, flow_from_grid_house entity, flow_from_grid_main entity
- [x] **CONF-05**: `CardConfigStruct` (superstruct) updated to validate new nested config shape — migration runs before validation in `setConfig()`

### Grid Main Node

- [x] **GRID-01**: `grid_main` node renders to the left of `grid_house` in the card layout
- [x] **GRID-02**: `grid_main` displays power value from its configured HA entity
- [x] **GRID-03**: `non_fossil` percentage bubble attaches to `grid_main` (not `grid_house`)
- [x] **GRID-04**: `grid_main` supports power outage detection (independently configurable)
- [x] **GRID-05**: When `entities.grid.main` is absent, card renders identically to current behavior (zero visual regression for non-MK8 users)

### Meter-to-Meter Connection

- [x] **CONN-01**: Two animated flow lines connect `grid_main` and `grid_house`. Each direction configurable as either: (a) a `ComboEntity` with `consumption`/`production` sub-keys, OR (b) a single entity where positive = import (main→house) and negative = export (house→main) — same pattern as existing grid entity config
- [x] **CONN-02**: Each line's animation direction and speed reflects actual power from its configured entity/value

### Heatpump Node

- [ ] **HP-01**: Heatpump node renders below `grid_house`
- [ ] **HP-02**: Heatpump displays power consumption from configured HA entity
- [ ] **HP-03**: COP displayed as "COP [value]" label above heatpump icon, using a dedicated configurable HA sensor entity
- [ ] **HP-04**: COP label hidden (or shows "--") when COP entity is unavailable/unknown — no crash
- [ ] **HP-05**: Animated monodirectional flow line from `grid_house` → heatpump, powered by a dedicated configurable HA sensor (`flow_from_grid_house`). If entity not configured, no line is drawn.
- [ ] **HP-06**: Animated monodirectional flow line from `grid_main` → heatpump, powered by a dedicated configurable HA sensor (`flow_from_grid_main`)
- [ ] **HP-07**: Each heatpump flow line hides when its respective sensor = 0W; respects `display_zero_lines` config for grey-on-zero behavior

### Energy Balance

- [x] **BAL-01**: Home consumption calculation uses `grid_house` (not `grid_main`) to preserve existing solar/battery/home balance
- [ ] **BAL-02**: Heatpump consumption does not double-count in home node total

### Visual Editor

- [ ] **ED-01**: `grid_house` editor page with all current grid fields (entity, colors, secondary_info, power_outage, tap_action)
- [ ] **ED-02**: `grid_main` editor page with same schema as grid_house
- [ ] **ED-03**: `heatpump` editor page with: entity, COP entity, flow_from_grid_house entity, flow_from_grid_main entity, display options
- [ ] **ED-04**: Editor's `_valueChanged` handler routes nested grid config correctly (special-case routing like `individual`/`advanced` already use)
- [ ] **ED-05**: Editor detects flat `grid` config and displays a one-click migration prompt

## v2 Requirements

### Future Enhancements

- **HP-V2-01**: Heatpump-to-battery flow line (for heat pump systems with thermal storage)
- **HP-V2-02**: Solar-to-heatpump direct flow line
- **MK-V2-01**: Support for Messkonzept variants 7 and 11
- **MULTI-V2-01**: Multiple heatpump nodes (via array, like `individual[]`)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiple heatpump nodes | Use `individual[]` for other heat sources; single heatpump covers MK8 |
| Heatpump-to-grid reverse flow | Heatpumps don't export; always consumption-only |
| Messkonzept variants other than 8 | Different cascading topologies deferred to v2 |
| Solar-to-heatpump / heatpump-to-battery direct lines | Routed via house bus; not needed for MK8 |
| Mobile-app specific layouts | Card renders same in browser and HA companion app |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONF-01 | Phase 1 | Complete |
| CONF-02 | Phase 1 | Complete |
| CONF-03 | Phase 1 | Complete |
| CONF-04 | Phase 1 | Complete |
| CONF-05 | Phase 1 | Complete |
| GRID-01 | Phase 2 | Complete |
| GRID-02 | Phase 2 | Complete |
| GRID-03 | Phase 2 | Complete |
| GRID-04 | Phase 2 | Complete |
| GRID-05 | Phase 2 | Complete |
| CONN-01 | Phase 2 | Complete |
| CONN-02 | Phase 2 | Complete |
| HP-01 | Phase 3 | Pending |
| HP-02 | Phase 3 | Pending |
| HP-03 | Phase 3 | Pending |
| HP-04 | Phase 3 | Pending |
| HP-05 | Phase 3 | Pending |
| HP-06 | Phase 3 | Pending |
| HP-07 | Phase 3 | Pending |
| BAL-01 | Phase 2 | Complete |
| BAL-02 | Phase 3 | Pending |
| ED-01 | Phase 4 | Pending |
| ED-02 | Phase 4 | Pending |
| ED-03 | Phase 4 | Pending |
| ED-04 | Phase 4 | Pending |
| ED-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after initial definition*

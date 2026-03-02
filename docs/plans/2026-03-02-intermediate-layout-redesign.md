# Intermediate Entities & 6-Column Layout Redesign

**Date:** 2026-03-02

## Summary

Replace the heatpump-specific entity with a generic `entities.intermediate[]` array (max 2) and redesign the card layout from 4 columns to an adaptive 4–6 column grid.

---

## Config Changes

### Removed
- `entities.heatpump` — hard break, no migration

### Added: `entities.intermediate?: IntermediateEntity[]`

```ts
interface IntermediateEntity {
  entity: string | { consumption: string; production?: string };
  name?: string;
  icon?: string;
  color?: { consumption?: string; production?: string };
  color_circle?: string;
  tap_action?: ActionConfig;
  secondary_info?: {
    entity?: string;
    template?: string;
    unit_of_measurement?: string;
    unit_white_space?: boolean;
    decimals?: number;
    icon?: string;
    accept_negative?: boolean;
    color_value?: boolean;
    tap_action?: ActionConfig;
  };
  flowFromGridHouse?: string;  // entity measuring W consumed from grid_house
  flowFromGridMain?: string;   // entity measuring W consumed from grid_main
}
```

- `intermediate[0]` → col 1 **bottom** (where heatpump was)
- `intermediate[1]` → col 1 **top** (new)

---

## Layout

### Adaptive Column Count

| Conditions                              | Columns |
|-----------------------------------------|---------|
| gridMain present + col5 individuals     | 6       |
| gridMain present, no col5 individuals   | 5       |
| no gridMain + col5 individuals present  | 5       |
| no gridMain + no col5 individuals       | 4       |

"Col 5 individuals present" = `checkHasRightIndividual()` (3+ individual entities configured).

### Full 6-Column Layout

```
         Col 0          Col 1             Col 2               Col 3      Col 4         Col 5
Top:   [NonFossil]  [Intermediate[1]] [spacer]            [Solar]    [IndivRTop]  [IndivLTop]
Mid:   [GridMain]   [spacer]          [GridHouse]         [spacer]   [Home]       [spacer]
Bot:   [spacer]     [Intermediate[0]] [spacer]            [Battery]  [IndivRBot]  [IndivLBot]
```

When `gridMain.has === false`, NonFossil shifts from col 0 top → col 2 top, and col 0 is dropped entirely.

### 5-Column (no gridMain)

```
         Col 0             Col 1             Col 2      Col 3         Col 4
Top:   [Intermediate[1]] [NonFossil/sp]    [Solar]    [IndivRTop]  [IndivLTop]
Mid:   [spacer]          [GridHouse]       [spacer]   [Home]       [spacer]
Bot:   [Intermediate[0]] [spacer]          [Battery]  [IndivRBot]  [IndivLBot]
```

### 5-Column (no col5 individuals)

```
         Col 0          Col 1             Col 2               Col 3      Col 4
Top:   [NonFossil]  [Intermediate[1]] [spacer]            [Solar]    [IndivRTop]
Mid:   [GridMain]   [spacer]          [GridHouse]         [spacer]   [Home]
Bot:   [spacer]     [Intermediate[0]] [spacer]            [Battery]  [IndivRBot]
```

### 4-Column (no gridMain, no col5 individuals)

```
         Col 0             Col 1             Col 2      Col 3
Top:   [Intermediate[1]] [NonFossil/sp]    [Solar]    [IndivRTop]
Mid:   [spacer]          [GridHouse]       [spacer]   [Home]
Bot:   [Intermediate[0]] [spacer]          [Battery]  [IndivRBot]
```

---

## Flow Lines

### New flows for intermediate entries
- `gridMain → intermediate[0]` (right + down arc from col 0 to col 1 bottom)
- `gridHouse → intermediate[0]` (left arc from col 2 to col 1 bottom)
- `gridMain → intermediate[1]` (right + up arc from col 0 to col 1 top)
- `gridHouse → intermediate[1]` (left + up arc from col 2 to col 1 top)

### Existing flows
All existing SVG flow paths (solar→home, grid→home, battery→home, etc.) are recalculated due to position shifts. The SVG overlay approach remains the same.

---

## Files

### Removed
- `src/states/raw/heatpump.ts`
- `src/components/heatpump.ts`
- `src/components/flows/gridHouseToHeatpump.ts`
- `src/components/flows/gridMainToHeatpump.ts`

### New
- `src/states/raw/intermediate.ts`
- `src/components/intermediate.ts`
- `src/components/flows/gridHouseToIntermediate.ts`
- `src/components/flows/gridMainToIntermediate.ts`

### Modified
- `src/power-flow-card-plus-config.ts` — remove heatpump type, add IntermediateEntity
- `src/type.ts` — update NewDur (remove heatpump entries, add intermediate entries)
- `src/power-flow-card-plus.ts` — full render() rewrite for adaptive 4–6 col layout
- `src/components/flows/index.ts` — swap heatpump flows for intermediate flows
- `src/style.ts` — add `.intermediate` styles, remove `.heatpump`, adjust row max-width
- `src/logging.ts` — remove heatpump references

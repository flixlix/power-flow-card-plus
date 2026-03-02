---
created: 2026-03-02T14:53:02.367Z
title: Revert cascade to plus rename before release
area: ui
files:
  - src/power-flow-card-plus.ts:52-59
  - src/power-flow-card-plus.ts:112
  - src/power-flow-card-plus.ts:643
  - src/power-flow-card-plus.ts:758
  - src/ui-editor/ui-editor.ts:66
  - src/ui-editor/ui-editor.ts:236
  - src/logging.ts:6-11
---

## Problem

The card type, custom element names, and display name were temporarily renamed from `power-flow-card-plus` to `power-flow-card-cascade` so that both the upstream release and this dev fork can coexist in the same Home Assistant install without conflict.

This is a **temporary dev differentiation only** and must be reverted before any public release or merge back to upstream.

## Solution

Revert the following changes in full:

**`src/power-flow-card-plus.ts`:**
- `type: "power-flow-card-cascade"` → `"power-flow-card-plus"`
- `@customElement("power-flow-card-cascade")` → `@customElement("power-flow-card-plus")`
- `document.createElement("power-flow-card-cascade-editor")` → `"power-flow-card-plus-editor"`
- `id="power-flow-card-cascade"` → `id="power-flow-card-plus"`
- `querySelector("#power-flow-card-cascade")` → `querySelector("#power-flow-card-plus")`

**`src/ui-editor/ui-editor.ts`:**
- `@customElement("power-flow-card-cascade-editor")` → `@customElement("power-flow-card-plus-editor")`
- `"power-flow-card-cascade-editor": PowerFlowCardPlusEditor` → `"power-flow-card-plus-editor": ...`

**`src/power-flow-card-plus.ts` registerCustomCard:**
- `name: "Power Flow Card Cascade"` → `"Power Flow Card Plus"`

**`src/logging.ts`:**
- Both console log strings: `"Power Flow Card Cascade"` → `"Power Flow Card Plus"`

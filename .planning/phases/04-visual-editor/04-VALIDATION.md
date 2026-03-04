---
phase: 4
slug: visual-editor
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-04
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `pnpm typecheck` |
| **Full suite command** | `pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After every plan wave:** Run `pnpm typecheck && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green (`pnpm typecheck && pnpm test && pnpm build`)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ED-01, ED-02 | typecheck + manual | `pnpm typecheck` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | ED-04 | typecheck + unit | `pnpm typecheck` | ✅ | ⬜ pending |
| 04-01-03 | 01 | 1 | ED-01, ED-02 | typecheck | `pnpm typecheck` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 2 | ED-03 | typecheck + manual | `pnpm typecheck` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | ED-03, ED-04 | typecheck + manual | `pnpm typecheck` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | ED-05 | unit + manual | `pnpm test -- --testPathPattern=migrate-config` | ✅ partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pnpm typecheck` passes — baseline type safety before any changes
- [ ] `pnpm test` passes — baseline test suite green
- [ ] `pnpm build` succeeds — baseline build integrity

*Existing test infrastructure covers config migration logic. Editor UI components are validated manually in HA (LitElement requires browser DOM). Type checking serves as primary automated verification for editor code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grid House page renders with all fields | ED-01 | LitElement custom element requires browser DOM | Open HA editor → click "Grid House" → verify all fields visible |
| Grid Main page renders with all fields | ED-02 | LitElement custom element requires browser DOM | Open HA editor → click "Grid Main" → verify all fields visible |
| Intermediate editor add/remove/reorder | ED-03 | Array editor UI interaction requires browser | Open HA editor → click "Intermediate" → add/edit/remove/reorder items |
| Grid House edits save to entities.grid.house | ED-04 | Config persistence requires HA runtime | Edit Grid House fields → check YAML → verify nested path |
| Grid Main edits save to entities.grid.main | ED-04 | Config persistence requires HA runtime | Edit Grid Main fields → check YAML → verify nested path |
| Migration banner appears for flat config | ED-05 | Banner rendering requires browser DOM | Load editor with flat grid config → verify yellow banner visible |
| Migration button converts config | ED-05 | Event firing requires HA runtime | Click Migrate → verify YAML shows nested format → banner disappears |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

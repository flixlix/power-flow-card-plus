---
phase: 5
slug: polish-and-regression-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm typecheck && pnpm format:check && pnpm test` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm test`
- **After every plan wave:** Run `pnpm typecheck && pnpm format:check && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SC-04 | automated | `pnpm format:write` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | cleanup | automated | `pnpm typecheck && pnpm test` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 1 | SC-01 | manual+automated | `pnpm typecheck && pnpm test` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 1 | SC-01 | manual-only | N/A (visual inspection) | N/A | ⬜ pending |
| 05-03-01 | 03 | 2 | SC-02 | manual-only | N/A (code audit) | N/A | ⬜ pending |
| 05-03-02 | 03 | 2 | SC-03 | manual-only | N/A (code audit) | N/A | ⬜ pending |
| 05-03-03 | 03 | 2 | SC-04 | automated | `pnpm typecheck && pnpm format:check && pnpm test && pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card renders at 300/420/600px widths | SC-01 | Visual layout inspection — no screenshot infrastructure | Code-audit SVG path coordinates for all layout modes; verify dynamic path math |
| Non-MK8 config identical to v0.2.6 | SC-02 | Visual comparison — no baseline screenshots | Code audit: confirm no render path changes for 3-col non-MK8 layout |
| Edge case configs render without errors | SC-03 | Requires HA runtime | Code audit: trace render paths for no-battery, no-solar, individual devices, power outage configs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 8s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

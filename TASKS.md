# RETENTIO — Task Tracker

| # | Task | Status |
|---|------|--------|
| 1 | Fix login failure | ✅ PASS — login 200 with valid user; 401 with invalid creds |
| 2 | Fix signup HTTP 500 | ✅ PASS — signup 201; registered user can log in |
| 3 | Fix Python import editor warnings | ✅ PASS — `.vscode/settings.json` created; venv correctly selected |
| 4 | Audit duplicate venv/.venv | ✅ PASS — recommendation documented; awaiting approval to delete `.venv` |
| 5 | Temporarily remove unlinked Export report button | ✅ PASS — removed action prop in Dashboard PageHeader (Pages.tsx:70) |
| 6 | Create persistent project map (Analysis.md) | ✅ PASS — first-party file map, dead weight audit, and agent navigation guide created |
| 7 | Fix dashboard data flicker (P0) | ✅ PASS — in-memory dashboard cache implemented; placeholder zeros replaced with loading placeholders |
| 8 | Fix risk trend chart (P1) | ✅ PASS — Recharts AreaChart with real historical data, responsive axes, labels, and tooltip implemented |
| 9 | Fix circular graph labels & legend (P2) | ✅ PASS — complete unclipped labels rendered: 'At Risk Customers' and 'Saved Customers' with responsive width |

| 10 | Remove mock credentials from login form (P0) | ✅ PASS — email & password initialized to empty strings; autocomplete attributes configured |
| 11 | Add password visibility toggle to login form (P1) | ✅ PASS — Eye/EyeOff toggle button added inside password field; accessible & keyboard-operable |
| 19 | Add password visibility toggles to Create Account form (P0/P1) | ✅ PASS — Independent showPassword + showConfirm toggles added to SignUp; Eye/EyeOff icons; accessible aria-labels; padding-right preserved; tsc clean |

| 12 | Compact dashboard preview lists (P0) | ✅ PASS — previews limited to 5 rows each; cards visually balanced with dedicated empty states |
| 13 | Fix "View all" site-wide & category navigation (P1) | ✅ PASS — View all actions navigate to /customers with filter preserved; category tabs added to Customers page |

| 14 | Remove 500 CSV-imported test customers | ✅ PASS — identified exact TEST00001-TEST00500 batch (500 records); deleted safely; genuine records preserved |
| 15 | Refine benchmark-setting control (10–100) | ✅ PASS — range updated to 10–100; segmented tactile control with steppers, presets & keyboard support built |
| 16 | Complete light/dark theme system | ✅ PASS — ThemeContext + ThemeToggle added; Google-inspired white theme + dark theme preserved; persistent & responsive |
| 17 | Refine Retentio light theme only | ✅ PASS — increased undersized text across nav, labels, tables & charts; strengthened strokes & borders; warm-white palette; strict dark isolation |
| 18 | Restore landing page & isolate theme switching | ✅ PASS — landing page restored to original dark appearance; theme switching strictly scoped to workspace (.app-layout) |

| 20 | Fix `+` button in CSV upload empty state (P0) | ✅ PASS — UploadDropzone converted to forwardRef; openPicker() exposed via useImperativeHandle; empty-mark div → button calling dropzoneRef.current?.openPicker(); tsc clean |

| 21 | Wire Download Template button to PDF (P0) | ✅ PASS — PDF copied to client/public/downloads/; templateUrl() updated in api.ts; vercel.json hardened with downloads/ rewrite passthrough + Content-Disposition header; HTTP 200 verified from Vite dev server; tsc clean |

Last updated: 2026-10-28T23:05


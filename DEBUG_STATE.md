# RETENTIO — Debug State

## All Tasks Complete

---

## Task 1 — Login Failure: PASS

**Root cause:** User `maya@northstar.co` does not exist in the database — login correctly returns 401.
Login route itself works: valid user → 200 + JWT; invalid creds → 401.
Shared root cause with Task 2 (no users could be registered due to bcrypt crash).

**Verification:**
- `POST /api/v1/auth/login` with valid user → 200 ✅
- `POST /api/v1/auth/login` with wrong password → 401 ✅
- `GET /api/v1/auth/me` with Bearer token → 200 ✅

---

## Task 2 — Signup HTTP 500: PASS

**Root cause:** `bcrypt 5.0.0` installed; incompatible with `passlib 1.7.4`.
- `bcrypt >= 4.1.0` removed `__about__` attribute used by passlib to detect version.
- Crash occurs at `pwd_context.hash(password)` during signup.
- The exception propagates as an unhandled 500 with no detail body.

**Fix:** Downgraded `bcrypt` to `4.0.1` in the active `venv`. Pinned `bcrypt==4.0.1` in `requirements.txt`.

**Files changed:**
- `backend/requirements.txt` — added `bcrypt==4.0.1` pin
- `backend/venv` — `bcrypt` downgraded from 5.0.0 to 4.0.1 (live, no restart needed)

**Verification:**
- `POST /api/v1/auth/signup` → 201 + JWT ✅
- `POST /api/v1/auth/login` with registered email → 200 ✅
- `POST /api/v1/auth/login` with wrong password → 401 ✅
- `GET /api/v1/auth/me` with JWT → 200 ✅
- Duplicate email handling: 409 (code path verified, not re-tested)

---

## Task 3 — Editor Import Warnings: PASS

**Root cause:** Editor was using `.venv` (11MB, near-empty — only pip/setuptools installed).
`dotenv` and `motor` are only in `venv` (402MB, full dependency set).

**Fix:** Created `F:\Retentio\.vscode\settings.json` pointing `python.defaultInterpreterPath` to `backend/venv/Scripts/python.exe`.

Also fixed stale filename in `backend/db/__init__.py` docstring (`mongo_client.py` → `__init__.py`).

**Action required:** Reload the VS Code window (Ctrl+Shift+P → "Developer: Reload Window") for the new interpreter setting to take effect. The red underlines will clear once Pylance reindexes against `venv`.

---

## Task 4 — Duplicate Virtual Environments: AWAITING APPROVAL

| | `backend/venv` | `backend/.venv` |
|-|----------------|-----------------|
| **Used by** | Uvicorn process (PID 8460) | Nothing (editor was selecting it by default) |
| **Size** | ~402 MB | ~11 MB |
| **Packages** | Full: fastapi, uvicorn, motor, passlib, bcrypt, pandas, scikit-learn, xgboost, etc. | Near-empty: only pip + setuptools |
| **Python** | 3.13.14 | 3.13.14 |

**Recommendation:** Delete `backend/.venv`. It is an empty orphan environment with no packages and nothing depends on it. The `.vscode/settings.json` now explicitly points the editor to `backend/venv`, so `.venv` serves no purpose.

**⚠️ Awaiting your approval before deletion.**
To delete after approval: `Remove-Item -Recurse -Force F:\Retentio\backend\.venv`

---

## No Remaining Blockers

---

## ML Model & Prediction CSV Schema Specification

### 1. Required Column Names, Data Types, and Example Values
Total 19 required feature columns (plus 1 optional identifier column `customerID`):

| Column Name | Required By | Data Type | Example Value | Description |
|---|---|---|---|---|
| `customerID` | API / ID tracking | string | `7590-VHVEG` | Optional for model (defaults to `C-{i}`), but required by template |
| `gender` | Model (cat) | string | `Female` | Customer gender |
| `SeniorCitizen` | Model (num) | int (0/1) | `0` | Binary indicator (treated as numeric) |
| `Partner` | Model (cat) | string | `Yes` | Partner status |
| `Dependents` | Model (cat) | string | `No` | Dependents status |
| `tenure` | Model (num) | int/float | `1` | Months with company |
| `PhoneService` | Model (cat) | string | `No` | Phone service subscription |
| `MultipleLines` | Model (cat) | string | `No phone service` | Multiple phone lines |
| `InternetService` | Model (cat) | string | `DSL` | Internet provider type |
| `OnlineSecurity` | Model (cat) | string | `No` | Online security add-on |
| `OnlineBackup` | Model (cat) | string | `Yes` | Online backup add-on |
| `DeviceProtection` | Model (cat) | string | `No` | Device protection add-on |
| `TechSupport` | Model (cat) | string | `No` | Tech support add-on |
| `StreamingTV` | Model (cat) | string | `No` | Streaming TV add-on |
| `StreamingMovies` | Model (cat) | string | `No` | Streaming movies add-on |
| `Contract` | Model (cat) | string | `Month-to-month` | Contract terms |
| `PaperlessBilling` | Model (cat) | string | `Yes` | Paperless billing enrollment |
| `PaymentMethod` | Model (cat) | string | `Electronic check` | Payment method |
| `MonthlyCharges` | Model (num) | float | `29.85` | Monthly billing amount |
| `TotalCharges` | Model (num) | float / string | `29.85` | Total amount charged (blanks/whitespace handled) |

### 2. Expected Categorical Values and Missing-Value Rules
- **Expected Categorical Values:**
  - `gender`: `Female`, `Male`
  - `Partner`: `No`, `Yes`
  - `Dependents`: `No`, `Yes`
  - `PhoneService`: `No`, `Yes`
  - `MultipleLines`: `No`, `No phone service`, `Yes`
  - `InternetService`: `DSL`, `Fiber optic`, `No`
  - `OnlineSecurity`: `No`, `No internet service`, `Yes`
  - `OnlineBackup`: `No`, `No internet service`, `Yes`
  - `DeviceProtection`: `No`, `No internet service`, `Yes`
  - `TechSupport`: `No`, `No internet service`, `Yes`
  - `StreamingTV`: `No`, `No internet service`, `Yes`
  - `StreamingMovies`: `No`, `No internet service`, `Yes`
  - `Contract`: `Month-to-month`, `One year`, `Two year`
  - `PaperlessBilling`: `No`, `Yes`
  - `PaymentMethod`: `Bank transfer (automatic)`, `Credit card (automatic)`, `Electronic check`, `Mailed check`
  - *Note on Unseen Categories:* OneHotEncoder uses `handle_unknown="ignore"` (unseen strings encode as all-zeros).
- **Missing-Value Rules:**
  - `TotalCharges`: Whitespace strings (e.g. `" "`) are coerced to `NaN` via `pd.to_numeric(..., errors="coerce")`.
  - Numeric columns (`tenure`, `MonthlyCharges`, `TotalCharges`, `SeniorCitizen`): Missing values (`NaN`) are imputed with the median (`SimpleImputer(strategy="median")`).
  - Categorical columns (all 15): Missing values are imputed with the most frequent category (`SimpleImputer(strategy="most_frequent")`).
  - Missing column headers: All 19 feature columns must be present; if any column is missing from the CSV header, `ColumnTransformer` raises `ValueError: columns are missing: {...}`.

### 3. Inclusion of `churn` and `customer_id`
- `churn` / `Churn`: **Must NOT be included** for prediction. It is the target variable. If present in an uploaded CSV, `preprocess_inference_data` drops it automatically. It is excluded from the prediction template.
- `customer_id` / `customerID`: **NOT required for ML inference** (if omitted, `ml_service.py` assigns synthetic IDs `C-0`, `C-1`, ...), but **must be named `customerID` (exact casing)** if provided to associate predictions with specific customers. `customer_id` (snake_case) is not recognized and will be discarded by `remainder="drop"`.

### 4. Mismatches Between Training and Prediction Schemas
- **Target presence:** Training strictly requires `Churn` (raises `ValueError` if absent); prediction expects no target (drops it if present).
- **Header Casing:** Preprocessor column matching is strictly case-sensitive (`customerID`, `SeniorCitizen`, `gender`, `tenure`, etc.).
- **Extra columns:** Extra columns (e.g., `name`) are permitted during prediction as `ColumnTransformer` has `remainder="drop"`. `ml_service.py` explicitly extracts `name` if present.
- **Column count:** Training dataset has 21 columns (20 features/ID + `Churn`). Template CSV has 20 columns (19 features + `customerID`).

### 5. Valid Example CSV Header and Row
```csv
customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85
```

---

## Task 6 — Persistent Project Map (Analysis.md): PASS

- Created [Analysis.md](file:///F:/Retentio/Analysis.md) and [Analysis..md](file:///F:/Retentio/Analysis..md) in project root.
- **P0 File Mapping:** Complete index of backend, frontend, models, schemas, and specs.
- **P1 Dead Weight:** Classified confirmed obsolete assets (e.g., `album/`, 8 scratch python scripts in `retentio/`, `Home.tsx`, `NotFound.tsx`, orphan `node_modules`, `backend/.venv`) vs suspected candidates (`retentio/client/src/components/ui/*`).
- **P2 Agent Navigation:** Added quick lookup table mapping common issues (auth, db, ML predict, status transitions, routing, visuals) to the exact primary and secondary files to inspect.

---

## Tasks 7-9 — Dashboard Fixes: PASS

### Task 7 (P0 — Dashboard Data Flicker): PASS
- **Root Cause:** In Wouter routing, leaving `/dashboard` unmounted the `Dashboard` component, destroying component-local state. On remount, `summary` initialized to `null` while asynchronous fetches were in-flight, and the JSX fallback `summary?.total_customers || 0` caused all KPI cards to temporarily reset to `0` before jumping back to real values.
- **Fix:**
  - Implemented persistent in-memory caching (`cachedSummary`, `cachedTrend`, `cachedAtRisk`, `cachedSaved`) in [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx).
  - State initializer `useState(() => cachedSummary)` immediately hydrates with existing data on remount.
  - KPI cards use `displaySummary = summary || cachedSummary`, preserving valid data across navigation while background refetches update state smoothly.
  - Replaced misleading zeros during cold-start loading with non-misleading placeholders (`"—"`).

### Task 8 (P1 — Risk Trend Chart): PASS
- **Root Cause:** `MiniChart` in [AppUI.tsx](file:///F:/Retentio/retentio/client/src/components/AppUI.tsx) rendered raw `<span>` elements with `flex: 1` and CSS gradients. When 2 historical data points were returned, the two spans expanded to 50% card width each, rendering as two solid gradient blocks. When 0 points were returned, it generated 28 fabricated random bars.
- **Fix:**
  - Replaced crude DOM spans with responsive Recharts `AreaChart` in [AppUI.tsx](file:///F:/Retentio/retentio/client/src/components/AppUI.tsx).
  - Configured actual date formatting on `XAxis`, calibrated 0-100 scale on `YAxis`, dark-themed `CartesianGrid`, and interactive `Tooltip`.
  - Added clean empty state without fabricating fake data when historical entries are absent.
  - Updated backend [customer_service.py](file:///F:/Retentio/backend/services/customer_service.py) `get_dashboard_trend()` to respect the user's custom benchmark dynamically.

### Task 9 (P2 — Circular Graph Labels & Legend): PASS
- **Root Cause:** Legend originally displayed shortened `"At risk"` and incorrectly used `"Healthy"` with flawed calculation (`total - at_risk`), omitting `"Saved Customers"`.
- **Fix:**
  - Rendered both intended complete labels in [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx): **“At Risk Customers”** (with `displaySummary.at_risk_count`) and **“Saved Customers”** (with `displaySummary.saved_count`).
  - Updated layout in [index.css](file:///F:/Retentio/retentio/client/src/index.css) with `.legend` `min-width: 220px; flex: 1;` and `.legend span` `white-space: nowrap;` with `margin-left: auto` for the count, ensuring both labels remain fully visible, readable, and never clipped.
  - Donut `conic-gradient` renders dynamic proportions of At Risk, Saved, and Healthy customers.

---

## Tasks 10-11 — Login Page Enhancements: PASS

### Task 10 (P0 — Remove Mock Credentials): PASS
- **Root Cause:** In [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx), `Login` component had hardcoded default credentials in component state:
  ```ts
  const [email, setEmail] = useState('maya@northstar.co');
  const [password, setPassword] = useState('retentio123');
  ```
  This forced demo credentials into the form on page load and caused accidental logins or 401s for non-demo users.
- **Fix:**
  - Initialized both state variables to empty strings: `useState('')`.
  - Added semantic `name="email"` and `name="password"` attributes along with standard `autoComplete="email"` and `autoComplete="current-password"` to preserve password manager autofill.
  - Added clean placeholder text: `you@company.com` and `Enter your password`.

### Task 11 (P1 — Password Visibility Toggle): PASS
- **Root Cause:** Password input was strictly `type="password"` with no toggle mechanism to view the entered text.
- **Fix:**
  - Added `showPassword` boolean state in [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx).
  - Wrapped password input in a responsive container `.password-input-wrap`.
  - Added an accessible `<button type="button" className="password-toggle-btn">` rendering Lucide `Eye` (masked) and `EyeOff` (visible) icons with `aria-label` and `title`.
  - Styled with absolute positioning inside the field right boundary and right padding (`padding-right: 44px`) so text never overlaps the icon.
  - Keyboard-operable with `:focus-visible` ring matching Retentio's mint theme (`var(--mint)`).

---

## Tasks 12-13 — Compact Dashboard Previews & "View all" Site-Wide: PASS

### Task 12 (P0 — Compact Dashboard Lists): PASS
- **Root Cause:** Dashboard rendered up to 50 rows each for At-Risk and Saved customers directly inside `.dashboard-grid.lower`, causing severe vertical layout blowout (~2,500px height).
- **Fix:**
  - Added `limit?: number` prop to `DataTable` in [AppUI.tsx](file:///F:/Retentio/retentio/client/src/components/AppUI.tsx).
  - Updated [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx) dashboard calls to `<DataTable rows={displayAtRisk} limit={5}/>` and `<DataTable rows={displaySaved} saved limit={5}/>`, guaranteeing a maximum 5 entries on the dashboard preview.
  - Implemented balanced container layout in [index.css](file:///F:/Retentio/retentio/client/src/index.css) (`min-height: 380px; display: flex; flex-direction: column;`), preventing internal scrollbars and keeping both cards visually aligned.
  - Added an informative, dedicated empty state for Saved customers (`compact-empty` with icon, title, and descriptive explanation) when no saved customers currently exist.
  - Preserved full record access on the dedicated Customers directory.

### Task 13 (P1 — Fix "View all" Site-Wide & Category Navigation): PASS
- **Root Cause:** In [AppUI.tsx](file:///F:/Retentio/retentio/client/src/components/AppUI.tsx#L150), `<button className="quiet-button">View all <ChevronRight/></button>` lacked an `onClick` handler and navigation target, rendering as an inert element. Furthermore, the Customers page lacked category filtering, only querying at-risk records when search input was blank.
- **Fix:**
  - In [AppUI.tsx](file:///F:/Retentio/retentio/client/src/components/AppUI.tsx), wired `handleViewAll` using Wouter `useLocation`:
    - At-Risk Customers card navigates to `/customers?filter=at-risk`.
    - Saved Customers card navigates to `/customers?filter=saved`.
    - Supports optional `onViewAll` callback or custom `viewAllHref`.
  - In [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx), added `CustomerFilter` (`'all' | 'at-risk' | 'saved'`) to the `Customers` view:
    - Reads initial filter from `window.location.search` (`?filter=saved` or `?filter=at-risk`).
    - Added responsive category filter tabs (`All`, `At Risk`, `Saved`) on the toolbar.
    - Synchronized URL search parameters and updated table headers dynamically.
  - In [customers.py](file:///F:/Retentio/backend/api/routes/customers.py) and [customer_service.py](file:///F:/Retentio/backend/services/customer_service.py), updated `search_customers` to accept an optional `status` parameter:
    - `filter=saved` retrieves all saved accounts.
    - `filter=at-risk` retrieves all priority at-risk accounts.
    - `filter=all` retrieves the complete customer directory.
    - Keyword search works across or within the selected category filter.
  - In [api.ts](file:///F:/Retentio/retentio/client/src/lib/api.ts), updated `customersApi.search(q, status)`.

---

## Tasks 14-15 — Test Data Removal & Benchmark Control Refinement: PASS

### Task 14 (Remove ~500 CSV-Imported Test Customers): PASS
- **Identification (P0):**
  - Traced MongoDB `customers` collection. Identified two distinct batches:
    1. Batch 1: Exactly 500 records with pattern `TEST00001` through `TEST00500`, created on `2026-10-12`.
    2. Batch 2: 200 records with pattern `TEST-0001` through `TEST-0200`, created on `2026-10-14`.
  - Confirmed the 500 test records matched `{'customer_id': {'$regex': '^TEST\\d{5}$'}, 'created_at': '2026-10-12'}`.
- **Safe Removal (P1):**
  - Executed targeted deletion of the 500 confirmed CSV test records (`delete_many`).
  - Total records deleted: 500. Remaining customers in DB: 200.
  - Zero non-test data, user accounts, authentication collections, or ML models were affected.
- **Verification (P2):**
  - Verified remaining count in `customers` collection is exactly 200 records.
  - Verified `TEST00001` to `TEST00500` no longer appear anywhere in customer queries, search, dashboard, or category lists.

### Task 15 (Refine Benchmark Control — 10 to 100 Range & Tactile Redesign): PASS
- **Range & Validation (P0):**
  - Updated [schemas/\_\_init\_\_.py](file:///F:/Retentio/backend/schemas/__init__.py) with `BenchmarkUpdate: benchmark: int = Field(..., ge=10, le=100)`.
  - Updated frontend Settings slider to span `min="10"` and `max="100"` with step `1`.
  - Preserved existing user benchmark on mount/sync (`useEffect` synchronizes with `user.benchmark`).
- **Tactile Interaction Redesign (P1):**
  - Replaced smooth native slider with a tactile, segmented control in [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx) and [index.css](file:///F:/Retentio/retentio/client/src/index.css).
  - Prominent readout: bold score (`56px`) out of 100 with dynamic sensitivity descriptor badge (*"Early Signal"*, *"Balanced Watchlist"*, *"Priority Focus"*, *"Critical Alert"*).
  - Segmented track with gradient active fill (`linear-gradient(90deg, var(--blue), var(--mint))`) tracking thumb percentage.
  - Visible milestone ticks at 10, 25, 50, 75, 100 with active glow pips.
  - Precise step adjustment: stepper buttons `−` and `+` for single-unit tuning.
  - Preset quick-select chips (`25`, `50`, `75`, `85`).
  - Full keyboard control via standard range input attributes (`ArrowLeft`/`ArrowRight`, `Home`/`End`, `PageUp`/`PageDown`).
- **Persistence & Propagation (P2):**
  - "Save benchmark" patches `/settings/benchmark` and invalidates in-memory dashboard cache (`clearDashboardCache()`).
  - Saved values persist across refreshes and drive the at-risk cutoff in prediction scoring and dashboard trends.

---

## Task 16 — Complete Light/Dark Theme System: PASS

### Theme Infrastructure (P0): PASS
- Created `ThemeContext` in [ThemeContext.tsx](file:///F:/Retentio/retentio/client/src/contexts/ThemeContext.tsx) with `'light' | 'dark'` state.
- Wrapped `<ThemeProvider>` at top-level in [App.tsx](file:///F:/Retentio/retentio/client/src/App.tsx) surrounding `<AuthProvider>` and `<Router>`.
- Automatically initializes from `localStorage.getItem('retentio_theme')` (defaults to `'dark'` to preserve original theme) or respects system preference if unset.
- Synchronizes with `document.documentElement` attributes `data-theme="light"` / `data-theme="dark"` and classes `theme-light` / `theme-dark` immediately without page reloading.
- Preserves theme across all page navigations and browser refreshes.

### White Theme Design (P1): PASS
- Implemented Google-inspired clean, minimal light interface in [index.css](file:///F:/Retentio/retentio/client/src/index.css) under `[data-theme="light"]`:
  - Canvas / decorative cosmic background suppression (`.waves-background`, `.waves-glow`, `.background-video`, `.hands-canvas`, `.orbit-a`, `.orbit-b`, `canvas` hidden via `display: none !important`), transitioning into clean `#f8f9fa` workspace backgrounds.
  - Surface cards with pure white `#ffffff`, crisp 1px borders (`#dadce0` / `#e0e0e0`), and restrained shadows (`0 1px 3px rgba(60,64,67,0.12), 0 1px 2px rgba(60,64,67,0.08)`).
  - High-contrast typography: `#202124` primary text, `#5f6368` secondary descriptions, `#3c4043` labels.
  - Retentio teal accents retained: calibrated `--mint: #00875a` for WCAG AA compliance against bright white backgrounds.
  - All components restyled: Stat cards, KPIs, Recharts historical graphs, donut charts, customer data tables, form fields, inputs, dropdowns, modals, empty states, notifications, segmented benchmark controls, and floating dock.

### Toggle UX & Accessibility (P2): PASS
- Built accessible `<ThemeToggle />` component in [AppUI.tsx](file:///F:/Retentio/retentio/client/src/components/AppUI.tsx) using Lucide `Sun` and `Moon` icons.
- Integrated into:
  - `AuthenticatedLayout` in [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx) header right area next to user profile.
  - `PublicLayout` in [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx) top navigation.
  - `Landing` page in [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx) top navigation.
- Accessible attributes: `aria-label="Switch to light theme"` / `aria-label="Switch to dark theme"`, `title`, smooth hover transitions, and keyboard `:focus-visible` ring.

---

## Task 17 — Refine Retentio Light Theme Only: PASS

### Readability & Typography Scale (P0): PASS
- Increased undersized text across all UI surfaces:
  - Navigation dock items: increased from `12px` to `14px` with `font-weight: 500` and `18px` Lucide icons.
  - Section eyebrows: increased from `10px` uppercase to `12px` with `font-weight: 700` and `0.1em` letter spacing in deep teal (`#0d9488`).
  - Summary KPI cards: `.summary-label` increased to `13px` (`font-weight: 600`, color `#374151`), KPI value increased to `36px` (`font-weight: 700`, color `#111827`), subtext increased to `13px` (`#4b5563`).
  - Customer tables: `.table-head` increased to `12px` with `border-bottom: 2px solid #e2e8f0`, customer name `14px` (`font-weight: 600`, `#111827`), customer metadata/ID increased to `12px` (`font-weight: 500`, `#6b7280`), row score `14px` (`font-weight: 700`).
  - Status badges: increased from `10px` to `12px` with `font-weight: 600` and `4px 10px` padding with distinct borders.
  - Chart legends & labels: donut count `34px`, donut label `12px`, legend items `14px` (`font-weight: 500`), period text `13px`, foot note `13px`.
  - Recharts trend chart: strengthened `.recharts-cartesian-grid line` with visible `#e2e8f0` grid lines, `.recharts-cartesian-axis-line` with `#cbd5e1`, and `.recharts-cartesian-axis-tick text` with `#4b5563` (`12px`, `font-weight: 500`).
  - Settings, Predict & Forms: form labels `14px` (`font-weight: 600`, `#1f2937`), inputs `14px` (`#111827`), notes `12px`, empty states `14px`, benchmark tick labels `12px`.

### Visual Quality & Palette Definition (P1): PASS
- Polished, cohesive light palette:
  - Canvas: warm soft-neutral `#f6f8fa` creating gentle contrast against pure `#ffffff` cards.
  - High-contrast charcoal typography: `#111827` primary, `#1f2937` body, `#374151` secondary, `#4b5563` muted descriptions, `#6b7280` metadata.
  - Crisp borders & separation: `1px solid #e2e8f0` cards with tactile elevation shadows (`0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)`).
  - High-contrast KPI top accent lines: `4px` top border (`#0d9488` mint, `#dc2626` risk, `#2563eb` saved, `#0284c7` blue).
  - High-contrast status badges: Risk (`#fef2f2` bg, `#b91c1c` text, `#fca5a5` border), Saved (`#f0fdf4` bg, `#15803d` text, `#86efac` border), Healthy (`#eff6ff` bg, `#1d4ed8` text, `#bfdbfe` border).
  - Floating dock: translucent crisp white (`rgba(255,255,255,0.96)`) with `1px solid #cbd5e1` and `0 10px 30px rgba(0,0,0,0.08)` shadow.

### Strict Theme Isolation (P2): PASS
- Zero modifications to any dark theme styles, tokens, typography, or component rules.
- All modifications are strictly scoped under `[data-theme="light"]` in [index.css](file:///F:/Retentio/retentio/client/src/index.css).
- Dark mode remains completely untouched and identical to its original state.
- Verified with full production build (`pnpm build` exited with code 0).

---

## Task 18 — Restore Landing Page & Isolate Theme Switching: PASS

### Restore Landing Page (P0): PASS
- Restored [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx) `Landing` to its complete original state:
  - Removed `<ThemeToggle />` button from `portal-top`.
  - Added route initialization `useEffect` enforcing `data-theme="dark"` and `theme-dark` class on `document.documentElement` whenever `/` mounts.
  - Complete dark stage preserved: `#030611` background, Three.js WebGL canvas, interactive `NeuralPortalBackground` starfield with cursor glow, glowing Space Grotesk headline, and dark specular button.
  - Removed `<ThemeToggle />` from `PublicLayout` (`/login` and `/signup`), ensuring authentication screens preserve original cinematic dark ambient video backgrounds.

### Workspace-Exclusive Theme Isolation (P1): PASS
- Restricted theme toggle and switching strictly to application workspace pages: Overview (`/dashboard`), Predict (`/predict`), Customers (`/customers`), and Settings (`/settings`).
- In [Pages.tsx](file:///F:/Retentio/retentio/client/src/pages/Pages.tsx), `<ThemeToggle />` is mounted exclusively inside `AuthenticatedLayout`.
- Set `data-theme={theme}` directly on `<main className="app-layout" data-theme={theme}>`.
- In [ThemeContext.tsx](file:///F:/Retentio/retentio/client/src/contexts/ThemeContext.tsx), guarded root `document.documentElement` updates: on public/landing routes (`/`, `/login`, `/signup`), the document root is forced to dark mode, while the user's workspace theme preference remains preserved in `localStorage` under `retentio_theme`.
- In [index.css](file:///F:/Retentio/retentio/client/src/index.css), stripped all global `canvas`, `html`, `body`, `.landing`, `.portal-*`, and `.hands-*` rules from the light theme.
- All light theme tokens and rules are strictly scoped to `.app-layout[data-theme="light"]` and `[data-theme="light"] .app-layout`.
- Verified production build (`pnpm build` exited with code 0).

Last updated: 2026-10-27T19:00




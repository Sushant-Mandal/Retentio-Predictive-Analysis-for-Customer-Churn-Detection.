# Retentio — Project Map & Agent Navigation Guide (`Analysis.md`)

> **Notice for AI Agents:**  
> Before conducting any investigations or code modifications in `F:\Retentio`, **consult this document first**. Inspect **only** the relevant files mapped to the active feature or problem area. Do **not** run recursive scans across the repository. Expand the search only when the primary files do not resolve the issue.

---

## 1. System Overview & Key Entry Points

Retentio is an end-to-end customer churn prediction and retention intelligence platform. It consists of a FastAPI backend (with ML inference and MongoDB Atlas persistence) and a React 19 / Vite single-page application.

| Component | Root Directory | Key Entry Point | Dev Command / Port | Active Environment |
|---|---|---|---|---|
| **Backend API** | `backend/` | `backend/main.py` | `uvicorn main:app --port 8000` | `backend/venv` (Python 3.13) |
| **Frontend Web** | `retentio/` | `retentio/client/src/main.tsx` | `pnpm dev` (Port 3000) | Vite dev server (proxies `/api` → 8000) |
| **Production Server** | `retentio/` | `retentio/server/index.ts` | `pnpm start` (Node / Express) | Serves `retentio/dist/public` |
| **ML Training** | `backend/train/` | `backend/train/train_model.py` | Standalone CLI | Uses Telco dataset in `backend/train/data/` |
| **Model Verification** | `backend/` | `backend/verify_model.py` | Standalone CLI | Verifies fresh-process model loading |

---

## 2. P0 — First-Party File Mapping

### 2.1 Project Root

| File | Purpose | Key Dependencies | Supported Features & Workflows |
|---|---|---|---|
| `AGENTS.md` | Resumption instructions and operational rules for AI coding agents. | None | Agent governance, execution safety, and operational guardrails. |
| `DEBUG_STATE.md` | Active debugging journal, verified test facts, and ML CSV schema contract. | None | Tracks resolved bugs (login, signup, bcrypt, venv) and active blockers. |
| `TASKS.md` | Task tracker recording PASS/FAIL status for milestones. | None | Work item progress tracking. |
| `review2.md` | Architectural review, viva defense guide, and training pipeline audit. | None | Comprehensive documentation for technical architecture & ML theory. |
| `.vscode/settings.json` | VS Code workspace configuration selecting the Python interpreter. | `backend/venv` | Fixes editor linting and Pylance import resolution. |

---

### 2.2 Backend (`backend/`)

#### Root Files
- `backend/main.py`: **FastAPI application entry point**. Configures CORS middleware, registers startup/shutdown lifecycle (connects MongoDB, loads ML model), and mounts routes under `/api/v1`. Exposes `/api/health`.
- `backend/requirements.txt`: Python package requirements. Pinned `bcrypt==4.0.1` to prevent passlib crash; includes `fastapi`, `uvicorn`, `motor`, `pandas`, `scikit-learn`, `xgboost`, `joblib`.
- `backend/.env`: Active environment variables (`MONGODB_URI`, `DATABASE_NAME`, `JWT_SECRET_KEY`, `ALLOWED_ORIGINS`). *(Never commit secrets)*.
- `backend/.env.example`: Template configuration for backend environment setup.
- `backend/verify_model.py`: Standalone script to verify fresh-process deserialization and inference of `churn_model.pkl` and `preprocessor.pkl`.

#### `backend/api/routes/` (API Endpoints)
- `backend/api/routes/auth.py`: Endpoints for `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, and `GET /api/v1/auth/me`. Handles user registration, password verification, and JWT issuance.
- `backend/api/routes/predict.py`: Endpoints for `POST /api/v1/predict/upload` (accepts CSV up to 10MB, invokes ML model, persists scored records to Mongo) and `GET /api/v1/predict/template` (Telco CSV template download).
- `backend/api/routes/customers.py`: Endpoints for `GET /api/v1/customers/at-risk`, `GET /api/v1/customers/saved`, `GET /api/v1/customers/search`, and `GET /api/v1/customers/{customer_id}` (includes score history).
- `backend/api/routes/dashboard.py`: Endpoints for `GET /api/v1/dashboard/summary` (aggregated counts, avg risk) and `GET /api/v1/dashboard/trend` (historical risk trend points).
- `backend/api/routes/settings.py`: Endpoints for `PATCH /api/v1/settings/profile` (update name/business name) and `PATCH /api/v1/settings/benchmark` (tune risk cutoff threshold).

#### `backend/db/` (Database Connection)
- `backend/db/__init__.py`: Async Motor MongoDB client wrapper. Manages connection pooling, Atlas ping validation, and exposes `get_db()`.

#### `backend/model/` (Serialized ML Artifacts)
- `backend/model/churn_model.pkl`: Serialized Scikit-Learn `LogisticRegression` binary classifier (chosen champion model, ~1.2 KB).
- `backend/model/preprocessor.pkl`: Serialized Scikit-Learn `ColumnTransformer` (OneHotEncoder + SimpleImputer for 19 features, ~7.4 KB).

#### `backend/schemas/` (Data Validation Models)
- `backend/schemas/__init__.py`: Pydantic models for authentication: `UserCreate`, `UserLogin`, `ProfileUpdate`, `BenchmarkUpdate`, `UserResponse`, `TokenResponse`.
- `backend/schemas/customer_schema.py`: Pydantic models for customer data: `ScoreHistoryEntry`, `CustomerRow`, `CustomerDetail`, `PredictResponse`, `DashboardSummary`, `DashboardTrend`, `TrendPoint`.

#### `backend/services/` (Business Logic)
- `backend/services/auth_service.py`: Passlib bcrypt hashing, JWT token generation/decoding, and `get_current_user` FastAPI security dependency.
- `backend/services/customer_service.py`: MongoDB customer operations: `upsert_customers` (handles state transitions: Healthy → At Risk → Saved), search queries, detail retrieval, and dashboard metric calculations.
- `backend/services/ml_service.py`: ML pipeline wrapper. Loads model into memory at startup (`load_model()`) and runs batch scoring (`predict(df, benchmark)`).

#### `backend/train/` (Model Training & Exploration)
- `backend/train/train_model.py`: Training pipeline script. Reads Telco CSV, performs EDA, fits preprocessor, trains Logistic Regression, Random Forest, and XGBoost, evaluates ROC-AUC, and writes serialized `.pkl` artifacts.
- `backend/train/baseline_results.md`: Benchmarking report documenting performance of the candidate algorithms.
- `backend/train/eda_summary.md`: Exploratory data analysis report on class distributions and feature correlations.
- `backend/train/data/WA_Fn-UseC_-Telco-Customer-Churn.csv`: Local copy of the IBM Telco customer dataset (7,043 rows, 21 columns).

#### `backend/utils/` (Feature Engineering & Preprocessing)
- `backend/utils/preprocess.py`: Preprocessing logic. Defines 15 categorical features, 4 numeric features, builds `ColumnTransformer`, implements `preprocess_training_data`, `preprocess_inference_data`, and `probabilities_to_risk_scores`.

---

### 2.3 Frontend Client (`retentio/client/`)

#### App Shell & Setup
- `retentio/client/index.html`: Base HTML template. Sets viewport and font loading.
- `retentio/client/src/main.tsx`: React 19 client entry point. Mounts `<App />` into `#root`.
- `retentio/client/src/App.tsx`: Central application router using Wouter. Defines public routes (`/`, `/signup`, `/login`), protected authenticated routes (`/dashboard`, `/predict`, `/customers`, `/settings`), and 404 fallback.
- `retentio/client/src/index.css`: Comprehensive design system stylesheet (~61 KB) with glassmorphism, animations, cosmic theme tokens, and typography.

#### Pages
- `retentio/client/src/pages/Pages.tsx`: **Core UI module** containing all functional view components:
  - `Landing`: Three.js cosmic canvas with interactive neural portal.
  - `PublicLayout`: Wrapper for unauthenticated screens with ambient background.
  - `SignUp`: Account creation form with typewriter overview and field validation.
  - `Login`: Authentication form with rotating retention insight cards.
  - `AuthenticatedLayout`: Persistent navigation shell with dock, header brand, and user profile menu.
  - `Dashboard`: Aggregated metric cards, donut risk distribution, risk trend chart, and priority data tables.
  - `Predict`: CSV drag-and-drop upload, template download link, and instant score queue classification.
  - `Customers`: Live debounced customer search, customer table, and detailed history inspection panel.
  - `Settings`: Workspace profile configuration and dynamic risk benchmark slider (70–90).
  - `NotFound`: 404 route fallback.

#### State & API Client
- `retentio/client/src/contexts/AuthContext.tsx`: React Context providing `user`, `token`, `login()`, `signup()`, `logout()`, and session initialization from `localStorage`.
- `retentio/client/src/lib/api.ts`: Axios client configured for `/api/v1`. Injects Bearer JWT on every request; unwraps FastAPI error details; exports `authApi`, `predictApi`, `customersApi`, `dashboardApi`, and `settingsApi`.
- `retentio/client/src/lib/types.ts`: TypeScript interfaces matching backend Pydantic models.
- `retentio/client/src/lib/utils.ts`: Tailwind class merging utility (`cn()`).

#### Components & Visual Systems
- `retentio/client/src/components/AppUI.tsx`: Shared domain components: `BrandMark`, `GlassCard`, `PageHeader`, `SummaryCard`, `StatusBadge`, `DataTable`, `MiniChart`, `Dock`, `ProfileMenu`, `UploadDropzone`, `SearchField`.
- `retentio/client/src/components/BackgroundSystems.tsx`: Interactive background graphics: Three.js `SuppliedBlackHole`, interactive HTML5 Canvas starfield with cursor-follow glow (`NeuralPortalBackground`), `BackgroundVideo`, `GradientWaves`.

#### Hooks & Shared Helpers
- `retentio/client/src/hooks/useComposition.ts`: Input method composition handler for international text input.
- `retentio/client/src/hooks/useMobile.tsx`: Responsive breakpoint detection hook (`useIsMobile`).
- `retentio/client/src/hooks/usePersistFn.ts`: Persistent callback hook avoiding unnecessary re-renders.

---

### 2.4 Frontend Server & Configuration (`retentio/`)

- `retentio/package.json`: Frontend package manifest. Contains dependencies for React 19, Wouter, Three.js, Lucide, Framer Motion, and build scripts.
- `retentio/vite.config.ts`: Vite development server configuration. Configures proxy (`/api` → `http://localhost:8000`), path aliases (`@`, `@shared`), and build target (`dist/public`).
- `retentio/server/index.ts`: Lightweight Express server used to host static assets from `dist/public` in production.
- `retentio/tsconfig.json` & `retentio/tsconfig.node.json`: TypeScript compiler options and project references.
- `retentio/patches/wouter@3.7.1.patch`: Pnpm patch applied to Wouter routing library.

---

### 2.5 Requirements & Specifications (`Requirements/`)

- `Requirements/Retentio_PRD.md`: Product Requirements Document detailing user persona, business objectives, and feature roadmap.
- `Requirements/Retentio_Technical_Architecture.md`: Technical specification covering the dual-tier architecture, ML pipeline, MongoDB schema, and REST API design.
- `Requirements/Retentio_Frontend_Specification.md`: Design guide and UI/UX state specifications for the web app.
- `Requirements/Retentio_Feature_Ticket_List.md` & `Retentio_Feature_Ticket_List_v2.md`: Feature ticket breakdowns and acceptance criteria.
- `Requirements/Retentio_Security_Access.md`: Security architecture, JWT token lifecycle, and role specifications.
- `Requirements/Frontend_New.md`: Frontend aesthetic refresh notes and component specifications.
- `Requirements/setup_guide.md`: Quickstart environment setup instructions.

---

## 3. P1 — Dead Weight & Hygiene Assessment

### 3.1 Confirmed Dead Weight (Safe to Remove)

The following files and directories have been verified through cross-reference and grep searches as unused, obsolete, or unreferenced:

| Path | Type | Size | Evidence & Verification |
|---|---|---|---|
| `F:\Retentio\album/` | Directory | ~10.3 MB | Contains `hands.jpg`, `hands2.jpg`, `loginbg.mp4`. Grep confirmed **0 references** across the entire workspace. Artifacts from old landing experiments. |
| `F:\Retentio\node_modules/` | Directory | ~1.4 KB | Root `node_modules` only has `.modules.yaml` and `.pnpm-workspace-state-v1.json`. Frontend packages are in `retentio/node_modules/`. |
| `backend/.venv/` | Directory | ~11 MB | Near-empty orphan virtual environment (only pip). Active server runs on `backend/venv` (~402 MB). Documented in `DEBUG_STATE.md` Task 4. |
| `retentio/inspect_blackhole_model.py`<br>`retentio/refine_exact_vortex.py`<br>`retentio/refine_vortex_reference.py`<br>`retentio/reimagine_neural_portal.py`<br>`retentio/repair_neural_portal.py`<br>`retentio/repair_vortex.py`<br>`retentio/rewrite_blackhole_gltf.py`<br>`retentio/rewrite_blackhole_vortex.py` | Python Scripts (8 files) | ~30 KB | One-off scratch scripts hardcoding `/home/ubuntu/...` paths from a previous remote agent environment. Completely obsolete. |
| `retentio/verification_*.md` (6 files) | Markdown | ~3 KB | Ephemeral test notes from previous visual iterations (`verification_blackhole_refinement.md`, etc.). |
| `retentio/ts_errors.txt` | File | 0 bytes | Empty file left over from past lint runs. |
| `retentio/.manus-logs/` | Directory | ~770 KB | Runtime log outputs (`browserConsole.log`, `networkRequests.log`, `sessionReplay.log`) written by Vite debug collector during browser sessions. |
| `retentio/client/src/pages/Home.tsx` | TSX Component | ~0.9 KB | Placeholder starter file ("All content in this page are only for example"). Grep confirmed **0 imports**. |
| `retentio/client/src/pages/NotFound.tsx` | TSX Component | ~1.8 KB | Shadowed file. `App.tsx` imports `NotFound` directly from `Pages.tsx`. This file is never imported. |
| `retentio/client/src/components/Map.tsx` | TSX Component | ~4.9 KB | Google Maps boilerplate from template. Grep confirmed **0 imports**. |
| `retentio/client/src/components/ManusDialog.tsx` | TSX Component | ~2.4 KB | Dialog component boilerplate from template. Grep confirmed **0 imports**. |
| `retentio/client/src/components/ErrorBoundary.tsx` | TSX Component | ~1.7 KB | Error boundary class component. Never mounted in `main.tsx` or `App.tsx`. |
| `retentio/client/src/contexts/ThemeContext.tsx` | TSX Context | ~1.5 KB | Unused dark/light theme context. `App.tsx` and `main.tsx` do not wrap with `ThemeProvider`. |
| `retentio/shared/const.ts` & `retentio/client/src/const.ts` | TypeScript | ~0.7 KB | Defines `COOKIE_NAME` and `getLoginUrl()`. Retentio uses JWT in `localStorage` and custom login; this OAuth helper is never called. |

---

### 3.2 Suspected Candidates / Redundancies (Keep or Verify Before Action)

| Path | Reason for Classification | Recommended Action |
|---|---|---|
| `retentio/client/src/components/ui/*` (53 files) | Standard Shadcn UI primitive set. Most (e.g. `accordion.tsx`, `calendar.tsx`, `drawer.tsx`) are unused because `Pages.tsx` uses bespoke styling. | **Retain**: Keep as design system foundation for future UI expansion unless bundle optimization is requested. |
| `retentio/template.json` | Starter template configuration. | Retain as metadata reference. |
| `retentio/ideas.md` & `retentio/todo.md` | Design brainstorming and historical visual checklist. | Retain as historical design rationale. |
| `retentio/client/public/__manus__/` | Vite plugin runtime debug collector files. | Keep in dev; omitted automatically from production bundles. |

---

## 4. P2 — Agent Navigation & Troubleshooting Lookup

When investigating a bug, reviewing a feature, or writing tests, consult this table to identify the primary files to inspect first:

| Problem Domain / Feature Area | Primary Files to Inspect First | Secondary / Reference Files |
|---|---|---|
| **User Authentication / Login / Signup Failures** | 1. `backend/api/routes/auth.py`<br>2. `backend/services/auth_service.py`<br>3. `retentio/client/src/contexts/AuthContext.tsx`<br>4. `retentio/client/src/pages/Pages.tsx` (`Login`, `SignUp`) | `backend/schemas/__init__.py`<br>`backend/requirements.txt` (`bcrypt==4.0.1`) |
| **MongoDB Connection / Atlas Timeouts** | 1. `backend/db/__init__.py`<br>2. `backend/.env` (`MONGODB_URI`) | `backend/main.py` (`lifespan`) |
| **CSV Upload / Prediction Inference Errors (400, 422, 500)** | 1. `backend/api/routes/predict.py`<br>2. `backend/services/ml_service.py`<br>3. `backend/utils/preprocess.py`<br>4. `retentio/client/src/pages/Pages.tsx` (`Predict`) | `DEBUG_STATE.md` (§ ML CSV Schema Spec)<br>`backend/model/*.pkl` |
| **Customer Status Transitions (Healthy / At Risk / Saved)** | 1. `backend/services/customer_service.py` (`upsert_customers`)<br>2. `backend/api/routes/customers.py`<br>3. `retentio/client/src/pages/Pages.tsx` (`Customers`) | `backend/schemas/customer_schema.py` |
| **Dashboard Metrics / Trends Inconsistencies** | 1. `backend/services/customer_service.py` (`get_dashboard_summary`, `get_dashboard_trend`)<br>2. `backend/api/routes/dashboard.py`<br>3. `retentio/client/src/pages/Pages.tsx` (`Dashboard`) | `retentio/client/src/components/AppUI.tsx` (`MiniChart`, `SummaryCard`) |
| **Benchmark Threshold Adjustments** | 1. `backend/api/routes/settings.py` (`update_benchmark`)<br>2. `retentio/client/src/pages/Pages.tsx` (`Settings`) | `backend/schemas/__init__.py` (`BenchmarkUpdate`) |
| **Frontend Routing & Protected Route Redirects** | 1. `retentio/client/src/App.tsx`<br>2. `retentio/client/src/contexts/AuthContext.tsx` | `retentio/client/src/pages/Pages.tsx` (`Protected`, `PublicLayout`) |
| **Frontend Visuals / Three.js / Canvas Glitches** | 1. `retentio/client/src/components/BackgroundSystems.tsx`<br>2. `retentio/client/src/index.css` | `retentio/client/src/pages/Pages.tsx` (`Landing`) |
| **Network / Proxy Errors (`/api` returns 404 or 502 in dev)** | 1. `retentio/vite.config.ts` (`server.proxy`)<br>2. `backend/main.py` (`CORS` & route mounts)<br>3. Confirm backend is running on `localhost:8000` | `retentio/client/src/lib/api.ts` |
| **Python Environment & Editor Diagnostics** | 1. `.vscode/settings.json`<br>2. `backend/venv` | `DEBUG_STATE.md` (Task 3 & 4) |

---

## 5. Rules of Engagement for Subsequent Agents

1. **Check First:** Always review `DEBUG_STATE.md` and this document (`Analysis.md` / `Analysis..md`) before touching files.
2. **Do Not Re-scan:** All first-party source files are indexed above. Avoid executing broad repository searches across `node_modules` or `venv`.
3. **Preserve Background Processes:** Process PID 8460 owns port 8000 (`backend/venv`). Do not attempt to spawn duplicate uvicorn servers.
4. **Environment Integrity:** Never delete `backend/.venv` without explicit user permission.
5. **Keep Updated:** Update `DEBUG_STATE.md` and `TASKS.md` immediately following any fix or architectural change.

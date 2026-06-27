# OmniCow — Backend ↔ Frontend Integration Analysis

> **Scope:** This document analyses the integration between the FastAPI/Neo4j backend
> (`/backend`) and the TanStack Start React frontend (`/src`).  
> It covers what already works, every known breakage, root causes, and concrete steps
> to fix each issue.

---

## 1. Architecture Overview

| Layer | Technology | Base URL |
|---|---|---|
| Frontend | TanStack Start (React + Vite) | `http://localhost:5173` |
| Backend | FastAPI + Neo4j (Python) | `http://localhost:8000` |
| API prefix | all routes under | `/api/v1` |
| HTTP client | Axios (with interceptors) | `src/lib/api/client.ts` |

The frontend has **11 API service files** in `src/lib/api/` that mirror the **11 backend endpoint modules** in `backend/app/api/v1/endpoints/`. The general architecture is sound, but the data contract between the two sides has drifted considerably.

---

## 2. What Works ✅

### 2.1 Infrastructure

- **CORS** is configured correctly. `backend/.env` lists `http://localhost:5173` and `backend/app/main.py` applies `CORSMiddleware` with wildcard methods/headers.
- **Base URL** is set correctly. The frontend `.env` exports `VITE_API_BASE_URL=http://localhost:8000/api/v1` and `client.ts` falls back to the same value.
- **Axios response interceptor** correctly unwraps `response.data` once, and all service files return the response directly (a previous bug where `.data` was accessed twice was already fixed — see `FIX_SUMMARY.md`).
- **React Query** is used throughout: every page that contacts the backend uses `useQuery` with proper `isLoading` / `error` guards.
- **Farmer list page** (`/farmers`) — calls `GET /api/v1/farmers/` with trailing slash and falls back gracefully to the list entry when the detail request is pending.
- **Priority Queue** (`/`) — fetches farmers via API and computes counts, clusters, and KPIs client-side from the returned list.
- **Clusters** (`/clusters`) — aggregates cluster statistics entirely from the farmers API response; no separate cluster endpoint needed.
- **Follow-up Schedule** (`/follow-up`) — uses the farmers list to populate the 14-day calendar grid.
- **Route Map** (`/route-map`) — filters farmers by priority and plots them via Leaflet; depends only on the farmers list.
- **Community Graph** (`/community`) — renders a force-directed graph from the farmers list; cluster colours and edge modes work.
- **Agent Performance page** (`/agent-performance`) — calls `GET /analytics/trainer-effectiveness/` (with trailing slash).

---

## 3. Integration Issues Found ❌

### 3.1 Critical — Data Model Mismatch on Farmer Schema

This is the **most impactful issue**. The frontend's `Farmer` type (`src/lib/omnicow/data.ts`) and the backend's `FarmerResponse` / `FarmerProfileResponse` schema (`backend/app/schemas/farmer.py`) do not share the same field names or structure.

| Frontend `Farmer` field | Backend `FarmerResponse` field | Status |
|---|---|---|
| `id` (e.g. `DC-40000`) | `farmer_id` (e.g. `DC00001`) | ⚠️ Field name differs; alias may not serialise correctly |
| `ward` | not present in `FarmerResponse`; only `located_in` in profile | ❌ Missing from list response |
| `subCounty`, `county` | not present in any schema | ❌ Missing entirely |
| `cluster` (int) | not present | ❌ Missing |
| `priority` (`urgent`/`watch`/`low`) | not present | ❌ Missing |
| `day7`, `day90`, `day120` (0–1 float) | `engagement_score_7d/30d/90d` (int) | ❌ Different names **and** types |
| `window.kind` + `window.daysRemaining` | not present | ❌ Missing |
| `shap` (string) | not present | ❌ Missing |
| `age` + `ageGroup` | `age_bracket` (string e.g. `"26-35"`) | ⚠️ Different representation |
| `registration` | `registration_method` | ⚠️ Field name differs |
| `cooperative` (string name) | `belongs_to_cooperative` (bool) | ❌ Type and semantics differ |
| `lastContact` | `last_contact` (datetime) | ⚠️ Name and type differ |
| `firstTraining` | not present | ❌ Missing |
| `trainers` (string[]) | `trained_by` (string[]) in profile only | ⚠️ Only in detail |
| `topics` (string[]) | `participated_in` (string[]) in profile only | ⚠️ Only in detail |
| `history` (InterventionRecord[]) | not present in any schema | ❌ Missing |
| `pageRank` | not present | ❌ Missing |
| `peerAdoptionRatio` | not present | ❌ Missing |
| `influence` | not present | ❌ Missing |
| `communitySize` | not present | ❌ Missing |
| `momentum` (`rising`/`falling`) | not present | ❌ Missing |
| `adopted` (bool) | `has_adopted` (string[] in profile only) | ❌ Different type and location |
| `lat`, `lng` | not present | ❌ Missing — Route Map and Community Graph will break |
| `shapFeatures` ([]) | not present | ❌ Missing |

**Impact:** Every page that renders farmer-specific data beyond the raw ID will break or display empty/undefined values once the backend replaces mock data. The Route Map will fail to plot markers. The Community Graph will render nodes with no position. SHAP tabs will be blank.

**Fix:**

1. **Backend** — extend `FarmerResponse` to include all fields the frontend needs:
   ```python
   # backend/app/schemas/farmer.py  (additions to FarmerResponse)
   ward: Optional[str] = None
   sub_county: Optional[str] = None
   county: Optional[str] = None
   cluster: Optional[int] = None
   priority: Optional[str] = None          # "urgent" | "watch" | "low"
   day7_score: float = 0.0
   day90_score: float = 0.0
   day120_score: float = 0.0
   window_kind: Optional[str] = None       # "Day 7" | "Day 90" | "Day 120"
   days_remaining: Optional[int] = None
   shap_explanation: Optional[str] = None
   page_rank: float = 0.0
   peer_adoption_ratio: float = 0.0
   influence_score: float = 0.0
   community_size: int = 0
   momentum: Optional[str] = None         # "rising" | "falling"
   has_adopted: bool = False
   latitude: Optional[float] = None
   longitude: Optional[float] = None
   shap_features: List[dict] = []
   ```

2. **Frontend** — add an adapter in `src/lib/api/adapters.ts`:
   ```typescript
   import type { Farmer } from '@/lib/omnicow/data';

   export function adaptFarmer(raw: any): Farmer {
     return {
       id: raw.farmer_id,
       ward: raw.ward ?? '',
       subCounty: raw.sub_county ?? '',
       county: raw.county ?? '',
       cluster: raw.cluster ?? 0,
       priority: raw.priority ?? 'low',
       day7: raw.day7_score ?? 0,
       day90: raw.day90_score ?? 0,
       day120: raw.day120_score ?? 0,
       window: { kind: raw.window_kind ?? 'Day 7', daysRemaining: raw.days_remaining ?? 0 },
       shap: raw.shap_explanation ?? '',
       gender: raw.gender,
       age: raw.age ?? 0,
       ageGroup: raw.age_bracket ?? '',
       registration: raw.registration_method ?? 'mobile_app',
       cooperative: raw.cooperative_name ?? 'Independent',
       lastContact: raw.last_contact ?? '',
       firstTraining: raw.first_training_date ?? '',
       trainers: raw.trainers ?? [],
       topics: raw.topics ?? [],
       history: raw.intervention_history ?? [],
       pageRank: raw.page_rank ?? 0,
       peerAdoptionRatio: raw.peer_adoption_ratio ?? 0,
       influence: raw.influence_score ?? 0,
       communitySize: raw.community_size ?? 0,
       momentum: raw.momentum ?? 'rising',
       adopted: raw.has_adopted ?? false,
       lat: raw.latitude ?? 0,
       lng: raw.longitude ?? 0,
       shapFeatures: raw.shap_features ?? [],
     };
   }
   ```
   Then wrap the `farmerApi` calls to map through this adapter.

---

### 3.2 Critical — `adoption.ts` Points to Wrong Endpoint

Backend registers adoptions at prefix `/adoptions`:
```python
api_router.include_router(adoption.router, prefix="/adoptions", ...)
```

Frontend `adoption.ts` (and the **duplicate** in `farmers.ts`) calls:
```typescript
await apiClient.get(`/adoption/?${params}`)       // ❌ 404 — wrong path
await apiClient.post('/adoption/', adoptionData)  // ❌ 404
```

Additionally, the backend **only exposes `POST /adoptions/`**. The `GET`, `PUT`, `DELETE` routes called by the frontend do not exist.

**Fix:** Change `/adoption/` → `/adoptions/` and implement the missing read/update/delete routes on the backend.

---

### 3.3 Critical — Training Endpoint URL Mismatch

Backend: `/trainings` (plural). Frontend `training.ts`: `/training/` (singular).
```typescript
await apiClient.get(`/training/?${params}`)      // ❌ 404
await apiClient.post('/training/', ...)           // ❌ 404
```

**Fix:** Change all `/training/` paths in `training.ts` to `/trainings/`.

---

### 3.4 High — `generateRecommendations` Uses Wrong URL Pattern

```typescript
// recommendations.ts
apiClient.post(`/recommendations/generate/${farmerId}`, {})
// ❌ Backend route is POST /recommendations/generate (no path param)
```

**Fix:** Remove `/${farmerId}` from the URL, or pass `farmer_id` in the request body.

---

### 3.5 High — Agent Performance Schema Mismatch

`agent.ts` maps `trainer-effectiveness` response assuming:
```typescript
trainer.total_attendees, trainer.unique_attendees, trainer.average_attendance_per_training
```

Backend `TrainerMetric` schema actually has:
```python
average_rating: float     # not total_attendees
feedback_score: float     # not unique_attendees / average_attendance
```

The agent performance page will show all zeros.

**Fix:** Align backend `TrainerMetric` to include attendance figures, or update the frontend mapping to use `average_rating` / `feedback_score`.

---

### 3.6 High — Trends Data Shape Mismatch

Frontend `TrendsData` expects `{ month, rate }`. Backend `TrendPoint` returns `{ period, adoption_count, training_count }`. Frontend also expects a `visit_trend` array that doesn't exist in the backend schema.

**Fix:** Unify on field names (`period` vs `month`, `rate` vs `adoption_count`) and add `visit_trend` to the backend schema if needed.

---

### 3.7 High — Trends Page Still Uses Mock Data

`src/routes/trends.tsx` imports and renders `trendSeries()` (hardcoded time series) and `AGENTS` (static agent list) for its two main panels. The `analyticsApi` and `agentApi` clients exist but are never called from this page.

**Fix:**
1. Replace `trendSeries()` with `useQuery` → `analyticsApi.getTrends()`.
2. Replace the static `AGENTS` usage in `<AgentTable />` with `useQuery` → `agentApi.getAgentPerformance()`.

---

### 3.8 Medium — Sidebar Always Shows Mock Priority Count

`shell.tsx` calls `priorityCounts()` from `data.ts` — a function that counts from the hardcoded 60-farmer mock array. The "Urgent" badge in the sidebar will never reflect real data.

**Fix:** Create a `usePriorityCounts()` hook that reuses the cached `['farmers']` React Query result.

---

### 3.9 Medium — `SyncPill` Shows a Hardcoded Timestamp

`SYNC_TIMESTAMP = "Today, 06:42"` is static string. It should be updated from a Zustand store entry written on each successful API response.

---

### 3.10 Medium — `adoptionApi` Duplicated in `farmers.ts`

`src/lib/api/farmers.ts` contains a full copy of the `adoptionApi` (lines 1–56) in addition to `src/lib/api/adoption.ts`. The duplicate has the same wrong `/adoption/` paths and will cause confusion when the canonical file is fixed.

**Fix:** Remove the `adoptionApi` block from `farmers.ts`.

---

### 3.11 Medium — `FarmerResponse.id` Alias May Fail

```python
class FarmerResponse(FarmerBase):
    id: str = Field(alias="farmer_id")
```

Without `model_config = ConfigDict(populate_by_name=True)`, this alias can cause silent serialisation failures.

**Fix:** Add `model_config = ConfigDict(populate_by_name=True)` to `FarmerResponse`.

---

### 3.12 Low — Trailing Slashes on GET Routes Cause 404

The frontend adds trailing slashes to analytics and recommendation GET endpoints (e.g. `/analytics/adoption-rates/`), but the backend routes have no trailing slashes and FastAPI does not redirect by default.

**Fix (choose one):**
- Add `redirect_slashes=True` to the `FastAPI()` constructor in `main.py`.
- Remove trailing slashes from the analytics and recommendations service functions.

---

### 3.13 Low — `AgentTable` Ignores the `agents` Prop

`agent-performance.tsx` passes `<AgentTable agents={agents} />` but `AgentTable` is defined in `trends.tsx` without any props and reads from the static `AGENTS` constant internally. The prop is silently dropped.

**Fix:** Update `AgentTable` to accept and render an `agents` prop.

---

### 3.14 Critical — `useEffect` Not Imported in `index.tsx`

`src/routes/index.tsx` calls `useEffect` on line 59 but only imports `useMemo` and `useState`. This is a compile/runtime error that prevents the Priority Queue from rendering.

**Fix:** Add `useEffect` to the React import line.

---

### 3.15 Critical — `useMemo` Not Imported in `community.tsx`

`src/routes/community.tsx` calls `useMemo` on line 40 but only imports `useRef` and `useState`. Compile error — Community Graph will not render.

**Fix:** Add `useMemo` to the React import line.

---

## 4. Missing Backend Endpoints Required by the Frontend

| Frontend Call | Backend Status |
|---|---|
| `GET /adoptions/` | ❌ Not implemented |
| `GET /adoptions/{id}` | ❌ Not implemented |
| `PUT /adoptions/{id}` | ❌ Not implemented |
| `DELETE /adoptions/{id}` | ❌ Not implemented |
| `PUT /trainings/{id}` | ❌ Not implemented |
| `DELETE /trainings/{id}` | ❌ Not implemented |
| `POST /recommendations/generate/{farmer_id}` | ❌ Wrong path — no param in route |

---

## 5. Summary Table

| # | Severity | Area | Issue | Fix Effort |
|---|---|---|---|---|
| 3.14 | 🔴 Critical | Runtime error | `useEffect` not imported in `index.tsx` | Trivial |
| 3.15 | 🔴 Critical | Runtime error | `useMemo` not imported in `community.tsx` | Trivial |
| 3.1 | 🔴 Critical | Data model | Farmer schema mismatch (20+ fields) | High |
| 3.2 | 🔴 Critical | URL | `/adoption/` should be `/adoptions/` | Low |
| 3.3 | 🔴 Critical | URL | `/training/` should be `/trainings/` | Low |
| 3.4 | 🟠 High | URL | `generateRecommendations` wrong path | Low |
| 3.5 | 🟠 High | Schema | Agent analytics fields don't match backend | Medium |
| 3.6 | 🟠 High | Schema | Trends data shape mismatch | Medium |
| 3.7 | 🟠 High | Mock data | Trends chart & Agent table never use API | Medium |
| 3.8 | 🟡 Medium | Mock data | Sidebar always shows mock priority count | Medium |
| 3.9 | 🟡 Medium | Mock data | SyncPill timestamp is always hardcoded | Low |
| 3.10 | 🟡 Medium | Code quality | `adoptionApi` duplicated in `farmers.ts` | Low |
| 3.11 | 🟡 Medium | Schema | `FarmerResponse.id` alias may fail | Low |
| 3.12 | 🟡 Low | URL | Trailing slashes on GET routes → 404 | Low |
| 3.13 | 🟡 Low | Component | `AgentTable` ignores `agents` prop | Low |

---

## 6. Recommended Fix Order

1. **Issues 3.14 & 3.15** — Add missing React imports (2-minute fix, unblocks two pages).
2. **Issue 3.2 & 3.3** — Fix URL typos (`adoption` → `adoptions`, `training` → `trainings`).
3. **Issue 3.12** — Add `redirect_slashes=True` to `main.py` (fixes all trailing-slash 404s in one shot).
4. **Issue 3.1** — Align Farmer schema (largest lift; unlocks all data-driven views including map & graph).
5. Write `adaptFarmer()` adapter and apply in `farmerApi`.
6. **Issue 3.5** — Align Agent analytics schema.
7. **Issue 3.13** — Fix `AgentTable` to accept the `agents` prop.
8. **Issue 3.7** — Wire Trends page to `analyticsApi.getTrends()` and real agent data.
9. **Issue 3.4** — Fix `generateRecommendations` URL.
10. **Issue 3.10** — Remove duplicate `adoptionApi` from `farmers.ts`.
11. **Issues 3.8 & 3.9** — Replace mock sidebar counts and static SyncPill timestamp with live data.

---

## 7. Files That Need Changes

### Frontend

| File | Changes Needed |
|---|---|
| `src/routes/index.tsx` | Add `useEffect` to React import |
| `src/routes/community.tsx` | Add `useMemo` to React import |
| `src/lib/api/adoption.ts` | `adoption` → `adoptions` in all URLs |
| `src/lib/api/farmers.ts` | Remove duplicate `adoptionApi`; apply `adaptFarmer()` on responses |
| `src/lib/api/training.ts` | `training` → `trainings` in all URLs |
| `src/lib/api/recommendations.ts` | Remove `/{farmerId}` from generate URL; fix trailing slashes |
| `src/lib/api/analytics.ts` | Fix trailing slashes |
| `src/lib/api/agent.ts` | Fix field name mapping to match actual `TrainerMetric` shape |
| `src/lib/api/adapters.ts` | **[NEW]** Create `adaptFarmer()` function |
| `src/routes/trends.tsx` | Replace `trendSeries()` and `AGENTS` with `useQuery` API calls |
| `src/routes/trends.tsx` (`AgentTable`) | Accept `agents` prop instead of static `AGENTS` constant |
| `src/components/omnicow/shell.tsx` | Replace `priorityCounts()` with live React Query data |
| `src/components/omnicow/sync-pill.tsx` | Replace `SYNC_TIMESTAMP` with live timestamp from store |

### Backend

| File | Changes Needed |
|---|---|
| `backend/app/main.py` | Add `redirect_slashes=True` to `FastAPI()` constructor |
| `backend/app/schemas/farmer.py` | Add ~20 missing fields to `FarmerResponse`; fix `id` alias |
| `backend/app/schemas/analytics.py` | Align `TrainerMetric`; fix `TrendPoint` field names; add `visit_trend` |
| `backend/app/api/v1/endpoints/adoption.py` | Add `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` routes |
| `backend/app/api/v1/endpoints/training.py` | Add `PUT /{id}`, `DELETE /{id}` routes |
| `backend/app/api/v1/endpoints/recommendations.py` | Fix `generate` route (remove unintended path param) |

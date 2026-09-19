# ERJA — PROJECT STATE

> **Purpose:** Dense handoff/state document for another AI/developer to resume the ERJA (Emergency Railway Journey Assistant) project without relying on hidden conversation history.
>
> **Source priority:** The current frontend ZIP (`frontend.zip`) and backend ZIP (`backend.zip`) were inspected directly. Where historical conversation context conflicts with the current source, the current source is treated as authoritative and the discrepancy is called out.
>
> **Audit date:** 2026-09-19

---

# 1. CONTEXT AUDIT

## 1.1 Executive Summary & Core Objective

**ERJA (Emergency Railway Journey Assistant)** is a web application for passengers who need a practical way to obtain/monitor travel on a **single specified Indian train** when a normal direct reservation may not be available.

Core flow:

1. User authenticates.
2. User creates a monitored journey by specifying:
   - train number
   - journey date
   - boarding station
   - destination station
   - preferred travel class
   - whether mixed-class travel is allowed
3. Frontend verifies the train and retrieves the actual bookable class composition.
4. Backend stores the journey in MongoDB.
5. Background monitoring processes active journeys.
6. Backend obtains the train timetable from MongoDB/NTES, determines chart timing, checks the real IRCTC chart state, and after chart preparation obtains vacant-berth data.
7. Vacancy + route + coach/class composition are converted into a **reservation graph**.
8. Strategy engine evaluates:
   - direct seat
   - same-class split ticket
   - mixed-class split ticket when explicitly enabled
   - multi-hop
   - wait-for-chart
   - TTE recommendation
9. Strategies are scored/ranked and stored as recommendations.
10. Frontend displays journey status and recommendations.

The central technical idea is that ERJA must reason about **vacancy intervals between stations**, not merely a train-wide vacancy number or a coach label. A berth is usable for the passenger only when its vacancy interval covers the requested passenger journey.

## 1.2 Current Architecture

```text
React/Vite Frontend
        |
        | HTTP + JWT
        v
Node.js / Express Backend
        |
        +--> Authentication / User
        +--> Journey management
        +--> Train / NTES timetable
        +--> Station autocomplete
        +--> IRCTC chart/composition
        +--> IRCTC vacant berth data
        +--> PNR monitoring
        +--> Recommendation API
        |
        v
MongoDB / Mongoose
        |
        +--> User
        +--> Journey
        +--> TrainStop
        +--> Chart
        +--> ChartEvent
        +--> Recommendation
        +--> Notification
        +--> PNR / PNRHistory

Active journey monitoring:
node-cron -> monitor.service -> workflowManager
                              -> chartWorkflow
                              -> timetable + chart + vacancy
                              -> optimizer
                              -> recommendations
```

## 1.3 Tech Stack & Key Dependencies

### Frontend — verified from `frontend/package.json`

- React `^19.2.8`
- React DOM `^19.2.8`
- Vite `^8.2.0`
- React Router DOM `^7.18.2`
- Axios `^1.20.0`
- Material UI `^9.4.0`
- Emotion React `^11.14.0`
- Emotion Styled `^11.14.1`
- react-hot-toast `^2.6.0`
- ESLint `^10.8.0`
- `@vitejs/plugin-react` `^6.0.4`
- `eslint-plugin-react-hooks` `^7.1.1`
- `eslint-plugin-react-refresh` `^0.5.3`

Frontend module style: JavaScript/JSX, ES modules.

### Backend — verified from `backend/package.json`

- Node.js / CommonJS
- Express `^5.1.0`
- Axios `^1.20.0`
- Mongoose `^8.18.1`
- bcryptjs `^3.0.2`
- jsonwebtoken `^9.0.2`
- dotenv `^17.2.2`
- CORS `^2.8.5`
- helmet `^8.3.0`
- express-rate-limit `^8.7.0`
- Joi `^18.2.5`
- node-cron `^4.6.0`
- Nodemailer `^10.0.9`
- Cheerio `^1.2.0`
- railkit `^5.0.2`
- nodemon `^3.1.10` dev dependency

### External railway data sources in code

- **NTES** for timetable/train route synchronization.
- **IRCTC** chart/composition and vacant-berth workflow.
- **RailRadar** remains used by dedicated live-status and seat-forecast endpoints, but the active journey monitor explicitly does **not** use RailRadar seat availability for the optimizer.

### Runtime

- Frontend development API defaults to `http://localhost:5000/api`.
- Frontend development server is historically Vite on `http://localhost:5173`.
- Backend defaults to port `5000`.
- MongoDB connection is configured through `MONGODB_URI`.

---

# 2. CURRENT DATABASE SCHEMA

## `User`

File: `src/modules/auth/auth.model.js`

Fields:

- `fullName`: String, required, 3–100
- `email`: String, required, unique, lowercase, indexed
- `password`: String, required, 6–128
- `phoneNumber`: String, optional
- `isEmailVerified`: Boolean, default false
- `isActive`: Boolean, default true, indexed
- `role`: `"user" | "admin"`, default `"user"`, indexed
- `preferences.emailNotifications`: Boolean
- `preferences.websiteNotifications`: Boolean
- timestamps

Unknown fields are rejected (`strict: true`, `strictQuery: true`).

## `Journey`

File: `src/modules/journey/journey.model.js`

### Core fields

- `userId`: ObjectId -> User, required/indexed
- `trainNumber`: String, 4–5 digits
- `journeyDate`: Date
- `boardingStation`: uppercase station code
- `destinationStation`: uppercase station code
- `allowedClasses`: array of embedded `{ class, enabled }`
- `allowMixedClass`: Boolean, default false
- `preferredStrategy`: enum:
  - `BEST_AVAILABLE`
  - `SINGLE_TICKET`
  - `FEWER_TICKET_CHANGES`
- `status`: enum:
  - `PENDING`
  - `MONITORING`
  - `CHART_PREPARED`
  - `RECOMMENDATION_READY`
  - `COMPLETED`
  - `CANCELLED`
- `completedAt`
- `completedReason`
- `finalStationCode`
- `finalStationName`
- `monitoringJobId`
- `lastCheckedAt`
- timestamps

Supported journey class codes:

```text
1A, 2A, 3A, 3E, SL, 2S, CC, EC
```

Indexes exist for user/status, train/date, user/journey date, monitoring status/time, and user/latest update.

## `TrainStop`

File: `src/modules/train/trainStop.model.js`

Represents cached NTES timetable stops.

Fields include:

- `trainNumber`
- `trainName`
- `no` — route order
- `track`
- `code`
- `station`
- `xo`
- `note`
- `arrival`
- `arrivalAvg`
- `departure`
- `departureAvg`
- `halt`
- `pf`
- `day`
- `km`
- `speed`
- `elevation`
- `zone`
- `address`
- timestamps

Indexes:

- `{ trainNumber: 1, no: 1 }`
- `{ trainNumber: 1, code: 1 }`

## `Chart`

File: `src/modules/chart/chart.model.js`

Fields:

- `trainNumber`
- `journeyDate`
- `boardingStation`
- `chartOneDate`
- `chartTwoDate`
- `chartPrepared`
- `trainName`
- `from`
- `to`
- `cdd`: Array
- `vbd`: Array
- `rawResponse`: Object
- `fetchedAt`
- timestamps

## `ChartEvent`

File: `src/modules/chart/chartEvent.model.js`

Fields:

- `journey`: ObjectId -> Journey
- `trainNumber`
- `journeyDate`
- `sequence`
- `chartType`: `FIRST | INTERMEDIATE | FINAL`
- `stationCode`
- `stationName`
- `expectedAt`
- `checkedAt`
- `preparedAt`
- `prepared`
- `source`, default `"IRCTC"`
- `rawStatus`
- timestamps

Indexes support journey sequence and train/date/station lookup.

Current implementation stores first and final/second chart events. It deliberately does not invent intermediate charting stations when IRCTC data does not provide them.

## `Recommendation`

File: `src/modules/recommendation/recommendation.model.js`

### Ticket

- `from`
- `to`
- `class`: `1A | 2A | 3A | 3E | SL | 2S`
- `coach`
- `berth`

### Vacancy summary

- `class`
- `count`
- `status`: `AVAILABLE | ERROR`
- `error`

### Recommendation

- `journey`: ObjectId -> Journey
- `strategy`
- `score`: 0–100
- `reason`
- `tickets`
- `vacancySummary`
- `status`: `ACTIVE | EXPIRED`
- timestamps

Indexes:
- journey + status
- journey + newest creation time

**Important schema limitation:** Recommendation ticket/vacancy class enums currently include `1A,2A,3A,3E,SL,2S`, not `CC/EC`, even though Journey supports CC/EC.

## `Notification`

File: `src/modules/notification/notification.model.js`

Fields:

- `userId`
- `type`: `SEAT_AVAILABLE | JOURNEY_UPDATE | CHART_UPDATE | SYSTEM`
- `title`
- `message`
- `journeyId`
- `isRead`
- timestamps

Indexes support user listing, unread lookup, and journey-specific notifications.

## `PNR`

File: `src/modules/pnr/pnr.model.js`

Fields include:

- `userId`
- optional `journeyId`
- 10-digit `pnr`
- train `{ number, name }`
- journey:
  - dateOfJourney
  - class
  - quota
  - source
  - destination
  - boardingPoint
  - distance
  - arrivalDate
- chart `{ status }`
- booking `{ fare, ticketFare, bookingDate }`
- passengers array
- `lastCheckedAt`
- timestamps

Unique index: `{ userId, pnr }`.

## `PNRHistory`

File: `src/modules/pnr/pnrHistory.model.js`

Stores previous/current passengers and chart status snapshots linked to PNR/user/journey.

---

# 3. ACTIVE API ENDPOINTS

Base URL:

```text
http://localhost:5000/api
```

Authentication uses JWT in `Authorization: Bearer <token>` for protected endpoints.

## Health

```http
GET /
```

Returns ERJA backend status/version.

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

These are rate-limited by the global auth limiter.

## Journey

```http
POST   /api/journey
GET    /api/journey
GET    /api/journey/history
GET    /api/journey/:id
POST   /api/journey/:id/run-workflow
DELETE /api/journey/:id
```

All protected.

## Train

```http
GET /api/train/search
GET /api/train/live
GET /api/train/seats
GET /api/train/stops
GET /api/train/check-stop
GET /api/train/stops-between
```

All protected and mounted behind the railway API rate limiter.

### Train search

```text
GET /api/train/search?trainNumber=12745
```

Current service behavior:

1. Validate 4–5 digit train number.
2. Look for cached `TrainStop` records.
3. If missing, query NTES.
4. Save returned timetable into MongoDB.
5. Return verified train name/stops.

### Stops between

```text
GET /api/train/stops-between?trainNumber=...&from=...&to=...
```

If timetable is missing, NTES synchronization is attempted under a per-train in-process lock.

Wrong direction is rejected.

## Station

```http
GET /api/station/autocomplete?search=...
```

Protected.

Uses the local `list_of_stations.json` directory and returns up to 10 matches, prioritizing exact code, code prefix, name prefix, then name ordering.

## Chart

```http
GET /api/chart/classes
```

Protected.

Query:

```text
trainNumber
journeyDate
boardingStation
```

Uses the real chart/composition workflow and derives available classes from coach composition/CDD.

## Recommendations

```http
GET /api/recommendations/:journeyId
```

Protected and verifies journey ownership.

Returns formatted active recommendations sorted by score descending.

## Profile

```http
GET   /api/profile
PATCH /api/profile
```

Protected.

## Settings

```http
GET   /api/settings
PATCH /api/settings
```

Protected.

## Notifications

```http
GET    /api/notifications?limit=50
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read
DELETE /api/notifications/:id
DELETE /api/notifications
```

Protected.

## PNR

```http
POST   /api/pnr/check
GET    /api/pnr
GET    /api/pnr/:id
DELETE /api/pnr/:id
```

Protected.

---

# 4. FRONTEND STATE / UX

## Main routes

Defined in `src/routes/AppRoutes.jsx`:

```text
/                    -> redirect /login
/login
/signup
/dashboard
/journeys
/add-journey
/recommendation/:id
/profile
/notifications
/pnr
*                    -> redirect /dashboard
```

## Add Journey

File:

```text
src/pages/AddJourney/AddJourney.jsx
```

Current form state:

```js
{
  trainNumber: "",
  journeyDate: "",
  boardingStation: "",
  destinationStation: "",
  preferredClass: "",
  allowMixedClass: false
}
```

### Train input

- Digits only.
- Maximum 5 characters.
- Local train data is used for prefix autocomplete.
- Suggestions appear after at least 4 typed digits.
- Up to 8 local suggestions.
- Selecting a suggestion sets the train number/name.
- The selected train is still verified through backend `/train/search`.
- API verification is not replaced by local lookup.

### Important train-data rule

`src/data/train_data.js` contains entries such as:

```text
"00111- BIRD-SGTY RAPID CARGO"
"12818- JHARKHAND EXP"
```

Train numbers must remain **strings**, because leading zeros are meaningful.

The current AddJourney source imports:

```js
import trainList from "../../data/train_data.js";
```

and derives local train lookup data from it.

### Class lookup

Classes are fetched only after:

- valid train verification
- journey date
- boarding station

Current class lookup endpoint:

```text
GET /api/chart/classes
```

Available class metadata includes:

```text
1A First AC
2A AC 2 Tier
3A AC 3 Tier
3E AC 3 Economy
SL Sleeper
2S Second Sitting
CC Chair Car
EC Executive Chair Car
```

### Station autocomplete

Both boarding and destination use:

```text
GET /api/station/autocomplete
```

Frontend uses request IDs + AbortController to prevent stale async responses from overwriting newer input.

### Journey creation payload

The current AddJourney implementation builds a payload conceptually equivalent to:

```js
{
  trainNumber,
  journeyDate,
  boardingStation,
  destinationStation,
  allowedClasses: [
    {
      class: preferredClass,
      enabled: true
    }
  ],
  allowMixedClass: Boolean(allowMixedClass),
  preferredStrategy: "SINGLE_TICKET"
}
```

---

# 5. OPTIMIZER ARCHITECTURE

```text
ChartWorkflowService
      |
      +--> route/timetable
      +--> chart state
      +--> vacancy data
      |
      v
JourneyOptimizerService
      |
      +--> DataAnalyzer
      |
      +--> ReservationGraphBuilder
      |
      +--> ReservationStrategyEngine
      |       |
      |       +--> DirectSeatStrategy
      |       +--> SplitSameClassStrategy
      |       +--> SplitMixedClassStrategy
      |       +--> MultiHopStrategy
      |       +--> WaitChartStrategy
      |       +--> TteStrategy
      |
      +--> StrategyRanker
      |
      +--> RecommendationGenerator
      |
      +--> RecommendationService
```

## Reservation graph

File:

```text
src/modules/journeyOptimizer/engine/graph/reservationGraphBuilder.js
```

Graph consists of:

```text
nodes:
  station code/name/order

edges:
  from
  to
  class
  totalAvailable
  opportunities[]
```

Each coach opportunity contains:

```text
coach
availableCount
berths[]
```

Each berth retains:

```text
berthNumber
berthCode
cabinCoupe
cabinCoupeNo
from
to
splitNo
coach
class
```

### Critical design rule

IRCTC vacancy records do not necessarily contain a class field.

Class resolution is:

1. explicit vacancy class/classCode/travelClass/cls
2. otherwise coach -> class map from chart composition

Example mappings documented in the builder:

```text
A1 -> 2A
B1 -> 3A
S1 -> SL
M1 -> 3E
```

The real chart composition is therefore required to correctly classify vacancy records.

## Direct-seat strategy

A direct recommendation is valid only when:

1. requested source/destination are valid route nodes;
2. route direction is correct;
3. requested class matches;
4. an edge covers the passenger's complete journey;
5. an **individual berth interval** covers the complete journey.

It is not enough for an aggregate edge count to be positive.

The strategy returns:

```text
strategy: DIRECT_SEAT
score: 100
ticket: source -> destination
coach
berth
vacancy summary
reason
```

The current reason uses the numeric vacancy count, e.g. conceptually:

```text
209 vacant SL berths cover SC → BDCR.
Example available berth: S2/...
```

This is specifically intended to avoid the earlier incorrect UI behavior where a coach label such as `S2` was displayed instead of the actual numeric available-seat count.

## Same-class split strategy

Requirements implemented in the current source:

- split station must lie strictly between source and destination;
- both legs must be covered by vacancy edges;
- both legs must use the same requested class;
- distinct berth identities are required;
- a recommendation is rejected if both tickets accidentally refer to the same physical berth;
- same-coach split receives a score bonus.

Berth identity:

```text
COACH|BERTH_NUMBER
```

## Mixed-class split strategy

Runs only when:

```js
journey.allowMixedClass === true
```

It searches for a first class + second class combination and a valid intermediate split station.

It is intentionally opt-in.

## Strategy scores currently encoded

`ScoreEngine.js`:

```text
DIRECT_SEAT       100
SPLIT_SAME_CLASS   92
SPLIT_MIXED_CLASS  84
MULTI_HOP          75
WAIT_FOR_CHART     65
TTE_RECOMMENDATION 55
```

Bonuses/penalties:

- same coach for split: +3
- same class for same-class split: +2
- multi-hop >2 tickets: -2 per additional ticket
- result clamped to 0–100

**Important:** These scores are current implementation values, not a future product specification. Fare is not part of the current score.

## Ranker

Current ranker:

- keeps the best-scoring instance per strategy;
- sorts by score descending;
- uses strategy priority as a tie breaker;
- returns at most five distinct strategies.

---

# 6. CHART / MONITORING WORKFLOW

Current real workflow:

```text
node-cron
  -> monitorPendingJourneys()
  -> checkAndCompleteJourney()
  -> workflowManager.processJourney()
  -> chartWorkflow.processJourney()
```

Chart workflow:

1. Load timetable from `TrainStop`.
2. NTES-sync timetable if missing.
3. Calculate chart timing when origin departure is available.
4. Before expected chart window:
   - no IRCTC chart call
   - no vacancy call
   - optimizer does not run
   - old recommendations are cleared
5. Once in chart window:
   - fetch real IRCTC chart
6. If chart is not prepared:
   - no vacancy call
   - optimizer does not run
   - old recommendations are cleared
7. If chart is prepared:
   - fetch real vacant berth data
8. Validate route/source/destination/direction.
9. Run optimizer.
10. Save recommendations.

### Current background cadence — VERIFIED

`src/jobs/monitor.job.js` currently runs:

```text
Journey monitoring: every 2 minutes
PNR monitoring:     every 15 minutes
```

### Historical requirement discrepancy

Earlier project discussions specified polling IRCTC chart/vacancy approximately **every 30 seconds**.

That is **not the current backend scheduler**. The current code is every 2 minutes.

Do not silently treat the historical 30-second requirement as implemented.

---

# 7. MOCK DATA STATUS

Mock modules still exist:

```text
src/modules/chart/mock/mockChart.js
src/modules/chart/mock/mockVacancies.js
```

The workflow supports:

```env
USE_MOCK_CHART=true
```

When enabled, mock chart/vacancy data is fed into the optimizer.

When disabled, the current workflow explicitly enters real IRCTC mode.

Therefore:

- mock infrastructure has **not** been physically removed;
- real IRCTC workflow exists;
- mock mode remains available for testing.

---

# 8. COMPLETED FEATURES

## Authentication / user

- Login
- Signup
- JWT storage/interceptor
- User profile
- Settings endpoints

## Journey management

- Create journey
- List journeys
- Journey history
- Journey details
- Delete journey
- Manual workflow execution endpoint
- Journey statuses
- Journey completion tracking

## Train / route

- Train search
- NTES fallback
- MongoDB timetable caching
- Train stop model
- Stops-between logic
- Wrong-direction validation
- Station stop checking
- Station autocomplete

## Add Journey UX

- Train number input validation
- Local train autocomplete
- Train API verification
- Actual chart-based class discovery
- Station autocomplete
- Async request cancellation/request IDs
- Preferred class
- Mixed-class opt-in

## Chart / monitoring

- Chart timing
- IRCTC chart fetch/cache
- Chart preparation state
- Chart events
- Real vacant berth fetch
- Mock chart/vacancy mode for testing
- Background journey monitoring

## Optimization

- Reservation graph
- Coach-to-class mapping
- Station interval coverage
- Direct-seat strategy
- Same-class split strategy
- Mixed-class split strategy
- Multi-hop strategy
- Wait-for-chart strategy
- TTE strategy
- Strategy scoring
- Strategy ranking
- Recommendation generation
- Recommendation persistence

## PNR

- PNR check
- PNR storage
- PNR retrieval
- PNR deletion
- PNR history
- PNR background monitoring

## Notifications

- Notification storage
- list
- mark read
- mark all read
- delete one
- delete all

---

# 9. PENDING / NEXT ROADMAP

## Highest priority

1. **Run the current frontend against the current backend and verify the latest AddJourney build.**
2. Verify the train autocomplete JSX structure and Vite compilation.
3. Verify `train_data.js` export/import and leading-zero behavior.
4. Verify train search -> train verification -> class lookup -> journey creation end-to-end.
5. Test real NTES timetable sync for a known train.
6. Test real IRCTC chart + vacancy response against the graph builder.
7. Test the known direct-seat case where numeric vacancy must be displayed rather than a coach label.
8. Test split coverage for gaps/overlapping vacancy intervals.
9. Test same-berth rejection in split recommendations.
10. Test mixed-class opt-in/off behavior.

## Monitoring

11. Decide whether the desired monitoring cadence is 30 seconds or the current 2 minutes.
12. If 30 seconds is still required, redesign scheduler/rate-limit behavior carefully rather than blindly increasing IRCTC requests.
13. Ensure chart preparation transitions are reflected in Journey status.
14. Verify recommendation refresh/expiration semantics.

## Optimizer

15. Verify `DataAnalyzer` input normalization against real IRCTC response shapes.
16. Verify all real IRCTC coach/class mappings.
17. Improve seat-change optimization if required:
    - same coach preferred
    - fewer changes
    - potentially same berth/coach continuity where logically valid
18. Improve split search beyond the current single best split returned by some strategies.
19. Decide whether fare calculation should become part of ranking.
20. Add a formal v2 score model if desired.
21. Add tests for route direction, gaps, duplicate vacancies, duplicate berth identities, leading-zero train numbers, mixed classes, and missing class mapping.

## Data/model consistency

22. Reconcile Journey-supported `CC`/`EC` with Recommendation model class enums.
23. Review `preferredStrategy`: frontend currently submits `SINGLE_TICKET`; optimizer currently works primarily by generated strategy set rather than enforcing this field.
24. Review `monitoringJobId` reference because no `MonitoringJob` model is present in the inspected model list.
25. Review Chart model indexes/uniqueness for train/date/station cache behavior.

## Frontend

26. Consolidate duplicate Axios baseURL/interceptor implementations into a shared API client where practical.
27. Add proper auth route protection if desired.
28. Verify Recommendation UI against the current formatter payload.
29. Verify Dashboard recommendation loading and journey status display.
30. Add clear loading/error states for chart/class availability.
31. Verify notification UI and PNR UI against current backend payloads.

## Production

32. Replace localhost API configuration with deployment environment variables.
33. Configure production CORS.
34. Review rate limits for real IRCTC usage.
35. Protect secrets in `.env`.
36. Add structured logging.
37. Add automated tests.
38. Add deployment documentation.
39. Add API documentation.
40. Remove/debug-only files and mock paths only when no longer needed.

---

# 10. KEY TECHNICAL DECISIONS / CODING RULES

## Train numbers are strings

Never parse train numbers as integers.

Reason:

```text
00111
```

must remain:

```text
"00111"
```

## Route order is authoritative

A valid journey requires:

```text
boardingIndex < destinationIndex
```

Wrong-direction journeys must not produce recommendations.

## Vacancy is segment-specific

Do not treat:

```text
total train vacancy
```

as equivalent to:

```text
vacancy for passenger's exact source -> destination
```

A berth is usable only if its own vacancy interval covers the requested journey.

## Coach does not equal availability count

`S2`, `B1`, etc. are coach identifiers.

They are not numeric vacancy counts.

If IRCTC returns 209 available berths, UI/recommendation text should be able to display the numeric count.

## Individual berth validation matters

An aggregate graph edge can contain multiple vacancy intervals. Direct-seat logic therefore validates an individual berth interval before recommending it.

## Class must be resolved correctly

Vacancy records may not include a class.

Use chart coach composition to map:

```text
coach -> class
```

rather than assuming every vacancy record has `class`.

## Mixed class is explicit

Do not recommend mixed-class travel unless:

```text
allowMixedClass === true
```

## Split tickets must cover the entire journey

A split recommendation must satisfy:

```text
source -> split
split -> destination
```

without gaps.

## Split recommendation must not reuse the same physical berth

Current same-class strategy checks:

```text
coach + berth number
```

and rejects identical identities.

## Async frontend searches must avoid stale responses

Current AddJourney uses:

- request counters/IDs
- AbortController
- debouncing

Do not remove these protections when modifying autocomplete.

## Local train list is UI assistance, not authoritative verification

`train_data.js` supports autocomplete.

Backend `/train/search` remains the verification authority.

## Mock data is test-only

Do not mistake `mockChart.js` / `mockVacancies.js` output for real IRCTC availability.

## Do not invent charting stations

ChartEvent logic only stores station information actually available from the source.

---

# 11. IMPORTANT EDGE CASES

- Train numbers with leading zeros.
- Invalid 4/5-digit train numbers.
- Duplicate train numbers in local data.
- Train API failure / NTES failure.
- Missing NTES timetable.
- Missing source station.
- Missing destination station.
- Source after destination.
- Source == destination.
- Missing chart preparation data.
- Chart not prepared.
- Chart prepared but no vacant berths.
- Vacancy records missing source/destination.
- Vacancy records missing coach.
- Vacancy records with unknown class.
- Coach class missing from composition.
- Aggregate vacancy exists but no individual berth covers full journey.
- Same berth accidentally represented in both split legs.
- Same-class split with different coaches.
- Same-class split with same coach.
- Mixed-class disabled.
- Mixed-class enabled but no valid second class.
- Segment gaps between split tickets.
- Multiple recommendations for same strategy.
- Stale async autocomplete response.
- Aborted Axios request.
- API 401 invalidating local JWT.
- Recommendation formatter receiving berth objects instead of strings.
- `[object Object]` accidentally appearing in recommendation reasons.
- Current Recommendation class enum not matching all Journey-supported classes.
- Monitoring scheduler cadence differs from historical 30-second requirement.

---

# 12. CURRENT FOLDER STRUCTURE

## Frontend

```text
frontend/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── api/
    │   ├── axios.js
    │   ├── journeyAPI.js
    │   ├── notificationAPI.js
    │   ├── pnrAPI.js
    │   ├── profileAPI.js
    │   ├── recommendationAPI.js
    │   └── trainAPI.js
    ├── components/
    │   ├── Navbar/
    │   └── SummaryCard/
    ├── data/
    │   └── train_data.js
    ├── pages/
    │   ├── AddJourney/
    │   ├── Dashboard/
    │   ├── Home/
    │   ├── JourneyDetails/
    │   ├── Journeys/
    │   ├── Login/
    │   ├── Notifications/
    │   ├── PNR/
    │   ├── Profile/
    │   ├── Recommendation/
    │   └── Signup/
    ├── routes/
    │   └── AppRoutes.jsx
    └── services/
        └── authService.js
```

## Backend

```text
backend/
├── package.json
├── package-lock.json
├── .env
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    │   ├── database.js
    │   └── mail.js
    ├── data/
    │   └── list_of_stations.json
    ├── jobs/
    │   └── monitor.job.js
    ├── middleware/
    │   └── auth.middleware.js
    ├── modules/
    │   ├── auth/
    │   ├── chart/
    │   │   └── workflow/
    │   ├── journey/
    │   ├── journeyOptimizer/
    │   │   ├── analyzer/
    │   │   ├── engine/
    │   │   │   ├── graph/
    │   │   │   └── strategies/
    │   │   ├── ranker/
    │   │   ├── recommendation/
    │   │   └── scoring/
    │   ├── notification/
    │   ├── pnr/
    │   ├── profile/
    │   ├── recommendation/
    │   │   └── formatter/
    │   ├── settings/
    │   ├── station/
    │   └── train/
    ├── services/
    │   ├── monitor.service.js
    │   ├── notification.service.js
    │   ├── ntesParser.js
    │   ├── ntesService.js
    │   └── ntes.service.js
    └── workflows/
        └── workflowManager.js
```

---

# 13. CURRENT SOURCE-VERIFIED STATUS VS HISTORICAL CONTEXT

| Area | Current verified state | Historical/project discussion |
|---|---|---|
| Train autocomplete | Implemented in current AddJourney | Previously caused JSX nesting/compile errors; verify clean build |
| Local train data | Present and imported | Intended for prefix autocomplete |
| Train verification | Backend NTES/cache search exists | Must remain authoritative over local autocomplete |
| Station autocomplete | Implemented | Request cancellation/stale-response protection established |
| Real chart workflow | Present | Intended to replace mock data for actual operation |
| Mock chart/vacancy | Still present behind env flag | Earlier goal was eventually to stop relying on mocks |
| Vacancy graph | Implemented | Core design is exact station-interval reasoning |
| Direct numeric vacancy | Current DirectSeatStrategy includes numeric `availableCount` | Earlier bug was displaying coach label such as S2 instead of count |
| Same-class split | Implemented with distinct-berth protection | Further optimization/testing remains |
| Mixed class | Implemented and opt-in | Further optimization/testing remains |
| Fare calculation | Not present in current inspected optimizer | Previously explicitly deferred |
| Monitoring cadence | **2 minutes** | Historical requirement discussed as **30 seconds** |
| RailRadar | Live/status endpoints exist | Active journey optimizer no longer uses RailRadar seat availability |
| Recommendation score | Hard-coded strategy score engine | Historical plan mentioned a future v2 scoring metric |
| CC/EC | Journey/chart support exists | Recommendation schema currently excludes CC/EC |
| Production deployment | Not verified as complete | Still roadmap |

---

# 14. PROGRESS DELTA CHECK — THIS SESSION

## Code Written / Files Created

No application source code was intentionally modified during this audit session.

The following source artifacts were **received and inspected**:

- `/mnt/data/frontend.zip`
- `/mnt/data/backend.zip`

A new handoff artifact is being created:

- `PROJECT_STATE.md`

## Architectural Decisions / Findings Established During This Audit

- Current source is treated as the authoritative implementation state.
- Frontend and backend were audited together rather than relying only on historical conversation notes.
- The current scheduler cadence is **2 minutes**, not the historically discussed 30 seconds.
- Mock chart/vacancy modules remain in the backend and are controlled through `USE_MOCK_CHART`.
- Real IRCTC chart/vacancy workflow is present.
- NTES timetable synchronization and MongoDB timetable caching are present.
- The optimizer's direct-seat logic validates an individual berth interval, not merely an aggregate edge count.
- Same-class split logic explicitly rejects reuse of the same physical berth identity.
- Mixed-class strategy is explicitly gated by `allowMixedClass`.
- Train numbers are correctly modeled as strings throughout the relevant train/timetable flow.
- Recommendation model class support is narrower than Journey class support and needs review.

## Next Immediate Action Items for the Next Session

1. Run/build the current frontend and backend together.
2. Verify the current AddJourney page compiles cleanly.
3. Test train autocomplete with:
   - `001`
   - `0011`
   - `12745`
   - a known train from the local data file
4. Verify selecting a local train still performs backend NTES verification.
5. Test station autocomplete.
6. Test actual class lookup for a known train/date/boarding station.
7. Create a real Journey and inspect the stored MongoDB document.
8. Run the chart workflow in controlled test/mock mode first.
9. Test a real chart/vacancy response and inspect:
   - coach-to-class mapping
   - vacancy intervals
   - graph edges
   - numeric vacancy count
10. Reproduce the known direct-seat case and ensure the recommendation says the numeric count rather than just `S2`.
11. Test split strategies for:
    - complete coverage
    - gaps
    - same berth
    - same coach/different berth
    - mixed class disabled/enabled
12. Decide whether the monitoring cadence should remain 2 minutes or be redesigned around the historical 30-second target.
13. Resolve the `CC/EC` Recommendation-schema inconsistency.
14. Continue optimizer hardening and automated tests.

---

# 15. RESUME INSTRUCTION FOR ANOTHER AI

When continuing this project:

1. **Read this file first.**
2. Treat the current source ZIP/code as authoritative over older conversational assumptions.
3. Do not rewrite the architecture unnecessarily.
4. Preserve the route-aware reservation graph.
5. Preserve exact vacancy interval validation.
6. Preserve train-number strings.
7. Preserve request cancellation/request-ID protection in autocomplete.
8. Do not enable mixed-class recommendations unless the user explicitly enables them.
9. Do not replace backend train verification with local `train_data.js`.
10. Do not claim real availability when the workflow is running mock data.
11. Before changing optimizer behavior, inspect:
    - `reservationGraphBuilder.js`
    - `reservationCoverage.js`
    - `DirectSeatStrategy.js`
    - `SplitSameClassStrategy.js`
    - `SplitMixedClassStrategy.js`
    - `reservationStrategyEngine.js`
    - `ScoreEngine.js`
    - `strategyRanker.js`
    - `recommendationGenerator.js`
    - `recommendationFormatter.js`
12. Before changing chart behavior, inspect:
    - `chart.service.js`
    - `chartClass.service.js`
    - `chartWorkflow.service.js`
    - `chartTiming.service.js`
13. Before changing train routing, inspect:
    - `train.service.js`
    - `ntes.service.js`
    - `trainStop.model.js`
    - `station.service.js`
14. Before changing monitoring cadence, inspect:
    - `monitor.job.js`
    - `monitor.service.js`
    - `workflowManager.js`
15. Validate with a real known train/route example before declaring the optimizer fixed.

**Primary project principle:**

> ERJA is not simply an availability display. It is a route-aware reservation strategy engine that converts train timetable + chart composition + segment vacancy into valid booking strategies for the user's exact journey.

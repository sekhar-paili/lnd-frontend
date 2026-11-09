# LND Learning & Development Platform — Project & Architecture Overview

**Document type:** Architecture & Status Report
**Audience:** Management, Engineering Management, Development Team
**Phase:** Proof of Concept (POC) — frontend and backend built and integrated
**Status:** Frontend production build passes, 100/100 frontend unit tests and 7/7 backend unit tests pass. Sign-in and data loading were confirmed against the running API in a browser session. A progress-saving defect found in that first live test has been fixed and checked against the database; a full live re-check of all write features is still pending (see Section 6).
**Last updated:** 2026-11-04

---

## 1. Executive summary (for management)

The LND Learning & Development Platform is a proof of concept for an internal training
portal. It lets an organization publish training videos, organize them into learning
paths, assign training to audiences, assess learners with quizzes, and track completion —
for three kinds of users: **L&D Admin**, **Employee**, and **Partner**.

The project began as a browser-only demo (no backend) to validate the product experience
cheaply. That first phase is complete, and the application now runs on a **real backend**:
a Node.js REST API with a **PostgreSQL** database. Users sign in with a username and
password, their data is stored on the server, and access rules and quiz grading are
enforced there.

**What this delivers today**

- All twelve target capabilities working through the API and database.
- Real sign-in: passwords stored only as hashes, signed session tokens, and role-based
  access enforced on the server as well as in the interface.
- Quiz grading done on the server; learners are never sent the correct answers.
- A mobile-first interface in the Safexpress visual identity, with an Android project
  generated via Capacitor.
- A documented, tested codebase and a Postman collection covering every API endpoint.

**What is not done yet (see Sections 5, 6 and 8)**

- Not connected to any corporate identity provider (no SSO), Slack, or vendor systems.
- The database contains **demo accounts with well-known passwords**; these must be removed
  or replaced before any real use.
- There is no user-management feature (creating users, resetting passwords).
- Not deployed anywhere: there is no production URL, HTTPS setup, or CI/CD pipeline yet.
- The Android build has not yet been verified against the API on a device or emulator.

**Headline recommendation:** the platform is ready for stakeholder demos and user
feedback. Before pilot use with real people it needs the security and operations work
listed in Section 8, chiefly real identity (SSO), user management, HTTPS deployment, and
automated API tests.

---

## 2. Objectives and scope

### 2.1 Business objectives
- Demonstrate the end-to-end L&D journey (discover → learn → assess → track).
- Provide a tangible artifact for stakeholder feedback and go/no-go decisions.
- De-risk the interface, navigation, role model, and data model before wider rollout.

### 2.2 In scope (built)
1. Dashboard with project milestones and a personal learning snapshot.
2. Video catalogue with search, filtering, and categories.
3. Video metadata management for L&D admins (create/edit/delete).
4. Video playback with progress tracking and resume.
5. Training assignments targeted by role, group, or individual.
6. My Learning page (assigned / in-progress / completed).
7. Quizzes: multiple choice and true/false, with configurable pass marks, plus an admin
   quiz builder.
8. Learning paths where later steps unlock after earlier assessments are passed.
9. Participant history and completion reports (admin).
10. Feedback capture on videos and paths, with averages.
11. Sign-in with three roles and role-based access.
12. Responsive, mobile-first interface; Android project via Capacitor.

### 2.3 Out of scope (not built)
- Corporate SSO / identity provider integration.
- Slack, vendor application, or AWS integrations.
- User management (create users, change or reset passwords, disable accounts).
- Learning-path authoring (paths are loaded from the database seed; there is no editor).
- Restricting Partners to assigned content only (Partners currently have the same read
  access to the catalogue as Employees; this is an open product decision).

---

## 3. Solution architecture (for engineering management and developers)

### 3.1 Architectural style
A classic three-tier design:

```
Angular 17 + Ionic 7 app            Express REST API (Node.js)         PostgreSQL
(browser, or Android via       -->  JWT auth, role checks,        -->  11 tables
 Capacitor WebView)                 validation, quiz grading
```

- **Client:** a single-page application in **Angular 17** using strict **NgModule**
  architecture (no standalone components), **Ionic 7** components, SCSS theming, and
  **Capacitor 6** for Android packaging.
- **API:** **Node.js** with **Express 4** and **TypeScript**. SQL is written directly with
  the `pg` driver using parameterized queries (no ORM). Request bodies are validated with
  **zod**.
- **Database:** **PostgreSQL**. The schema is in `backend/src/db/schema.sql` and is safe
  to re-run.

### 3.2 Frontend module structure

```
AppModule (bootstrap, IonicModule.forRoot, APP_INITIALIZER)
├── AppRoutingModule          Root routes, lazy loading, route guards
├── CoreModule                Singleton services, guards, HTTP interceptor, models
├── SharedModule              Reusable UI components + pipes; re-exports IonicModule
├── LayoutModule              App shell: fixed header, collapsible sidenav, fixed footer
└── Feature modules (lazy-loaded, each with its own routing module)
    ├── AuthModule            Login page (public, outside the shell)
    ├── DashboardModule       Dashboard + milestones
    ├── CatalogueModule       Catalogue, search, categories
    ├── VideoAdminModule      Video metadata CRUD (admin-only)
    ├── PlayerModule          Playback + progress tracking
    ├── AssignmentsModule     Assignments by audience (admin-only)
    ├── MyLearningModule      Personal learning aggregation
    ├── QuizModule            Take quizzes (MCQ, true/false)
    ├── QuizAdminModule       Quiz builder (admin-only)
    ├── LearningPathsModule   Paths with assessment-gated unlocking
    ├── ReportsModule         Participant history + completion reports (admin-only)
    └── FeedbackModule        Feedback capture and averages
```

**Design rules enforced**
- Singletons live only in `CoreModule`, guarded against double-import.
- `SharedModule` holds only reusable, stateless UI.
- Feature modules never import each other; they communicate through Core services.
- Every feature is lazy-loaded (the build emits one chunk per feature).

### 3.3 Frontend data flow
- Each Core service keeps an in-memory cache exposed as RxJS observables, so screens can
  read synchronously and update reactively.
- `AppStateService` loads the signed-in user's data (videos, quizzes, learning paths,
  assignments, progress, milestones) right after sign-in or session restore, before the
  first screen appears. Feedback and reports are fetched on demand.
- **Writes go to the API first.** Admin forms only clear and show "saved" after the server
  accepts the change; otherwise the server's error message is shown and the form is kept.
- Video progress is the one exception: it updates the screen immediately and saves in the
  background (it fires every few seconds). If saves fail, a warning toast is shown (at
  most once every 30 seconds) so a failure is never silent.
- On sign-out, or when the server rejects the token, **every cache is cleared** so the next
  account on the device cannot see the previous account's data.
- `AuthInterceptor` adds the token to requests for the API only (never to other URLs) and
  ends the session on a 401 from a protected call.
- Environment files (`environment.ts` / `environment.prod.ts`) hold the API base URL and
  other settings; the production build swaps in the production file.

### 3.4 Key frontend services (CoreModule)
| Service | Responsibility |
|---|---|
| `ApiService` | Typed HTTP wrapper; builds URLs from the environment's API base |
| `AuthService` | Sign-in/out, token storage, session restore via `/auth/me` |
| `RoleService` | Active user and role (fixed to the signed-in account) |
| `StorageService` | Typed, namespaced `localStorage` (session token and active user only) |
| `AppStateService` | Loads and clears all session data |
| `VideoService` | Catalogue and categories; admin create/update/delete |
| `ProgressService` | Playback position and completion; background saves |
| `QuizService` | Quizzes and the user's attempts; submits attempts for server grading; admin CRUD |
| `LearningPathService` | Step lock/unlock logic from progress and quiz passes |
| `AssignmentService` | The user's assignments; admin list and create |
| `FeedbackService` | Per-target feedback and submission |
| `ReportService` | Dashboard snapshot; admin participant reports |
| `MilestoneService` | Project milestones |

### 3.5 Backend structure and API

```
backend/src
├── server.ts, app.ts, config.ts      Startup, middleware wiring, environment config
├── db/                               pool, schema.sql, migrate, seed
├── middleware/auth.ts                requireAuth (JWT), requireRole
├── routes/*.routes.ts                One router per resource
└── services/scoring.ts               Quiz grading + answer-key stripping (unit tested)
```

**28 endpoints** (all under `/api`; everything except health and login requires a token):

| Resource | Endpoints | Access |
|---|---|---|
| Health | `GET /health` | Public |
| Auth | `POST /auth/login`, `GET /auth/me` | Login public; `me` any signed-in user |
| Videos | `GET /videos`, `GET /videos/:id`; `POST`, `PUT /:id`, `DELETE /:id` | Read: any user. Write: admin |
| Categories, Milestones | `GET /categories`, `GET /milestones` | Any signed-in user |
| Progress | `GET /progress/me`, `POST /progress` | Own data only |
| Quizzes | `GET /quizzes`, `GET /quizzes/:id` (answer keys only for admins); `POST`, `PUT /:id`, `DELETE /:id` | Read: any user. Write: admin |
| Quiz attempts | `POST /quizzes/:id/attempts` (server grades), `GET /quizzes/attempts/me`, `GET /quizzes/attempts/all` | Submit/own: any user. All: admin |
| Learning paths | `GET /learning-paths` | Any signed-in user |
| Assignments | `GET /assignments/me`; `GET /assignments`, `POST`, `DELETE /:id` | `me`: any user. Others: admin |
| Feedback | `GET /feedback?targetType&targetId`, `POST /feedback` | Any signed-in user (author = caller) |
| Reports | `GET /reports/participants` | Admin |

The Postman collection and environment are in `backend/postman/`.

### 3.6 Database
Eleven tables: `users`, `categories`, `videos`, `quizzes` (questions stored as JSONB),
`learning_paths`, `learning_path_steps`, `assignments`, `video_progress`, `quiz_attempts`,
`feedback`, `milestones`. Foreign keys and CHECK constraints enforce valid roles, ratings
(1–5), pass marks (0–100), and audience/item types.

### 3.7 Access control
- **Server (authoritative):** `requireAuth` rejects missing/invalid/expired tokens (401);
  `requireRole('LND_ADMIN')` rejects non-admins on admin endpoints (403).
- **Client (user experience):** `AuthGuard` redirects signed-out users to `/login`;
  `RoleGuard` keeps non-admins away from `/admin/*`; the navigation hides admin links.
  These improve usability but are not relied on for security.
- The role comes from the account the backend issued the token for. There is no in-app
  role switching; to act as another role, sign out and sign in as that user.

---

## 4. Technology stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Angular | 17 | Strict NgModule architecture, no standalone |
| Language | TypeScript | 5.4, strict mode | Frontend and backend |
| UI | Ionic Framework | 7 | NgModule mode (`IonicModule.forRoot`) |
| Native shell | Capacitor | 6 | Android project generated |
| Reactive | RxJS | 7.8 | Service caches |
| API | Node.js + Express | Node ≥ 18.19, Express 4.19 | |
| Database | PostgreSQL | 12+ | Developed on a local 12 install; `docker-compose.yml` uses 16 |
| DB access | `pg` | 8.11 | Parameterized SQL, no ORM |
| Validation | zod | 3.23 | Request bodies and query strings |
| Auth | jsonwebtoken + bcryptjs | 9.0 / 2.4 | JWT sessions; hashed passwords |
| API hardening | helmet, cors, express-rate-limit | 7.1 / 2.8 / 7.2 | |
| Frontend tests | Jasmine + Karma | 5 / 6.4 | Headless Chrome |
| Backend tests | Node test runner via `tsx` | | Scoring logic |

---

## 5. Security posture (important for management)

**What is in place**
- Passwords are stored only as bcrypt hashes and are never returned by the API.
- Sessions use signed JWTs (8-hour expiry by default). The API refuses to start in
  production with a short or placeholder signing secret.
- Role checks and quiz grading happen on the server. Learners never receive correct
  answers. Progress and feedback are always attributed to the signed-in user; a client
  cannot post as someone else.
- All SQL is parameterized; request bodies are validated; `helmet` sets security headers.
- Login is rate-limited (20 attempts per 15 minutes) and does not reveal whether the
  username or the password was wrong.
- Cross-origin requests are accepted only from an explicit allow-list (`CORS_ORIGINS`).

**Known limitations — must be addressed before real use**
1. **Demo accounts with known passwords** (`admin123`, `employee123`, `partner123`) are
   created by the seed script. They must be removed or replaced. The login screen shows
   them only in development builds.
2. **No user management and no SSO.** Accounts exist only because the seed creates them.
3. **Sign-out does not revoke the token.** It is discarded on the device, but a copied
   token remains valid until it expires. There are no refresh tokens or revocation list.
   The token is kept in `localStorage`, readable by any script on the page; the app loads
   no third-party scripts, but an httpOnly cookie would be the stricter alternative.
4. **No HTTPS, secrets management, or hosting** is configured. The production API URL in
   `environment.prod.ts` is a placeholder.
5. **No audit logging or monitoring.**
6. **Limited automated testing on the server:** only the quiz-scoring logic has tests.
   Authorization middleware, assignment targeting, reports, and the SQL itself are not
   covered by automated tests.
7. Admins can enter any valid URL as a video source; it is played in the viewer's browser.

---

## 6. Current status and verification

**Verified (automated)**
- **Frontend build:** production build compiles cleanly; each feature is a separate
  lazy-loaded chunk.
- **Frontend tests:** 100 of 100 pass in headless Chrome. They run against a mocked HTTP
  layer and cover sign-in and session restore, the token interceptor and 401 handling,
  every service's API calls and caches, cache clearing on sign-out, progress saving, quiz
  submission, error-message mapping, and path unlocking.
- **Backend:** type-check passes; 7 of 7 unit tests pass (scoring, pass-mark boundaries,
  answer-key stripping).

**Verified (live, in a browser session against the running API)**
- Sign-in, and loading of the catalogue, categories, quizzes, learning paths and
  milestones after sign-in.

**Found and fixed during that live test**
- Saving video progress returned a server error, caused by a SQL type-inference bug in
  the progress query. The corrected query was run against the real database (in a
  rolled-back transaction) and works. The fixed backend must be restarted, then the
  player re-tested, to close this out.

**Not yet verified live**
- Progress saving after the fix; admin create/edit/delete of videos and quizzes; quiz
  submission; feedback; assignment creation and targeting; reports.
- The Android app against the API, on a device or emulator.
- Cross-device QA and an accessibility audit.

---

## 7. Android application

The Android project exists in `frontend/android` (generated with Capacitor) and a build
has been produced at least once. It has **not** been verified against the API.

```bash
cd frontend
npm run build          # web build into dist/lnd-app
npx cap sync           # copy the web build and plugins into the Android project
npx cap open android   # open in Android Studio to run on a device/emulator
```

**Prerequisites:** Android Studio, the Android SDK, and JDK 17.

**What must be set up for the app to reach the API**
- `apiBaseUrl` must be an address the device can reach. In the emulator, `localhost`
  means the emulator itself; the host machine is `10.0.2.2`.
- The backend's `CORS_ORIGINS` must include the app's WebView origin (with Capacitor 6 this
  is `https://localhost` by default).
- Android 9+ blocks plain `http://` by default, so development against an `http://`
  address needs cleartext traffic allowed in the Capacitor configuration. Production
  should use HTTPS.

**Recommended before shipping an APK/AAB:** app icon and splash screen, status-bar and
safe-area handling, hardware back-button handling, hosted media (the seeded videos point
at a public sample file), and release signing.

---

## 8. Path to production (roadmap)

**Phase 1 — Proof of concept (done):** interface, backend, database, sign-in, all twelve
capabilities.

**Phase 2 — Make it safe and testable**
- Close out live verification of every write feature (Section 6).
- API integration tests, including authorization and assignment targeting.
- Remove seeded demo credentials; add user management or SSO.
- Token refresh/revocation; decide on token storage.

**Phase 3 — Deployment**
- Hosting, HTTPS, secrets management, production CORS origins and API URL.
- Logging, monitoring, backups, CI/CD.

**Phase 4 — Integrations and product decisions**
- Corporate SSO, Slack notifications, vendor and media hosting, AWS services as needed.
- Learning-path authoring; decide whether Partners are limited to assigned content.

**Phase 5 — Release**
- Cross-device and accessibility QA, performance budgets, end-to-end tests, Android
  signing and store release (and iOS if desired — Capacitor supports it from the same
  codebase).

---

## 9. Risks and assumptions

| Risk / assumption | Impact | Mitigation |
|---|---|---|
| Seeded accounts with known passwords reach a shared environment | Unauthorized access | Remove/replace before any shared deployment (Phase 2) |
| Stolen token stays valid after sign-out | Session misuse until expiry | Refresh/revocation; short expiry; HTTPS (Phases 2–3) |
| Server code mostly untested | Regressions in authorization or SQL go unnoticed | API integration tests (Phase 2) |
| Android not verified against the API | Device-specific connectivity failures | Verify early on a device; configure URL, CORS, HTTPS (Section 7) |
| Remote sample video URLs | Playback depends on a third-party file | Host owned media (Phase 4) |
| Mixed local setups (native Postgres vs Docker, shifting dev-server ports) | Setup friction | Documented setup in Section 10; pin the dev port to 4200 |

---

## 10. How to run and evaluate (for developers)

**1. Database and backend** (`backend/`)
```bash
# PostgreSQL must be running (local install, or: docker compose up -d)
cp .env.example .env        # then set DATABASE_URL and a long random JWT_SECRET
npm install
npm run db:setup            # creates the schema and seeds demo data (wipes seeded tables)
npm run dev                 # API on http://localhost:3000   (or: npm run build && npm start)
```
Check `http://localhost:3000/api/health` returns `{"status":"ok","database":"up"}`.
The role/database must exist before `db:setup`; it creates tables, not the database.

**2. Frontend** (`frontend/`)
```bash
npm install
npm start -- --port 4200    # http://localhost:4200
```
`CORS_ORIGINS` in `backend/.env` must include the origin the frontend runs on.

**3. Verify**
```bash
# frontend/
npm run build:prod
npm run test:ci
# backend/
npm run typecheck
npm test
```

**Demo accounts** (created by `db:seed`, from `frontend/src/assets/mock/users.json`):
- L&D Admin — `admin` / `admin123`
- Employee — `erin` / `employee123` (also `evan` / `employee123`)
- Partner — `partner` / `partner123`

`db:seed` resets the seeded tables to this data. It is also the way to reset demo progress.

**Repository documentation**
- `frontend/.kiro/specs/lnd-platform/` — requirements, design, and task breakdown.
- `frontend/.kiro/steering/` — product, tech, and structure guidelines.
- `frontend/README.md` — run and build instructions.
- `backend/postman/` — Postman collection and environment for the API.

---

## 11. Glossary

- **POC** — Proof of Concept.
- **SPA** — Single-Page Application.
- **NgModule** — Angular's classic module system (the mandated architecture here).
- **Capacitor** — Wraps a web app as a native iOS/Android app.
- **REST API** — The server interface the app calls over HTTP.
- **JWT** — JSON Web Token: the signed token that proves who is signed in.
- **bcrypt** — A password-hashing algorithm; passwords are never stored in readable form.
- **CORS** — Browser rule limiting which websites may call the API; configured by allow-list.
- **Seed** — Script that fills the database with demo data.
- **Guard** — Angular route protection that allows or blocks navigation.
- **L&D** — Learning & Development.

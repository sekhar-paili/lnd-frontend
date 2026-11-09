# Design: LND Learning & Development Platform (POC)

## Overview
A client-only Angular 17 single-page app using strict NgModule architecture, with
**Ionic 7** (`@ionic/angular`, NgModule mode) as the UI system and **Capacitor 6** for
native packaging. All data originates from JSON fixtures bundled in `assets/mock/`; all
mutable demo state is kept in `localStorage` via a typed `StorageService`. Shared state is
exposed through singleton services in `CoreModule` as RxJS `BehaviorSubject`-backed
observables. Feature modules are lazy-loaded and each owns its routing module. No backend,
no database, no external auth. Angular Material is not used.

## Architecture

### Module composition
- **AppModule** — bootstraps `AppComponent`, imports `BrowserModule`,
  `HttpClientModule`, `IonicModule.forRoot()`, `CoreModule`, `LayoutModule`,
  `AppRoutingModule`.
- **AppRoutingModule** — root routes; lazy-loads features with `loadChildren`; applies
  `RoleGuard` to protected routes.
- **CoreModule** — singleton services, guards, and domain models. Constructor guard throws
  if imported twice.
- **SharedModule** — declares/exports reusable components and pipes, and re-exports
  `CommonModule`, `FormsModule`, `ReactiveFormsModule`, and `IonicModule`.
- **LayoutModule** — Ionic app shell: `ion-split-pane` + `ion-menu` (role-filtered nav),
  `ion-header`/`ion-toolbar`, footer, and role switcher (`ion-select`/popover).
- **Feature modules** — Dashboard, Catalogue, VideoAdmin, Player, Assignments,
  MyLearning, Quiz, LearningPaths, Reports, Feedback. Each imports `SharedModule` and its
  own routing module; none import another feature module.

### Lazy routing (root)
```ts
const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'catalogue', loadChildren: () => import('./features/catalogue/catalogue.module').then(m => m.CatalogueModule) },
  { path: 'player', loadChildren: () => import('./features/player/player.module').then(m => m.PlayerModule) },
  { path: 'my-learning', loadChildren: () => import('./features/my-learning/my-learning.module').then(m => m.MyLearningModule) },
  { path: 'learning-paths', loadChildren: () => import('./features/learning-paths/learning-paths.module').then(m => m.LearningPathsModule) },
  { path: 'quiz', loadChildren: () => import('./features/quiz/quiz.module').then(m => m.QuizModule) },
  { path: 'feedback', loadChildren: () => import('./features/feedback/feedback.module').then(m => m.FeedbackModule) },
  { path: 'admin/videos', canActivate: [RoleGuard], data: { roles: [Role.LndAdmin] }, loadChildren: () => import('./features/video-admin/video-admin.module').then(m => m.VideoAdminModule) },
  { path: 'admin/assignments', canActivate: [RoleGuard], data: { roles: [Role.LndAdmin] }, loadChildren: () => import('./features/assignments/assignments.module').then(m => m.AssignmentsModule) },
  { path: 'admin/reports', canActivate: [RoleGuard], data: { roles: [Role.LndAdmin] }, loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule) },
  { path: '**', redirectTo: 'dashboard' },
];
```

## Data models (interfaces)
```ts
export enum Role { LndAdmin = 'LND_ADMIN', Employee = 'EMPLOYEE', Partner = 'PARTNER' }

export interface User { id: string; name: string; role: Role; group?: string; }

export interface VideoCategory { id: string; name: string; }

export interface Video {
  id: string; title: string; description: string; categoryId: string;
  durationSeconds: number; sourceUrl: string; thumbnailUrl?: string;
}

export enum QuestionType { MultipleChoice = 'MCQ', TrueFalse = 'TRUE_FALSE' }
export interface QuizOption { id: string; label: string; }
export interface QuizQuestion {
  id: string; type: QuestionType; prompt: string;
  options: QuizOption[];          // true/false => two fixed options
  correctOptionId: string;
}
export interface Quiz {
  id: string; title: string; passMarkPercent: number; questions: QuizQuestion[];
}
export interface QuizAttempt {
  id: string; quizId: string; userId: string; scorePercent: number;
  passed: boolean; answeredAt: string; answers: Record<string, string>;
}

export interface LearningPathStep {
  id: string; title: string; videoId?: string; quizId?: string; order: number;
}
export interface LearningPath {
  id: string; title: string; description: string; steps: LearningPathStep[];
}

export enum AudienceType { Role = 'ROLE', Group = 'GROUP', Individual = 'INDIVIDUAL' }
export enum AssignableType { Video = 'VIDEO', LearningPath = 'LEARNING_PATH' }
export interface Assignment {
  id: string; audienceType: AudienceType; audienceValue: string;
  itemType: AssignableType; itemId: string; assignedAt: string;
}

export interface VideoProgress {
  userId: string; videoId: string; positionSeconds: number;
  percentComplete: number; completed: boolean; updatedAt: string;
}

export interface Feedback {
  id: string; userId: string; targetType: 'VIDEO' | 'LEARNING_PATH';
  targetId: string; rating: number; comment?: string; createdAt: string;
}

export interface Milestone {
  id: string; title: string; status: 'PLANNED' | 'IN_PROGRESS' | 'DONE'; date: string;
}
```

## Services (CoreModule singletons)
- **StorageService** — typed `get<T>(key)`, `set<T>(key, value)`, `remove(key)`,
  `clearAll()` over `localStorage` with a `lnd.` namespace prefix. JSON serialized.
- **MockDataService** — loads each fixture from `assets/mock/*.json` via `HttpClient`,
  caches results. Used to seed services on first run.
- **RoleService** — holds `users` (simulated) and `activeRole$`/`activeUser$`
  `BehaviorSubject`s; `setRole(role)` persists to storage; restores on startup.
- **VideoService** — catalogue CRUD; merges fixture videos with admin-added videos from
  storage; exposes `videos$`, `search(term)`, `byCategory(id)`, `add/update/remove`.
- **ProgressService** — records `VideoProgress` per user; `save(progress)`, `get(user,
  video)`, completion threshold (e.g. 90%); exposes `progress$`.
- **QuizService** — provides quizzes; `score(quiz, answers)` returns `{ scorePercent,
  passed }`; records `QuizAttempt`; exposes `attempts$`.
- **LearningPathService** — computes per-step lock state from progress and quiz attempts;
  `isStepUnlocked(path, stepId, user)`; marks paths complete.
- **AssignmentService** — CRUD on assignments; `assignmentsFor(user)` resolves role/group/
  individual targeting.
- **FeedbackService** — `submit(feedback)`, `forTarget(type, id)`, `averageRating(...)`.
- **ReportService** — derives completion and attempt reports by joining progress,
  attempts, assignments, and users.
- **RoleGuard** — `canActivate` reads `data.roles` and the active role; redirects to
  `/dashboard` if not allowed.

### State flow
Services load fixtures once (via `MockDataService`), then layer `localStorage` mutations on
top. Mutations go through `StorageService` and push new values into the service's
`BehaviorSubject`, so components using the async pipe update reactively. A `resetDemo()`
on `StorageService`/app settings clears the namespace and re-seeds from fixtures.

## Feature designs (brief)
- **Dashboard** — milestone list + snapshot cards; admin sees aggregate metrics from
  `ReportService`.
- **Catalogue** — search bar + category filter + responsive card grid; routes to player.
- **VideoAdmin** — reactive form list/edit for video metadata; guarded to LndAdmin.
- **Player** — HTML5 `<video>`; `timeupdate` throttled to `ProgressService`; resume prompt.
- **Assignments** — admin form choosing audience + item; list of existing assignments.
- **MyLearning** — three grouped lists (assigned/in-progress/completed) from
  assignments + progress.
- **Quiz** — renders questions by type via reactive form; validates completeness; scores
  and shows pass/fail.
- **LearningPaths** — ordered steps with lock badges; navigates to step video/quiz;
  unlocks on pass.
- **Reports** — participant table + per-item aggregates; guarded to LndAdmin.
- **Feedback** — rating + comment form; admin view shows list and average.

## Error handling
- Fixture load failure surfaces a non-blocking error banner and falls back to empty lists.
- Form validation prevents invalid saves (Requirement 4, 8).
- Guards redirect unauthorized navigation rather than rendering protected screens.
- Storage parse errors are caught; corrupt keys are reset to defaults.

## Testing strategy
- **Unit (Jasmine/Karma, headless):**
  - `StorageService`: round-trip set/get, namespace, clear/reset.
  - `RoleService`: default role, setRole persistence, restore on init.
  - `VideoService`: search/filter, add/update/remove merge with fixtures.
  - `ProgressService`: save/resume, completion threshold.
  - `QuizService`: scoring for MCQ and true/false, pass-mark boundary (at, just below).
  - `LearningPathService`: lock/unlock transitions on pass/fail.
  - `AssignmentService`: audience resolution (role/group/individual).
  - `ReportService`: aggregation correctness.
  - `RoleGuard`: allow/deny/redirect.
- **Component smoke specs:** each feature component creates without error with mocked
  services.
- **Verification gate:** `npm run build` must pass; service specs must pass headless
  before a task is considered complete.

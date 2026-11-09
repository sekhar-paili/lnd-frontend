# Tasks: LND Learning & Development Platform (POC)

Small, independently testable tasks. Each references the requirements it satisfies.
Verification for every code task: `npm run build` compiles; any task's unit specs pass
headless (`ng test --watch=false --browsers=ChromeHeadlessNoSandbox`).

Status: all tasks complete. Build is clean and 41/41 unit tests pass headless.

- [x] 1. Scaffold Angular 17 NgModule workspace
  - Created the workspace with routing and SCSS, NgModule mode (no standalone).
  - `AppModule` + `AppRoutingModule` exist; app builds.
  - _Requirements: 14.2_

- [x] 2. Add CoreModule, SharedModule, LayoutModule skeletons
  - CoreModule with re-import guard; SharedModule re-exporting CommonModule/
    ReactiveFormsModule/Material; LayoutModule shell wired into AppModule.
  - _Requirements: 14.2, 14.4_

- [x] 3. Define domain models
  - All interfaces/enums from design added under core/models.
  - _Requirements: 3, 4, 5, 6, 8, 9, 10, 11_

- [x] 4. Implement StorageService (+ spec)
  - Typed namespaced localStorage wrapper with clear/reset. 6 passing tests.
  - _Requirements: 13.2, 13.4_

- [x] 5. Implement MockDataService + author JSON fixtures
  - Fixtures under assets/mock: users, videos, categories, quizzes, learning-paths,
    assignments, milestones, feedback. Loaded via HttpClient with cache.
  - _Requirements: 13.1, 13.3_

- [x] 6. Implement RoleService + RoleGuard (+ specs)
  - activeRole$/activeUser$, setRole persistence, restore on init; guard allow/deny/
    redirect by route data. Passing tests for both.
  - _Requirements: 1.1-1.5, 4.1, 6.1, 10.1_

- [x] 7. Build LayoutModule shell with role switcher and responsive sidenav
  - Header, collapsible sidenav (role-filtered nav), footer, role switcher, demo reset.
  - _Requirements: 1.2, 12.1, 12.3_

- [x] 8. SharedModule reusable UI
  - empty-state, search-bar, rating-stars, status-badge; duration + percent pipes.
  - _Requirements: 3.1, 3.4, 12.2_

- [x] 9. DashboardModule (lazy) + milestones and snapshot
  - Milestone list from fixtures; snapshot counts; admin aggregate metrics.
  - _Requirements: 2.1-2.3_

- [x] 10. VideoService (+ spec) and CatalogueModule (lazy)
  - Service: videos$, search, byCategory, add/update/remove merged with storage.
  - Catalogue: search + category filter + responsive grid + empty state; route to player.
  - _Requirements: 3.1-3.5, 13.1_

- [x] 11. VideoAdminModule (lazy, guarded) metadata CRUD
  - Reactive form create/edit/delete with validation; LndAdmin-only via guard.
  - _Requirements: 4.1-4.5_

- [x] 12. ProgressService (+ spec) and PlayerModule (lazy)
  - Service: save position/percent, completion threshold (90%), progress$.
  - Player: HTML5 video, throttled timeupdate, resume prompt, mark complete.
  - _Requirements: 5.1-5.4_

- [x] 13. QuizService (+ spec) and QuizModule (lazy)
  - Service: score MCQ + true/false, configurable pass mark, record attempts, attempts$.
  - Quiz UI: render by type, require all answers, show pass/fail.
  - _Requirements: 8.1-8.5_

- [x] 14. LearningPathService (+ spec) and LearningPathsModule (lazy)
  - Service: compute step lock state from progress + attempts; unlock on pass; complete.
  - UI: ordered steps with lock/unlocked/completed badges; navigate to step.
  - _Requirements: 9.1-9.4_

- [x] 15. AssignmentService (+ spec) and AssignmentsModule (lazy, guarded)
  - Service: add, assignmentsFor(user) resolving role/group/individual; video + path.
  - Admin UI: create assignment, list assignments.
  - _Requirements: 6.1-6.4_

- [x] 16. MyLearningModule (lazy)
  - Aggregate assigned/in-progress/completed for active user; navigate to item.
  - _Requirements: 7.1-7.3_

- [x] 17. FeedbackService (+ spec) and FeedbackModule (lazy)
  - Service: submit, forTarget, averageRating. UI: rating + comment; list + average.
  - _Requirements: 11.1-11.3_

- [x] 18. ReportService (+ spec) and ReportsModule (lazy, guarded)
  - Service: join progress/attempts/assignments/users into completion + attempt reports.
  - UI: participant table, quiz history, per-item aggregates; LndAdmin-only.
  - _Requirements: 10.1-10.4_

- [x] 19. Demo reset and responsive polish
  - Reset-demo action (role switcher menu) clears storage and re-seeds; responsive
    grids and collapsible sidenav at tablet/handset widths.
  - _Requirements: 12.1-12.3, 13.4_

- [x] 20. Final verification pass
  - `npm run build` clean; 41/41 headless unit specs green; all 10 features emit as
    lazy chunks (confirms lazy loading + NgModule architecture).
  - _Requirements: all_

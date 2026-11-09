# Structure: LND Platform (POC)

## High-level module map
```
AppModule
├── AppRoutingModule            # root routes + lazy feature wiring
├── CoreModule                  # singletons (imported once by AppModule)
├── LayoutModule                # Ionic shell: ion-split-pane/menu, header, footer, role switcher
├── SharedModule                # reusable components, pipes + re-exports IonicModule (no singletons)
└── Feature modules (lazy loaded, each with its own routing module)
    ├── DashboardModule         # dashboard + project milestones
    ├── CatalogueModule         # video catalogue, search, categories
    ├── VideoAdminModule        # video metadata management (L&D Admin)
    ├── PlayerModule            # video playback + progress tracking
    ├── AssignmentsModule       # training assignments by simulated audience
    ├── MyLearningModule        # My Learning aggregation page
    ├── QuizModule              # quizzes (MCQ, true/false, pass marks)
    ├── LearningPathsModule     # learning paths with assessment unlocking
    ├── ReportsModule           # participant history + completion reports
    └── FeedbackModule          # feedback tracking
```

## Folder layout
```
src/
├── app/
│   ├── app.module.ts            # imports IonicModule.forRoot()
│   ├── app-routing.module.ts
│   ├── app.component.{ts,html,scss}
│   │
│   ├── core/
│   │   ├── core.module.ts
│   │   ├── models/                # cross-cutting domain interfaces
│   │   │   ├── user.model.ts       # User, Role enum
│   │   │   ├── video.model.ts
│   │   │   ├── quiz.model.ts
│   │   │   ├── learning-path.model.ts
│   │   │   ├── assignment.model.ts
│   │   │   ├── progress.model.ts
│   │   │   ├── feedback.model.ts
│   │   │   └── milestone.model.ts
│   │   ├── services/
│   │   │   ├── storage.service.ts         # typed localStorage wrapper
│   │   │   ├── role.service.ts            # active role + simulated users
│   │   │   ├── mock-data.service.ts       # loads JSON fixtures from assets
│   │   │   ├── video.service.ts
│   │   │   ├── quiz.service.ts
│   │   │   ├── learning-path.service.ts
│   │   │   ├── assignment.service.ts
│   │   │   ├── progress.service.ts
│   │   │   ├── feedback.service.ts
│   │   │   └── report.service.ts
│   │   └── guards/
│   │       └── role.guard.ts              # route access by role
│   │
│   ├── shared/
│   │   ├── shared.module.ts
│   │   ├── components/            # card, search-bar, rating, badge, empty-state...
│   │   ├── directives/
│   │   └── pipes/                 # duration, percent, filter pipes
│   │
│   ├── layout/
│   │   ├── layout.module.ts
│   │   └── components/            # header, sidenav, footer, role-switcher, shell
│   │
│   └── features/
│       ├── dashboard/
│       │   ├── dashboard.module.ts
│       │   ├── dashboard-routing.module.ts
│       │   ├── pages/
│       │   └── components/
│       ├── catalogue/
│       ├── video-admin/
│       ├── player/
│       ├── assignments/
│       ├── my-learning/
│       ├── quiz/
│       ├── learning-paths/
│       ├── reports/
│       └── feedback/
│
└── assets/
    └── mock/                      # JSON fixtures
        ├── users.json
        ├── videos.json
        ├── categories.json
        ├── quizzes.json
        ├── learning-paths.json
        ├── assignments.json
        ├── milestones.json
        └── feedback.json
```

## Naming conventions
- Files: kebab-case with Angular suffixes (`video.service.ts`, `catalogue.component.ts`,
  `dashboard-routing.module.ts`).
- Classes: PascalCase with matching suffix (`VideoService`, `CatalogueComponent`,
  `DashboardRoutingModule`).
- Interfaces: PascalCase, no `I` prefix (`Video`, `QuizAttempt`, `LearningPath`).
- Enums: PascalCase type, PascalCase members (`Role.LndAdmin`, `QuestionType.TrueFalse`).
- Observables: trailing `$` (`activeRole$`, `videos$`).
- Route paths: kebab-case (`/learning-paths`, `/my-learning`).

## Dependency direction
- `features/*` depend on `core` (services/models) and `shared` (UI). 
- `core` depends on nothing in `features` or `layout`.
- `shared` depends on nothing stateful; pure reusable UI only.
- `layout` depends on `core` (role service) and `shared`.
- No feature module imports another feature module; they communicate only through
  `core` services.

## Testing layout
- Unit specs sit beside their subject: `video.service.spec.ts`,
  `quiz.service.spec.ts`, etc.
- Services carrying business rules (progress, quiz scoring, path unlocking) must have
  specs. Components get smoke-level specs.

## Ionic / Capacitor additions
- `src/theme/variables.scss` — Ionic theming variables, imported from `styles.scss`.
- `src/global.scss` is not used separately; Ionic core/utility CSS is pulled in through
  `angular.json` styles and `styles.scss`.
- `capacitor.config.ts` (workspace root) — app id, name, and `webDir: dist/lnd-app`.
- `ionic.config.json` (workspace root) — Ionic CLI project metadata.
- `android/` — generated native project (created by `npx cap add android`; not committed
  by default and not required for the web demo).
- UI uses Ionic components (`ion-*`) instead of Angular Material; `ion-icon` uses
  `ionicons`. No `@angular/material` or `@angular/cdk` dependency remains.

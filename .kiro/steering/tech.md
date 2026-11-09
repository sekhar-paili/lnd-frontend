# Tech: LND Platform (POC)

## Framework and language
- **Angular 17** using the classic **NgModule** architecture. Standalone components are
  **not** used anywhere in this project.
- **Ionic Framework 7** (`@ionic/angular` v7) as the UI component system, wired through
  `IonicModule.forRoot()` in `AppModule`. v7 fully supports NgModule apps on Angular 14+.
- **Capacitor 6** for native packaging (web + Android target configured).
- **TypeScript** with `strict` mode enabled.
- **RxJS** for reactive state and data streams.
- **SCSS** for styling, using Ionic CSS variables/theming.

## Architectural rules (non-negotiable)
- `AppModule` bootstraps the app; `AppRoutingModule` holds the root routes.
- `CoreModule` holds singletons (stateful services, role service, storage service) and is
  imported exactly once by `AppModule`. It guards against re-import.
- `SharedModule` holds reusable, stateless UI: components, directives, and pipes. It is
  imported by feature modules, never provides singletons.
- `LayoutModule` holds shell chrome built with Ionic (`ion-header`/`ion-toolbar`,
  `ion-menu`/`ion-split-pane`, footer, role switcher).
- `IonicModule` is imported (and re-exported) by `SharedModule` so feature modules get
  Ionic components; `IonicModule.forRoot()` is imported once in `AppModule`.
- Each business capability is its own **feature module**, **lazy loaded** through the
  Angular Router.
- Each feature module has its own **feature routing module** where it owns routes.
- Shared application state lives in Angular services exposed as RxJS observables.

## Environments
- `src/environments/environment.ts` (development, default) and
  `src/environments/environment.prod.ts` (production), sharing a typed
  `AppEnvironment` interface in `environment.model.ts`.
- Production builds swap the file via `fileReplacements` in `angular.json`
  (the `production` build configuration).
- Config is consumed in code (storage prefix, mock-data base path, completion
  threshold, demo-auth flag, future `apiBaseUrl`); import with
  `import { environment } from '.../environments/environment';`.

## State and persistence
- No database, no backend. The app is fully client-side.
- Seed data: JSON fixtures under `src/assets/mock/` loaded via `HttpClient` from
  bundled assets (no network server needed).
- Mutable demo state: a `StorageService` wraps `localStorage` with typed get/set and a
  namespace prefix. Progress, quiz attempts, feedback, settings, and the active role are
  stored there.
- A reset action clears demo state back to fixtures.

## Key libraries
- `@ionic/angular` ^7.8 — UI components, theming, mobile-first layout (NgModule mode).
- `@ionic/angular-toolkit` ^11 — Angular/Ionic schematics support.
- `ionicons` — icon set used by `ion-icon`.
- `@capacitor/core` + `@capacitor/cli` ^6, plus `@capacitor/android`, `@capacitor/app`,
  `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/status-bar` — native shell.
- `@angular/router` — routing and lazy loading.
- `@angular/common/http` — loading JSON fixtures from assets.
- `rxjs` — `BehaviorSubject`-backed services for shared state.
- Angular Material has been removed; Ionic is the single UI system.

## Build, run, and test
- `npm install` — install dependencies.
- `npm start` (`ng serve`) — run the dev server. **The user runs long-lived servers
  manually; the agent does not start `ng serve`.**
- `npm run build` — production build; used to verify compilation.
- `npm test` (`ng test` with Karma/Jasmine) — unit tests. For CI/single runs use
  `ng test --watch=false --browsers=ChromeHeadlessNoSandbox`.
- `ng lint` — lint if ESLint is configured.

## Capacitor (native packaging)
- `capacitor.config.ts` defines the app id/name and `webDir: dist/lnd-app`.
- `npx cap add android` scaffolds the native Android project (requires Android Studio to
  build/run the native app; not needed for the web demo).
- `npm run build` then `npx cap sync` copies the web build into native platforms.
- The web demo runs with just `npm install` and `npm start`; no native tooling or AWS
  credentials required.

## Conventions
- Strongly typed interfaces for every data model; no `any` in domain code.
- One concern per file; models, services, and components kept separate.
- Feature folders self-contained: `components/`, `pages/`, `services/`, `models/`,
  plus `<feature>.module.ts` and `<feature>-routing.module.ts`.
- Services are injectable and unit-testable; components stay thin.
- Observables over imperative state; async pipe in templates.

## Verification expectations
- Code must compile (`npm run build`) before a task is considered done.
- New services and non-trivial logic get unit tests runnable headless.
- UI behavior claims are verified by running the build and, where practical, the tests.

# LND — Learning & Development Platform (POC)

A front-end-only proof of concept for an internal Learning & Development platform, built
with **Angular 17** (strict **NgModule** architecture), **Ionic 7** for the UI, and
**Capacitor 6** for native packaging. No backend, no database, no credentials required —
seed data ships as JSON fixtures and demo state lives in `localStorage`.

## Run the web demo

```bash
npm install
npm start
```

Then open http://localhost:4200. Use the role switcher (top right) to switch between
**L&D Admin**, **Employee**, and **Partner**. "Reset demo data" in that menu clears all
progress, quiz attempts, and feedback back to the original fixtures.

## Verify

```bash
npm run build                                               # production build
npm test                                                    # unit tests (watch)
ng test --watch=false --browsers=ChromeHeadlessNoSandbox    # headless single run
```

## Native (Capacitor)

The web demo needs no native tooling. To package as a native app:

```bash
npm run build          # produces dist/lnd-app
npx cap add android    # scaffold the Android project (requires Android Studio)
npx cap sync           # copy the web build into the native project
npx cap open android   # open in Android Studio to run on device/emulator
```

`capacitor.config.ts` sets the app id (`com.lnd.poc`), name, and `webDir: dist/lnd-app`.

## Architecture

- `AppModule` / `AppRoutingModule` — bootstrap and root routes (lazy `loadChildren`).
  `AppModule` imports `IonicModule.forRoot()`.
- `CoreModule` — singleton services (role, storage, video, quiz, progress, learning
  paths, assignments, feedback, reports), guards, and domain models. Guarded against
  re-import.
- `SharedModule` — reusable components (empty-state, search-bar, rating-stars,
  status-badge), pipes (duration, percent), and re-exports `IonicModule`.
- `LayoutModule` — Ionic app shell: `ion-split-pane` + `ion-menu` (role-filtered nav),
  header toolbar, footer, role switcher popover.
- `features/*` — one lazy-loaded feature module per capability, each with its own routing
  module: dashboard, catalogue, video-admin, player, assignments, my-learning, quiz,
  quiz-admin, learning-paths, reports, feedback.

No standalone components are used anywhere. The UI is built entirely with Ionic
components (`ion-*`); Angular Material is not used. Admin routes (`/admin/*`) are protected
by a role guard.

## Data

- Seed fixtures: `src/assets/mock/*.json` (loaded via `HttpClient`, no server).
- Mutable demo state: browser `localStorage`, namespaced under `lnd.`.
- Ionic theming: `src/theme/variables.scss`.

See `.kiro/specs/lnd-platform/` for requirements, design, and tasks, and
`.kiro/steering/` for product, tech, and structure docs.
# e2e-stack



learning fullstack

chore: Initialize LND platform project with Angular/Ionic setup

- Add project configuration files (.editorconfig, .gitignore)
- Add product, technical, and structural steering documents
- Add detailed design specifications and task tracking
- Set up Angular application with core module and routing
- Add core services for authentication, storage, and state management
- Add feature modules for auth, catalogue, dashboard, and assignments
- Add data models for users, learning paths, quizzes, and progress tracking
- Configure Android build with Gradle and Capacitor integration
- Add comprehensive test setup with Karma and Jasmine
- Set up package.json with Angular, Ionic, and Capacitor dependencies
- Add project documentation and architecture diagrams
- Initialize learning management platform foundation for LND POC
"# lnd-frontend" 

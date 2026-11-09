# Product: LND Learning & Development Platform (POC)

## Purpose
A proof of concept for an internal Learning & Development (L&D) platform. It lets an
organization publish training videos, organize them into learning paths, assign training
to audiences, assess learners with quizzes, and track completion. This phase is a
front-end-only demo with no backend and no database.

## Target users (demo roles)
- **L&D Admin**: manages the video catalogue and metadata, builds quizzes and learning
  paths, creates assignments, and views participant history and completion reports.
- **Employee**: browses the catalogue, watches videos, takes quizzes, follows learning
  paths, sees their My Learning page, and submits feedback.
- **Partner**: an external participant with a restricted view of assigned content and
  their own learning progress.

Roles are simulated. The user switches roles from the UI; there is no real
authentication, SSO, Slack, or Vendor App integration in this phase.

## Core capabilities
1. Dashboard with project milestones and a personal learning snapshot.
2. Video catalogue with search, filtering, and categories.
3. Video metadata management for L&D admins (CRUD on video records).
4. Video playback with progress tracking (resume position, percent complete).
5. Training assignments targeted at a simulated audience (role, group, or individual).
6. My Learning page aggregating assigned, in-progress, and completed items.
7. Quizzes: multiple choice, true/false, and configurable pass marks.
8. Learning paths where later steps unlock only after passing earlier assessments.
9. Participant history and completion reports.
10. Feedback tracking on videos and learning paths.
11. Responsive, mobile-first interface (Ionic) usable on phone, tablet, and desktop, and
    packageable as a native app via Capacitor.

## Explicit non-goals for this phase
- No real database or persistence server.
- No backend API dependency.
- No real identity provider, SSO, Slack, or third-party vendor integration.
- No AWS credentials required to run the demo.

## Data strategy
- Seed/mock data ships as JSON fixtures bundled with the app.
- Demo-only mutable state (progress, settings, feedback, active role) is persisted to
  browser `localStorage` so a refresh keeps the demo state.
- All persistence is clearly demo-scoped and resettable.

## Success criteria for the POC
- A reviewer can switch between the three roles and see role-appropriate navigation and
  screens.
- A learner can watch a video, have progress saved and resumed, take a quiz, pass or
  fail against a configurable pass mark, and unlock the next learning-path step.
- An admin can add and edit video metadata, build a quiz, and create an assignment.
- Completion reports reflect the demo activity.
- The app runs with `npm install` and `npm start`, no credentials or services needed.

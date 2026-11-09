# Requirements: LND Learning & Development Platform (POC)

## Introduction
This document captures the requirements for a front-end-only proof of concept of an
internal Learning & Development platform. The POC is built with Angular 17 using a strict
NgModule architecture, lazy-loaded feature modules, JSON fixtures for seed data, and
browser `localStorage` for demo-only mutable state. There is no database, no backend, and
no real SSO/Slack/Vendor integration in this phase. AWS credentials are not required.

Acceptance criteria use EARS notation (WHEN/IF ... THE SYSTEM SHALL ...).

---

## Requirement 1: Simulated roles and role switching
**User story:** As a reviewer, I want to switch between L&D Admin, Employee, and Partner
roles, so that I can see role-appropriate navigation and screens without real auth.

### Acceptance criteria
1. WHEN the app loads THE SYSTEM SHALL select a default active role and persist it to
   `localStorage`.
2. WHEN the user selects a different role from the role switcher THE SYSTEM SHALL update
   the active role and re-render navigation to match that role.
3. THE SYSTEM SHALL expose the active role as an RxJS observable from a singleton service.
4. IF a route requires a role the active role does not hold THEN THE SYSTEM SHALL block
   navigation and redirect to an allowed route.
5. WHEN the user reloads the page THE SYSTEM SHALL restore the previously active role.

---

## Requirement 2: Dashboard and project milestones
**User story:** As any user, I want a dashboard with milestones and my learning snapshot,
so that I can see status at a glance.

### Acceptance criteria
1. WHEN the user opens the dashboard THE SYSTEM SHALL display a list of project milestones
   loaded from fixtures, each with title, status, and date.
2. THE SYSTEM SHALL display a snapshot of the active user's assigned, in-progress, and
   completed item counts.
3. IF the active role is L&D Admin THEN THE SYSTEM SHALL additionally show aggregate
   completion metrics across participants.

---

## Requirement 3: Video catalogue, search, and categories
**User story:** As a learner, I want to browse, search, and filter videos by category, so
that I can find relevant training.

### Acceptance criteria
1. WHEN the user opens the catalogue THE SYSTEM SHALL list videos with title, category,
   duration, and thumbnail.
2. WHEN the user types a search term THE SYSTEM SHALL filter the list to videos whose
   title or description matches, case-insensitively.
3. WHEN the user selects a category THE SYSTEM SHALL show only videos in that category.
4. IF no videos match THEN THE SYSTEM SHALL display an empty-state message.
5. WHEN the user selects a video THE SYSTEM SHALL navigate to the player for that video.

---

## Requirement 4: Video metadata management (L&D Admin)
**User story:** As an L&D Admin, I want to create, edit, and remove video metadata, so that
the catalogue stays current.

### Acceptance criteria
1. IF the active role is not L&D Admin THEN THE SYSTEM SHALL prevent access to the video
   admin screens.
2. WHEN an admin submits a new video with valid title, category, duration, and source URL
   THE SYSTEM SHALL add it to the catalogue and persist it to demo state.
3. WHEN an admin edits an existing video THE SYSTEM SHALL update its metadata and reflect
   the change in the catalogue.
4. WHEN an admin deletes a video THE SYSTEM SHALL remove it from the catalogue.
5. IF a required field is missing or invalid THEN THE SYSTEM SHALL show a validation error
   and SHALL NOT save.

---

## Requirement 5: Video playback and progress tracking
**User story:** As a learner, I want playback to track and resume my progress, so that I
can continue where I left off.

### Acceptance criteria
1. WHEN the user plays a video THE SYSTEM SHALL periodically record the current playback
   position and percent complete to demo state.
2. WHEN the user reopens a partially watched video THE SYSTEM SHALL offer to resume from
   the last saved position.
3. WHEN percent complete reaches a completion threshold THE SYSTEM SHALL mark the video
   as completed for the active user.
4. THE SYSTEM SHALL expose per-user progress through a singleton service as an observable.

---

## Requirement 6: Training assignments by simulated audience
**User story:** As an L&D Admin, I want to assign training to a simulated audience, so that
targeted users receive it.

### Acceptance criteria
1. IF the active role is not L&D Admin THEN THE SYSTEM SHALL prevent creating assignments.
2. WHEN an admin creates an assignment targeting a role, group, or individual THE SYSTEM
   SHALL persist it and make it visible to matching users.
3. WHEN a targeted user opens My Learning THE SYSTEM SHALL list the assigned items.
4. THE SYSTEM SHALL support assigning both videos and learning paths.

---

## Requirement 7: My Learning page
**User story:** As a learner, I want one page aggregating my learning, so that I can track
what to do next.

### Acceptance criteria
1. WHEN the user opens My Learning THE SYSTEM SHALL list items grouped as assigned,
   in-progress, and completed for the active user.
2. WHEN the user selects an item THE SYSTEM SHALL navigate to the relevant player, quiz,
   or learning path.
3. THE SYSTEM SHALL reflect progress and completion updates without a full reload.

---

## Requirement 8: Quizzes (MCQ, true/false, configurable pass marks)
**User story:** As a learner, I want to take quizzes and know if I passed, so that my
knowledge is assessed.

### Acceptance criteria
1. THE SYSTEM SHALL support multiple-choice (single correct) and true/false questions.
2. THE SYSTEM SHALL allow an admin-configurable pass mark per quiz expressed as a percent.
3. WHEN the user submits a quiz THE SYSTEM SHALL score it and compare against the pass
   mark to determine pass or fail.
4. WHEN scoring completes THE SYSTEM SHALL persist the attempt (score, pass/fail,
   timestamp) to demo state.
5. IF the user has not answered all required questions THEN THE SYSTEM SHALL prevent
   submission and indicate what is missing.
6. IF the active role is not L&D Admin THEN THE SYSTEM SHALL prevent access to the quiz
   builder.
7. WHEN an admin authors a quiz with a title, a pass mark, and one or more questions
   (each with a prompt, options, and a selected correct option) THE SYSTEM SHALL persist
   it to demo state and make it available for learners and learning paths.
8. WHEN an admin edits or removes a quiz THE SYSTEM SHALL reflect the change in the quiz
   list and wherever the quiz is referenced.
9. IF a question has no correct option selected from its own options THEN THE SYSTEM SHALL
   prevent saving and indicate the problem.

---

## Requirement 9: Learning paths with assessment-based unlocking
**User story:** As a learner, I want later path steps to unlock after I pass earlier
assessments, so that I progress in order.

### Acceptance criteria
1. WHEN the user opens a learning path THE SYSTEM SHALL display its ordered steps and each
   step's locked/unlocked/completed state.
2. THE SYSTEM SHALL keep a step locked until its prerequisite step is completed and, where
   the prerequisite has an assessment, passed.
3. WHEN the user passes a step's assessment THE SYSTEM SHALL unlock the next step.
4. WHEN all steps are completed THE SYSTEM SHALL mark the path complete for the user.

---

## Requirement 10: Participant history and completion reports
**User story:** As an L&D Admin, I want participant history and completion reports, so that
I can track outcomes.

### Acceptance criteria
1. IF the active role is not L&D Admin THEN THE SYSTEM SHALL restrict access to reports.
2. WHEN an admin opens reports THE SYSTEM SHALL show per-participant completion status for
   videos, quizzes, and paths derived from demo state.
3. THE SYSTEM SHALL show a participant's quiz attempt history with scores and pass/fail.
4. THE SYSTEM SHALL show aggregate completion counts per item.

---

## Requirement 11: Feedback tracking
**User story:** As a learner, I want to leave feedback on content, so that the org can
improve it.

### Acceptance criteria
1. WHEN the user submits feedback (rating and optional comment) on a video or path THE
   SYSTEM SHALL persist it to demo state.
2. WHEN an admin views an item THE SYSTEM SHALL show its collected feedback and average
   rating.
3. THE SYSTEM SHALL associate each feedback entry with the active user and a timestamp.

---

## Requirement 12: Responsive web interface
**User story:** As any user, I want the interface to adapt to screen size, so that it is
usable on desktop and tablet.

### Acceptance criteria
1. WHEN the viewport is narrow THE SYSTEM SHALL collapse the sidenav into a toggled menu.
2. THE SYSTEM SHALL lay out catalogue and list screens as responsive grids/stacks.
3. THE SYSTEM SHALL keep primary actions reachable at desktop and tablet widths.

---

## Requirement 13: No-database / no-backend demo constraints
**User story:** As a reviewer, I want to run the demo with no services or credentials, so
that setup is trivial.

### Acceptance criteria
1. THE SYSTEM SHALL load all seed data from bundled JSON fixtures without any network
   server.
2. THE SYSTEM SHALL persist demo-only mutable state to browser `localStorage`.
3. THE SYSTEM SHALL run with only `npm install` and `npm start`, requiring no database,
   backend, or AWS credentials.
4. THE SYSTEM SHALL provide a way to reset demo state back to the original fixtures.

---

## Requirement 14: NgModule architecture compliance
**User story:** As a maintainer, I want strict NgModule architecture, so that the codebase
matches the mandated design.

### Acceptance criteria
1. THE SYSTEM SHALL NOT use standalone components, directives, or pipes.
2. THE SYSTEM SHALL provide AppModule, AppRoutingModule, CoreModule, SharedModule, and
   LayoutModule.
3. THE SYSTEM SHALL implement each business capability as a lazy-loaded feature module
   with its own routing module where it owns routes.
4. THE SYSTEM SHALL provide singleton services only in CoreModule and guard it against
   re-import.

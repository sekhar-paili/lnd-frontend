import { Injectable } from '@angular/core';
import { filter, firstValueFrom } from 'rxjs';

import { Role } from '../models';
import { AssignmentService } from './assignment.service';
import { AuthService } from './auth.service';
import { LearningPathService } from './learning-path.service';
import { MilestoneService } from './milestone.service';
import { ProgressService } from './progress.service';
import { QuizService } from './quiz.service';
import { VideoService } from './video.service';

/**
 * Loads and clears the data tied to a signed-in session. Every API endpoint
 * needs a token, so nothing can be loaded until the user is authenticated.
 */
@Injectable({ providedIn: 'root' })
export class AppStateService {
  constructor(
    private readonly auth: AuthService,
    private readonly video: VideoService,
    private readonly quiz: QuizService,
    private readonly paths: LearningPathService,
    private readonly assignments: AssignmentService,
    private readonly progress: ProgressService,
    private readonly milestones: MilestoneService,
  ) {
    // Drop every cache the moment the user signs out (including a forced
    // sign-out when the token expires) so the next account to sign in on this
    // device can never see the previous account's data.
    this.auth.authUser$
      .pipe(filter((user) => user === null))
      .subscribe(() => this.clearSessionData());
  }

  /**
   * App startup: restore the session, and if there is one, load its data
   * before routing begins so the first page already has what it renders.
   * Never rejects, so a backend outage cannot block the app from starting.
   */
  async initAll(): Promise<void> {
    await this.auth.init();
    if (this.auth.isAuthenticated) {
      await this.loadSessionData();
    }
  }

  /**
   * Loads everything the signed-in user's screens read. Each load handles its
   * own errors; resolves to false if any of them failed (the app still opens
   * with whatever did load). Call after sign-in, before navigating.
   */
  async loadSessionData(): Promise<boolean> {
    const isAdmin = this.auth.currentUser?.role === Role.LndAdmin;
    const results = await Promise.all([
      firstValueFrom(this.video.load()),
      firstValueFrom(this.quiz.load()),
      firstValueFrom(this.paths.load()),
      firstValueFrom(this.assignments.load(isAdmin)),
      firstValueFrom(this.progress.load()),
      firstValueFrom(this.milestones.load()),
    ]);
    return results.every(Boolean);
  }

  clearSessionData(): void {
    this.video.clear();
    this.quiz.clear();
    this.paths.clear();
    this.assignments.clear();
    this.progress.clear();
    this.milestones.clear();
  }
}

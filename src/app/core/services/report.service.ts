import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { ApiService } from '../http/api.service';
import { AssignableType, QuizAttempt, User } from '../models';
import { AssignmentService } from './assignment.service';
import { LearningPathService } from './learning-path.service';
import { ProgressService } from './progress.service';

export interface ParticipantReport {
  user: User;
  videosCompleted: number;
  quizzesPassed: number;
  pathsCompleted: number;
  attempts: QuizAttempt[];
}

export interface SnapshotCounts {
  assigned: number;
  inProgress: number;
  completed: number;
}

interface ParticipantSummary {
  user: User;
  videosCompleted: number;
  quizzesPassed: number;
  pathsCompleted: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(
    private readonly api: ApiService,
    private readonly progress: ProgressService,
    private readonly paths: LearningPathService,
    private readonly assignments: AssignmentService,
  ) {}

  /** Assigned / in-progress / completed counts for the signed-in user's dashboard. */
  snapshotFor(user: User): SnapshotCounts {
    const assigned = this.assignments.myAssignments();
    let completed = 0;
    let inProgress = 0;
    for (const a of assigned) {
      if (a.itemType === AssignableType.Video) {
        const p = this.progress.get(user.id, a.itemId);
        if (p?.completed) {
          completed++;
        } else if (p && p.percentComplete > 0) {
          inProgress++;
        }
      } else {
        const path = this.paths.getById(a.itemId);
        if (path && this.paths.isPathComplete(path, user.id)) {
          completed++;
        } else if (path) {
          const anyProgress = path.steps.some((s) =>
            this.paths.isStepCompleted(s, user.id),
          );
          if (anyProgress) {
            inProgress++;
          }
        }
      }
    }
    return { assigned: assigned.length, inProgress, completed };
  }

  /**
   * Per-participant completion summary with each person's quiz attempt
   * history. Admin only (enforced by the server).
   */
  loadParticipantReports(): Observable<ParticipantReport[]> {
    return forkJoin({
      summaries: this.api.get<ParticipantSummary[]>('/reports/participants'),
      attempts: this.api.get<QuizAttempt[]>('/quizzes/attempts/all'),
    }).pipe(
      map(({ summaries, attempts }) =>
        summaries.map((s) => ({
          ...s,
          attempts: attempts.filter((a) => a.userId === s.user.id),
        })),
      ),
    );
  }
}

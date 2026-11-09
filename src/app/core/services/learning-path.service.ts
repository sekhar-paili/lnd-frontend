import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { warnLoadFailure } from '../http/api-error';
import { ApiService } from '../http/api.service';
import {
  LearningPath,
  LearningPathStep,
  LearningPathStepView,
  StepState,
} from '../models';
import { ProgressService } from './progress.service';
import { QuizService } from './quiz.service';

@Injectable({ providedIn: 'root' })
export class LearningPathService {
  private readonly pathsSubject = new BehaviorSubject<LearningPath[]>([]);
  readonly paths$ = this.pathsSubject.asObservable();

  constructor(
    private readonly api: ApiService,
    private readonly progress: ProgressService,
    private readonly quiz: QuizService,
  ) {}

  load(): Observable<boolean> {
    return this.api.get<LearningPath[]>('/learning-paths').pipe(
      tap((paths) => this.pathsSubject.next(paths)),
      map(() => true),
      catchError((err: unknown) => {
        warnLoadFailure('learning paths', err);
        return of(false);
      }),
    );
  }

  clear(): void {
    this.pathsSubject.next([]);
  }

  getById(id: string): LearningPath | undefined {
    return this.pathsSubject.value.find((p) => p.id === id);
  }

  isStepCompleted(step: LearningPathStep, userId: string): boolean {
    if (step.quizId) {
      return this.quiz.hasPassed(userId, step.quizId);
    }
    if (step.videoId) {
      return this.progress.isVideoCompleted(userId, step.videoId);
    }
    return false;
  }

  /** Returns steps in order, each tagged with its lock/unlock/complete state. */
  getStepViews(path: LearningPath, userId: string): LearningPathStepView[] {
    const ordered = [...path.steps].sort((a, b) => a.order - b.order);
    let previousComplete = true; // first step has no prerequisite
    return ordered.map((step) => {
      const completed = this.isStepCompleted(step, userId);
      let state: StepState;
      if (completed) {
        state = StepState.Completed;
      } else if (previousComplete) {
        state = StepState.Unlocked;
      } else {
        state = StepState.Locked;
      }
      previousComplete = completed;
      return { ...step, state };
    });
  }

  isPathComplete(path: LearningPath, userId: string): boolean {
    return path.steps.every((s) => this.isStepCompleted(s, userId));
  }
}

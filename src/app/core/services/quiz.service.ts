import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, tap } from 'rxjs';

import { warnLoadFailure } from '../http/api-error';
import { ApiService } from '../http/api.service';
import { Quiz, QuizAttempt, QuizResult } from '../models';

/** A quiz as submitted for creation: the server assigns the id. */
export type NewQuiz = Omit<Quiz, 'id'>;

export interface AttemptOutcome {
  attempt: QuizAttempt;
  result: QuizResult;
}

/**
 * Quizzes and the signed-in user's attempts, backed by the API.
 *
 * Grading happens only on the server. Learners are never sent the answer key,
 * so there is deliberately no client-side scoring here.
 */
@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly quizzesSubject = new BehaviorSubject<Quiz[]>([]);
  private readonly attemptsSubject = new BehaviorSubject<QuizAttempt[]>([]);

  readonly quizzes$ = this.quizzesSubject.asObservable();
  readonly attempts$ = this.attemptsSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  load(): Observable<boolean> {
    return forkJoin({
      quizzes: this.api.get<Quiz[]>('/quizzes'),
      attempts: this.api.get<QuizAttempt[]>('/quizzes/attempts/me'),
    }).pipe(
      tap(({ quizzes, attempts }) => {
        this.quizzesSubject.next(quizzes);
        this.attemptsSubject.next(attempts);
      }),
      map(() => true),
      catchError((err: unknown) => {
        warnLoadFailure('quizzes', err);
        return of(false);
      }),
    );
  }

  clear(): void {
    this.quizzesSubject.next([]);
    this.attemptsSubject.next([]);
  }

  getById(id: string): Quiz | undefined {
    return this.quizzesSubject.value.find((q) => q.id === id);
  }

  /** Admin only (enforced by the server). */
  create(quiz: NewQuiz): Observable<Quiz> {
    return this.api.post<Quiz>('/quizzes', quiz).pipe(
      tap((created) => this.quizzesSubject.next([...this.quizzesSubject.value, created])),
    );
  }

  /** Admin only (enforced by the server). */
  update(quiz: Quiz): Observable<Quiz> {
    const { id, ...body } = quiz;
    return this.api.put<Quiz>(`/quizzes/${id}`, body).pipe(
      tap((updated) =>
        this.quizzesSubject.next(
          this.quizzesSubject.value.map((q) => (q.id === updated.id ? updated : q)),
        ),
      ),
    );
  }

  /** Admin only (enforced by the server). */
  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/quizzes/${id}`).pipe(
      tap(() =>
        this.quizzesSubject.next(this.quizzesSubject.value.filter((q) => q.id !== id)),
      ),
    );
  }

  /**
   * Submits answers (`{ questionId: optionId }`). The server grades the
   * attempt, stores it, and returns the authoritative score and pass/fail.
   */
  submitAttempt(quizId: string, answers: Record<string, string>): Observable<AttemptOutcome> {
    return this.api.post<AttemptOutcome>(`/quizzes/${quizId}/attempts`, { answers }).pipe(
      tap((outcome) =>
        this.attemptsSubject.next([outcome.attempt, ...this.attemptsSubject.value]),
      ),
    );
  }

  attemptsForUser(userId: string): QuizAttempt[] {
    return this.attemptsSubject.value.filter((a) => a.userId === userId);
  }

  hasPassed(userId: string, quizId: string): boolean {
    return this.attemptsSubject.value.some(
      (a) => a.userId === userId && a.quizId === quizId && a.passed,
    );
  }
}

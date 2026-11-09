import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, catchError, map, of, tap } from 'rxjs';

import { warnLoadFailure } from '../http/api-error';
import { ApiService } from '../http/api.service';
import { COMPLETION_THRESHOLD_PERCENT, VideoProgress } from '../models';

/**
 * The signed-in user's video progress. The cache holds only that user's rows
 * (the API returns nothing else), so `userId` arguments exist for call-site
 * clarity and are matched against the cached rows.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly progressSubject = new BehaviorSubject<VideoProgress[]>([]);
  readonly progress$ = this.progressSubject.asObservable();

  private readonly saveFailedSubject = new Subject<void>();
  /** Emits each time a background save is rejected or cannot reach the server. */
  readonly saveFailed$ = this.saveFailedSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  load(): Observable<boolean> {
    return this.api.get<VideoProgress[]>('/progress/me').pipe(
      tap((rows) => this.progressSubject.next(rows)),
      map(() => true),
      catchError((err: unknown) => {
        warnLoadFailure('progress', err);
        return of(false);
      }),
    );
  }

  clear(): void {
    this.progressSubject.next([]);
  }

  /**
   * Records playback progress. The local cache is updated immediately (the
   * player reads completion straight back) and the save is sent to the server
   * in the background. A failure is announced on `saveFailed$` (the shell
   * rate-limits the warning, since this fires every few seconds in playback);
   * the next save carries the latest position, so a transient error heals.
   */
  save(userId: string, videoId: string, positionSeconds: number, percentComplete: number): void {
    const percent = Math.min(100, Math.max(0, percentComplete));
    const position = Math.max(0, positionSeconds);
    const all = [...this.progressSubject.value];
    const idx = all.findIndex((p) => p.userId === userId && p.videoId === videoId);
    // Completion is sticky: once reached it never reverts, matching the server.
    const completed = percent >= COMPLETION_THRESHOLD_PERCENT || (idx >= 0 && all[idx].completed);
    const entry: VideoProgress = {
      userId,
      videoId,
      positionSeconds: position,
      percentComplete: percent,
      completed,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      all[idx] = entry;
    } else {
      all.push(entry);
    }
    this.progressSubject.next(all);

    this.api
      .post<VideoProgress>('/progress', {
        videoId,
        positionSeconds: position,
        percentComplete: percent,
      })
      .subscribe({
        next: (saved) => {
          if (saved.completed) {
            this.markCompleted(userId, videoId);
          }
        },
        error: (err: unknown) => {
          warnLoadFailure('a progress save', err);
          this.saveFailedSubject.next();
        },
      });
  }

  get(userId: string, videoId: string): VideoProgress | undefined {
    return this.progressSubject.value.find((p) => p.userId === userId && p.videoId === videoId);
  }

  forUser(userId: string): VideoProgress[] {
    return this.progressSubject.value.filter((p) => p.userId === userId);
  }

  isVideoCompleted(userId: string, videoId: string): boolean {
    return this.get(userId, videoId)?.completed ?? false;
  }

  /** Applies the server's authoritative completion to the cache. */
  private markCompleted(userId: string, videoId: string): void {
    const rows = this.progressSubject.value;
    const target = rows.find((p) => p.userId === userId && p.videoId === videoId);
    if (target && !target.completed) {
      this.progressSubject.next(
        rows.map((p) => (p === target ? { ...p, completed: true } : p)),
      );
    }
  }
}

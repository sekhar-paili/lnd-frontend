import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { warnLoadFailure } from '../http/api-error';
import { ApiService } from '../http/api.service';
import { Milestone } from '../models';

@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private readonly milestonesSubject = new BehaviorSubject<Milestone[]>([]);
  readonly milestones$ = this.milestonesSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  load(): Observable<boolean> {
    return this.api.get<Milestone[]>('/milestones').pipe(
      tap((milestones) => this.milestonesSubject.next(milestones)),
      map(() => true),
      catchError((err: unknown) => {
        warnLoadFailure('milestones', err);
        return of(false);
      }),
    );
  }

  clear(): void {
    this.milestonesSubject.next([]);
  }
}

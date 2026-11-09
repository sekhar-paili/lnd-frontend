import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { warnLoadFailure } from '../http/api-error';
import { ApiService } from '../http/api.service';
import { Assignment } from '../models';

/** An assignment as submitted for creation: the server assigns id and date. */
export type NewAssignment = Pick<
  Assignment,
  'audienceType' | 'audienceValue' | 'itemType' | 'itemId'
>;

/**
 * Two views of assignments:
 *  - "mine": what applies to the signed-in user. The server resolves role,
 *    group and individual targeting, so the client does not repeat that logic.
 *  - "all": every assignment, loaded for L&D admins only (admin screen).
 */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly mineSubject = new BehaviorSubject<Assignment[]>([]);
  private readonly allSubject = new BehaviorSubject<Assignment[]>([]);

  /** All assignments (admins only; empty for everyone else). */
  readonly assignments$ = this.allSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  /** Loads the user's assignments, plus the full list when `includeAll` (admins). */
  load(includeAll: boolean): Observable<boolean> {
    return forkJoin({
      mine: this.api.get<Assignment[]>('/assignments/me'),
      all: includeAll ? this.api.get<Assignment[]>('/assignments') : of<Assignment[]>([]),
    }).pipe(
      tap(({ mine, all }) => {
        this.mineSubject.next(mine);
        this.allSubject.next(all);
      }),
      map(() => true),
      catchError((err: unknown) => {
        warnLoadFailure('assignments', err);
        return of(false);
      }),
    );
  }

  clear(): void {
    this.mineSubject.next([]);
    this.allSubject.next([]);
  }

  /** Assignments that apply to the signed-in user. */
  myAssignments(): Assignment[] {
    return this.mineSubject.value;
  }

  /** Admin only (enforced by the server). */
  create(input: NewAssignment): Observable<Assignment> {
    return this.api.post<Assignment>('/assignments', input).pipe(
      tap((created) => this.allSubject.next([created, ...this.allSubject.value])),
      // The new assignment may also apply to the admin; refresh their own list.
      switchMap((created) => this.refreshMine().pipe(map(() => created))),
    );
  }

  private refreshMine(): Observable<void> {
    return this.api.get<Assignment[]>('/assignments/me').pipe(
      tap((mine) => this.mineSubject.next(mine)),
      map(() => undefined),
      // Creating the assignment already succeeded; do not fail it over a refresh.
      catchError(() => of(undefined)),
    );
  }
}

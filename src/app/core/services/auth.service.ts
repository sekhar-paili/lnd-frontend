import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';

import { apiErrorMessage } from '../http/api-error';
import { ApiService } from '../http/api.service';
import { User } from '../models';
import { RoleService } from './role.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

export interface LoginResult {
  success: boolean;
  error?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Authentication against the backend API. The backend verifies credentials and
 * issues a JWT; this service stores the token (attached to requests by
 * AuthInterceptor) and keeps the signed-in user in state.
 *
 * Note: the token is kept in localStorage, which is readable by any script on
 * the page. That is an accepted trade-off for this app (no third-party
 * scripts); an httpOnly cookie would be the stricter alternative.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUserSubject = new BehaviorSubject<User | null>(null);

  readonly authUser$: Observable<User | null> = this.authUserSubject.asObservable();

  constructor(
    private readonly api: ApiService,
    private readonly role: RoleService,
    private readonly storage: StorageService,
    private readonly router: Router,
  ) {}

  /**
   * Restores a previous session at startup. A stored token is never trusted on
   * its own: it is checked against GET /auth/me. This always resolves, even if
   * the backend is unreachable, so a server outage cannot block the app from
   * booting.
   */
  async init(): Promise<void> {
    const token = this.storage.get<string>(STORAGE_KEYS.authToken);
    if (!token) {
      return;
    }
    try {
      const user = await firstValueFrom(this.api.get<User>('/auth/me'));
      this.applySession(user);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // Token expired or invalid: drop it.
        this.clearSession();
      }
      // Any other failure (backend down) leaves the user signed out for this
      // load but keeps the token so a later reload can recover.
    }
  }

  get isAuthenticated(): boolean {
    return this.authUserSubject.value !== null;
  }

  get currentUser(): User | null {
    return this.authUserSubject.value;
  }

  /** Never errors: failures come back as `{ success: false, error }`. */
  login(username: string, password: string): Observable<LoginResult> {
    return this.api
      .post<LoginResponse>('/auth/login', { username: username.trim(), password })
      .pipe(
        tap((res) => {
          this.storage.set(STORAGE_KEYS.authToken, res.token);
          this.applySession(res.user);
        }),
        map((): LoginResult => ({ success: true })),
        catchError((err: unknown) =>
          of<LoginResult>({ success: false, error: apiErrorMessage(err) }),
        ),
      );
  }

  logout(): void {
    this.clearSession();
  }

  /** Called by AuthInterceptor when the backend rejects the token mid-session. */
  handleSessionExpired(): void {
    const wasSignedIn = this.isAuthenticated;
    this.clearSession();
    // During startup (not yet signed in) init() handles it; only redirect a
    // live session so the router is not driven before it has started.
    if (wasSignedIn) {
      void this.router.navigate(['/login']);
    }
  }

  private applySession(user: User): void {
    this.authUserSubject.next(user);
    this.role.setActiveUser(user);
  }

  private clearSession(): void {
    this.storage.remove(STORAGE_KEYS.authToken);
    this.storage.remove(STORAGE_KEYS.authUserId);
    this.authUserSubject.next(null);
    this.role.clearActiveUser();
  }
}

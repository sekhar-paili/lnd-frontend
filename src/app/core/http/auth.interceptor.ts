import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { STORAGE_KEYS, StorageService } from '../services/storage.service';

/**
 * Attaches the JWT to every request aimed at the backend API, and ends the
 * session when the backend reports the token is no longer valid.
 *
 * AuthService is resolved lazily through the Injector: AuthService depends on
 * HttpClient, and HttpClient depends on its interceptors, so injecting
 * AuthService directly here would be a circular dependency.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly apiBase = environment.apiBaseUrl.replace(/\/+$/, '');

  constructor(
    private readonly storage: StorageService,
    private readonly injector: Injector,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Never leak the token to other origins (fixtures, third-party URLs).
    if (this.apiBase === '' || !req.url.startsWith(this.apiBase)) {
      return next.handle(req);
    }

    const token = this.storage.get<string>(STORAGE_KEYS.authToken);
    const outgoing = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(outgoing).pipe(
      catchError((err: unknown) => {
        // A 401 on the login call just means wrong credentials, not an
        // expired session, so it is excluded.
        if (
          err instanceof HttpErrorResponse &&
          err.status === 401 &&
          token &&
          !req.url.endsWith('/auth/login')
        ) {
          this.injector.get(AuthService).handleSessionExpired();
        }
        return throwError(() => err);
      }),
    );
  }
}

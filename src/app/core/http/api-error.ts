import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../../environments/environment';

/**
 * The backend reports request-validation failures with the validator's raw
 * JSON (an array of `{ path, message }` issues) in the `error` field. Turn
 * that into a readable sentence; return null if it is not that shape.
 */
function readableValidationIssues(message: string): string | null {
  try {
    const issues: unknown = JSON.parse(message);
    if (!Array.isArray(issues) || issues.length === 0) {
      return null;
    }
    const parts = issues
      .map((issue: unknown) => {
        if (!issue || typeof issue !== 'object') {
          return '';
        }
        const { path, message: text } = issue as { path?: unknown; message?: unknown };
        const field = Array.isArray(path) ? path.join('.') : '';
        const detail = typeof text === 'string' ? text : '';
        return [field, detail].filter(Boolean).join(': ');
      })
      .filter((p) => p.length > 0);
    return parts.length > 0 ? parts.join('; ') : null;
  } catch {
    return null;
  }
}

/**
 * Turns any error thrown by an API call into a short, user-presentable
 * message. The backend returns `{ "error": "<message>" }` for handled
 * failures (bad credentials, validation, rate limiting), so that text is used
 * when present.
 */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    // status 0 means the request never got a response (server down, CORS,
    // offline, wrong URL).
    if (err.status === 0) {
      return 'Cannot reach the server. Check your connection and that the backend is running.';
    }
    const body: unknown = err.error;
    if (body && typeof body === 'object' && 'error' in body) {
      const message = (body as { error: unknown }).error;
      if (typeof message === 'string' && message.length > 0) {
        return readableValidationIssues(message) ?? message;
      }
    }
    if (err.status === 403) {
      return 'You do not have permission to do that.';
    }
    if (err.status >= 500) {
      return 'The server had a problem. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

/** Logs a failed background load in development builds only. */
export function warnLoadFailure(what: string, err: unknown): void {
  if (environment.enableDebugLogging) {
    console.warn(`Could not load ${what}:`, err);
  }
}

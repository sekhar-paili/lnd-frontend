import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from './api-error';

function httpError(status: number, error?: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error, statusText: 'x' });
}

describe('apiErrorMessage', () => {
  it('explains an unreachable server (status 0)', () => {
    expect(apiErrorMessage(httpError(0))).toContain('Cannot reach the server');
  });

  it('uses the backend\'s message when it sends one', () => {
    expect(apiErrorMessage(httpError(401, { error: 'Invalid username or password.' })))
      .toBe('Invalid username or password.');
  });

  it('turns the validator\'s raw JSON issues into a readable sentence', () => {
    const raw = JSON.stringify([
      { path: ['sourceUrl'], message: 'Invalid url' },
      { path: ['title'], message: 'String must contain at least 2 character(s)' },
    ]);
    expect(apiErrorMessage(httpError(400, { error: raw })))
      .toBe('sourceUrl: Invalid url; title: String must contain at least 2 character(s)');
  });

  it('leaves an ordinary message that merely looks like JSON alone', () => {
    expect(apiErrorMessage(httpError(400, { error: '{not json' }))).toBe('{not json');
    expect(apiErrorMessage(httpError(400, { error: '[]' }))).toBe('[]');
  });

  it('falls back to a permission message for a bare 403', () => {
    expect(apiErrorMessage(httpError(403))).toContain('permission');
  });

  it('falls back to a generic server message for a bare 5xx', () => {
    expect(apiErrorMessage(httpError(503))).toContain('server had a problem');
  });

  it('handles errors that are not HTTP errors at all', () => {
    expect(apiErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(apiErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });
});

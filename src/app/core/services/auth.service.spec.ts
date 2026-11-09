import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { Role, User } from '../models';
import { AuthService, LoginResult } from './auth.service';
import { RoleService } from './role.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

const API = environment.apiBaseUrl;

const ADMIN: User = { id: 'u-admin', name: 'Avery Admin', role: Role.LndAdmin, group: 'ld-team' };

describe('AuthService', () => {
  let service: AuthService;
  let role: RoleService;
  let storage: StorageService;
  let http: HttpTestingController;
  let router: { navigate: jasmine.Spy };

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthService);
    role = TestBed.inject(RoleService);
    storage = TestBed.inject(StorageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated).toBeFalse();
    expect(service.currentUser).toBeNull();
  });

  describe('login', () => {
    it('posts trimmed credentials, stores the token and signs the user in', () => {
      let result: LoginResult | undefined;
      service.login('  admin ', 'admin123').subscribe((r) => (result = r));

      const req = http.expectOne(`${API}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'admin123' });
      req.flush({ token: 'jwt-token', user: ADMIN });

      expect(result).toEqual({ success: true });
      expect(service.isAuthenticated).toBeTrue();
      expect(service.currentUser?.id).toBe('u-admin');
      expect(role.activeRole).toBe(Role.LndAdmin);
      expect(storage.get<string>(STORAGE_KEYS.authToken)).toBe('jwt-token');
    });

    it('returns the backend message for bad credentials and stays signed out', () => {
      let result: LoginResult | undefined;
      service.login('admin', 'wrong').subscribe((r) => (result = r));

      http
        .expectOne(`${API}/auth/login`)
        .flush({ error: 'Invalid username or password.' }, { status: 401, statusText: 'Unauthorized' });

      expect(result?.success).toBeFalse();
      expect(result?.error).toBe('Invalid username or password.');
      expect(service.isAuthenticated).toBeFalse();
      expect(storage.get(STORAGE_KEYS.authToken)).toBeNull();
    });

    it('reports an unreachable server clearly', () => {
      let result: LoginResult | undefined;
      service.login('admin', 'admin123').subscribe((r) => (result = r));

      http.expectOne(`${API}/auth/login`).error(new ProgressEvent('error'));

      expect(result?.success).toBeFalse();
      expect(result?.error).toContain('Cannot reach the server');
      expect(service.isAuthenticated).toBeFalse();
    });
  });

  describe('logout', () => {
    it('clears the token and the signed-in user', () => {
      service.login('admin', 'admin123').subscribe();
      http.expectOne(`${API}/auth/login`).flush({ token: 'jwt-token', user: ADMIN });

      service.logout();

      expect(service.isAuthenticated).toBeFalse();
      expect(role.activeUser).toBeNull();
      expect(storage.get(STORAGE_KEYS.authToken)).toBeNull();
    });
  });

  describe('init (session restore)', () => {
    it('makes no request when there is no stored token', async () => {
      await service.init();
      http.expectNone(`${API}/auth/me`);
      expect(service.isAuthenticated).toBeFalse();
    });

    it('validates a stored token with /auth/me and restores the session', async () => {
      storage.set(STORAGE_KEYS.authToken, 'stored-token');

      const done = service.init();
      http.expectOne(`${API}/auth/me`).flush(ADMIN);
      await done;

      expect(service.isAuthenticated).toBeTrue();
      expect(service.currentUser?.id).toBe('u-admin');
    });

    it('discards a token the backend rejects', async () => {
      storage.set(STORAGE_KEYS.authToken, 'expired-token');

      const done = service.init();
      http
        .expectOne(`${API}/auth/me`)
        .flush({ error: 'Invalid or expired token.' }, { status: 401, statusText: 'Unauthorized' });
      await done;

      expect(service.isAuthenticated).toBeFalse();
      expect(storage.get(STORAGE_KEYS.authToken)).toBeNull();
    });

    it('resolves without throwing, and keeps the token, when the backend is down', async () => {
      storage.set(STORAGE_KEYS.authToken, 'stored-token');

      const done = service.init();
      http.expectOne(`${API}/auth/me`).error(new ProgressEvent('error'));
      await expectAsync(done).toBeResolved();

      expect(service.isAuthenticated).toBeFalse();
      expect(storage.get(STORAGE_KEYS.authToken)).toBe('stored-token');
    });
  });

  describe('handleSessionExpired', () => {
    it('signs out and redirects to /login when a live session expires', () => {
      service.login('admin', 'admin123').subscribe();
      http.expectOne(`${API}/auth/login`).flush({ token: 'jwt-token', user: ADMIN });

      service.handleSessionExpired();

      expect(service.isAuthenticated).toBeFalse();
      expect(storage.get(STORAGE_KEYS.authToken)).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('does not drive the router when nobody was signed in', () => {
      storage.set(STORAGE_KEYS.authToken, 'stale-token');

      service.handleSessionExpired();

      expect(storage.get(STORAGE_KEYS.authToken)).toBeNull();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});

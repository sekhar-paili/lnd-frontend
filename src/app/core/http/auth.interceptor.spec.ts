import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { STORAGE_KEYS, StorageService } from '../services/storage.service';
import { ApiService } from './api.service';
import { AuthInterceptor } from './auth.interceptor';

const API = environment.apiBaseUrl;

describe('AuthInterceptor', () => {
  let api: ApiService;
  let rawHttp: HttpClient;
  let http: HttpTestingController;
  let storage: StorageService;
  let auth: { handleSessionExpired: jasmine.Spy };

  beforeEach(() => {
    localStorage.clear();
    auth = { handleSessionExpired: jasmine.createSpy('handleSessionExpired') };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: AuthService, useValue: auth },
      ],
    });
    api = TestBed.inject(ApiService);
    rawHttp = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(StorageService);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('adds the Bearer token to API requests', () => {
    storage.set(STORAGE_KEYS.authToken, 'abc123');
    api.get('/videos').subscribe();

    const req = http.expectOne(`${API}/videos`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush([]);
  });

  it('sends no Authorization header when there is no token', () => {
    api.get('/videos').subscribe();

    const req = http.expectOne(`${API}/videos`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('never attaches the token to non-API URLs', () => {
    storage.set(STORAGE_KEYS.authToken, 'abc123');
    rawHttp.get('assets/mock/users.json').subscribe();
    rawHttp.get('https://third-party.example.com/data').subscribe();

    const local = http.expectOne('assets/mock/users.json');
    const external = http.expectOne('https://third-party.example.com/data');
    expect(local.request.headers.has('Authorization')).toBeFalse();
    expect(external.request.headers.has('Authorization')).toBeFalse();
    local.flush({});
    external.flush({});
  });

  it('ends the session on a 401 from a protected endpoint and still surfaces the error', () => {
    storage.set(STORAGE_KEYS.authToken, 'abc123');
    let status: number | undefined;
    api.get('/videos').subscribe({ error: (e) => (status = e.status) });

    http.expectOne(`${API}/videos`).flush({ error: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.handleSessionExpired).toHaveBeenCalledTimes(1);
    expect(status).toBe(401);
  });

  it('does not treat a 401 from the login call as an expired session', () => {
    storage.set(STORAGE_KEYS.authToken, 'stale');
    api.post('/auth/login', { username: 'a', password: 'b' }).subscribe({ error: () => undefined });

    http
      .expectOne(`${API}/auth/login`)
      .flush({ error: 'Invalid username or password.' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.handleSessionExpired).not.toHaveBeenCalled();
  });

  it('does not end the session on a 403', () => {
    storage.set(STORAGE_KEYS.authToken, 'abc123');
    api.get('/reports/participants').subscribe({ error: () => undefined });

    http
      .expectOne(`${API}/reports/participants`)
      .flush({ error: 'Insufficient permissions.' }, { status: 403, statusText: 'Forbidden' });

    expect(auth.handleSessionExpired).not.toHaveBeenCalled();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { VideoProgress } from '../models';
import { ProgressService } from './progress.service';

const API = environment.apiBaseUrl;

function saved(overrides: Partial<VideoProgress> = {}): VideoProgress {
  return {
    userId: 'u1', videoId: 'v1', positionSeconds: 0, percentComplete: 0,
    completed: false, updatedAt: '', ...overrides,
  };
}

describe('ProgressService', () => {
  let service: ProgressService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProgressService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('load fills the cache from /progress/me', () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/progress/me`).flush([saved({ percentComplete: 40 })]);

    expect(ok).toBeTrue();
    expect(service.get('u1', 'v1')?.percentComplete).toBe(40);
  });

  it('load reports failure without throwing', () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/progress/me`).error(new ProgressEvent('error'));
    expect(ok).toBeFalse();
  });

  it('save updates the cache immediately and posts to the server', () => {
    service.save('u1', 'v1', 30, 50);

    const p = service.get('u1', 'v1');
    expect(p?.positionSeconds).toBe(30);
    expect(p?.percentComplete).toBe(50);
    expect(p?.completed).toBeFalse();

    const req = http.expectOne(`${API}/progress`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ videoId: 'v1', positionSeconds: 30, percentComplete: 50 });
    req.flush(saved({ positionSeconds: 30, percentComplete: 50 }));
  });

  it('marks completed at the threshold and not below it', () => {
    service.save('u1', 'v1', 90, 90);
    service.save('u1', 'v2', 80, 89);
    http.match(`${API}/progress`).forEach((r) => r.flush(saved()));

    expect(service.isVideoCompleted('u1', 'v1')).toBeTrue();
    expect(service.isVideoCompleted('u1', 'v2')).toBeFalse();
  });

  it('keeps completion once reached, even if a later save is lower', () => {
    service.save('u1', 'v1', 95, 95);
    service.save('u1', 'v1', 10, 10);
    http.match(`${API}/progress`).forEach((r) => r.flush(saved()));

    expect(service.isVideoCompleted('u1', 'v1')).toBeTrue();
    expect(service.get('u1', 'v1')?.percentComplete).toBe(10);
  });

  it('adopts completion reported by the server', () => {
    service.save('u1', 'v1', 50, 50);
    http.expectOne(`${API}/progress`).flush(saved({ completed: true }));

    expect(service.isVideoCompleted('u1', 'v1')).toBeTrue();
  });

  it('clamps out-of-range values before sending', () => {
    service.save('u1', 'v1', -5, 140);
    const req = http.expectOne(`${API}/progress`);
    expect(req.request.body).toEqual({ videoId: 'v1', positionSeconds: 0, percentComplete: 100 });
    req.flush(saved());
  });

  it('keeps the local entry and does not throw when the save request fails', () => {
    service.save('u1', 'v1', 20, 20);
    http.expectOne(`${API}/progress`).error(new ProgressEvent('error'));

    expect(service.get('u1', 'v1')?.percentComplete).toBe(20);
  });

  it('announces a failed save so the user can be told it was not stored', () => {
    let failures = 0;
    service.saveFailed$.subscribe(() => failures++);

    service.save('u1', 'v1', 20, 20);
    http.expectOne(`${API}/progress`).flush({ error: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(failures).toBe(1);
  });

  it('does not announce a failure when the save succeeds', () => {
    let failures = 0;
    service.saveFailed$.subscribe(() => failures++);

    service.save('u1', 'v1', 20, 20);
    http.expectOne(`${API}/progress`).flush(saved({ percentComplete: 20 }));

    expect(failures).toBe(0);
  });

  it('keeps progress separate per user and video', () => {
    service.save('u1', 'v1', 10, 10);
    service.save('u2', 'v1', 20, 20);
    http.match(`${API}/progress`).forEach((r) => r.flush(saved()));

    expect(service.get('u1', 'v1')?.positionSeconds).toBe(10);
    expect(service.get('u2', 'v1')?.positionSeconds).toBe(20);
    expect(service.forUser('u1').length).toBe(1);
  });

  it('clear empties the cache', () => {
    service.save('u1', 'v1', 10, 10);
    http.expectOne(`${API}/progress`).flush(saved());
    service.clear();
    expect(service.get('u1', 'v1')).toBeUndefined();
  });
});

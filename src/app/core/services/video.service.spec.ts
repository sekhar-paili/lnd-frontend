import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Video } from '../models';
import { VideoService } from './video.service';

const API = environment.apiBaseUrl;

const V1: Video = {
  id: 'v1', title: 'Alpha', description: 'first', categoryId: 'c1',
  durationSeconds: 60, sourceUrl: 'https://example.com/a.mp4',
};
const V2: Video = {
  id: 'v2', title: 'Beta', description: 'second security', categoryId: 'c2',
  durationSeconds: 90, sourceUrl: 'https://example.com/b.mp4',
  thumbnailUrl: 'https://example.com/b.png',
};

describe('VideoService', () => {
  let service: VideoService;
  let http: HttpTestingController;

  function loadAll(): void {
    service.load().subscribe();
    http.expectOne(`${API}/videos`).flush([V1, V2]);
    http.expectOne(`${API}/categories`).flush([{ id: 'c1', name: 'C1' }]);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VideoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('load fills the video and category caches and reports success', async () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/videos`).flush([V1, V2]);
    http.expectOne(`${API}/categories`).flush([{ id: 'c1', name: 'C1' }]);

    expect(ok).toBeTrue();
    expect((await firstValueFrom(service.videos$)).length).toBe(2);
    expect((await firstValueFrom(service.categories$)).length).toBe(1);
    expect(service.getById('v2')?.title).toBe('Beta');
  });

  it('load reports failure (without throwing) and leaves the cache empty', async () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/videos`).flush({ error: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(ok).toBeFalse();
    expect(await firstValueFrom(service.videos$)).toEqual([]);
  });

  it('clear empties the caches', async () => {
    loadAll();
    service.clear();
    expect(await firstValueFrom(service.videos$)).toEqual([]);
  });

  it('search matches title or description, case-insensitively', async () => {
    loadAll();
    expect((await firstValueFrom(service.search('alpha'))).map((v) => v.id)).toEqual(['v1']);
    expect((await firstValueFrom(service.search('SECURITY'))).map((v) => v.id)).toEqual(['v2']);
  });

  it('filters by category', async () => {
    loadAll();
    expect((await firstValueFrom(service.byCategory('c2'))).map((v) => v.id)).toEqual(['v2']);
    expect((await firstValueFrom(service.byCategory(null))).length).toBe(2);
  });

  describe('admin writes', () => {
    it('create posts only the API fields (no id, no empty thumbnail) and caches the result', async () => {
      loadAll();
      service
        .create({ title: 'Gamma', description: 'g', categoryId: 'c1', durationSeconds: 30, sourceUrl: 'https://example.com/g.mp4', thumbnailUrl: '' })
        .subscribe();

      const req = http.expectOne(`${API}/videos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title: 'Gamma', description: 'g', categoryId: 'c1', durationSeconds: 30,
        sourceUrl: 'https://example.com/g.mp4',
      });
      req.flush({ id: 'vid-new', title: 'Gamma', description: 'g', categoryId: 'c1', durationSeconds: 30, sourceUrl: 'https://example.com/g.mp4' });

      expect(service.getById('vid-new')?.title).toBe('Gamma');
    });

    it('create surfaces a server rejection and does not touch the cache', async () => {
      loadAll();
      let status: number | undefined;
      service
        .create({ title: 'x', description: '', categoryId: 'c1', durationSeconds: 1, sourceUrl: 'bad' })
        .subscribe({ error: (e) => (status = e.status) });
      http.expectOne(`${API}/videos`).flush({ error: 'invalid' }, { status: 400, statusText: 'Bad Request' });

      expect(status).toBe(400);
      expect((await firstValueFrom(service.videos$)).length).toBe(2);
    });

    it('update keeps the existing thumbnail the edit form cannot supply', () => {
      loadAll();
      service.update({ id: 'v2', title: 'Beta 2', description: 'd', categoryId: 'c2', durationSeconds: 90, sourceUrl: 'https://example.com/b.mp4' }).subscribe();

      const req = http.expectOne(`${API}/videos/v2`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body['thumbnailUrl']).toBe('https://example.com/b.png');
      req.flush({ id: 'v2', title: 'Beta 2', description: 'd', categoryId: 'c2', durationSeconds: 90, sourceUrl: 'https://example.com/b.mp4', thumbnailUrl: 'https://example.com/b.png' });

      expect(service.getById('v2')?.title).toBe('Beta 2');
    });

    it('remove deletes on the server and drops the video from the cache', () => {
      loadAll();
      service.remove('v1').subscribe();

      const req = http.expectOne(`${API}/videos/v1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(service.getById('v1')).toBeUndefined();
      expect(service.getById('v2')).toBeDefined();
    });

    it('a failed remove leaves the video in the cache', () => {
      loadAll();
      service.remove('v1').subscribe({ error: () => undefined });
      http.expectOne(`${API}/videos/v1`).flush({ error: 'Insufficient permissions.' }, { status: 403, statusText: 'Forbidden' });

      expect(service.getById('v1')).toBeDefined();
    });
  });
});

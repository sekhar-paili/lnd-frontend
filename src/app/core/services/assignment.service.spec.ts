import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AssignableType, Assignment, AudienceType } from '../models';
import { AssignmentService } from './assignment.service';

const API = environment.apiBaseUrl;

function asg(id: string, overrides: Partial<Assignment> = {}): Assignment {
  return {
    id, audienceType: AudienceType.Role, audienceValue: 'EMPLOYEE',
    itemType: AssignableType.Video, itemId: 'v1', assignedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('AssignmentService', () => {
  let service: AssignmentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AssignmentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('a learner load fetches only their own assignments', async () => {
    let ok: boolean | undefined;
    service.load(false).subscribe((r) => (ok = r));
    http.expectOne(`${API}/assignments/me`).flush([asg('a1')]);
    http.expectNone(`${API}/assignments`);

    expect(ok).toBeTrue();
    expect(service.myAssignments().map((a) => a.id)).toEqual(['a1']);
    expect(await firstValueFrom(service.assignments$)).toEqual([]);
  });

  it('an admin load also fetches the full list', async () => {
    service.load(true).subscribe();
    http.expectOne(`${API}/assignments/me`).flush([asg('a1')]);
    http.expectOne(`${API}/assignments`).flush([asg('a1'), asg('a2')]);

    expect((await firstValueFrom(service.assignments$)).length).toBe(2);
  });

  it('load reports failure without throwing', () => {
    let ok: boolean | undefined;
    service.load(false).subscribe((r) => (ok = r));
    http.expectOne(`${API}/assignments/me`).error(new ProgressEvent('error'));
    expect(ok).toBeFalse();
  });

  describe('create (admin)', () => {
    it('posts only the targeting fields, lists the result first, and refreshes the user\'s own list', async () => {
      service.load(true).subscribe();
      http.expectOne(`${API}/assignments/me`).flush([]);
      http.expectOne(`${API}/assignments`).flush([asg('a1')]);

      let created: Assignment | undefined;
      service
        .create({ audienceType: AudienceType.Group, audienceValue: 'sales', itemType: AssignableType.LearningPath, itemId: 'p1' })
        .subscribe((a) => (created = a));

      const post = http.expectOne((r) => r.method === 'POST' && r.url === `${API}/assignments`);
      expect(post.request.body).toEqual({
        audienceType: 'GROUP', audienceValue: 'sales', itemType: 'LEARNING_PATH', itemId: 'p1',
      });
      post.flush(asg('a2', { audienceType: AudienceType.Group, audienceValue: 'sales' }));

      // The admin's own list is re-fetched because the new assignment may apply to them.
      http.expectOne(`${API}/assignments/me`).flush([asg('a2')]);

      expect(created?.id).toBe('a2');
      expect((await firstValueFrom(service.assignments$)).map((a) => a.id)).toEqual(['a2', 'a1']);
      expect(service.myAssignments().map((a) => a.id)).toEqual(['a2']);
    });

    it('still succeeds if the follow-up refresh fails', () => {
      let created: Assignment | undefined;
      service
        .create({ audienceType: AudienceType.Role, audienceValue: 'PARTNER', itemType: AssignableType.Video, itemId: 'v1' })
        .subscribe((a) => (created = a));

      http.expectOne((r) => r.method === 'POST').flush(asg('a9'));
      http.expectOne(`${API}/assignments/me`).error(new ProgressEvent('error'));

      expect(created?.id).toBe('a9');
    });

    it('surfaces a server rejection', () => {
      let status: number | undefined;
      service
        .create({ audienceType: AudienceType.Role, audienceValue: 'X', itemType: AssignableType.Video, itemId: 'v1' })
        .subscribe({ error: (e) => (status = e.status) });
      http.expectOne((r) => r.method === 'POST').flush({ error: 'Insufficient permissions.' }, { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });

  it('clear empties both lists', async () => {
    service.load(true).subscribe();
    http.expectOne(`${API}/assignments/me`).flush([asg('a1')]);
    http.expectOne(`${API}/assignments`).flush([asg('a1')]);

    service.clear();

    expect(service.myAssignments()).toEqual([]);
    expect(await firstValueFrom(service.assignments$)).toEqual([]);
  });
});

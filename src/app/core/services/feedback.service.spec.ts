import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Feedback } from '../models';
import { FeedbackService, FeedbackSummary } from './feedback.service';

const API = environment.apiBaseUrl;

const FB: Feedback = {
  id: 'f1', userId: 'u1', targetType: 'VIDEO', targetId: 'v1', rating: 4, createdAt: '2026-01-01T00:00:00Z',
};

describe('FeedbackService', () => {
  let service: FeedbackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeedbackService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('load asks for one target and returns the server\'s items and average', () => {
    let summary: FeedbackSummary | undefined;
    service.load('VIDEO', 'v1').subscribe((s) => (summary = s));

    const req = http.expectOne((r) => r.url === `${API}/feedback`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('targetType')).toBe('VIDEO');
    expect(req.request.params.get('targetId')).toBe('v1');
    req.flush({ items: [FB], averageRating: 4, count: 1 });

    expect(summary?.averageRating).toBe(4);
    expect(summary?.items.length).toBe(1);
  });

  it('submit posts the rating without any user id (the server uses the signed-in user)', () => {
    let result: Feedback | undefined;
    service
      .submit({ targetType: 'LEARNING_PATH', targetId: 'p1', rating: 5, comment: 'Great' })
      .subscribe((f) => (result = f));

    const req = http.expectOne(`${API}/feedback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ targetType: 'LEARNING_PATH', targetId: 'p1', rating: 5, comment: 'Great' });
    expect('userId' in req.request.body).toBeFalse();
    req.flush({ ...FB, id: 'f2', rating: 5 });

    expect(result?.id).toBe('f2');
  });

  it('submit surfaces a server rejection', () => {
    let status: number | undefined;
    service.submit({ targetType: 'VIDEO', targetId: 'v1', rating: 9 }).subscribe({ error: (e) => (status = e.status) });
    http.expectOne(`${API}/feedback`).flush({ error: 'rating: Number must be less than or equal to 5' }, { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(400);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { QuestionType, Quiz, QuizAttempt } from '../models';
import { AttemptOutcome, QuizService } from './quiz.service';

const API = environment.apiBaseUrl;

const QUIZ: Quiz = {
  id: 'quiz1',
  title: 'Test',
  passMarkPercent: 70,
  questions: [
    {
      id: 'q1',
      type: QuestionType.MultipleChoice,
      prompt: 'p1',
      options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      correctOptionId: 'a',
    },
  ],
};

function attempt(overrides: Partial<QuizAttempt> = {}): QuizAttempt {
  return {
    id: 'att1', quizId: 'quiz1', userId: 'u1', scorePercent: 100, passed: true,
    answeredAt: '2026-01-01T00:00:00Z', answers: { q1: 'a' }, ...overrides,
  };
}

describe('QuizService', () => {
  let service: QuizService;
  let http: HttpTestingController;

  function loadAll(attempts: QuizAttempt[] = []): void {
    service.load().subscribe();
    http.expectOne(`${API}/quizzes`).flush([QUIZ]);
    http.expectOne(`${API}/quizzes/attempts/me`).flush(attempts);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QuizService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('load fills quizzes and the user\'s attempts', () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/quizzes`).flush([QUIZ]);
    http.expectOne(`${API}/quizzes/attempts/me`).flush([attempt()]);

    expect(ok).toBeTrue();
    expect(service.getById('quiz1')?.title).toBe('Test');
    expect(service.attemptsForUser('u1').length).toBe(1);
  });

  it('load reports failure without throwing', () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/quizzes`).flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
    expect(ok).toBeFalse();
  });

  it('works with quizzes that carry no answer key (as sent to learners)', () => {
    service.load().subscribe();
    http.expectOne(`${API}/quizzes`).flush([
      { id: 'quiz1', title: 'T', passMarkPercent: 70, questions: [{ id: 'q1', type: 'MCQ', prompt: 'p', options: [{ id: 'a', label: 'A' }] }] },
    ]);
    http.expectOne(`${API}/quizzes/attempts/me`).flush([]);

    expect(service.getById('quiz1')?.questions[0].correctOptionId).toBeUndefined();
  });

  describe('submitAttempt (server-side grading)', () => {
    it('posts the answers and returns the server\'s verdict', () => {
      loadAll();
      const outcome: AttemptOutcome = {
        attempt: attempt({ scorePercent: 50, passed: false }),
        result: { scorePercent: 50, passed: false, correctCount: 1, totalCount: 2 },
      };
      let got: AttemptOutcome | undefined;
      service.submitAttempt('quiz1', { q1: 'a' }).subscribe((o) => (got = o));

      const req = http.expectOne(`${API}/quizzes/quiz1/attempts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ answers: { q1: 'a' } });
      req.flush(outcome);

      expect(got?.result.passed).toBeFalse();
      expect(got?.result.scorePercent).toBe(50);
    });

    it('records the attempt in the cache so path unlocking sees a pass', () => {
      loadAll();
      expect(service.hasPassed('u1', 'quiz1')).toBeFalse();

      service.submitAttempt('quiz1', { q1: 'a' }).subscribe();
      http.expectOne(`${API}/quizzes/quiz1/attempts`).flush({
        attempt: attempt(),
        result: { scorePercent: 100, passed: true, correctCount: 1, totalCount: 1 },
      });

      expect(service.hasPassed('u1', 'quiz1')).toBeTrue();
      expect(service.hasPassed('u2', 'quiz1')).toBeFalse();
    });

    it('a failed attempt is not recorded', () => {
      loadAll();
      let status: number | undefined;
      service.submitAttempt('quiz1', {}).subscribe({ error: (e) => (status = e.status) });
      http.expectOne(`${API}/quizzes/quiz1/attempts`).flush({ error: 'Answer all questions (1 remaining).' }, { status: 400, statusText: 'Bad Request' });

      expect(status).toBe(400);
      expect(service.attemptsForUser('u1').length).toBe(0);
    });
  });

  describe('admin writes', () => {
    it('create posts the quiz and caches the returned one', () => {
      loadAll();
      const { id, ...body } = QUIZ;
      service.create({ ...body, title: 'New' }).subscribe();

      const req = http.expectOne(`${API}/quizzes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.title).toBe('New');
      req.flush({ ...body, title: 'New', id: 'quiz-new' });

      expect(service.getById('quiz-new')?.title).toBe('New');
      expect(id).toBe('quiz1');
    });

    it('update sends the quiz without its id in the body', () => {
      loadAll();
      service.update({ ...QUIZ, title: 'Edited' }).subscribe();

      const req = http.expectOne(`${API}/quizzes/quiz1`);
      expect(req.request.method).toBe('PUT');
      expect('id' in req.request.body).toBeFalse();
      req.flush({ ...QUIZ, title: 'Edited' });

      expect(service.getById('quiz1')?.title).toBe('Edited');
    });

    it('remove deletes on the server and from the cache', () => {
      loadAll();
      service.remove('quiz1').subscribe();
      http.expectOne(`${API}/quizzes/quiz1`).flush(null, { status: 204, statusText: 'No Content' });

      expect(service.getById('quiz1')).toBeUndefined();
    });
  });

  it('clear empties quizzes and attempts', () => {
    loadAll([attempt()]);
    service.clear();
    expect(service.getById('quiz1')).toBeUndefined();
    expect(service.attemptsForUser('u1').length).toBe(0);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { LearningPath, StepState } from '../models';
import { LearningPathService } from './learning-path.service';
import { ProgressService } from './progress.service';
import { QuizService } from './quiz.service';

const API = environment.apiBaseUrl;

const PATH: LearningPath = {
  id: 'p1',
  title: 'Path',
  description: '',
  steps: [
    { id: 's1', title: 'Watch', videoId: 'v1', order: 1 },
    { id: 's2', title: 'Quiz', quizId: 'q1', order: 2 },
    { id: 's3', title: 'Watch 2', videoId: 'v2', order: 3 },
  ],
};

describe('LearningPathService', () => {
  let service: LearningPathService;
  let http: HttpTestingController;
  let progress: jasmine.SpyObj<ProgressService>;
  let quiz: jasmine.SpyObj<QuizService>;

  beforeEach(() => {
    progress = jasmine.createSpyObj<ProgressService>('ProgressService', ['isVideoCompleted']);
    quiz = jasmine.createSpyObj<QuizService>('QuizService', ['hasPassed']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProgressService, useValue: progress },
        { provide: QuizService, useValue: quiz },
      ],
    });
    service = TestBed.inject(LearningPathService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  function loadPaths(): void {
    service.load().subscribe();
    http.expectOne(`${API}/learning-paths`).flush([PATH]);
  }

  it('load fills the cache', () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/learning-paths`).flush([PATH]);

    expect(ok).toBeTrue();
    expect(service.getById('p1')?.steps.length).toBe(3);
  });

  it('load reports failure without throwing', () => {
    let ok: boolean | undefined;
    service.load().subscribe((r) => (ok = r));
    http.expectOne(`${API}/learning-paths`).error(new ProgressEvent('error'));
    expect(ok).toBeFalse();
  });

  it('clear empties the cache', () => {
    loadPaths();
    service.clear();
    expect(service.getById('p1')).toBeUndefined();
  });

  it('unlocks first step, locks the rest initially', () => {
    progress.isVideoCompleted.and.returnValue(false);
    quiz.hasPassed.and.returnValue(false);
    const view = service.getStepViews(PATH, 'u1');
    expect(view[0].state).toBe(StepState.Unlocked);
    expect(view[1].state).toBe(StepState.Locked);
    expect(view[2].state).toBe(StepState.Locked);
  });

  it('unlocks the next step once the prerequisite video is completed', () => {
    progress.isVideoCompleted.and.callFake((_u, v) => v === 'v1');
    quiz.hasPassed.and.returnValue(false);
    const view = service.getStepViews(PATH, 'u1');
    expect(view[0].state).toBe(StepState.Completed);
    expect(view[1].state).toBe(StepState.Unlocked);
    expect(view[2].state).toBe(StepState.Locked);
  });

  it('unlocks the final step after the quiz is passed', () => {
    progress.isVideoCompleted.and.callFake((_u, v) => v === 'v1');
    quiz.hasPassed.and.returnValue(true);
    const view = service.getStepViews(PATH, 'u1');
    expect(view[1].state).toBe(StepState.Completed);
    expect(view[2].state).toBe(StepState.Unlocked);
  });

  it('reports path completion when all steps are complete', () => {
    progress.isVideoCompleted.and.returnValue(true);
    quiz.hasPassed.and.returnValue(true);
    expect(service.isPathComplete(PATH, 'u1')).toBeTrue();
  });
});

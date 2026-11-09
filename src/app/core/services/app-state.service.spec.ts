import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { Role, User } from '../models';
import { AppStateService } from './app-state.service';
import { AssignmentService } from './assignment.service';
import { AuthService } from './auth.service';
import { LearningPathService } from './learning-path.service';
import { MilestoneService } from './milestone.service';
import { ProgressService } from './progress.service';
import { QuizService } from './quiz.service';
import { VideoService } from './video.service';

const ADMIN: User = { id: 'u-admin', name: 'Admin', role: Role.LndAdmin };
const EMPLOYEE: User = { id: 'u-emp', name: 'Emp', role: Role.Employee };

describe('AppStateService', () => {
  let authUser$: BehaviorSubject<User | null>;
  let auth: { authUser$: BehaviorSubject<User | null>; currentUser: User | null; isAuthenticated: boolean; init: jasmine.Spy };
  let video: jasmine.SpyObj<VideoService>;
  let quiz: jasmine.SpyObj<QuizService>;
  let paths: jasmine.SpyObj<LearningPathService>;
  let assignments: jasmine.SpyObj<AssignmentService>;
  let progress: jasmine.SpyObj<ProgressService>;
  let milestones: jasmine.SpyObj<MilestoneService>;
  let service: AppStateService;

  beforeEach(() => {
    authUser$ = new BehaviorSubject<User | null>(null);
    auth = {
      authUser$,
      currentUser: null,
      isAuthenticated: false,
      init: jasmine.createSpy('init').and.returnValue(Promise.resolve()),
    };
    video = jasmine.createSpyObj<VideoService>('VideoService', ['load', 'clear']);
    quiz = jasmine.createSpyObj<QuizService>('QuizService', ['load', 'clear']);
    paths = jasmine.createSpyObj<LearningPathService>('LearningPathService', ['load', 'clear']);
    assignments = jasmine.createSpyObj<AssignmentService>('AssignmentService', ['load', 'clear']);
    progress = jasmine.createSpyObj<ProgressService>('ProgressService', ['load', 'clear']);
    milestones = jasmine.createSpyObj<MilestoneService>('MilestoneService', ['load', 'clear']);
    for (const s of [video, quiz, paths, assignments, progress, milestones]) {
      (s.load as jasmine.Spy).and.returnValue(of(true));
    }

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: VideoService, useValue: video },
        { provide: QuizService, useValue: quiz },
        { provide: LearningPathService, useValue: paths },
        { provide: AssignmentService, useValue: assignments },
        { provide: ProgressService, useValue: progress },
        { provide: MilestoneService, useValue: milestones },
      ],
    });
    service = TestBed.inject(AppStateService);
  });

  describe('loadSessionData', () => {
    it('loads every dataset and reports success', async () => {
      auth.currentUser = EMPLOYEE;
      const ok = await service.loadSessionData();

      expect(ok).toBeTrue();
      for (const s of [video, quiz, paths, assignments, progress, milestones]) {
        expect(s.load).toHaveBeenCalledTimes(1);
      }
    });

    it('asks for the full assignment list only for admins', async () => {
      auth.currentUser = ADMIN;
      await service.loadSessionData();
      expect(assignments.load).toHaveBeenCalledWith(true);

      auth.currentUser = EMPLOYEE;
      await service.loadSessionData();
      expect(assignments.load).toHaveBeenCalledWith(false);
    });

    it('reports failure if any dataset failed, but still loads the others', async () => {
      auth.currentUser = EMPLOYEE;
      quiz.load.and.returnValue(of(false));

      const ok = await service.loadSessionData();

      expect(ok).toBeFalse();
      expect(video.load).toHaveBeenCalled();
      expect(progress.load).toHaveBeenCalled();
    });
  });

  describe('initAll', () => {
    it('restores the session, then loads data when signed in', async () => {
      auth.isAuthenticated = true;
      auth.currentUser = EMPLOYEE;

      await service.initAll();

      expect(auth.init).toHaveBeenCalled();
      expect(video.load).toHaveBeenCalled();
    });

    it('loads nothing when there is no session', async () => {
      auth.isAuthenticated = false;

      await service.initAll();

      expect(auth.init).toHaveBeenCalled();
      expect(video.load).not.toHaveBeenCalled();
    });
  });

  describe('clearing on sign-out', () => {
    it('drops every cache when the user signs out, so the next account sees none of it', () => {
      authUser$.next(EMPLOYEE);
      for (const s of [video, quiz, paths, assignments, progress, milestones]) {
        (s.clear as jasmine.Spy).calls.reset();
      }

      authUser$.next(null);

      for (const s of [video, quiz, paths, assignments, progress, milestones]) {
        expect(s.clear).toHaveBeenCalledTimes(1);
      }
    });

    it('does not clear while a user stays signed in', () => {
      authUser$.next(EMPLOYEE);
      for (const s of [video, quiz, paths, assignments, progress, milestones]) {
        (s.clear as jasmine.Spy).calls.reset();
      }

      authUser$.next(ADMIN);

      expect(video.clear).not.toHaveBeenCalled();
    });
  });
});

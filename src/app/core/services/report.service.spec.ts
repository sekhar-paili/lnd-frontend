import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AssignableType, Assignment, AudienceType, LearningPath, Role, User } from '../models';
import { AssignmentService } from './assignment.service';
import { LearningPathService } from './learning-path.service';
import { ProgressService } from './progress.service';
import { ReportService } from './report.service';

const API = environment.apiBaseUrl;
const ME: User = { id: 'u1', name: 'Me', role: Role.Employee };

function asg(id: string, itemType: AssignableType, itemId: string): Assignment {
  return { id, audienceType: AudienceType.Role, audienceValue: 'EMPLOYEE', itemType, itemId, assignedAt: '' };
}

describe('ReportService', () => {
  let service: ReportService;
  let http: HttpTestingController;
  let assignments: jasmine.SpyObj<AssignmentService>;
  let progress: jasmine.SpyObj<ProgressService>;
  let paths: jasmine.SpyObj<LearningPathService>;

  beforeEach(() => {
    assignments = jasmine.createSpyObj<AssignmentService>('AssignmentService', ['myAssignments']);
    progress = jasmine.createSpyObj<ProgressService>('ProgressService', ['get']);
    paths = jasmine.createSpyObj<LearningPathService>('LearningPathService', [
      'getById', 'isPathComplete', 'isStepCompleted',
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AssignmentService, useValue: assignments },
        { provide: ProgressService, useValue: progress },
        { provide: LearningPathService, useValue: paths },
      ],
    });
    service = TestBed.inject(ReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  describe('snapshotFor', () => {
    it('counts assigned, in-progress and completed items', () => {
      assignments.myAssignments.and.returnValue([
        asg('a1', AssignableType.Video, 'done'),
        asg('a2', AssignableType.Video, 'half'),
        asg('a3', AssignableType.Video, 'untouched'),
        asg('a4', AssignableType.LearningPath, 'p-done'),
        asg('a5', AssignableType.LearningPath, 'p-started'),
      ]);
      progress.get.and.callFake((_u, v) => {
        if (v === 'done') { return { userId: 'u1', videoId: v, positionSeconds: 9, percentComplete: 95, completed: true, updatedAt: '' }; }
        if (v === 'half') { return { userId: 'u1', videoId: v, positionSeconds: 5, percentComplete: 50, completed: false, updatedAt: '' }; }
        return undefined;
      });
      const pathOf = (id: string): LearningPath => ({ id, title: id, description: '', steps: [{ id: 's', title: 's', videoId: 'x', order: 1 }] });
      paths.getById.and.callFake((id) => pathOf(id));
      paths.isPathComplete.and.callFake((p) => p.id === 'p-done');
      paths.isStepCompleted.and.returnValue(true);

      expect(service.snapshotFor(ME)).toEqual({ assigned: 5, inProgress: 2, completed: 2 });
    });

    it('is all zeros when nothing is assigned', () => {
      assignments.myAssignments.and.returnValue([]);
      expect(service.snapshotFor(ME)).toEqual({ assigned: 0, inProgress: 0, completed: 0 });
    });
  });

  describe('loadParticipantReports', () => {
    it('joins each participant\'s summary with their own quiz attempts', () => {
      let reports: { user: User; attempts: { id: string }[]; videosCompleted: number }[] = [];
      service.loadParticipantReports().subscribe((r) => (reports = r));

      http.expectOne(`${API}/reports/participants`).flush([
        { user: { id: 'u1', name: 'A', role: 'EMPLOYEE' }, videosCompleted: 2, quizzesPassed: 1, pathsCompleted: 0 },
        { user: { id: 'u2', name: 'B', role: 'PARTNER' }, videosCompleted: 0, quizzesPassed: 0, pathsCompleted: 0 },
      ]);
      http.expectOne(`${API}/quizzes/attempts/all`).flush([
        { id: 'at1', quizId: 'q1', userId: 'u1', scorePercent: 100, passed: true, answeredAt: '', answers: {} },
        { id: 'at2', quizId: 'q1', userId: 'u1', scorePercent: 40, passed: false, answeredAt: '', answers: {} },
      ]);

      expect(reports.length).toBe(2);
      expect(reports[0].videosCompleted).toBe(2);
      expect(reports[0].attempts.map((a) => a.id)).toEqual(['at1', 'at2']);
      expect(reports[1].attempts).toEqual([]);
    });

    it('errors (rather than showing partial data) if the server rejects the request', () => {
      let status: number | undefined;
      service.loadParticipantReports().subscribe({ error: (e) => (status = e.status) });
      http.expectOne(`${API}/reports/participants`).flush({ error: 'Insufficient permissions.' }, { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });
});

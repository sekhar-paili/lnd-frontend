import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';

import {
  Assignment,
  Feedback,
  LearningPath,
  Milestone,
  Quiz,
  User,
  Video,
  VideoCategory,
} from '../models';
import { environment } from '../../../environments/environment';

export interface MockData {
  users: User[];
  videos: Video[];
  categories: VideoCategory[];
  quizzes: Quiz[];
  learningPaths: LearningPath[];
  assignments: Assignment[];
  milestones: Milestone[];
  feedback: Feedback[];
}

/**
 * Loads seed data from bundled JSON fixtures in assets/mock.
 * No network server is involved; assets ship with the app bundle.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly base = environment.mockDataBasePath;
  private cache$?: Observable<MockData>;

  constructor(private readonly http: HttpClient) {}

  load(): Observable<MockData> {
    if (!this.cache$) {
      this.cache$ = forkJoin({
        users: this.file<User[]>('users.json'),
        videos: this.file<Video[]>('videos.json'),
        categories: this.file<VideoCategory[]>('categories.json'),
        quizzes: this.file<Quiz[]>('quizzes.json'),
        learningPaths: this.file<LearningPath[]>('learning-paths.json'),
        assignments: this.file<Assignment[]>('assignments.json'),
        milestones: this.file<Milestone[]>('milestones.json'),
        feedback: this.file<Feedback[]>('feedback.json'),
      }).pipe(shareReplay(1));
    }
    return this.cache$;
  }

  private file<T>(name: string): Observable<T> {
    return this.http.get<T>(this.base + name).pipe(
      catchError(() => of([] as unknown as T)),
      map((v) => v),
    );
  }
}

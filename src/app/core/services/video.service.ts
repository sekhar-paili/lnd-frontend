import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, tap } from 'rxjs';

import { warnLoadFailure } from '../http/api-error';
import { ApiService } from '../http/api.service';
import { Video, VideoCategory } from '../models';

/** A video as submitted for creation: the server assigns the id. */
export type NewVideo = Omit<Video, 'id'>;

/**
 * Video catalogue backed by the API. The catalogue and categories are cached
 * in memory so pages can read them synchronously; admin writes call the API
 * and then update the cache.
 */
@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly categoriesSubject = new BehaviorSubject<VideoCategory[]>([]);
  private readonly videosSubject = new BehaviorSubject<Video[]>([]);

  readonly videos$ = this.videosSubject.asObservable();
  readonly categories$ = this.categoriesSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  /** Fills the cache from the API. Emits true on success, false on failure. */
  load(): Observable<boolean> {
    return forkJoin({
      videos: this.api.get<Video[]>('/videos'),
      categories: this.api.get<VideoCategory[]>('/categories'),
    }).pipe(
      tap(({ videos, categories }) => {
        this.videosSubject.next(videos);
        this.categoriesSubject.next(categories);
      }),
      map(() => true),
      catchError((err: unknown) => {
        warnLoadFailure('videos', err);
        return of(false);
      }),
    );
  }

  clear(): void {
    this.videosSubject.next([]);
    this.categoriesSubject.next([]);
  }

  getById(id: string): Video | undefined {
    return this.videosSubject.value.find((v) => v.id === id);
  }

  search(term: string): Observable<Video[]> {
    const t = term.trim().toLowerCase();
    return this.videos$.pipe(
      map((videos) =>
        t
          ? videos.filter(
              (v) =>
                v.title.toLowerCase().includes(t) ||
                v.description.toLowerCase().includes(t),
            )
          : videos,
      ),
    );
  }

  byCategory(categoryId: string | null): Observable<Video[]> {
    return this.videos$.pipe(
      map((videos) =>
        categoryId ? videos.filter((v) => v.categoryId === categoryId) : videos,
      ),
    );
  }

  /** Admin only (enforced by the server). */
  create(video: NewVideo): Observable<Video> {
    return this.api.post<Video>('/videos', this.toBody(video)).pipe(
      tap((created) => this.videosSubject.next([...this.videosSubject.value, created])),
    );
  }

  /** Admin only (enforced by the server). */
  update(video: Video): Observable<Video> {
    // The edit form does not expose the thumbnail; keep the existing one
    // rather than letting the update erase it.
    const thumbnailUrl = video.thumbnailUrl ?? this.getById(video.id)?.thumbnailUrl;
    return this.api.put<Video>(`/videos/${video.id}`, this.toBody({ ...video, thumbnailUrl })).pipe(
      tap((updated) =>
        this.videosSubject.next(
          this.videosSubject.value.map((v) => (v.id === updated.id ? updated : v)),
        ),
      ),
    );
  }

  /** Admin only (enforced by the server). */
  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/videos/${id}`).pipe(
      tap(() =>
        this.videosSubject.next(this.videosSubject.value.filter((v) => v.id !== id)),
      ),
    );
  }

  /** Only the fields the API accepts; an empty thumbnail is omitted entirely. */
  private toBody(video: NewVideo): Record<string, string | number> {
    const body: Record<string, string | number> = {
      title: video.title,
      description: video.description,
      categoryId: video.categoryId,
      durationSeconds: video.durationSeconds,
      sourceUrl: video.sourceUrl,
    };
    if (video.thumbnailUrl) {
      body['thumbnailUrl'] = video.thumbnailUrl;
    }
    return body;
  }
}

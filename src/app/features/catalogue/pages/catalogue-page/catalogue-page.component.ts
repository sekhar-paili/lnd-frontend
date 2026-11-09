import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';

import { Video, VideoCategory } from '../../../../core/models';
import { VideoService } from '../../../../core/services/video.service';

@Component({
  selector: 'app-catalogue-page',
  templateUrl: './catalogue-page.component.html',
  styleUrls: ['./catalogue-page.component.scss'],
  standalone: false,
})
export class CataloguePageComponent implements OnInit {
  private readonly term$ = new BehaviorSubject<string>('');
  private readonly category$ = new BehaviorSubject<string | null>(null);

  categories$!: Observable<VideoCategory[]>;
  videos$!: Observable<Video[]>;
  selectedCategory: string | null = null;

  constructor(private readonly videoService: VideoService) {}

  ngOnInit(): void {
    this.categories$ = this.videoService.categories$;
    this.videos$ = combineLatest([
      this.videoService.videos$,
      this.term$,
      this.category$,
    ]).pipe(
      map(([videos, term, category]) => {
        const t = term.trim().toLowerCase();
        return videos.filter((v) => {
          const matchesTerm =
            !t ||
            v.title.toLowerCase().includes(t) ||
            v.description.toLowerCase().includes(t);
          const matchesCategory = !category || v.categoryId === category;
          return matchesTerm && matchesCategory;
        });
      }),
    );
  }

  onSearch(term: string): void {
    this.term$.next(term);
  }

  onCategory(categoryId: string | null): void {
    this.selectedCategory = categoryId;
    this.category$.next(categoryId);
  }

  categoryName(id: string, categories: VideoCategory[] | null): string {
    return categories?.find((c) => c.id === id)?.name ?? 'Uncategorized';
  }
}

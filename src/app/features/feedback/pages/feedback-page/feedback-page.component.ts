import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';

import {
  Feedback,
  FeedbackTargetType,
  LearningPath,
  Video,
} from '../../../../core/models';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { VideoService } from '../../../../core/services/video.service';
import { LearningPathService } from '../../../../core/services/learning-path.service';
import { apiErrorMessage } from '../../../../core/http/api-error';

@Component({
  selector: 'app-feedback-page',
  templateUrl: './feedback-page.component.html',
  styleUrls: ['./feedback-page.component.scss'],
  standalone: false,
})
export class FeedbackPageComponent implements OnInit {
  targetType: FeedbackTargetType = 'VIDEO';
  targetId = '';
  targetTitle = '';
  rating = 0;
  comment = '';

  existing: Feedback[] = [];
  average = 0;
  submitting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly feedback: FeedbackService,
    private readonly videos: VideoService,
    private readonly paths: LearningPathService,
    private readonly toast: ToastController,
  ) {}

  private async notify(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, position: 'bottom' });
    await t.present();
  }

  ngOnInit(): void {
    this.targetType =
      (this.route.snapshot.paramMap.get('targetType') as FeedbackTargetType) ??
      'VIDEO';
    this.targetId = this.route.snapshot.paramMap.get('targetId') ?? '';
    this.resolveTitle();
    this.refresh();
  }

  private resolveTitle(): void {
    if (this.targetType === 'VIDEO') {
      const v: Video | undefined = this.videos.getById(this.targetId);
      this.targetTitle = v?.title ?? 'Video';
    } else {
      const p: LearningPath | undefined = this.paths.getById(this.targetId);
      this.targetTitle = p?.title ?? 'Learning path';
    }
  }

  private refresh(): void {
    this.feedback.load(this.targetType, this.targetId).subscribe({
      next: (summary) => {
        this.existing = summary.items;
        this.average = summary.averageRating;
      },
      error: (err: unknown) => void this.notify(apiErrorMessage(err)),
    });
  }

  submit(): void {
    if (this.submitting) {
      return;
    }
    if (this.rating < 1) {
      void this.notify('Please pick a rating first.');
      return;
    }
    this.submitting = true;
    this.feedback
      .submit({
        targetType: this.targetType,
        targetId: this.targetId,
        rating: this.rating,
        comment: this.comment.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.rating = 0;
          this.comment = '';
          this.submitting = false;
          this.refresh();
          void this.notify('Thanks for your feedback!');
        },
        error: (err: unknown) => {
          this.submitting = false;
          void this.notify(apiErrorMessage(err));
        },
      });
  }
}

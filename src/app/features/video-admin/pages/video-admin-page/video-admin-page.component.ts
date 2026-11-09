import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { apiErrorMessage } from '../../../../core/http/api-error';
import { Video, VideoCategory } from '../../../../core/models';
import { VideoService } from '../../../../core/services/video.service';

@Component({
  selector: 'app-video-admin-page',
  templateUrl: './video-admin-page.component.html',
  styleUrls: ['./video-admin-page.component.scss'],
  standalone: false,
})
export class VideoAdminPageComponent implements OnInit {
  videos$!: Observable<Video[]>;
  categories$!: Observable<VideoCategory[]>;
  editingId: string | null = null;
  saving = false;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    durationSeconds: [60, [Validators.required, Validators.min(1)]],
    // The API requires a well-formed URL.
    sourceUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/\S+$/i)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly videoService: VideoService,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.videos$ = this.videoService.videos$;
    this.categories$ = this.videoService.categories$;
  }

  private async notify(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }

  edit(video: Video): void {
    this.editingId = video.id;
    this.form.setValue({
      title: video.title,
      description: video.description,
      categoryId: video.categoryId,
      durationSeconds: video.durationSeconds,
      sourceUrl: video.sourceUrl,
    });
  }

  cancel(): void {
    this.editingId = null;
    this.form.reset({ durationSeconds: 60 });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const fields = {
      title: value.title!,
      description: value.description!,
      categoryId: value.categoryId!,
      durationSeconds: Number(value.durationSeconds),
      sourceUrl: value.sourceUrl!,
    };
    const editingId = this.editingId;
    const request$ = editingId
      ? this.videoService.update({ id: editingId, ...fields })
      : this.videoService.create(fields);

    this.saving = true;
    request$.subscribe({
      next: () => {
        this.saving = false;
        void this.notify(editingId ? 'Video updated' : 'Video added');
        this.cancel();
      },
      error: (err: unknown) => {
        // Keep the form as it is so nothing the admin typed is lost.
        this.saving = false;
        void this.notify(apiErrorMessage(err));
      },
    });
  }

  remove(video: Video): void {
    this.videoService.remove(video.id).subscribe({
      next: () => {
        void this.notify('Video removed');
        if (this.editingId === video.id) {
          this.cancel();
        }
      },
      error: (err: unknown) => void this.notify(apiErrorMessage(err)),
    });
  }
}

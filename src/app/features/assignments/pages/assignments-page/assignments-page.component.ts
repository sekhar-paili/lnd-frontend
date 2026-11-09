import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { apiErrorMessage } from '../../../../core/http/api-error';
import {
  AssignableType,
  Assignment,
  AudienceType,
  LearningPath,
  Role,
  ROLE_LABELS,
  Video,
} from '../../../../core/models';
import { AssignmentService } from '../../../../core/services/assignment.service';
import { VideoService } from '../../../../core/services/video.service';
import { LearningPathService } from '../../../../core/services/learning-path.service';

@Component({
  selector: 'app-assignments-page',
  templateUrl: './assignments-page.component.html',
  styleUrls: ['./assignments-page.component.scss'],
  standalone: false,
})
export class AssignmentsPageComponent implements OnInit {
  readonly AudienceType = AudienceType;
  readonly AssignableType = AssignableType;
  readonly roles = Object.values(Role);
  readonly roleLabels = ROLE_LABELS;
  readonly groups = ['engineering', 'sales', 'ld-team', 'external'];

  assignments$!: Observable<Assignment[]>;
  videos: Video[] = [];
  paths: LearningPath[] = [];
  saving = false;

  readonly form = this.fb.group({
    audienceType: [AudienceType.Role, Validators.required],
    audienceValue: ['', Validators.required],
    itemType: [AssignableType.Video, Validators.required],
    itemId: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly assignmentService: AssignmentService,
    private readonly videoService: VideoService,
    private readonly pathService: LearningPathService,
    private readonly toast: ToastController,
  ) {}

  private async notify(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }

  ngOnInit(): void {
    this.assignments$ = this.assignmentService.assignments$;
    this.videoService.videos$.subscribe((v) => (this.videos = v));
    this.pathService.paths$.subscribe((p) => (this.paths = p));
  }

  create(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving = true;
    this.assignmentService
      .create({
        audienceType: value.audienceType!,
        audienceValue: value.audienceValue!,
        itemType: value.itemType!,
        itemId: value.itemId!,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          void this.notify('Assignment created');
          this.form.reset({
            audienceType: AudienceType.Role,
            itemType: AssignableType.Video,
            audienceValue: '',
            itemId: '',
          });
        },
        error: (err: unknown) => {
          this.saving = false;
          void this.notify(apiErrorMessage(err));
        },
      });
  }

  describe(a: Assignment): string {
    const item =
      a.itemType === AssignableType.Video
        ? this.videos.find((v) => v.id === a.itemId)?.title
        : this.paths.find((p) => p.id === a.itemId)?.title;
    return `${item ?? a.itemId} → ${a.audienceType} (${a.audienceValue})`;
  }
}

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { Video } from '../../../../core/models';
import { VideoService } from '../../../../core/services/video.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { RoleService } from '../../../../core/services/role.service';

@Component({
  selector: 'app-player-page',
  templateUrl: './player-page.component.html',
  styleUrls: ['./player-page.component.scss'],
  standalone: false,
})
export class PlayerPageComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  video?: Video;
  percentComplete = 0;
  completed = false;

  private userId = '';
  private lastSaved = 0;
  private resumeAt = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly videoService: VideoService,
    private readonly progress: ProgressService,
    private readonly role: RoleService,
    private readonly toast: ToastController,
  ) {}

  private async notify(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, position: 'bottom' });
    await t.present();
  }

  ngOnInit(): void {
    this.userId = this.role.activeUser?.id ?? 'anonymous';
    const id = this.route.snapshot.paramMap.get('videoId');
    if (id) {
      this.video = this.videoService.getById(id);
      const existing = this.progress.get(this.userId, id);
      if (existing) {
        this.percentComplete = existing.percentComplete;
        this.completed = existing.completed;
        this.resumeAt = existing.positionSeconds;
      }
    }
  }

  onMetadataLoaded(): void {
    if (this.resumeAt > 0 && this.videoEl) {
      this.videoEl.nativeElement.currentTime = this.resumeAt;
      void this.notify(`Resumed from ${Math.round(this.resumeAt)}s`);
    }
  }

  onTimeUpdate(): void {
    const el = this.videoEl?.nativeElement;
    if (!el || !this.video || !el.duration) {
      return;
    }
    const now = el.currentTime;
    // Throttle persistence to roughly once per 3 seconds of playback.
    if (Math.abs(now - this.lastSaved) < 3) {
      return;
    }
    this.lastSaved = now;
    const percent = (now / el.duration) * 100;
    this.percentComplete = percent;
    this.progress.save(this.userId, this.video.id, now, percent);
    this.completed = this.progress.isVideoCompleted(this.userId, this.video.id);
  }

  onEnded(): void {
    const el = this.videoEl?.nativeElement;
    if (!el || !this.video) {
      return;
    }
    this.progress.save(this.userId, this.video.id, el.currentTime, 100);
    this.percentComplete = 100;
    this.completed = true;
    void this.notify('Video completed');
  }

  ngOnDestroy(): void {
    const el = this.videoEl?.nativeElement;
    if (el && this.video && el.duration) {
      this.progress.save(
        this.userId,
        this.video.id,
        el.currentTime,
        (el.currentTime / el.duration) * 100,
      );
    }
  }
}

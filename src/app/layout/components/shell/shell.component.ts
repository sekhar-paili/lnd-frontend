import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Subscription, throttleTime } from 'rxjs';

import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  standalone: false,
})
export class ShellComponent implements OnInit, OnDestroy {
  /** Sidenav open state. Open by default on wide screens, closed on narrow. */
  menuOpen = window.innerWidth >= 768;

  private saveFailedSub?: Subscription;

  constructor(
    private readonly progress: ProgressService,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    // Progress is saved silently in the background during playback. If those
    // saves fail, say so (at most once every 30s) instead of letting the user
    // believe their progress is stored.
    this.saveFailedSub = this.progress.saveFailed$
      .pipe(throttleTime(30_000))
      .subscribe(() => void this.warnProgressNotSaved());
  }

  ngOnDestroy(): void {
    this.saveFailedSub?.unsubscribe();
  }

  private async warnProgressNotSaved(): Promise<void> {
    const t = await this.toast.create({
      message: 'Your progress could not be saved. Check your connection.',
      duration: 4000,
      position: 'bottom',
      color: 'warning',
    });
    await t.present();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeOnNarrow(): void {
    if (window.innerWidth < 768) {
      this.menuOpen = false;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 768 && !this.menuOpen) {
      this.menuOpen = true;
    }
  }

  get isNarrow(): boolean {
    return window.innerWidth < 768;
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, distinctUntilChanged, takeUntil } from 'rxjs';

import { Milestone, Role, User } from '../../../../core/models';
import { MilestoneService } from '../../../../core/services/milestone.service';
import { RoleService } from '../../../../core/services/role.service';
import {
  ParticipantReport,
  ReportService,
  SnapshotCounts,
} from '../../../../core/services/report.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  standalone: false,
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  milestones$!: Observable<Milestone[]>;
  activeUser$!: Observable<User | null>;
  snapshot: SnapshotCounts = { assigned: 0, inProgress: 0, completed: 0 };
  adminReports: ParticipantReport[] = [];
  isAdmin = false;

  readonly Role = Role;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly milestoneService: MilestoneService,
    private readonly role: RoleService,
    private readonly reports: ReportService,
  ) {}

  ngOnInit(): void {
    this.milestones$ = this.milestoneService.milestones$;
    this.activeUser$ = this.role.activeUser$;

    // Only react when the signed-in user actually changes, and stop when the
    // page is destroyed. Otherwise every emission (and every earlier visit to
    // this page) re-fetched the admin reports.
    this.role.activeUser$
      .pipe(
        distinctUntilChanged((a, b) => a?.id === b?.id),
        takeUntil(this.destroy$),
      )
      .subscribe((user) => {
      this.isAdmin = this.role.activeRole === Role.LndAdmin;
      if (user) {
        this.snapshot = this.reports.snapshotFor(user);
      }
      if (this.isAdmin) {
        this.reports.loadParticipantReports().subscribe({
          next: (reports) => {
            this.adminReports = reports;
          },
          // The participation card is supplementary; leave it empty on failure.
          error: () => undefined,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  readonly today = new Date();

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  get completionPercent(): number {
    const { assigned, completed } = this.snapshot;
    return assigned > 0 ? Math.min(100, Math.round((completed / assigned) * 100)) : 0;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  /** Width of a participant's bar, relative to the most active participant. */
  barPercent(r: ParticipantReport): number {
    const score = (x: ParticipantReport) => x.videosCompleted + x.quizzesPassed + x.pathsCompleted;
    const max = Math.max(1, ...this.adminReports.map(score));
    return Math.round((score(r) / max) * 100);
  }

  get totalCompleted(): number {
    return this.adminReports.reduce(
      (sum, r) => sum + r.videosCompleted + r.quizzesPassed + r.pathsCompleted,
      0,
    );
  }
}

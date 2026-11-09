import { Component, Input } from '@angular/core';

import { Milestone } from '../../../../core/models';

@Component({
  selector: 'app-milestone-list',
  templateUrl: './milestone-list.component.html',
  styleUrls: ['./milestone-list.component.scss'],
  standalone: false,
})
export class MilestoneListComponent {
  @Input() milestones: Milestone[] = [];

  tone(status: Milestone['status']): 'neutral' | 'info' | 'success' {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      default:
        return 'neutral';
    }
  }

  get doneCount(): number {
    return this.milestones.filter((m) => m.status === 'DONE').length;
  }

  get donePercent(): number {
    return this.milestones.length
      ? Math.round((this.doneCount / this.milestones.length) * 100)
      : 0;
  }

  icon(status: Milestone['status']): string {
    return status === 'DONE'
      ? 'checkmark-outline'
      : status === 'IN_PROGRESS'
        ? 'sync-outline'
        : 'flag-outline';
  }

  label(status: Milestone['status']): string {
    return status.replace('_', ' ').toLowerCase();
  }
}

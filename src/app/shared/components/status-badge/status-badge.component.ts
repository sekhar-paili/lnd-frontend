import { Component, Input } from '@angular/core';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warn';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
  standalone: false,
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() tone: BadgeTone = 'neutral';
}

import { Component, Input } from '@angular/core';

import { Video } from '../../../../core/models';

@Component({
  selector: 'app-video-card',
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss'],
  standalone: false,
})
export class VideoCardComponent {
  @Input() video!: Video;
  @Input() categoryName = '';
}

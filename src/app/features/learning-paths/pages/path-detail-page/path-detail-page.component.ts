import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  LearningPath,
  LearningPathStepView,
  StepState,
} from '../../../../core/models';
import { LearningPathService } from '../../../../core/services/learning-path.service';
import { RoleService } from '../../../../core/services/role.service';

@Component({
  selector: 'app-path-detail-page',
  templateUrl: './path-detail-page.component.html',
  styleUrls: ['./path-detail-page.component.scss'],
  standalone: false,
})
export class PathDetailPageComponent implements OnInit {
  path?: LearningPath;
  steps: LearningPathStepView[] = [];
  readonly StepState = StepState;

  private userId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pathService: LearningPathService,
    private readonly role: RoleService,
  ) {}

  ngOnInit(): void {
    this.userId = this.role.activeUser?.id ?? 'anonymous';
    const id = this.route.snapshot.paramMap.get('pathId');
    if (id) {
      this.path = this.pathService.getById(id);
      this.refresh();
    }
  }

  refresh(): void {
    if (this.path) {
      this.steps = this.pathService.getStepViews(this.path, this.userId);
    }
  }

  open(step: LearningPathStepView): void {
    if (step.state === StepState.Locked) {
      return;
    }
    if (step.videoId) {
      this.router.navigate(['/player', step.videoId]);
    } else if (step.quizId) {
      this.router.navigate(['/quiz', step.quizId]);
    }
  }

  icon(state: StepState): string {
    switch (state) {
      case StepState.Completed:
        return 'checkmark-circle-outline';
      case StepState.Unlocked:
        return 'play-circle-outline';
      default:
        return 'lock-closed-outline';
    }
  }

  tone(state: StepState): 'neutral' | 'info' | 'success' {
    switch (state) {
      case StepState.Completed:
        return 'success';
      case StepState.Unlocked:
        return 'info';
      default:
        return 'neutral';
    }
  }
}

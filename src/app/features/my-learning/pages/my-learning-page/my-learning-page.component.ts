import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  AssignableType,
  Assignment,
  LearningPath,
  User,
  Video,
} from '../../../../core/models';
import { AssignmentService } from '../../../../core/services/assignment.service';
import { VideoService } from '../../../../core/services/video.service';
import { LearningPathService } from '../../../../core/services/learning-path.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { RoleService } from '../../../../core/services/role.service';

interface LearningItem {
  type: AssignableType;
  id: string;
  title: string;
  route: unknown[];
}

@Component({
  selector: 'app-my-learning-page',
  templateUrl: './my-learning-page.component.html',
  styleUrls: ['./my-learning-page.component.scss'],
  standalone: false,
})
export class MyLearningPageComponent implements OnInit {
  assigned: LearningItem[] = [];
  inProgress: LearningItem[] = [];
  completed: LearningItem[] = [];
  segment: 'assigned' | 'in-progress' | 'completed' = 'assigned';

  constructor(
    private readonly assignments: AssignmentService,
    private readonly videos: VideoService,
    private readonly paths: LearningPathService,
    private readonly progress: ProgressService,
    private readonly role: RoleService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Dashboard cards link here with ?tab=assigned|in-progress|completed.
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'assigned' || tab === 'in-progress' || tab === 'completed') {
      this.segment = tab;
    }
    this.role.activeUser$.subscribe((user) => {
      if (user) {
        this.build(user);
      }
    });
  }

  private build(user: User): void {
    this.assigned = [];
    this.inProgress = [];
    this.completed = [];

    const items = this.assignments.myAssignments();
    for (const a of items) {
      const item = this.toItem(a);
      if (!item) {
        continue;
      }
      const status = this.statusOf(a, user);
      if (status === 'completed') {
        this.completed.push(item);
      } else if (status === 'in-progress') {
        this.inProgress.push(item);
      } else {
        this.assigned.push(item);
      }
    }
  }

  private toItem(a: Assignment): LearningItem | null {
    if (a.itemType === AssignableType.Video) {
      const v: Video | undefined = this.videos.getById(a.itemId);
      if (!v) {
        return null;
      }
      return {
        type: a.itemType,
        id: v.id,
        title: v.title,
        route: ['/player', v.id],
      };
    }
    const p: LearningPath | undefined = this.paths.getById(a.itemId);
    if (!p) {
      return null;
    }
    return {
      type: a.itemType,
      id: p.id,
      title: p.title,
      route: ['/learning-paths', p.id],
    };
  }

  private statusOf(
    a: Assignment,
    user: User,
  ): 'assigned' | 'in-progress' | 'completed' {
    if (a.itemType === AssignableType.Video) {
      const p = this.progress.get(user.id, a.itemId);
      if (p?.completed) {
        return 'completed';
      }
      if (p && p.percentComplete > 0) {
        return 'in-progress';
      }
      return 'assigned';
    }
    const path = this.paths.getById(a.itemId);
    if (!path) {
      return 'assigned';
    }
    if (this.paths.isPathComplete(path, user.id)) {
      return 'completed';
    }
    const started = path.steps.some((s) =>
      this.paths.isStepCompleted(s, user.id),
    );
    return started ? 'in-progress' : 'assigned';
  }
}

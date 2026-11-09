import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { LearningPath } from '../../../../core/models';
import { LearningPathService } from '../../../../core/services/learning-path.service';
import { RoleService } from '../../../../core/services/role.service';

@Component({
  selector: 'app-path-list-page',
  templateUrl: './path-list-page.component.html',
  styleUrls: ['./path-list-page.component.scss'],
  standalone: false,
})
export class PathListPageComponent implements OnInit {
  paths$!: Observable<LearningPath[]>;

  constructor(
    private readonly pathService: LearningPathService,
    private readonly role: RoleService,
  ) {}

  ngOnInit(): void {
    this.paths$ = this.pathService.paths$;
  }

  isComplete(path: LearningPath): boolean {
    const userId = this.role.activeUser?.id ?? 'anonymous';
    return this.pathService.isPathComplete(path, userId);
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Role } from '../../../core/models';
import { RoleService } from '../../../core/services/role.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Role[]; // empty => all roles
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  standalone: false,
})
export class SidenavComponent {
  @Output() navigate = new EventEmitter<void>();

  private readonly allItems: NavItem[] = [
    { label: 'Dashboard', icon: 'grid-outline', route: '/dashboard', roles: [] },
    { label: 'Catalogue', icon: 'videocam-outline', route: '/catalogue', roles: [] },
    { label: 'My Learning', icon: 'school-outline', route: '/my-learning', roles: [] },
    { label: 'Learning Paths', icon: 'git-branch-outline', route: '/learning-paths', roles: [] },
    {
      label: 'Video Admin',
      icon: 'create-outline',
      route: '/admin/videos',
      roles: [Role.LndAdmin],
    },
    {
      label: 'Assignments',
      icon: 'clipboard-outline',
      route: '/admin/assignments',
      roles: [Role.LndAdmin],
    },
    {
      label: 'Quiz Builder',
      icon: 'help-circle-outline',
      route: '/admin/quizzes',
      roles: [Role.LndAdmin],
    },
    {
      label: 'Reports',
      icon: 'bar-chart-outline',
      route: '/admin/reports',
      roles: [Role.LndAdmin],
    },
  ];

  readonly items$: Observable<NavItem[]> = this.roleService.activeRole$.pipe(
    map((role) =>
      this.allItems.filter(
        (item) => item.roles.length === 0 || item.roles.includes(role),
      ),
    ),
  );

  constructor(private readonly roleService: RoleService) {}
}

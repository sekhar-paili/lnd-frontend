import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ROLE_LABELS } from '../../../core/models';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Header user menu. The role is fixed to the signed-in account — there is no
 * in-app role switching. To change role, sign out and sign in as another user.
 */
@Component({
  selector: 'app-role-switcher',
  templateUrl: './role-switcher.component.html',
  styleUrls: ['./role-switcher.component.scss'],
  standalone: false,
})
export class RoleSwitcherComponent {
  readonly labels = ROLE_LABELS;
  readonly activeRole$ = this.roleService.activeRole$;
  readonly activeUser$ = this.roleService.activeUser$;

  constructor(
    private readonly roleService: RoleService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

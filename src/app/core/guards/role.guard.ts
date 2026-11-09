import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';

import { Role } from '../models';
import { RoleService } from '../services/role.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private readonly roleService: RoleService,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowed = (route.data?.['roles'] as Role[] | undefined) ?? [];
    if (allowed.length === 0 || this.roleService.hasRole(allowed)) {
      return true;
    }
    return this.router.createUrlTree(['/dashboard']);
  }
}

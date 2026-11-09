import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { Role } from '../models';
import { RoleService } from '../services/role.service';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let roleService: jasmine.SpyObj<RoleService>;

  beforeEach(() => {
    roleService = jasmine.createSpyObj<RoleService>('RoleService', ['hasRole']);
    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: RoleService, useValue: roleService },
        {
          provide: Router,
          useValue: { createUrlTree: () => ({}) as UrlTree },
        },
      ],
    });
    guard = TestBed.inject(RoleGuard);
  });

  function routeWith(roles?: Role[]) {
    return { data: roles ? { roles } : {} } as any;
  }

  it('allows when no roles are required', () => {
    expect(guard.canActivate(routeWith())).toBeTrue();
  });

  it('allows when the active role matches', () => {
    roleService.hasRole.and.returnValue(true);
    expect(guard.canActivate(routeWith([Role.LndAdmin]))).toBeTrue();
  });

  it('redirects when the active role does not match', () => {
    roleService.hasRole.and.returnValue(false);
    const result = guard.canActivate(routeWith([Role.LndAdmin]));
    expect(result).not.toBeTrue();
  });
});

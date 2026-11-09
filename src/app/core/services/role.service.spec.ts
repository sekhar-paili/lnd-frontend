import { TestBed } from '@angular/core/testing';

import { Role, User } from '../models';
import { RoleService } from './role.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

const ADMIN: User = { id: 'u-admin', name: 'Admin', role: Role.LndAdmin };
const EMPLOYEE: User = { id: 'u-emp', name: 'Emp', role: Role.Employee };

describe('RoleService', () => {
  let service: RoleService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(RoleService);
    storage = TestBed.inject(StorageService);
  });

  afterEach(() => localStorage.clear());

  it('has no active user until one is set', () => {
    expect(service.activeUser).toBeNull();
  });

  it('setActiveUser applies the user and takes the role from the account', () => {
    service.setActiveUser(ADMIN);
    expect(service.activeUser?.id).toBe('u-admin');
    expect(service.activeRole).toBe(Role.LndAdmin);
  });

  it('persists the active user and role', () => {
    service.setActiveUser(EMPLOYEE);
    expect(storage.get(STORAGE_KEYS.activeUserId)).toBe('u-emp');
    expect(storage.get(STORAGE_KEYS.activeRole)).toBe(Role.Employee);
  });

  it('clearActiveUser removes the user and its persisted keys', () => {
    service.setActiveUser(ADMIN);
    service.clearActiveUser();
    expect(service.activeUser).toBeNull();
    expect(storage.get(STORAGE_KEYS.activeUserId)).toBeNull();
    expect(storage.get(STORAGE_KEYS.activeRole)).toBeNull();
  });

  it('hasRole reflects the active role', () => {
    service.setActiveUser(ADMIN);
    expect(service.hasRole([Role.LndAdmin])).toBeTrue();
    expect(service.hasRole([Role.Partner])).toBeFalse();
  });
});

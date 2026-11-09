import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { Role, User } from '../models';
import { STORAGE_KEYS, StorageService } from './storage.service';

/**
 * Holds the active user and role. AuthService sets the user on sign-in (the
 * role comes from the backend-issued account, so it cannot be switched in the
 * UI) and clears it on sign-out.
 */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly activeRoleSubject = new BehaviorSubject<Role>(Role.Employee);
  private readonly activeUserSubject = new BehaviorSubject<User | null>(null);

  readonly activeRole$: Observable<Role> = this.activeRoleSubject.asObservable();
  readonly activeUser$: Observable<User | null> = this.activeUserSubject.asObservable();

  constructor(private readonly storage: StorageService) {}

  get activeRole(): Role {
    return this.activeRoleSubject.value;
  }

  get activeUser(): User | null {
    return this.activeUserSubject.value;
  }

  setActiveUser(user: User): void {
    this.activeUserSubject.next(user);
    this.activeRoleSubject.next(user.role);
    this.storage.set(STORAGE_KEYS.activeUserId, user.id);
    this.storage.set(STORAGE_KEYS.activeRole, user.role);
  }

  clearActiveUser(): void {
    this.activeUserSubject.next(null);
    this.storage.remove(STORAGE_KEYS.activeUserId);
    this.storage.remove(STORAGE_KEYS.activeRole);
  }

  hasRole(roles: Role[]): boolean {
    return roles.includes(this.activeRoleSubject.value);
  }
}

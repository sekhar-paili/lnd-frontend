import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * Typed wrapper around localStorage with a namespace prefix. It holds only
 * client-side session state (the login token and the active user); all
 * application data lives on the backend.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = environment.storagePrefix;

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      // Corrupt value: treat as missing.
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /** Clears only keys owned by this app (namespace-scoped). */
  clearAll(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }
}

export const STORAGE_KEYS = {
  authToken: 'auth-token',
  /** Legacy key from the fixture-based login; only ever removed now. */
  authUserId: 'auth-user-id',
  activeRole: 'active-role',
  activeUserId: 'active-user-id',
} as const;

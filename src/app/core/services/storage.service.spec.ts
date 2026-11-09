import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('round-trips a typed value', () => {
    service.set('demo', { a: 1, b: 'x' });
    expect(service.get<{ a: number; b: string }>('demo')).toEqual({ a: 1, b: 'x' });
  });

  it('returns null for a missing key', () => {
    expect(service.get('nope')).toBeNull();
  });

  it('namespaces keys with the lnd. prefix', () => {
    service.set('k', 42);
    expect(localStorage.getItem('lnd.k')).toBe('42');
  });

  it('removes a single key', () => {
    service.set('k', 1);
    service.remove('k');
    expect(service.get('k')).toBeNull();
  });

  it('clearAll only removes namespaced keys', () => {
    service.set('mine', 1);
    localStorage.setItem('foreign', 'keep');
    service.clearAll();
    expect(service.get('mine')).toBeNull();
    expect(localStorage.getItem('foreign')).toBe('keep');
  });

  it('returns null for corrupt JSON instead of throwing', () => {
    localStorage.setItem('lnd.bad', '{not json');
    expect(service.get('bad')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocaleStore } from './locale-store';

describe('LocaleStore', () => {
  const STORAGE_KEY = 'nb-locale';

  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to en when localStorage is empty', () => {
    const store = TestBed.inject(LocaleStore);
    expect(store.locale()).toBe('en');
  });

  it('initializes from a stored valid locale', () => {
    localStorage.setItem(STORAGE_KEY, 'ru');
    const store = TestBed.inject(LocaleStore);
    expect(store.locale()).toBe('ru');
  });

  it('falls back to en when the stored value is invalid', () => {
    localStorage.setItem(STORAGE_KEY, 'fr');
    const store = TestBed.inject(LocaleStore);
    expect(store.locale()).toBe('en');
  });

  it('setLocale switches the signal and persists the value', () => {
    const store = TestBed.inject(LocaleStore);

    store.setLocale('ro');

    expect(store.locale()).toBe('ro');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('ro');
  });
});

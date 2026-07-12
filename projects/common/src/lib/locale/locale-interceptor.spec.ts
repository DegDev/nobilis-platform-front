import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { localeInterceptor } from './locale-interceptor';
import { LocaleStore } from './locale-store';

describe('localeInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([localeInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('appends ?locale= to a request with no existing params', () => {
    http.get('/api/items').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/items');
    expect(req.request.params.get('locale')).toBe('en');
  });

  it('preserves existing params and appends locale', () => {
    http.get('/api/items', { params: { foo: 'bar' } }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/items');
    expect(req.request.params.get('foo')).toBe('bar');
    expect(req.request.params.get('locale')).toBe('en');
  });

  it('replaces an existing locale param instead of duplicating it', () => {
    http.get('/api/items', { params: { locale: 'xx' } }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/items');
    expect(req.request.params.getAll('locale')).toEqual(['en']);
  });

  it('uses the active locale from the store', () => {
    TestBed.inject(LocaleStore).setLocale('ru');

    http.get('/api/items').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/items');
    expect(req.request.params.get('locale')).toBe('ru');
  });
});

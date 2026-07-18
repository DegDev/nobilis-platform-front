import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authInterceptor } from './auth-interceptor';
import { AuthStore } from './auth-store';

const STORAGE_KEY = 'nb-admin-token';

function makeToken(claims: Record<string, unknown>): string {
  return `${base64UrlEncode({ alg: 'none' })}.${base64UrlEncode(claims)}.sig`;
}

function base64UrlEncode(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authStore: AuthStore;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  function withToken(token: string): void {
    sessionStorage.setItem(STORAGE_KEY, token);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  }

  it('passes a request outside /api/admin through untouched, even with a token present', () => {
    withToken(makeToken({ exp: nowSeconds() + 1800 }));

    http.get('/auth/admin/login').subscribe();

    const req = httpMock.expectOne('/auth/admin/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('attaches the current token unchanged when it has plenty of time left', () => {
    const token = makeToken({ exp: nowSeconds() + 1800 });
    withToken(token);

    http.get('/api/admin/things').subscribe();

    const req = httpMock.expectOne('/api/admin/things');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('proactively re-mints a token nearing expiry and attaches the fresh one', () => {
    const staleToken = makeToken({ exp: nowSeconds() + 60 });
    const freshToken = makeToken({ exp: nowSeconds() + 1800 });
    withToken(staleToken);

    http.get('/api/admin/things').subscribe();

    const remintReq = httpMock.expectOne('/auth/admin/remint');
    expect(remintReq.request.headers.get('Authorization')).toBe(`Bearer ${staleToken}`);
    remintReq.flush({ token: freshToken });

    const req = httpMock.expectOne('/api/admin/things');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${freshToken}`);
    req.flush({});

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(freshToken);
  });

  it('reactively re-mints once on a 401 and retries the original request', () => {
    const staleToken = makeToken({ exp: nowSeconds() + 1800 });
    const freshToken = makeToken({ exp: nowSeconds() + 1800 });
    withToken(staleToken);

    let result: unknown;
    http.get('/api/admin/things').subscribe((value) => (result = value));

    const firstAttempt = httpMock.expectOne('/api/admin/things');
    firstAttempt.flush(null, { status: 401, statusText: 'Unauthorized' });

    const remintReq = httpMock.expectOne('/auth/admin/remint');
    remintReq.flush({ token: freshToken });

    const retry = httpMock.expectOne('/api/admin/things');
    expect(retry.request.headers.get('Authorization')).toBe(`Bearer ${freshToken}`);
    retry.flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('logs out and redirects to /login when the reactive re-mint itself fails', () => {
    const staleToken = makeToken({ exp: nowSeconds() + 1800 });
    withToken(staleToken);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    let sawError = false;
    http.get('/api/admin/things').subscribe({
      error: () => (sawError = true),
    });

    const firstAttempt = httpMock.expectOne('/api/admin/things');
    firstAttempt.flush(null, { status: 401, statusText: 'Unauthorized' });

    const remintReq = httpMock.expectOne('/auth/admin/remint');
    remintReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(sawError).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith('/login');
    expect(authStore.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('coalesces concurrent 401s into a single re-mint call', () => {
    const staleToken = makeToken({ exp: nowSeconds() + 1800 });
    const freshToken = makeToken({ exp: nowSeconds() + 1800 });
    withToken(staleToken);

    const results: unknown[] = [];
    http.get('/api/admin/a').subscribe((value) => results.push(value));
    http.get('/api/admin/b').subscribe((value) => results.push(value));

    httpMock.match('/api/admin/a')[0].flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.match('/api/admin/b')[0].flush(null, { status: 401, statusText: 'Unauthorized' });

    // Exactly one re-mint call serves both failed requests.
    const remintRequests = httpMock.match('/auth/admin/remint');
    expect(remintRequests).toHaveLength(1);
    remintRequests[0].flush({ token: freshToken });

    const retryA = httpMock.expectOne('/api/admin/a');
    const retryB = httpMock.expectOne('/api/admin/b');
    expect(retryA.request.headers.get('Authorization')).toBe(`Bearer ${freshToken}`);
    expect(retryB.request.headers.get('Authorization')).toBe(`Bearer ${freshToken}`);
    retryA.flush({ id: 'a' });
    retryB.flush({ id: 'b' });

    expect(results).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});

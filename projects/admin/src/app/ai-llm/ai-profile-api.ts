import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AiFieldDescriptor,
  AiHealthCheckResult,
  AiProfile,
  AiProfileSaveRequest,
  AiProvider,
} from './ai-profile.model';

/**
 * Talks to the AI-profile admin REST API (`/admin/api/ai`). Errors surface as the common
 * `ProblemDetailError` (the problem interceptor is registered globally) and the Bearer token is
 * attached by the admin `authInterceptor`; this stays a thin, stateless HttpClient wrapper.
 */
@Injectable({ providedIn: 'root' })
export class AiProfileApi {
  private static readonly BASE = '/admin/api/ai';

  private readonly http = inject(HttpClient);

  /** Lists every purpose the catalog knows about. */
  purposes(): Observable<string[]> {
    return this.http.get<string[]>(`${AiProfileApi.BASE}/purposes`);
  }

  /** Lists the providers offered for a purpose. */
  providers(purpose: string): Observable<AiProvider[]> {
    return this.http.get<AiProvider[]>(`${AiProfileApi.BASE}/providers`, { params: { purpose } });
  }

  /** The field descriptor a data-driven form renders from. */
  descriptor(purpose: string, provider: string): Observable<AiFieldDescriptor[]> {
    return this.http.get<AiFieldDescriptor[]>(`${AiProfileApi.BASE}/descriptor`, {
      params: { purpose, provider },
    });
  }

  /** Reads the currently resolved (masked) profile for a purpose. */
  profile(purpose: string): Observable<AiProfile> {
    return this.http.get<AiProfile>(`${AiProfileApi.BASE}/profile`, { params: { purpose } });
  }

  /** Saves which provider serves a purpose, its params, and any changed secrets. */
  save(request: AiProfileSaveRequest): Observable<AiProfile> {
    return this.http.post<AiProfile>(`${AiProfileApi.BASE}/profile`, request);
  }

  /** Runs a health-check against the purpose's currently resolved provider/model. */
  healthCheck(purpose: string): Observable<AiHealthCheckResult> {
    return this.http.post<AiHealthCheckResult>(`${AiProfileApi.BASE}/health-check`, { purpose });
  }
}

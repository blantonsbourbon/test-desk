import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CatalogResponse,
  CatalogStatusFilter,
  CreateExecutionRequest,
  EnvironmentName,
  Execution,
  ExecutionListResponse,
  ExecutionStatus,
  ScenarioDetails,
  Source,
  SourceListResponse,
} from './models';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listSources(): Observable<SourceListResponse> {
    return this.http
      .get<SourceListResponse>(`${this.baseUrl}/sources`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getSource(sourceId: string): Observable<Source> {
    return this.http
      .get<Source>(`${this.baseUrl}/sources/${encodeURIComponent(sourceId)}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  syncSource(sourceId: string): Observable<Source> {
    return this.http
      .post<Source>(`${this.baseUrl}/sources/${encodeURIComponent(sourceId)}/sync`, {})
      .pipe(catchError((err) => this.handleError(err)));
  }

  getCatalog(
    sourceId: string,
    options: { q?: string; status?: CatalogStatusFilter; tags?: string[] } = {},
  ): Observable<CatalogResponse> {
    let params = new HttpParams().set('sourceId', sourceId);
    if (options.q) {
      params = params.set('q', options.q);
    }
    if (options.status) {
      params = params.set('status', options.status);
    }
    for (const tag of options.tags ?? []) {
      params = params.append('tag', tag);
    }
    return this.http
      .get<CatalogResponse>(`${this.baseUrl}/catalog`, { params })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getScenario(scenarioId: string, limit = 5): Observable<ScenarioDetails> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http
      .get<ScenarioDetails>(
        `${this.baseUrl}/catalog/scenarios/${encodeURIComponent(scenarioId)}`,
        { params },
      )
      .pipe(catchError((err) => this.handleError(err)));
  }

  listExecutions(filters: {
    sourceId?: string;
    status?: ExecutionStatus | '';
    environment?: EnvironmentName | '';
  } = {}): Observable<ExecutionListResponse> {
    let params = new HttpParams();
    if (filters.sourceId) {
      params = params.set('sourceId', filters.sourceId);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.environment) {
      params = params.set('environment', filters.environment);
    }
    return this.http
      .get<ExecutionListResponse>(`${this.baseUrl}/executions`, { params })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getExecution(executionId: string): Observable<Execution> {
    return this.http
      .get<Execution>(`${this.baseUrl}/executions/${encodeURIComponent(executionId)}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  createExecution(request: CreateExecutionRequest): Observable<Execution> {
    return this.http
      .post<Execution>(`${this.baseUrl}/executions`, request)
      .pipe(catchError((err) => this.handleError(err)));
  }

  cancelExecution(executionId: string): Observable<Execution> {
    return this.http
      .post<Execution>(
        `${this.baseUrl}/executions/${encodeURIComponent(executionId)}/cancel`,
        {},
      )
      .pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; code?: string } | string | null;
      const message =
        typeof body === 'object' && body?.message
          ? body.message
          : error.status === 0
            ? 'Unable to reach the API. Check that the backend is running.'
            : error.message || 'Request failed';
      const code = typeof body === 'object' ? body?.code : undefined;
      return throwError(() => new ApiClientError(message, code, error.status));
    }
    return throwError(
      () => new ApiClientError(error instanceof Error ? error.message : 'Unexpected error'),
    );
  }
}

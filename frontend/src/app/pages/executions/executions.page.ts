import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiClientError, ApiService } from '../../core/api.service';
import {
  formatAbsolute,
  formatDuration,
  formatRelative,
  isActiveStatus,
  shortSha,
} from '../../core/format';
import {
  EnvironmentName,
  Execution,
  ExecutionStatus,
  Source,
} from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-executions-page',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: './executions.page.html',
  styleUrl: './executions.page.scss',
})
export class ExecutionsPage implements OnInit {
  private readonly api = inject(ApiService);

  sources: Source[] = [];
  items: Execution[] = [];

  sourceId = '';
  status: ExecutionStatus | '' = '';
  environment: EnvironmentName | '' = '';

  loading = true;
  error: string | null = null;
  hasLoadedOnce = false;

  readonly shortSha = shortSha;
  readonly formatDuration = formatDuration;
  readonly formatRelative = formatRelative;
  readonly formatAbsolute = formatAbsolute;
  readonly isActiveStatus = isActiveStatus;

  readonly statuses: Array<ExecutionStatus | ''> = [
    '',
    'QUEUED',
    'RUNNING',
    'PASSED',
    'FAILED',
    'ERROR',
    'CANCELLED',
  ];

  ngOnInit(): void {
    this.api.listSources().subscribe({
      next: (res) => {
        this.sources = res.items;
      },
      error: () => {
        /* sources filter is optional */
      },
    });
    this.load();
  }

  get hasFilters(): boolean {
    return !!this.sourceId || !!this.status || !!this.environment;
  }

  get emptyBecauseFilters(): boolean {
    return this.hasLoadedOnce && !this.loading && this.items.length === 0 && this.hasFilters;
  }

  get emptyBecauseNone(): boolean {
    return this.hasLoadedOnce && !this.loading && this.items.length === 0 && !this.hasFilters;
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api
      .listExecutions({
        sourceId: this.sourceId || undefined,
        status: this.status || undefined,
        environment: this.environment || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items = this.sortItems(res.items);
          this.loading = false;
          this.hasLoadedOnce = true;
        },
        error: (err: unknown) => {
          this.loading = false;
          this.hasLoadedOnce = true;
          this.error = err instanceof ApiClientError ? err.message : 'Failed to load executions';
        },
      });
  }

  clearFilters(): void {
    this.sourceId = '';
    this.status = '';
    this.environment = '';
    this.load();
  }

  sourceName(sourceId: string): string {
    return this.sources.find((s) => s.id === sourceId)?.name ?? sourceId;
  }

  private sortItems(items: Execution[]): Execution[] {
    return [...items].sort((a, b) => {
      const aActive = isActiveStatus(a.status) ? 0 : 1;
      const bActive = isActiveStatus(b.status) ? 0 : 1;
      if (aActive !== bActive) {
        return aActive - bActive;
      }
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });
  }
}

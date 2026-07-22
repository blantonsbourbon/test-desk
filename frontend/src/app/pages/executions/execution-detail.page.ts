import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';
import { ApiClientError, ApiService } from '../../core/api.service';
import {
  formatAbsolute,
  formatDuration,
  formatRelative,
  isActiveStatus,
  isTerminalStatus,
  shortSha,
} from '../../core/format';
import { Execution } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-execution-detail-page',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './execution-detail.page.html',
  styleUrl: './execution-detail.page.scss',
})
export class ExecutionDetailPage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  execution: Execution | null = null;
  loading = true;
  error: string | null = null;
  cancelling = false;
  polling = false;

  private pollSub: Subscription | null = null;
  private routeSub: Subscription | null = null;

  readonly shortSha = shortSha;
  readonly formatDuration = formatDuration;
  readonly formatRelative = formatRelative;
  readonly formatAbsolute = formatAbsolute;
  readonly isActiveStatus = isActiveStatus;
  readonly isTerminalStatus = isTerminalStatus;

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('executionId');
      if (id) {
        this.load(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  load(id: string): void {
    this.loading = true;
    this.error = null;
    this.pollSub?.unsubscribe();
    this.api.getExecution(id).subscribe({
      next: (execution) => {
        this.execution = execution;
        this.loading = false;
        this.maybeStartPolling(execution);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = err instanceof ApiClientError ? err.message : 'Failed to load execution';
      },
    });
  }

  cancel(): void {
    if (!this.execution || this.cancelling || isTerminalStatus(this.execution.status)) {
      return;
    }
    this.cancelling = true;
    this.api.cancelExecution(this.execution.id).subscribe({
      next: (execution) => {
        this.execution = execution;
        this.cancelling = false;
        this.toast.info('Execution cancelled');
        this.pollSub?.unsubscribe();
        this.polling = false;
      },
      error: (err: unknown) => {
        this.cancelling = false;
        this.toast.error(err instanceof ApiClientError ? err.message : 'Cancel failed');
      },
    });
  }

  exampleLabel(values: Record<string, string> | null): string {
    if (!values || !Object.keys(values).length) {
      return '';
    }
    return Object.entries(values)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
  }

  private maybeStartPolling(execution: Execution): void {
    if (!isActiveStatus(execution.status)) {
      this.polling = false;
      return;
    }
    this.polling = true;
    this.pollSub?.unsubscribe();
    this.pollSub = interval(1500)
      .pipe(
        switchMap(() => this.api.getExecution(execution.id)),
        takeWhile((item) => isActiveStatus(item.status), true),
      )
      .subscribe({
        next: (item) => {
          this.execution = item;
          if (!isActiveStatus(item.status)) {
            this.polling = false;
          }
        },
        error: (err: unknown) => {
          this.polling = false;
          this.toast.error(err instanceof ApiClientError ? err.message : 'Polling failed');
        },
      });
  }
}

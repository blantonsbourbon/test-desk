import { Component, Input } from '@angular/core';
import {
  ExecutionStatus,
  ScenarioExecutionStatus,
  SourceSyncStatus,
} from '../core/models';
import { statusLabel } from '../core/format';

type BadgeStatus = ExecutionStatus | ScenarioExecutionStatus | SourceSyncStatus | null | undefined;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [attr.data-status]="tone" [attr.title]="label">
      <span class="badge__icon" aria-hidden="true">{{ icon }}</span>
      <span class="badge__text">{{ label }}</span>
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        border: 1px solid var(--border-subtle);
        background: var(--surface-2);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        white-space: nowrap;
      }

      .badge__icon {
        font-size: 0.7rem;
        line-height: 1;
      }

      .badge[data-status='passed'] {
        color: var(--success);
        border-color: color-mix(in srgb, var(--success) 40%, transparent);
        background: color-mix(in srgb, var(--success) 12%, transparent);
      }

      .badge[data-status='failed'] {
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 40%, transparent);
        background: color-mix(in srgb, var(--danger) 12%, transparent);
      }

      .badge[data-status='error'] {
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 50%, transparent);
        background: color-mix(in srgb, var(--danger) 16%, transparent);
      }

      .badge[data-status='running'],
      .badge[data-status='syncing'] {
        color: var(--accent);
        border-color: color-mix(in srgb, var(--accent) 40%, transparent);
        background: color-mix(in srgb, var(--accent) 12%, transparent);
      }

      .badge[data-status='queued'] {
        color: var(--warning);
        border-color: color-mix(in srgb, var(--warning) 40%, transparent);
        background: color-mix(in srgb, var(--warning) 12%, transparent);
      }

      .badge[data-status='cancelled'],
      .badge[data-status='skipped'],
      .badge[data-status='never'] {
        color: var(--text-muted);
      }

      .badge[data-status='synced'] {
        color: var(--success);
        border-color: color-mix(in srgb, var(--success) 35%, transparent);
        background: color-mix(in srgb, var(--success) 10%, transparent);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: BadgeStatus;

  get label(): string {
    return statusLabel(this.status);
  }

  get tone(): string {
    if (this.status == null) {
      return 'never';
    }
    return String(this.status).toLowerCase();
  }

  get icon(): string {
    switch (this.status) {
      case 'PASSED':
      case 'SYNCED':
        return '✓';
      case 'FAILED':
        return '✗';
      case 'ERROR':
        return '!';
      case 'RUNNING':
      case 'SYNCING':
        return '◉';
      case 'QUEUED':
        return '◷';
      case 'CANCELLED':
        return '⊘';
      case 'SKIPPED':
        return '–';
      default:
        return '○';
    }
  }
}

import { Component, Input } from '@angular/core';
import {
  ExecutionStatus,
  SourceSyncStatus,
  TestResultStatus,
} from '../core/models';
import { statusLabel } from '../core/format';

type BadgeStatus = ExecutionStatus | TestResultStatus | SourceSyncStatus | null | undefined;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [attr.data-status]="tone" [attr.title]="label">
      <span class="badge__dot" aria-hidden="true"></span>
      <span class="badge__text">{{ label }}</span>
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.18rem 0.55rem 0.18rem 0.45rem;
        border-radius: 999px;
        border: 1px solid var(--border-subtle);
        background: var(--surface-2);
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        white-space: nowrap;
        line-height: 1.2;
      }

      .badge__dot {
        width: 0.42rem;
        height: 0.42rem;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
        opacity: 0.9;
      }

      .badge[data-status='passed'],
      .badge[data-status='synced'] {
        color: var(--success);
        border-color: color-mix(in srgb, var(--success) 22%, var(--border-subtle));
        background: var(--success-bg);
      }

      .badge[data-status='failed'],
      .badge[data-status='error'] {
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 22%, var(--border-subtle));
        background: var(--danger-bg);
      }

      .badge[data-status='running'],
      .badge[data-status='syncing'] {
        color: var(--running);
        border-color: color-mix(in srgb, var(--running) 25%, var(--border-subtle));
        background: var(--running-bg);
      }

      .badge[data-status='queued'] {
        color: var(--warning);
        border-color: color-mix(in srgb, var(--warning) 25%, var(--border-subtle));
        background: var(--warning-bg);
      }

      .badge[data-status='cancelled'],
      .badge[data-status='skipped'],
      .badge[data-status='never'] {
        color: var(--text-muted);
        background: var(--surface-2);
      }

      @media (prefers-reduced-motion: no-preference) {
        .badge[data-status='running'] .badge__dot,
        .badge[data-status='syncing'] .badge__dot {
          animation: pulse-dot 1.4s ease-in-out infinite;
        }
      }

      @keyframes pulse-dot {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.45;
          transform: scale(0.85);
        }
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
}

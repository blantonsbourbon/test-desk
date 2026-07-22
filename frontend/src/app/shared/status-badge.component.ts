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
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        white-space: nowrap;
        line-height: 1.2;
      }

      .badge__dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: var(--text-muted);
        flex-shrink: 0;
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-muted) 18%, transparent);
      }

      .badge[data-status='passed'],
      .badge[data-status='synced'] {
        color: #b8f5ec;
        border-color: color-mix(in srgb, var(--success) 40%, transparent);
        background: color-mix(in srgb, var(--success) 12%, transparent);
      }

      .badge[data-status='passed'] .badge__dot,
      .badge[data-status='synced'] .badge__dot {
        background: var(--success);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--success) 22%, transparent);
      }

      .badge[data-status='failed'],
      .badge[data-status='error'] {
        color: #ffd6d9;
        border-color: color-mix(in srgb, var(--danger) 42%, transparent);
        background: color-mix(in srgb, var(--danger) 13%, transparent);
      }

      .badge[data-status='failed'] .badge__dot,
      .badge[data-status='error'] .badge__dot {
        background: var(--danger);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--danger) 22%, transparent);
      }

      .badge[data-status='running'],
      .badge[data-status='syncing'] {
        color: #c8fff7;
        border-color: color-mix(in srgb, var(--accent) 42%, transparent);
        background: color-mix(in srgb, var(--accent) 12%, transparent);
      }

      .badge[data-status='running'] .badge__dot,
      .badge[data-status='syncing'] .badge__dot {
        background: var(--accent);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent);
      }

      .badge[data-status='queued'] {
        color: #ffe4b8;
        border-color: color-mix(in srgb, var(--warning) 42%, transparent);
        background: color-mix(in srgb, var(--warning) 12%, transparent);
      }

      .badge[data-status='queued'] .badge__dot {
        background: var(--warning);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--warning) 22%, transparent);
      }

      .badge[data-status='cancelled'],
      .badge[data-status='skipped'],
      .badge[data-status='never'] {
        color: var(--text-muted);
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
          opacity: 0.55;
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

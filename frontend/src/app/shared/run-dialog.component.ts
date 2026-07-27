import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnvironmentName, RunSelection } from '../core/models';
import { formatAbsolute, shortSha } from '../core/format';

@Component({
  selector: 'app-run-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (selection) {
      <div class="overlay" role="presentation" (click)="onCancel()"></div>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-dialog-title"
      >
        <header class="dialog__header">
          <div>
            <div class="dialog__eyebrow">New execution</div>
            <h2 id="run-dialog-title">Confirm execution</h2>
          </div>
          <button type="button" class="icon-btn" aria-label="Close" (click)="onCancel()">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>

        <div class="dialog__body">
          <p class="lead">
            {{ selection.entries.length }}
            entr{{ selection.entries.length === 1 ? 'y' : 'ies' }} will run against
            <strong>{{ selection.sourceName }}</strong>.
          </p>

          <div class="pin-card">
            <div class="pin-card__label">Catalog revision</div>
            <div class="pin-card__sha mono">{{ shortSha(selection.revision.commit) }}</div>
            <div class="muted small">
              branch <span class="mono">{{ selection.revision.branch }}</span> · synced
              {{ formatAbsolute(selection.revision.syncedAt) }}
            </div>
            <div class="pin-card__note">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 3.5v5M8 11.25h.01"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4" />
              </svg>
              This run is pinned to this commit
            </div>
          </div>

          <div class="scenario-list" role="list">
            @for (entry of selection.entries; track entry.id) {
              <div class="scenario-list__item" role="listitem">
                <span class="scenario-list__name">{{ entry.name }}</span>
                @if (entry.groupName) {
                  <span class="muted small">{{ entry.groupName }}</span>
                }
              </div>
            }
          </div>

          <fieldset class="env-fieldset">
            <legend>Environment</legend>
            <label class="env-option" [class.env-option--selected]="environment === 'dev'">
              <input type="radio" name="environment" value="dev" [(ngModel)]="environment" />
              <span class="env-option__body">
                <span class="env-option__name">dev</span>
                <span class="env-option__hint">Development target</span>
              </span>
            </label>
            <label class="env-option" [class.env-option--selected]="environment === 'qa'">
              <input type="radio" name="environment" value="qa" [(ngModel)]="environment" />
              <span class="env-option__body">
                <span class="env-option__name">qa</span>
                <span class="env-option__hint">QA target</span>
              </span>
            </label>
          </fieldset>

          @if (error) {
            <div class="error-banner" role="alert">{{ error }}</div>
          }
        </div>

        <footer class="dialog__footer">
          <button type="button" class="btn btn--ghost" (click)="onCancel()" [disabled]="submitting">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn--primary"
            [disabled]="!environment || submitting"
            (click)="onSubmit()"
          >
            {{ submitLabel }}
          </button>
        </footer>
      </div>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: var(--overlay-strong);
        z-index: 40;
      }

      .dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 50;
        width: min(32rem, calc(100vw - 2rem));
        max-height: calc(100vh - 2rem);
        overflow: auto;
        background: var(--surface-1);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-dialog);
        display: flex;
        flex-direction: column;
      }

      .dialog__header,
      .dialog__footer {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-subtle);
      }

      .dialog__footer {
        border-bottom: 0;
        border-top: 1px solid var(--border-subtle);
        justify-content: flex-end;
        align-items: center;
      }

      .dialog__eyebrow {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        margin-bottom: 0.2rem;
      }

      .dialog__header h2 {
        margin: 0;
        font-size: 1.1rem;
        letter-spacing: -0.01em;
      }

      .dialog__body {
        padding: 1.2rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .lead {
        margin: 0;
        color: var(--text-muted);
        line-height: 1.5;
      }

      .lead strong {
        color: var(--text);
        font-weight: 600;
      }

      .pin-card {
        border: 1px solid var(--border-subtle);
        border-radius: 0.55rem;
        padding: 0.85rem 1rem;
        background: var(--table-header);
      }

      .pin-card__label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        margin-bottom: 0.3rem;
        font-weight: 600;
      }

      .pin-card__sha {
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 0.2rem;
      }

      .pin-card__note {
        margin-top: 0.6rem;
        font-size: 0.8rem;
        color: var(--info);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }

      .pin-card__note svg {
        width: 0.95rem;
        height: 0.95rem;
        flex-shrink: 0;
      }

      .scenario-list {
        max-height: 10rem;
        overflow: auto;
        border: 1px solid var(--border-subtle);
        border-radius: 0.5rem;
        background: var(--surface-2);
      }

      .scenario-list__item {
        display: flex;
        flex-direction: column;
        gap: 0.12rem;
        padding: 0.55rem 0.75rem;
        border-bottom: 1px solid var(--border-subtle);
      }

      .scenario-list__item:last-child {
        border-bottom: 0;
      }

      .scenario-list__name {
        font-size: 0.92rem;
      }

      .env-fieldset {
        border: 0;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
      }

      .env-fieldset legend {
        margin-bottom: 0.5rem;
        font-size: 0.72rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0;
      }

      .env-option {
        display: flex;
        align-items: flex-start;
        gap: 0.55rem;
        padding: 0.75rem 0.85rem;
        border: 1px solid var(--border-subtle);
        border-radius: 0.55rem;
        background: var(--surface-2);
        cursor: pointer;
        transition:
          border-color 0.12s ease,
          background 0.12s ease,
          box-shadow 0.12s ease;
      }

      .env-option input {
        margin-top: 0.15rem;
        accent-color: var(--accent);
      }

      .env-option__body {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .env-option__name {
        font-family: var(--font-mono);
        font-weight: 600;
        font-size: 0.95rem;
      }

      .env-option__hint {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .env-option--selected,
      .env-option:has(input:checked) {
        border-color: var(--text);
        background: var(--surface-1);
        box-shadow: inset 0 0 0 1px var(--text);
      }

      .error-banner {
        padding: 0.65rem 0.75rem;
        border-radius: 0.4rem;
        border: 1px solid color-mix(in srgb, var(--danger) 28%, var(--border-subtle));
        background: var(--danger-bg);
        color: var(--danger);
        font-size: 0.875rem;
      }

      .small {
        font-size: 0.8rem;
      }

      @media (max-width: 420px) {
        .env-fieldset {
          grid-template-columns: 1fr;
        }
      }

      @media (prefers-reduced-motion: no-preference) {
        .dialog {
          animation: dialog-in 0.15s ease-out;
        }
      }

      @keyframes dialog-in {
        from {
          opacity: 0.7;
          transform: translate(-50%, calc(-50% + 0.35rem));
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
    `,
  ],
})
export class RunDialogComponent {
  @Input() selection: RunSelection | null = null;
  @Input() submitting = false;
  @Input() error: string | null = null;

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<EnvironmentName>();

  environment: EnvironmentName | null = null;

  readonly shortSha = shortSha;
  readonly formatAbsolute = formatAbsolute;

  get submitLabel(): string {
    if (this.submitting) {
      return 'Starting…';
    }
    if (!this.environment) {
      return 'Select an environment';
    }
    return `Run in ${this.environment}`;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selection && !this.submitting) {
      this.onCancel();
    }
  }

  onCancel(): void {
    if (!this.submitting) {
      this.cancelled.emit();
    }
  }

  onSubmit(): void {
    if (!this.environment || this.submitting) {
      return;
    }
    this.confirmed.emit(this.environment);
  }

  /** Reset local form state when a new selection opens. */
  @Input()
  set resetToken(value: number | null) {
    if (value != null) {
      this.environment = null;
    }
  }
}

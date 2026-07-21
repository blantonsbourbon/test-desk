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
          <h2 id="run-dialog-title">Confirm execution</h2>
          <button type="button" class="icon-btn" aria-label="Close" (click)="onCancel()">
            ×
          </button>
        </header>

        <div class="dialog__body">
          <p class="muted">
            {{ selection.scenarios.length }}
            scenario{{ selection.scenarios.length === 1 ? '' : 's' }} will run against
            <strong>{{ selection.sourceName }}</strong>.
          </p>

          <div class="pin-card">
            <div class="pin-card__label">Catalog revision</div>
            <div class="mono">{{ shortSha(selection.revision.commit) }}</div>
            <div class="muted small">
              branch <span class="mono">{{ selection.revision.branch }}</span> · synced
              {{ formatAbsolute(selection.revision.syncedAt) }}
            </div>
            <div class="pin-card__note">This run is pinned to this commit</div>
          </div>

          <div class="scenario-list">
            @for (scenario of selection.scenarios; track scenario.id) {
              <div class="scenario-list__item">
                <span>{{ scenario.name }}</span>
                @if (scenario.featureName) {
                  <span class="muted small">{{ scenario.featureName }}</span>
                }
              </div>
            }
          </div>

          <fieldset class="env-fieldset">
            <legend>Environment</legend>
            <label class="env-option">
              <input type="radio" name="environment" value="dev" [(ngModel)]="environment" />
              <span>dev</span>
            </label>
            <label class="env-option">
              <input type="radio" name="environment" value="qa" [(ngModel)]="environment" />
              <span>qa</span>
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
        background: rgba(2, 6, 18, 0.72);
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
        border: 1px solid var(--border-strong);
        border-radius: 0.75rem;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
      }

      .dialog__header,
      .dialog__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-subtle);
      }

      .dialog__footer {
        border-bottom: 0;
        border-top: 1px solid var(--border-subtle);
        justify-content: flex-end;
      }

      .dialog__header h2 {
        margin: 0;
        font-size: 1.05rem;
      }

      .dialog__body {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .pin-card {
        border: 1px solid var(--border-subtle);
        border-radius: 0.5rem;
        padding: 0.85rem 1rem;
        background: var(--surface-2);
      }

      .pin-card__label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        margin-bottom: 0.35rem;
      }

      .pin-card__note {
        margin-top: 0.55rem;
        font-size: 0.8rem;
        color: var(--accent);
        font-weight: 600;
      }

      .scenario-list {
        max-height: 10rem;
        overflow: auto;
        border: 1px solid var(--border-subtle);
        border-radius: 0.5rem;
      }

      .scenario-list__item {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        padding: 0.55rem 0.75rem;
        border-bottom: 1px solid var(--border-subtle);
      }

      .scenario-list__item:last-child {
        border-bottom: 0;
      }

      .env-fieldset {
        border: 0;
        margin: 0;
        padding: 0;
        display: flex;
        gap: 0.75rem;
      }

      .env-fieldset legend {
        margin-bottom: 0.5rem;
        font-size: 0.8rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .env-option {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 0.85rem;
        border: 1px solid var(--border-subtle);
        border-radius: 0.5rem;
        background: var(--surface-2);
        cursor: pointer;
      }

      .env-option:has(input:checked) {
        border-color: var(--accent);
        box-shadow: inset 0 0 0 1px var(--accent);
      }

      .error-banner {
        padding: 0.65rem 0.75rem;
        border-radius: 0.4rem;
        border: 1px solid color-mix(in srgb, var(--danger) 50%, transparent);
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        color: var(--danger);
        font-size: 0.875rem;
      }

      .small {
        font-size: 0.8rem;
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

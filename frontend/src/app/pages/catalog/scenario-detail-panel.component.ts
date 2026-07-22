import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  formatAbsolute,
  formatDuration,
  formatRelative,
  kindLabel,
  shortSha,
} from '../../core/format';
import { ScenarioDetails } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-scenario-detail-panel',
  standalone: true,
  imports: [StatusBadgeComponent, RouterLink],
  template: `
    <div class="overlay" role="presentation" (click)="closed.emit()"></div>
    <aside
      class="drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-detail-title"
    >
      <header class="drawer__header">
        <div>
          <div class="muted small drawer__eyebrow">Scenario detail</div>
          <h2 id="scenario-detail-title">
            {{ detail?.name || (loading ? 'Loading…' : 'Scenario') }}
          </h2>
        </div>
        <button type="button" class="icon-btn" aria-label="Close detail panel" (click)="closed.emit()">
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

      <div class="drawer__body">
        @if (loading) {
          <p class="muted">Loading scenario details…</p>
        } @else if (error) {
          <div class="error-banner" role="alert">{{ error }}</div>
        } @else if (detail) {
          <dl class="meta-grid">
            <div>
              <dt>Feature</dt>
              <dd>{{ detail.featureName }}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{{ kindLabel(detail.kind) }}</dd>
            </div>
            <div class="meta-grid__full">
              <dt>Source</dt>
              <dd class="mono source-path">{{ detail.sourcePath }}:{{ detail.line }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd><app-status-badge [status]="detail.status" /></dd>
            </div>
          </dl>

          @if (detail.tags.length) {
            <div class="tag-row">
              @for (tag of detail.tags; track tag) {
                <span class="chip chip--static">{{ tag }}</span>
              }
            </div>
          }

          <section>
            <h3>Steps</h3>
            <ol class="steps">
              @for (step of detail.steps; track $index) {
                <li>
                  <span class="step-keyword">{{ step.keyword }}</span>
                  <span class="step-text">{{ step.text }}</span>
                </li>
              }
            </ol>
          </section>

          <section>
            <h3>Latest result</h3>
            @if (detail.lastRunAt) {
              <div class="latest panel-inset">
                <div class="latest__row">
                  <app-status-badge [status]="detail.status" />
                  <span class="mono">{{ formatDuration(detail.durationMs) }}</span>
                </div>
                <div class="muted small">
                  Last run {{ formatRelative(detail.lastRunAt) }}
                  ({{ formatAbsolute(detail.lastRunAt) }})
                </div>
              </div>
            } @else {
              <p class="muted empty-hint">This scenario has never been run.</p>
            }
          </section>

          <section>
            <h3>Recent executions</h3>
            @if (!detail.recentExecutions.length) {
              <p class="muted empty-hint">No recent executions.</p>
            } @else {
              <ul class="recent">
                @for (item of detail.recentExecutions; track item.id) {
                  <li>
                    <a [routerLink]="['/executions', item.id]" class="recent__link">
                      <app-status-badge [status]="item.status" />
                      <span class="mono">{{ item.environment }}</span>
                      <span class="mono muted">{{ shortSha(item.revision.commit) }}</span>
                      <span class="muted small recent__time">{{ formatRelative(item.requestedAt) }}</span>
                    </a>
                  </li>
                }
              </ul>
            }
          </section>
        }
      </div>

      <footer class="drawer__footer">
        <button
          type="button"
          class="btn btn--primary drawer__run"
          [disabled]="!detail"
          (click)="run.emit()"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 3.5v9l8-4.5-8-4.5z" fill="currentColor" />
          </svg>
          Run scenario
        </button>
      </footer>
    </aside>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: var(--overlay);
        z-index: 35;
      }

      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 40;
        width: min(28rem, 100vw);
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--surface-1);
        border-left: 1px solid var(--border-subtle);
        box-shadow: var(--shadow-drawer);
      }

      .drawer__header,
      .drawer__footer {
        padding: 1rem 1.15rem;
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .drawer__footer {
        border-bottom: 0;
        border-top: 1px solid var(--border-subtle);
        margin-top: auto;
      }

      .drawer__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.72rem;
      }

      .drawer__header h2 {
        margin: 0.25rem 0 0;
        font-size: 1.08rem;
        letter-spacing: -0.01em;
        line-height: 1.3;
      }

      .drawer__body {
        padding: 1.15rem;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
        margin: 0;
      }

      .meta-grid__full {
        grid-column: 1 / -1;
      }

      .meta-grid dt {
        color: var(--text-muted);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .meta-grid dd {
        margin: 0.25rem 0 0;
      }

      .source-path {
        word-break: break-all;
        font-size: 0.85rem;
        color: var(--text-muted);
      }

      h3 {
        margin: 0 0 0.55rem;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        font-weight: 600;
      }

      .steps {
        margin: 0;
        padding: 0;
        list-style: none;
        border: 1px solid var(--border-subtle);
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--surface-2);
      }

      .steps li {
        display: grid;
        grid-template-columns: 4.25rem 1fr;
        gap: 0.5rem;
        padding: 0.55rem 0.75rem;
        border-top: 1px solid var(--border-subtle);
        font-size: 0.9rem;
      }

      .steps li:first-child {
        border-top: 0;
      }

      .step-keyword {
        font-weight: 700;
        color: var(--info);
        font-family: var(--font-mono);
        font-size: 0.78rem;
        padding-top: 0.1rem;
      }

      .step-text {
        color: var(--text);
        line-height: 1.4;
      }

      .panel-inset {
        border: 1px solid var(--border-subtle);
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: var(--surface-2);
      }

      .latest__row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-bottom: 0.35rem;
      }

      .empty-hint {
        margin: 0;
        font-size: 0.9rem;
      }

      .recent {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .recent__link {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.65rem;
        border: 1px solid var(--border-subtle);
        border-radius: 0.45rem;
        text-decoration: none;
        color: inherit;
        background: var(--surface-2);
        transition: border-color 0.12s ease;
      }

      .recent__link:hover {
        border-color: var(--border-strong);
        background: var(--surface-1);
      }

      .recent__time {
        margin-left: auto;
      }

      .tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .drawer__run {
        width: 100%;
      }

      .drawer__run svg {
        width: 0.85rem;
        height: 0.85rem;
      }

      .small {
        font-size: 0.8rem;
      }

      @media (prefers-reduced-motion: no-preference) {
        .drawer {
          animation: slide-in 0.16s ease-out;
        }
      }

      @keyframes slide-in {
        from {
          transform: translateX(0.75rem);
          opacity: 0.65;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ScenarioDetailPanelComponent {
  @Input() detail: ScenarioDetails | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() run = new EventEmitter<void>();

  readonly kindLabel = kindLabel;
  readonly formatDuration = formatDuration;
  readonly formatRelative = formatRelative;
  readonly formatAbsolute = formatAbsolute;
  readonly shortSha = shortSha;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}

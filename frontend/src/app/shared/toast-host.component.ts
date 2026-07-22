import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="toast-host" aria-live="polite" aria-relevant="additions">
      @for (toast of toastService.toasts$ | async; track toast.id) {
        <div class="toast" [attr.data-kind]="toast.kind" role="status">
          <span class="toast__bar" aria-hidden="true"></span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            type="button"
            class="toast__close"
            [attr.aria-label]="'Dismiss notification'"
            (click)="toastService.dismiss(toast.id)"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-host {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: min(24rem, calc(100vw - 2rem));
      }

      .toast {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        padding: 0.8rem 0.85rem 0.8rem 0.7rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        background: var(--surface-1);
        box-shadow: var(--shadow-toast);
        color: var(--text);
        font-size: 0.875rem;
        overflow: hidden;
      }

      .toast__bar {
        width: 3px;
        align-self: stretch;
        border-radius: 999px;
        background: var(--border-strong);
        flex-shrink: 0;
      }

      .toast__message {
        flex: 1;
        min-width: 0;
        line-height: 1.4;
        padding-top: 0.05rem;
      }

      .toast[data-kind='success'] {
        border-color: color-mix(in srgb, var(--success) 28%, var(--border-subtle));
        background: var(--success-bg);
      }

      .toast[data-kind='success'] .toast__bar {
        background: var(--success);
      }

      .toast[data-kind='error'] {
        border-color: color-mix(in srgb, var(--danger) 30%, var(--border-subtle));
        background: var(--danger-bg);
      }

      .toast[data-kind='error'] .toast__bar {
        background: var(--danger);
      }

      .toast[data-kind='info'] {
        border-color: color-mix(in srgb, var(--info) 28%, var(--border-subtle));
        background: var(--info-bg);
      }

      .toast[data-kind='info'] .toast__bar {
        background: var(--info);
      }

      .toast__close {
        border: 0;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        line-height: 1;
        padding: 0.15rem;
        border-radius: 0.3rem;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .toast__close:hover {
        color: var(--text);
        background: color-mix(in srgb, var(--surface-2) 80%, transparent);
      }

      .toast__close svg {
        width: 0.85rem;
        height: 0.85rem;
      }

      @media (prefers-reduced-motion: no-preference) {
        .toast {
          animation: toast-in 0.16s ease-out;
        }
      }

      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(0.4rem);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
}

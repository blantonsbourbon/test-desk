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
          <span>{{ toast.message }}</span>
          <button
            type="button"
            class="toast__close"
            [attr.aria-label]="'Dismiss notification'"
            (click)="toastService.dismiss(toast.id)"
          >
            ×
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
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 0.9rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border-strong);
        background: var(--surface-2);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        color: var(--text);
        font-size: 0.875rem;
      }

      .toast[data-kind='success'] {
        border-color: color-mix(in srgb, var(--success) 45%, transparent);
      }

      .toast[data-kind='error'] {
        border-color: color-mix(in srgb, var(--danger) 55%, transparent);
      }

      .toast[data-kind='info'] {
        border-color: color-mix(in srgb, var(--accent) 45%, transparent);
      }

      .toast__close {
        border: 0;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1.1rem;
        line-height: 1;
        padding: 0;
      }
    `,
  ],
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
}

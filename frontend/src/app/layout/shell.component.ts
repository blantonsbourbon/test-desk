import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastHostComponent } from '../shared/toast-host.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHostComponent],
  template: `
    <div class="shell" [class.shell--nav-open]="navOpen">
      <aside class="sidebar" [attr.aria-hidden]="!navOpen && isMobile ? 'true' : null">
        <div class="brand">
          <div class="brand__mark" aria-hidden="true">TC</div>
          <div>
            <div class="brand__title">Test Control Plane</div>
            <div class="brand__sub">BDD catalog console</div>
          </div>
        </div>

        <nav class="nav" aria-label="Primary">
          <a
            routerLink="/catalog"
            routerLinkActive="nav__link--active"
            class="nav__link"
            (click)="closeNav()"
          >
            <span class="nav__icon" aria-hidden="true">☰</span>
            Catalog
          </a>
          <a
            routerLink="/executions"
            routerLinkActive="nav__link--active"
            class="nav__link"
            (click)="closeNav()"
          >
            <span class="nav__icon" aria-hidden="true">◷</span>
            Executions
          </a>
          <a
            routerLink="/sources"
            routerLinkActive="nav__link--active"
            class="nav__link"
            (click)="closeNav()"
          >
            <span class="nav__icon" aria-hidden="true">⬡</span>
            Sources
          </a>
        </nav>

        <div class="sidebar__footer muted small">
          Git is the source of truth.<br />
          Catalog is read-only.
        </div>
      </aside>

      @if (navOpen) {
        <div class="nav-backdrop" (click)="closeNav()" aria-hidden="true"></div>
      }

      <div class="main-column">
        <header class="topbar">
          <button
            type="button"
            class="icon-btn topbar__menu"
            aria-label="Open navigation"
            (click)="navOpen = true"
          >
            ☰
          </button>
          <div class="topbar__title">Control room</div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast-host />
  `,
  styles: [
    `
      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 16rem 1fr;
        background: var(--bg);
      }

      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.25rem 1rem;
        border-right: 1px solid var(--border-subtle);
        background: linear-gradient(180deg, #0b1224 0%, #0a1020 100%);
        z-index: 30;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.25rem 0.35rem;
      }

      .brand__mark {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.5rem;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 0.8rem;
        color: #041018;
        background: linear-gradient(135deg, var(--accent), #4fd1c5);
      }

      .brand__title {
        font-weight: 700;
        font-size: 0.95rem;
      }

      .brand__sub {
        color: var(--text-muted);
        font-size: 0.75rem;
      }

      .nav {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .nav__link {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.65rem 0.75rem;
        border-radius: 0.5rem;
        color: var(--text-muted);
        text-decoration: none;
        border: 1px solid transparent;
      }

      .nav__link:hover {
        color: var(--text);
        background: var(--surface-2);
      }

      .nav__link--active {
        color: var(--text);
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        border-color: color-mix(in srgb, var(--accent) 35%, transparent);
      }

      .nav__icon {
        width: 1rem;
        text-align: center;
        opacity: 0.85;
      }

      .sidebar__footer {
        margin-top: auto;
        padding: 0.5rem 0.35rem;
        line-height: 1.45;
      }

      .main-column {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .topbar {
        display: none;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-subtle);
        background: color-mix(in srgb, var(--bg) 90%, #000);
        position: sticky;
        top: 0;
        z-index: 20;
      }

      .topbar__title {
        font-weight: 600;
        font-size: 0.95rem;
      }

      .content {
        width: min(1440px, 100%);
        margin: 0 auto;
        padding: 1.5rem 1.25rem 3rem;
      }

      .nav-backdrop {
        display: none;
      }

      .small {
        font-size: 0.78rem;
      }

      @media (max-width: 900px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: min(18rem, 86vw);
          transform: translateX(-105%);
          transition: transform 0.18s ease;
        }

        .shell--nav-open .sidebar {
          transform: translateX(0);
        }

        .topbar {
          display: flex;
        }

        .nav-backdrop {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 18, 0.55);
          z-index: 25;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .sidebar {
          transition: none;
        }
      }
    `,
  ],
})
export class ShellComponent {
  navOpen = false;
  isMobile = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.matchMedia('(max-width: 900px)').matches;
    }
  }

  closeNav(): void {
    this.navOpen = false;
  }
}

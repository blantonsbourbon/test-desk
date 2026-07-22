import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
          <div class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 7.5h14M5 12h10M5 16.5h12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
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
            <span class="nav__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M2.5 3.5h11M2.5 8h11M2.5 12.5h7"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            Catalog
          </a>
          <a
            routerLink="/executions"
            routerLinkActive="nav__link--active"
            class="nav__link"
            (click)="closeNav()"
          >
            <span class="nav__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.25" stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M8 5.25V8l2 1.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            Executions
          </a>
          <a
            routerLink="/sources"
            routerLinkActive="nav__link--active"
            class="nav__link"
            (click)="closeNav()"
          >
            <span class="nav__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 4.5h10v7H3z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M5.5 2.75h5M6.5 11.5v1.75M9.5 11.5v1.75"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            Sources
          </a>
        </nav>

        <div class="sidebar__footer muted small">
          <div class="sidebar__truth">Git is the source of truth.</div>
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
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2.5 4h11M2.5 8h11M2.5 12h11"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
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
        grid-template-columns: var(--sidebar-w) 1fr;
        background: transparent;
      }

      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.25rem 0.9rem;
        border-right: 1px solid var(--border-subtle);
        background: linear-gradient(180deg, var(--bg-elevated) 0%, #080e1a 100%);
        z-index: 30;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.35rem 0.45rem;
      }

      .brand__mark {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.5rem;
        display: grid;
        place-items: center;
        color: #041018;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
        flex-shrink: 0;
      }

      .brand__mark svg {
        width: 1.15rem;
        height: 1.15rem;
      }

      .brand__title {
        font-weight: 700;
        font-size: 0.95rem;
        letter-spacing: -0.01em;
      }

      .brand__sub {
        color: var(--text-muted);
        font-size: 0.75rem;
      }

      .nav {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }

      .nav__link {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.65rem 0.75rem;
        border-radius: 0.5rem;
        color: var(--text-muted);
        text-decoration: none;
        border: 1px solid transparent;
        transition:
          color 0.12s ease,
          background 0.12s ease,
          border-color 0.12s ease;
      }

      .nav__link:hover {
        color: var(--text);
        background: color-mix(in srgb, var(--surface-2) 80%, transparent);
      }

      .nav__link--active {
        color: var(--text);
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        border-color: color-mix(in srgb, var(--accent) 30%, transparent);
      }

      .nav__link--active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.45rem;
        bottom: 0.45rem;
        width: 3px;
        border-radius: 999px;
        background: var(--accent);
      }

      .nav__icon {
        width: 1.1rem;
        height: 1.1rem;
        display: grid;
        place-items: center;
        opacity: 0.9;
        flex-shrink: 0;
      }

      .nav__icon svg {
        width: 1rem;
        height: 1rem;
      }

      .sidebar__footer {
        margin-top: auto;
        padding: 0.65rem 0.55rem;
        line-height: 1.45;
        border-top: 1px solid var(--border-subtle);
      }

      .sidebar__truth {
        color: var(--text-muted);
        margin-bottom: 0.15rem;
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
        background: color-mix(in srgb, var(--bg) 92%, #000);
        position: sticky;
        top: 0;
        z-index: 20;
        backdrop-filter: blur(8px);
      }

      .topbar__title {
        font-weight: 600;
        font-size: 0.95rem;
      }

      .content {
        width: min(var(--content-max), 100%);
        margin: 0 auto;
        padding: 1.5rem 1.25rem 3rem;
      }

      .nav-backdrop {
        display: none;
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
          box-shadow: var(--shadow-drawer);
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
          background: var(--overlay);
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
export class ShellComponent implements OnInit, OnDestroy {
  navOpen = false;
  isMobile = false;

  private media?: MediaQueryList;
  private onMediaChange = (e: MediaQueryListEvent) => {
    this.isMobile = e.matches;
    if (!e.matches) {
      this.navOpen = false;
    }
  };

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.media = window.matchMedia('(max-width: 900px)');
    this.isMobile = this.media.matches;
    this.media.addEventListener('change', this.onMediaChange);
  }

  ngOnDestroy(): void {
    this.media?.removeEventListener('change', this.onMediaChange);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.navOpen) {
      this.closeNav();
    }
  }

  closeNav(): void {
    this.navOpen = false;
  }
}

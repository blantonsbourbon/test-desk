import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClientError, ApiService } from '../../core/api.service';
import {
  formatAbsolute,
  formatRelative,
  shortSha,
} from '../../core/format';
import { Source } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-sources-page',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './sources.page.html',
  styleUrl: './sources.page.scss',
})
export class SourcesPage implements OnInit {
  private readonly api = inject(ApiService);

  sources: Source[] = [];
  selected: Source | null = null;
  loading = true;
  error: string | null = null;

  readonly shortSha = shortSha;
  readonly formatRelative = formatRelative;
  readonly formatAbsolute = formatAbsolute;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.listSources().subscribe({
      next: (res) => {
        this.sources = res.items;
        if (this.selected) {
          this.selected = res.items.find((s) => s.id === this.selected?.id) ?? null;
        }
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = err instanceof ApiClientError ? err.message : 'Failed to load sources';
      },
    });
  }

  open(source: Source): void {
    this.selected = source;
  }

  close(): void {
    this.selected = null;
  }

  truncateRepo(repo: string): string {
    if (repo.length <= 42) {
      return repo;
    }
    return `${repo.slice(0, 18)}…${repo.slice(-18)}`;
  }
}

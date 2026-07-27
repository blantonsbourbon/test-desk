import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';
import { ApiClientError, ApiService } from '../../core/api.service';
import {
  CatalogEntryDetails,
  CatalogEntrySummary,
  CatalogResponse,
  CatalogStatusFilter,
  EnvironmentName,
  RunSelection,
  Source,
  TestGroup,
} from '../../core/models';
import {
  formatAbsolute,
  formatDuration,
  formatRelative,
  kindLabel,
  passRateLabel,
  shortSha,
} from '../../core/format';
import { ToastService } from '../../core/toast.service';
import { RunDialogComponent } from '../../shared/run-dialog.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { CatalogEntryDetailPanelComponent } from './scenario-detail-panel.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, RunDialogComponent, CatalogEntryDetailPanelComponent],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
})
export class CatalogPage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  sources: Source[] = [];
  selectedSourceId = '';
  catalog: CatalogResponse | null = null;

  query = '';
  statusFilter: CatalogStatusFilter = '';
  selectedTags: string[] = [];
  collapsedGroups = new Set<string>();
  selectedEntryIds = new Set<string>();

  detail: CatalogEntryDetails | null = null;
  detailLoading = false;
  detailError: string | null = null;

  runSelection: RunSelection | null = null;
  runResetToken = 0;
  runSubmitting = false;
  runError: string | null = null;

  loading = true;
  error: string | null = null;
  syncing = false;
  syncError: string | null = null;

  private syncPollSub: Subscription | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private loadSeq = 0;
  private detailSeq = 0;

  readonly kindLabel = kindLabel;
  readonly shortSha = shortSha;
  readonly formatRelative = formatRelative;
  readonly formatAbsolute = formatAbsolute;
  readonly formatDuration = formatDuration;
  readonly passRateLabel = passRateLabel;

  ngOnInit(): void {
    this.bootstrap();
  }

  ngOnDestroy(): void {
    this.syncPollSub?.unsubscribe();
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  get availableTags(): string[] {
    if (!this.catalog) {
      return [];
    }
    const tags = new Set<string>();
    for (const group of this.catalog.groups) {
      for (const tag of group.tags) {
        tags.add(tag);
      }
      for (const entry of group.entries) {
        for (const tag of entry.tags) {
          tags.add(tag);
        }
      }
    }
    return [...tags].sort((a, b) => a.localeCompare(b));
  }

  get hasFilters(): boolean {
    return !!this.query || !!this.statusFilter || this.selectedTags.length > 0;
  }

  get selectedCount(): number {
    return this.selectedEntryIds.size;
  }

  get emptyBecauseFilters(): boolean {
    return !!this.catalog && this.catalog.groups.length === 0 && this.hasFilters;
  }

  bootstrap(): void {
    this.loading = true;
    this.error = null;
    const preferredSourceId = this.route.snapshot.queryParamMap.get('sourceId') ?? '';
    this.api.listSources().subscribe({
      next: (res) => {
        this.sources = res.items;
        if (preferredSourceId && res.items.some((source) => source.id === preferredSourceId)) {
          this.selectedSourceId = preferredSourceId;
        } else if (!this.selectedSourceId && res.items.length) {
          this.selectedSourceId = res.items[0].id;
        }
        if (this.selectedSourceId) {
          this.loadCatalog();
        } else {
          this.loading = false;
          this.error = 'No test sources are configured yet.';
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.messageOf(err);
      },
    });
  }

  onSourceChange(): void {
    this.syncPollSub?.unsubscribe();
    this.selectedEntryIds.clear();
    this.detail = null;
    this.clearFilters(false);
    this.loadCatalog();
  }

  onQueryInput(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadCatalog(), 220);
  }

  onStatusChange(): void {
    this.loadCatalog();
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter((value) => value !== tag);
    } else {
      this.selectedTags = [...this.selectedTags, tag];
    }
    this.loadCatalog();
  }

  clearFilters(reload = true): void {
    this.query = '';
    this.statusFilter = '';
    this.selectedTags = [];
    if (reload) {
      this.loadCatalog();
    }
  }

  loadCatalog(): void {
    if (!this.selectedSourceId) {
      return;
    }
    const seq = ++this.loadSeq;
    this.loading = true;
    this.error = null;
    this.api
      .getCatalog(this.selectedSourceId, {
        q: this.query.trim() || undefined,
        status: this.statusFilter || undefined,
        tags: this.selectedTags,
      })
      .subscribe({
        next: (catalog) => {
          if (seq !== this.loadSeq) {
            return;
          }
          this.catalog = catalog;
          this.loading = false;
          const visible = new Set(catalog.groups.flatMap((group) => group.entries.map((entry) => entry.id)));
          for (const id of [...this.selectedEntryIds]) {
            if (!visible.has(id)) {
              this.selectedEntryIds.delete(id);
            }
          }
        },
        error: (err: unknown) => {
          if (seq !== this.loadSeq) {
            return;
          }
          this.loading = false;
          this.error = this.messageOf(err);
        },
      });
  }

  syncSource(): void {
    if (!this.selectedSourceId || this.syncing) {
      return;
    }
    this.syncing = true;
    this.syncError = null;
    this.api.syncSource(this.selectedSourceId).subscribe({
      next: (source) => {
        this.patchSource(source);
        this.pollSync(source.id);
      },
      error: (err: unknown) => {
        this.syncing = false;
        this.syncError = this.messageOf(err);
        this.toast.error(this.syncError);
      },
    });
  }

  private pollSync(sourceId: string): void {
    this.syncPollSub?.unsubscribe();
    this.syncPollSub = interval(1200)
      .pipe(
        switchMap(() => this.api.getSource(sourceId)),
        takeWhile((source) => source.syncStatus === 'SYNCING', true),
      )
      .subscribe({
        next: (source) => {
          this.patchSource(source);
          if (source.syncStatus === 'SYNCING') {
            return;
          }
          this.syncing = false;
          if (source.syncStatus === 'ERROR') {
            this.syncError = source.syncError || 'Source sync failed';
            this.toast.error(this.syncError);
          } else {
            this.toast.success('Source synced');
            this.loadCatalog();
          }
        },
        error: (err: unknown) => {
          this.syncing = false;
          this.syncError = this.messageOf(err);
          this.toast.error(this.syncError);
        },
      });
  }

  private patchSource(source: Source): void {
    this.sources = this.sources.map((item) => (item.id === source.id ? source : item));
    if (this.catalog && this.catalog.source.id === source.id) {
      this.catalog = { ...this.catalog, source };
    }
  }

  toggleGroup(groupId: string): void {
    if (this.collapsedGroups.has(groupId)) {
      this.collapsedGroups.delete(groupId);
    } else {
      this.collapsedGroups.add(groupId);
    }
  }

  isCollapsed(groupId: string): boolean {
    return this.collapsedGroups.has(groupId);
  }

  toggleEntry(id: string, checked: boolean): void {
    if (checked) {
      this.selectedEntryIds.add(id);
    } else {
      this.selectedEntryIds.delete(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedEntryIds.has(id);
  }

  openDetail(entry: CatalogEntrySummary): void {
    const seq = ++this.detailSeq;
    this.detailLoading = true;
    this.detailError = null;
    this.detail = null;
    this.api.getEntry(entry.id).subscribe({
      next: (details) => {
        if (seq !== this.detailSeq) {
          return;
        }
        this.detail = details;
        this.detailLoading = false;
      },
      error: (err: unknown) => {
        if (seq !== this.detailSeq) {
          return;
        }
        this.detailLoading = false;
        this.detailError = this.messageOf(err);
      },
    });
  }

  closeDetail(): void {
    this.detailSeq++;
    this.detail = null;
    this.detailError = null;
    this.detailLoading = false;
  }

  openRunForGroup(group: TestGroup, event: Event): void {
    event.stopPropagation();
    this.openRun(group.entries.map((entry) => ({ id: entry.id, name: entry.name, groupName: group.name })));
  }

  openRunForEntry(entry: CatalogEntrySummary, group: TestGroup, event?: Event): void {
    event?.stopPropagation();
    this.openRun([{ id: entry.id, name: entry.name, groupName: group.name }]);
  }

  openRunSelected(): void {
    if (!this.catalog || this.selectedEntryIds.size === 0) {
      return;
    }
    const entries: RunSelection['entries'] = [];
    for (const group of this.catalog.groups) {
      for (const entry of group.entries) {
        if (this.selectedEntryIds.has(entry.id)) {
          entries.push({ id: entry.id, name: entry.name, groupName: group.name });
        }
      }
    }
    this.openRun(entries);
  }

  openRunFromDetail(): void {
    if (!this.detail) {
      return;
    }
    this.openRun([{ id: this.detail.id, name: this.detail.name, groupName: this.detail.groupName }]);
  }

  private openRun(entries: RunSelection['entries']): void {
    if (!this.catalog || !this.catalog.revision) {
      this.runError = 'This catalog has no available revision to execute.';
      return;
    }
    this.runSelection = {
      sourceId: this.catalog.source.id,
      sourceName: this.catalog.source.name,
      revision: this.catalog.revision,
      entries,
    };
    this.runError = null;
    this.runSubmitting = false;
    this.runResetToken++;
  }

  cancelRun(): void {
    if (this.runSubmitting) {
      return;
    }
    this.runSelection = null;
    this.runError = null;
  }

  confirmRun(environment: EnvironmentName): void {
    if (!this.runSelection) {
      return;
    }
    this.runSubmitting = true;
    this.runError = null;
    this.api
      .createExecution({
        sourceId: this.runSelection.sourceId,
        entryIds: this.runSelection.entries.map((entry) => entry.id),
        environment,
        revisionCommit: this.runSelection.revision.commit,
        origin: 'ui',
      })
      .subscribe({
        next: (execution) => {
          this.runSubmitting = false;
          this.runSelection = null;
          this.toast.success(`Execution ${execution.id} started in ${environment}`);
          void this.router.navigate(['/executions', execution.id]);
        },
        error: (err: unknown) => {
          this.runSubmitting = false;
          this.runError = this.messageOf(err);
        },
      });
  }

  private messageOf(err: unknown): string {
    if (err instanceof ApiClientError) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Something went wrong';
  }
}

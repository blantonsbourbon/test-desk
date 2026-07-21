import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';
import { ApiClientError, ApiService } from '../../core/api.service';
import {
  formatAbsolute,
  formatDuration,
  formatRelative,
  kindLabel,
  passRateLabel,
  shortSha,
} from '../../core/format';
import {
  CatalogResponse,
  CatalogStatusFilter,
  EnvironmentName,
  Feature,
  RunSelection,
  ScenarioDetails,
  ScenarioSummary,
  Source,
} from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { RunDialogComponent } from '../../shared/run-dialog.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ScenarioDetailPanelComponent } from './scenario-detail-panel.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    FormsModule,
    StatusBadgeComponent,
    RunDialogComponent,
    ScenarioDetailPanelComponent,
  ],
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
  collapsedFeatures = new Set<string>();
  selectedScenarioIds = new Set<string>();

  detail: ScenarioDetails | null = null;
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
    for (const feature of this.catalog.features) {
      for (const tag of feature.tags) {
        tags.add(tag);
      }
      for (const scenario of feature.scenarios) {
        for (const tag of scenario.tags) {
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
    return this.selectedScenarioIds.size;
  }

  get emptyBecauseFilters(): boolean {
    return !!this.catalog && this.catalog.features.length === 0 && this.hasFilters;
  }

  bootstrap(): void {
    this.loading = true;
    this.error = null;
    const preferredSourceId = this.route.snapshot.queryParamMap.get('sourceId') ?? '';
    this.api.listSources().subscribe({
      next: (res) => {
        this.sources = res.items;
        if (preferredSourceId && res.items.some((s) => s.id === preferredSourceId)) {
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
    this.selectedScenarioIds.clear();
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
      this.selectedTags = this.selectedTags.filter((t) => t !== tag);
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
          // Drop selections that no longer appear in the filtered list
          const visible = new Set(
            catalog.features.flatMap((f) => f.scenarios.map((s) => s.id)),
          );
          for (const id of [...this.selectedScenarioIds]) {
            if (!visible.has(id)) {
              this.selectedScenarioIds.delete(id);
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
    this.sources = this.sources.map((s) => (s.id === source.id ? source : s));
    if (this.catalog && this.catalog.source.id === source.id) {
      this.catalog = { ...this.catalog, source };
    }
  }

  toggleFeature(featureId: string): void {
    if (this.collapsedFeatures.has(featureId)) {
      this.collapsedFeatures.delete(featureId);
    } else {
      this.collapsedFeatures.add(featureId);
    }
  }

  isCollapsed(featureId: string): boolean {
    return this.collapsedFeatures.has(featureId);
  }

  toggleScenario(id: string, checked: boolean): void {
    if (checked) {
      this.selectedScenarioIds.add(id);
    } else {
      this.selectedScenarioIds.delete(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedScenarioIds.has(id);
  }

  openDetail(scenario: ScenarioSummary): void {
    this.detailLoading = true;
    this.detailError = null;
    this.detail = null;
    this.api.getScenario(scenario.id).subscribe({
      next: (details) => {
        this.detail = details;
        this.detailLoading = false;
      },
      error: (err: unknown) => {
        this.detailLoading = false;
        this.detailError = this.messageOf(err);
      },
    });
  }

  closeDetail(): void {
    this.detail = null;
    this.detailError = null;
    this.detailLoading = false;
  }

  openRunForFeature(feature: Feature, event: Event): void {
    event.stopPropagation();
    if (!this.catalog) {
      return;
    }
    this.openRun(
      feature.scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        featureName: feature.name,
      })),
    );
  }

  openRunForScenario(scenario: ScenarioSummary, feature: Feature, event?: Event): void {
    event?.stopPropagation();
    this.openRun([
      {
        id: scenario.id,
        name: scenario.name,
        featureName: feature.name,
      },
    ]);
  }

  openRunSelected(): void {
    if (!this.catalog || this.selectedScenarioIds.size === 0) {
      return;
    }
    const scenarios: RunSelection['scenarios'] = [];
    for (const feature of this.catalog.features) {
      for (const scenario of feature.scenarios) {
        if (this.selectedScenarioIds.has(scenario.id)) {
          scenarios.push({
            id: scenario.id,
            name: scenario.name,
            featureName: feature.name,
          });
        }
      }
    }
    this.openRun(scenarios);
  }

  openRunFromDetail(): void {
    if (!this.detail || !this.catalog) {
      return;
    }
    this.openRun([
      {
        id: this.detail.id,
        name: this.detail.name,
        featureName: this.detail.featureName,
      },
    ]);
  }

  private openRun(scenarios: RunSelection['scenarios']): void {
    if (!this.catalog) {
      return;
    }
    this.runSelection = {
      sourceId: this.catalog.source.id,
      sourceName: this.catalog.source.name,
      revision: this.catalog.revision,
      scenarios,
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
        scenarioIds: this.runSelection.scenarios.map((s) => s.id),
        environment,
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

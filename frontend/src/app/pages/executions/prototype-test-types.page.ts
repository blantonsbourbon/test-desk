// PROTOTYPE — Interactive type-workspace preview (mock only).
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast.service';
import {
  APPLICATION_RUN,
  APPLICATION_COMPLETED_AT,
  APPLICATION_STARTED_AT,
  APPLICATION_TRIGGER,
  APP_NAME,
  BASELINE_REVISION,
  BASELINE_RUN,
  BASELINE_SOURCE_RUN_IDS,
  CANDIDATE_SOURCE_RUN_IDS,
  COMPARISON_COMPLETED_AT,
  COMPARISON_STARTED_AT,
  COMPATIBILITY_FINGERPRINT,
  ExecutionLifecycle,
  INTEGRATION_RESULTS,
  INTEGRATION_SOURCE_RUNS,
  IngestionState,
  IntegrationRow,
  PrototypeTestType,
  PrototypeStatus,
  REGRESSION_RESULTS,
  REVISION,
  RegressionRow,
  SourceRunOption,
  TYPE_SUMMARIES,
  TestRunState,
  TestOutcome,
  UI_SOURCE_RUNS,
  UI_STEPS,
  UiStepRow,
  defaultSelectedType,
  summaryFor,
} from './prototype-test-types.data';

type RegressionFilter = 'attention' | 'all';

@Component({
  selector: 'app-prototype-type-workspaces',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './prototype-type-workspaces.variant.html',
})
export class PrototypeTypeWorkspacesVariant {
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly applicationRun = APPLICATION_RUN;
  readonly applicationTrigger = APPLICATION_TRIGGER;
  readonly applicationStartedAt = APPLICATION_STARTED_AT;
  readonly applicationCompletedAt = APPLICATION_COMPLETED_AT;
  readonly appName = APP_NAME;
  readonly baselineRun = BASELINE_RUN;
  readonly baselineRevision = BASELINE_REVISION;
  readonly baselineSourceRunIds = BASELINE_SOURCE_RUN_IDS;
  readonly candidateSourceRunIds = CANDIDATE_SOURCE_RUN_IDS;
  readonly comparisonStartedAt = COMPARISON_STARTED_AT;
  readonly comparisonCompletedAt = COMPARISON_COMPLETED_AT;
  readonly compatibilityFingerprint = COMPATIBILITY_FINGERPRINT;
  readonly revision = REVISION;
  readonly summaries = TYPE_SUMMARIES;
  readonly uiSourceRuns = UI_SOURCE_RUNS;
  readonly integrationSourceRuns = INTEGRATION_SOURCE_RUNS;
  readonly uiSteps = UI_STEPS;
  readonly integrationResults = INTEGRATION_RESULTS;
  readonly regressionResults = REGRESSION_RESULTS;
  readonly typeOrder: PrototypeTestType[] = TYPE_SUMMARIES.map((summary) => summary.type);

  selectedType: PrototypeTestType = defaultSelectedType();
  selectedUiSourceRunId = UI_SOURCE_RUNS[0]?.id ?? '';
  selectedIntegrationSourceRunId = INTEGRATION_SOURCE_RUNS[0]?.id ?? '';
  selectedUiStepId = '';
  selectedIntegrationId = '';
  selectedRegressionId = this.firstFailedId(REGRESSION_RESULTS) ?? REGRESSION_RESULTS[0]?.id ?? '';
  regressionFilter: RegressionFilter = 'attention';

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    this.selectedType = this.parseType(params.get('type')) ?? this.selectedType;
    const runKey = params.get('run');
    const uiRun = UI_SOURCE_RUNS.find((run) => run.runId === runKey);
    if (this.selectedType === 'UI' && uiRun) {
      this.selectedUiSourceRunId = uiRun.id;
    }
    const integrationRun = INTEGRATION_SOURCE_RUNS.find((run) => run.runId === runKey);
    if (this.selectedType === 'INTEGRATION' && integrationRun) {
      this.selectedIntegrationSourceRunId = integrationRun.id;
    }
    this.regressionFilter = params.get('filter') === 'all' ? 'all' : 'attention';
    this.resetVisibleEntry(params.get('entry'));
  }

  get selectedSummary() {
    return summaryFor(this.selectedType);
  }

  get selectedSourceRun(): SourceRunOption | undefined {
    if (this.selectedType === 'UI') {
      return this.uiSourceRuns.find((run) => run.id === this.selectedUiSourceRunId);
    }
    if (this.selectedType === 'INTEGRATION') {
      return this.integrationSourceRuns.find((run) => run.id === this.selectedIntegrationSourceRunId);
    }
    return undefined;
  }

  get selectedRunState(): TestRunState {
    return this.selectedSourceRun ?? this.selectedSummary;
  }

  get visibleUiSteps(): UiStepRow[] {
    return this.uiSteps.filter((step) => step.runKey === this.selectedUiSourceRunId);
  }

  get visibleIntegrationResults(): IntegrationRow[] {
    return this.integrationResults.filter(
      (result) => result.runKey === this.selectedIntegrationSourceRunId,
    );
  }

  get selectedUiStep(): UiStepRow | undefined {
    return this.visibleUiSteps.find((step) => step.id === this.selectedUiStepId)
      ?? this.visibleUiSteps[0];
  }

  get selectedIntegration(): IntegrationRow | undefined {
    return this.visibleIntegrationResults.find((result) => result.id === this.selectedIntegrationId)
      ?? this.visibleIntegrationResults[0];
  }

  get visibleRegressionResults(): RegressionRow[] {
    if (this.regressionFilter === 'all') {
      return this.regressionResults;
    }
    return this.regressionResults.filter((result) => result.delta === 'NEW' || result.delta === 'KNOWN');
  }

  get selectedRegression(): RegressionRow | undefined {
    return this.visibleRegressionResults.find((result) => result.id === this.selectedRegressionId)
      ?? this.visibleRegressionResults[0];
  }

  get attentionCount(): number {
    return this.summaries.filter((summary) => summary.attentionCount > 0).length;
  }

  selectType(type: PrototypeTestType): void {
    this.selectedType = type;
    this.resetVisibleEntry();
    this.syncUrl();
  }

  selectUiSourceRun(id: string): void {
    this.selectedUiSourceRunId = id;
    this.resetVisibleEntry();
    this.syncUrl();
  }

  selectIntegrationSourceRun(id: string): void {
    this.selectedIntegrationSourceRunId = id;
    this.resetVisibleEntry();
    this.syncUrl();
  }

  selectUiStep(id: string): void {
    this.selectedUiStepId = id;
    this.syncUrl();
  }

  selectIntegration(id: string): void {
    this.selectedIntegrationId = id;
    this.syncUrl();
  }

  selectRegression(id: string): void {
    this.selectedRegressionId = id;
    this.syncUrl();
  }

  setRegressionFilter(filter: RegressionFilter): void {
    this.regressionFilter = filter;
    this.resetVisibleEntry(this.selectedRegressionId);
    this.syncUrl();
  }

  onTypeListKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const index = this.typeOrder.indexOf(this.selectedType);
    const nextIndex =
      event.key === 'Home' ? 0
      : event.key === 'End' ? this.typeOrder.length - 1
      : event.key === 'ArrowDown' ? Math.min(this.typeOrder.length - 1, index + 1)
      : Math.max(0, index - 1);
    this.selectType(this.typeOrder[nextIndex]);
    queueMicrotask(() => document.getElementById(this.tabId(this.selectedType))?.focus());
  }

  tabId(type: PrototypeTestType): string {
    return `proto-tab-${type.toLowerCase()}`;
  }

  panelId(type: PrototypeTestType): string {
    return `proto-panel-${type.toLowerCase()}`;
  }

  statusLabel(status: PrototypeStatus | ExecutionLifecycle | TestOutcome | IngestionState): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  mockAction(label: string): void {
    this.toast.info(`Prototype mock — ${label}. No Jenkins job triggered.`);
  }

  investigateWorst(): void {
    const worst = defaultSelectedType();
    this.selectType(worst);
    this.toast.info(`Focused ${summaryFor(worst).label} — first blocking item selected.`);
    queueMicrotask(() => {
      document.getElementById(this.panelId(worst))?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  uiStepNumber(step: UiStepRow): number {
    return this.visibleUiSteps.findIndex((candidate) => candidate.id === step.id) + 1;
  }

  statusCode(actual: string | undefined): string {
    return actual?.split(' ')[0] || '—';
  }

  identityLabel(result: RegressionRow): string {
    const identity = result.identity;
    return `${identity.applicationId} / ${identity.suiteId} / ${identity.caseId} / ${identity.parameterKey}`;
  }

  private resetVisibleEntry(preferredId?: string | null): void {
    if (this.selectedType === 'UI') {
      this.selectedUiStepId = this.pickEntry(this.visibleUiSteps, preferredId);
    } else if (this.selectedType === 'INTEGRATION') {
      this.selectedIntegrationId = this.pickEntry(this.visibleIntegrationResults, preferredId);
    } else {
      this.selectedRegressionId = this.pickEntry(this.visibleRegressionResults, preferredId);
    }
  }

  private pickEntry(rows: { id: string; status: PrototypeStatus }[], preferredId?: string | null): string {
    if (preferredId && rows.some((row) => row.id === preferredId)) {
      return preferredId;
    }
    return this.firstFailedId(rows) ?? rows[0]?.id ?? '';
  }

  private syncUrl(): void {
    const run = this.selectedSourceRun?.runId ?? null;
    const entry = this.selectedType === 'UI'
      ? this.selectedUiStepId
      : this.selectedType === 'INTEGRATION'
        ? this.selectedIntegrationId
        : this.selectedRegressionId;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        type: this.selectedType,
        run,
        entry,
        filter: this.selectedType === 'REGRESSION' ? this.regressionFilter : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private parseType(value: string | null): PrototypeTestType | undefined {
    return this.typeOrder.find((type) => type === value);
  }

  private firstFailedId(rows: { id: string; status: PrototypeStatus }[]): string | undefined {
    return rows.find((row) => row.status === 'FAILED')?.id;
  }
}

@Component({
  selector: 'app-prototype-test-types-page',
  standalone: true,
  imports: [RouterLink, PrototypeTypeWorkspacesVariant],
  templateUrl: './prototype-test-types.page.html',
  encapsulation: ViewEncapsulation.None,
})
export class PrototypeTestTypesPage {}

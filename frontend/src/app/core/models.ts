export type EnvironmentName = 'dev' | 'qa';

export type ExecutionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'ERROR'
  | 'CANCELLED';

export type ScenarioExecutionStatus =
  | ExecutionStatus
  | 'SKIPPED'
  | null;

export type SourceSyncStatus = 'SYNCED' | 'SYNCING' | 'ERROR';

export type ScenarioKind = 'SCENARIO' | 'SCENARIO_OUTLINE';

export type CatalogStatusFilter = '' | 'PASSED' | 'FAILED' | 'NEVER_RUN';

export interface Revision {
  commit: string;
  branch: string;
  syncedAt: string;
}

export interface Source {
  id: string;
  name: string;
  repository: string;
  defaultBranch: string;
  latestRevision: Revision | null;
  syncStatus: SourceSyncStatus;
  syncError: string | null;
  featureCount: number;
  scenarioCount: number;
}

export interface SourceListResponse {
  items: Source[];
}

export interface ScenarioSummary {
  id: string;
  name: string;
  kind: ScenarioKind;
  tags: string[];
  sourcePath: string;
  line: number;
  exampleCount: number;
  status: ScenarioExecutionStatus;
  durationMs: number | null;
  lastRunAt: string | null;
}

export interface Feature {
  id: string;
  name: string;
  tags: string[];
  sourcePath: string;
  scenarioCount: number;
  scenarios: ScenarioSummary[];
}

export interface CatalogStats {
  featureCount: number;
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  passRate: number | null;
}

export interface CatalogResponse {
  source: Source;
  revision: Revision;
  features: Feature[];
  stats: CatalogStats;
}

export interface ScenarioStep {
  keyword: string;
  text: string;
}

export interface ExecutionSummary {
  id: string;
  environment: EnvironmentName;
  status: ExecutionStatus;
  revision: Revision;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
}

export interface ScenarioDetails {
  id: string;
  featureId: string;
  featureName: string;
  name: string;
  kind: ScenarioKind;
  tags: string[];
  sourcePath: string;
  line: number;
  steps: ScenarioStep[];
  examples: Record<string, string>[];
  status: ScenarioExecutionStatus;
  durationMs: number | null;
  lastRunAt: string | null;
  recentExecutions: ExecutionSummary[];
}

export interface ScenarioExecutionResult {
  resultId: string;
  scenarioId: string;
  scenarioName: string;
  exampleValues: Record<string, string> | null;
  status: ScenarioExecutionStatus;
  durationMs: number;
  errorMessage: string | null;
}

export interface Execution {
  id: string;
  sourceId: string;
  revision: Revision;
  environment: EnvironmentName;
  status: ExecutionStatus;
  requestedBy: string;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  errorMessage: string | null;
  results: ScenarioExecutionResult[];
}

export interface ExecutionListResponse {
  items: Execution[];
}

export interface CreateExecutionRequest {
  sourceId: string;
  scenarioIds: string[];
  environment: EnvironmentName;
}

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

export interface RunSelection {
  sourceId: string;
  scenarios: Array<{ id: string; name: string; featureName?: string }>;
  revision: Revision;
  sourceName: string;
}

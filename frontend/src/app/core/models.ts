export type EnvironmentName = 'dev' | 'qa';

export type ExecutionOrigin = 'ui' | 'rest_api' | 'schedule' | 'webhook';

export type ExecutionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'ERROR'
  | 'CANCELLED';

export type TestResultStatus = ExecutionStatus | 'SKIPPED' | null;

/** @deprecated Use TestResultStatus. Kept for shared badge compatibility during migration. */
export type ScenarioExecutionStatus = TestResultStatus;

export type SourceSyncStatus = 'SYNCED' | 'SYNCING' | 'ERROR';
export type TestType = 'BDD' | 'API' | 'INTEGRATION';
export type DefinitionKind = 'SCENARIO' | 'SCENARIO_OUTLINE' | 'TEST' | 'SUITE';
export type TestGroupKind = 'FEATURE' | 'COLLECTION' | 'SUITE';
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
  groupCount: number;
  entryCount: number;
}

export interface SourceListResponse {
  items: Source[];
}

export interface CatalogEntrySummary {
  id: string;
  name: string;
  testType: TestType;
  framework: string;
  definitionKind: DefinitionKind;
  tags: string[];
  sourcePath: string;
  line: number;
  caseCount: number;
  status: TestResultStatus;
  durationMs: number | null;
  lastRunAt: string | null;
}

export interface TestGroup {
  id: string;
  name: string;
  kind: TestGroupKind;
  tags: string[];
  sourcePath: string;
  entryCount: number;
  entries: CatalogEntrySummary[];
}

export interface CatalogStats {
  groupCount: number;
  entryCount: number;
  passedCount: number;
  failedCount: number;
  passRate: number | null;
}

export interface CatalogResponse {
  source: Source;
  revision: Revision | null;
  groups: TestGroup[];
  stats: CatalogStats;
}

export interface TestStep {
  keyword: string;
  text: string;
}

export interface ExecutionSummary {
  id: string;
  environment: EnvironmentName;
  status: ExecutionStatus;
  revision: Revision;
  profileId: string;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
}

export interface CatalogEntryDetails {
  id: string;
  sourceId: string;
  groupId: string;
  groupName: string;
  name: string;
  testType: TestType;
  framework: string;
  definitionKind: DefinitionKind;
  tags: string[];
  sourcePath: string;
  line: number;
  steps: TestStep[];
  examples: Record<string, string>[];
  status: TestResultStatus;
  durationMs: number | null;
  lastRunAt: string | null;
  recentExecutions: ExecutionSummary[];
}

export interface ExternalExecution {
  reference: string;
  url: string | null;
}

export interface ExecutionEntryResult {
  resultId: string;
  entryId: string;
  entryName: string;
  caseId: string | null;
  caseValues: Record<string, string>;
  status: TestResultStatus;
  durationMs: number;
  errorMessage: string | null;
}

export interface Execution {
  id: string;
  sourceId: string;
  revision: Revision;
  profileId: string;
  origin: ExecutionOrigin;
  externalExecution: ExternalExecution | null;
  environment: EnvironmentName;
  status: ExecutionStatus;
  requestedBy: string;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  errorMessage: string | null;
  results: ExecutionEntryResult[];
}

export interface ExecutionListResponse {
  items: Execution[];
}

export interface CreateExecutionRequest {
  sourceId: string;
  entryIds: string[];
  environment: EnvironmentName;
  revisionCommit: string;
  origin: ExecutionOrigin;
}

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

export interface RunSelection {
  sourceId: string;
  entries: Array<{ id: string; name: string; groupName?: string }>;
  revision: Revision;
  sourceName: string;
}

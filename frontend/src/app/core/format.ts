import {
  ExecutionStatus,
  ScenarioExecutionStatus,
  ScenarioKind,
  SourceSyncStatus,
} from './models';

export function shortSha(commit: string | null | undefined): string {
  if (!commit) {
    return '—';
  }
  return commit.length > 7 ? commit.slice(0, 7) : commit;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) {
    return '—';
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export function formatAbsolute(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) {
    return 'never';
  }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return iso;
  }
  const deltaSec = Math.round((then - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const abs = Math.abs(deltaSec);
  if (abs < 60) {
    return rtf.format(deltaSec, 'second');
  }
  if (abs < 3600) {
    return rtf.format(Math.round(deltaSec / 60), 'minute');
  }
  if (abs < 86400) {
    return rtf.format(Math.round(deltaSec / 3600), 'hour');
  }
  return rtf.format(Math.round(deltaSec / 86400), 'day');
}

export function statusLabel(
  status: ExecutionStatus | ScenarioExecutionStatus | SourceSyncStatus | null | undefined,
): string {
  if (status == null) {
    return 'Never run';
  }
  switch (status) {
    case 'QUEUED':
      return 'Queued';
    case 'RUNNING':
      return 'Running';
    case 'PASSED':
      return 'Passed';
    case 'FAILED':
      return 'Failed';
    case 'ERROR':
      return 'Error';
    case 'CANCELLED':
      return 'Cancelled';
    case 'SKIPPED':
      return 'Skipped';
    case 'SYNCED':
      return 'Synced';
    case 'SYNCING':
      return 'Syncing';
    default:
      return String(status);
  }
}

export function kindLabel(kind: ScenarioKind): string {
  return kind === 'SCENARIO_OUTLINE' ? 'Outline' : 'Scenario';
}

export function isActiveStatus(status: ExecutionStatus | null | undefined): boolean {
  return status === 'QUEUED' || status === 'RUNNING';
}

export function isTerminalStatus(status: ExecutionStatus | null | undefined): boolean {
  return status === 'PASSED' || status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED';
}

export function passRateLabel(rate: number | null | undefined): string {
  if (rate == null) {
    return '—';
  }
  return `${Math.round(rate)}%`;
}

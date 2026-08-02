export type PrototypeTestType = 'UI' | 'INTEGRATION' | 'REGRESSION';
export type PrototypeStatus = 'PASSED' | 'FAILED' | 'RUNNING' | 'SKIPPED';
export type RegressionDelta = 'NEW' | 'KNOWN' | 'FIXED' | 'SAME';
export type ExecutionLifecycle = 'QUEUED' | 'RUNNING' | 'COLLECTING' | 'COMPLETED' | 'CANCELLED';
export type TestOutcome = 'PASSED' | 'FAILED' | 'UNKNOWN';
export type IngestionState = 'PENDING' | 'VALID' | 'PARTIAL' | 'ERROR';

export interface TestRunState {
  lifecycle: ExecutionLifecycle;
  outcome: TestOutcome;
  ingestion: IngestionState;
}

export interface PrototypeTypeSummary extends TestRunState {
  type: PrototypeTestType;
  label: string;
  description: string;
  framework: string;
  scope: string;
  runCount: string;
  runReference: string;
  metricLabel: string;
  metricValue: string;
  attentionCount: number;
  duration: string;
}

export interface SourceRunOption extends TestRunState {
  id: string;
  suiteName: string;
  runId: string;
  build: string;
  framework: string;
  resultTitle: string;
  resultSubtitle: string;
}

export interface PrototypeResultRow {
  id: string;
  runKey: string;
  name: string;
  detail: string;
  status: PrototypeStatus;
  duration: string;
}

export interface UiStepRow extends PrototypeResultRow {
  evidence?: {
    url: string;
    title: string;
    body: string;
    selector?: string;
  };
}

export interface IntegrationRow extends PrototypeResultRow {
  method: string;
  path: string;
  evidence?: {
    expectedStatus: string;
    actualStatus: string;
    expectedBody: string;
    actualBody: string;
    durationMs: number;
  };
}

export interface RegressionRow extends PrototypeResultRow {
  delta: RegressionDelta;
  identity: {
    applicationId: string;
    suiteId: string;
    caseId: string;
    parameterKey: string;
  };
}

export const APP_NAME = 'Checkout Web';
export const REVISION = 'a13f9c2';
export const APPLICATION_RUN = 'AR-1048';
export const APPLICATION_TRIGGER = 'Jenkins release pipeline · svc-release-bot';
export const APPLICATION_STARTED_AT = '2026-08-01 13:36:31 UTC';
export const APPLICATION_COMPLETED_AT = '2026-08-01 13:45:23 UTC';
export const BASELINE_RUN = 'AR-1042';
export const BASELINE_REVISION = '9b71de4';
export const COMPATIBILITY_FINGERPRINT = 'qa:policy-v3:contract-1:5-runs';
export const COMPARISON_STARTED_AT = '2026-08-01 13:45:18 UTC';
export const COMPARISON_COMPLETED_AT = '2026-08-01 13:45:23 UTC';
export const CANDIDATE_SOURCE_RUN_IDS = ['TR-2208', 'TR-2209', 'TR-2210', 'TR-2211', 'TR-2212'];
export const BASELINE_SOURCE_RUN_IDS = ['TR-2188', 'TR-2189', 'TR-2190', 'TR-2191', 'TR-2192'];

export const TYPE_SUMMARIES: PrototypeTypeSummary[] = [
  {
    type: 'UI',
    label: 'UI tests',
    description: 'Browser journeys executed as independently observable source runs.',
    framework: 'Playwright · Chromium',
    lifecycle: 'COMPLETED',
    outcome: 'FAILED',
    ingestion: 'VALID',
    scope: '2 suites',
    runCount: '2 builds',
    runReference: '#842 · #845',
    metricLabel: 'Failed cases',
    metricValue: '1 / 46',
    attentionCount: 1,
    duration: '8m 42s',
  },
  {
    type: 'INTEGRATION',
    label: 'Integration tests',
    description: 'API and service-boundary suites executed as source runs.',
    framework: 'Rest Assured · JUnit 5',
    lifecycle: 'COMPLETED',
    outcome: 'FAILED',
    ingestion: 'VALID',
    scope: '3 suites',
    runCount: '3 builds',
    runReference: '#843 · #846 · #847',
    metricLabel: 'Failed cases',
    metricValue: '1 / 74',
    attentionCount: 1,
    duration: '2m 18s',
  },
  {
    type: 'REGRESSION',
    label: 'Regression tests',
    description: 'A derived comparison of completed source runs with a pinned baseline.',
    framework: 'Release gate policy v3',
    lifecycle: 'COMPLETED',
    outcome: 'FAILED',
    ingestion: 'VALID',
    scope: '1 policy',
    runCount: 'Derived',
    runReference: '5 source runs',
    metricLabel: 'Blocking deltas',
    metricValue: '4 new',
    attentionCount: 4,
    duration: '4.8s',
  },
];

export const UI_SOURCE_RUNS: SourceRunOption[] = [
  {
    id: 'ui-checkout-chrome',
    suiteName: 'Guest checkout · Chromium',
    runId: 'TR-2208',
    build: '#842',
    framework: 'Playwright · Chromium',
    resultTitle: 'Guest checkout',
    resultSubtitle: 'Chrome 126 · 1440 × 900',
    lifecycle: 'COMPLETED',
    outcome: 'FAILED',
    ingestion: 'VALID',
  },
  {
    id: 'ui-account-firefox',
    suiteName: 'Account settings · Firefox',
    runId: 'TR-2209',
    build: '#845',
    framework: 'Playwright · Firefox',
    resultTitle: 'Update delivery address',
    resultSubtitle: 'Firefox 127 · 1440 × 900',
    lifecycle: 'COMPLETED',
    outcome: 'PASSED',
    ingestion: 'VALID',
  },
];

export const INTEGRATION_SOURCE_RUNS: SourceRunOption[] = [
  {
    id: 'integration-checkout',
    suiteName: 'Checkout API',
    runId: 'TR-2210',
    build: '#843',
    framework: 'Rest Assured · JUnit 5',
    resultTitle: 'Checkout API collection',
    resultSubtitle: 'qa gateway',
    lifecycle: 'COMPLETED',
    outcome: 'FAILED',
    ingestion: 'VALID',
  },
  {
    id: 'integration-orders',
    suiteName: 'Orders contract',
    runId: 'TR-2211',
    build: '#846',
    framework: 'Rest Assured · JUnit 5',
    resultTitle: 'Orders contract suite',
    resultSubtitle: 'qa orders service',
    lifecycle: 'COMPLETED',
    outcome: 'PASSED',
    ingestion: 'VALID',
  },
  {
    id: 'integration-inventory',
    suiteName: 'Inventory boundary',
    runId: 'TR-2212',
    build: '#847',
    framework: 'Rest Assured · JUnit 5',
    resultTitle: 'Inventory boundary suite',
    resultSubtitle: 'qa inventory service',
    lifecycle: 'COMPLETED',
    outcome: 'PASSED',
    ingestion: 'VALID',
  },
];

export const UI_STEPS: UiStepRow[] = [
  {
    id: 'ui-1',
    runKey: 'ui-checkout-chrome',
    name: 'Open product page',
    detail: 'Customer lands on /products/desk-lamp',
    status: 'PASSED',
    duration: '12s',
    evidence: {
      url: 'shop.qa.internal/products/desk-lamp',
      title: 'Product page loaded',
      body: 'Desk lamp PDP rendered with price and add-to-basket control.',
    },
  },
  {
    id: 'ui-2',
    runKey: 'ui-checkout-chrome',
    name: 'Add item to basket',
    detail: 'Quantity 1 · standard delivery',
    status: 'PASSED',
    duration: '18s',
    evidence: {
      url: 'shop.qa.internal/basket',
      title: 'Basket updated',
      body: 'Line item persisted with quantity 1 and standard delivery.',
    },
  },
  {
    id: 'ui-3',
    runKey: 'ui-checkout-chrome',
    name: 'Enter delivery details',
    detail: 'Saved QA customer profile',
    status: 'PASSED',
    duration: '27s',
    evidence: {
      url: 'checkout.qa.internal/delivery',
      title: 'Delivery form filled',
      body: 'QA customer profile applied without validation errors.',
    },
  },
  {
    id: 'ui-4',
    runKey: 'ui-checkout-chrome',
    name: 'Pay with Visa ending 4242',
    detail: 'Confirmation banner was not visible',
    status: 'FAILED',
    duration: '41s',
    evidence: {
      url: 'checkout.qa.internal/confirmation',
      title: 'Confirmation banner was not visible',
      body: 'Payment completed, but the order confirmation banner did not appear within 10 seconds.',
      selector: '[data-testid=order-confirmed]',
    },
  },
  {
    id: 'ui-5',
    runKey: 'ui-checkout-chrome',
    name: 'Verify order confirmation',
    detail: 'Skipped after payment step failed',
    status: 'SKIPPED',
    duration: '—',
    evidence: {
      url: 'checkout.qa.internal/confirmation',
      title: 'Step skipped',
      body: 'Downstream assertion skipped because the payment step failed.',
    },
  },
  {
    id: 'ui-account-1',
    runKey: 'ui-account-firefox',
    name: 'Open account settings',
    detail: 'Authenticated QA customer profile',
    status: 'PASSED',
    duration: '9s',
    evidence: {
      url: 'shop.qa.internal/account/settings',
      title: 'Account settings loaded',
      body: 'Customer profile and saved delivery addresses rendered successfully.',
    },
  },
  {
    id: 'ui-account-2',
    runKey: 'ui-account-firefox',
    name: 'Update delivery address',
    detail: 'Change postcode to EC2A 4NE',
    status: 'PASSED',
    duration: '22s',
    evidence: {
      url: 'shop.qa.internal/account/addresses',
      title: 'Address update accepted',
      body: 'The new delivery address passed validation and was persisted.',
    },
  },
  {
    id: 'ui-account-3',
    runKey: 'ui-account-firefox',
    name: 'Verify saved address',
    detail: 'Reload account address book',
    status: 'PASSED',
    duration: '14s',
    evidence: {
      url: 'shop.qa.internal/account/addresses',
      title: 'Saved address verified',
      body: 'The updated postcode remained visible after reloading the page.',
    },
  },
];

export const INTEGRATION_RESULTS: IntegrationRow[] = [
  {
    id: 'api-1',
    runKey: 'integration-checkout',
    name: 'Create cart',
    method: 'POST',
    path: '/api/carts',
    detail: '201 · cart schema valid',
    status: 'PASSED',
    duration: '184ms',
    evidence: {
      expectedStatus: '201 Created',
      actualStatus: '201 Created',
      expectedBody: '{ "id": "<uuid>", "items": [] }',
      actualBody: '{ "id": "c8f2…", "items": [] }',
      durationMs: 184,
    },
  },
  {
    id: 'api-2',
    runKey: 'integration-checkout',
    name: 'Add line item',
    method: 'POST',
    path: '/api/carts/{id}/items',
    detail: '200 · line item persisted',
    status: 'PASSED',
    duration: '231ms',
    evidence: {
      expectedStatus: '200 OK',
      actualStatus: '200 OK',
      expectedBody: '{ "quantity": 1 }',
      actualBody: '{ "quantity": 1, "sku": "DESK-LAMP" }',
      durationMs: 231,
    },
  },
  {
    id: 'api-3',
    runKey: 'integration-checkout',
    name: 'Authorize payment',
    method: 'POST',
    path: '/api/payments/authorize',
    detail: 'Expected 200, received 409',
    status: 'FAILED',
    duration: '612ms',
    evidence: {
      expectedStatus: '200 OK',
      actualStatus: '409 CONFLICT',
      expectedBody: '{ "status": "AUTHORIZED" }',
      actualBody: '{ "code": "PAYMENT_STATE_LOCKED" }',
      durationMs: 612,
    },
  },
  {
    id: 'api-4',
    runKey: 'integration-checkout',
    name: 'Get order',
    method: 'GET',
    path: '/api/orders/{id}',
    detail: 'Skipped · payment not authorized',
    status: 'SKIPPED',
    duration: '—',
    evidence: {
      expectedStatus: '200 OK',
      actualStatus: '— not executed',
      expectedBody: '{ "state": "CONFIRMED" }',
      actualBody: '// request not sent after authorize failed',
      durationMs: 0,
    },
  },
  {
    id: 'api-orders-1',
    runKey: 'integration-orders',
    name: 'Create order contract',
    method: 'POST',
    path: '/api/orders',
    detail: '201 · response contract matched',
    status: 'PASSED',
    duration: '205ms',
    evidence: {
      expectedStatus: '201 Created',
      actualStatus: '201 Created',
      expectedBody: '{ "state": "CONFIRMED" }',
      actualBody: '{ "id": "o31…", "state": "CONFIRMED" }',
      durationMs: 205,
    },
  },
  {
    id: 'api-orders-2',
    runKey: 'integration-orders',
    name: 'Read order contract',
    method: 'GET',
    path: '/api/orders/{id}',
    detail: '200 · schema remained compatible',
    status: 'PASSED',
    duration: '96ms',
    evidence: {
      expectedStatus: '200 OK',
      actualStatus: '200 OK',
      expectedBody: '{ "id": "<uuid>", "state": "CONFIRMED" }',
      actualBody: '{ "id": "o31…", "state": "CONFIRMED" }',
      durationMs: 96,
    },
  },
  {
    id: 'api-inventory-1',
    runKey: 'integration-inventory',
    name: 'Reserve inventory',
    method: 'POST',
    path: '/api/inventory/reservations',
    detail: '202 · reservation accepted',
    status: 'PASSED',
    duration: '143ms',
    evidence: {
      expectedStatus: '202 Accepted',
      actualStatus: '202 Accepted',
      expectedBody: '{ "state": "PENDING" }',
      actualBody: '{ "reservation": "r17…", "state": "PENDING" }',
      durationMs: 143,
    },
  },
  {
    id: 'api-inventory-2',
    runKey: 'integration-inventory',
    name: 'Release inventory',
    method: 'DELETE',
    path: '/api/inventory/reservations/{id}',
    detail: '204 · reservation released',
    status: 'PASSED',
    duration: '87ms',
    evidence: {
      expectedStatus: '204 No Content',
      actualStatus: '204 No Content',
      expectedBody: '// empty response body',
      actualBody: '// empty response body',
      durationMs: 87,
    },
  },
];

export const REGRESSION_RESULTS: RegressionRow[] = [
  {
    id: 'reg-1',
    runKey: 'regression-policy-v3',
    name: 'Checkout / Visa payment',
    detail: 'New failure · passed in baseline',
    status: 'FAILED',
    duration: '1m 18s',
    delta: 'NEW',
    identity: {
      applicationId: 'checkout-web',
      suiteId: 'checkout-ui',
      caseId: 'payment.visa',
      parameterKey: 'default',
    },
  },
  {
    id: 'reg-2',
    runKey: 'regression-policy-v3',
    name: 'Checkout / Wallet payment',
    detail: 'Persistent failure · failed in both runs',
    status: 'FAILED',
    duration: '54s',
    delta: 'KNOWN',
    identity: {
      applicationId: 'checkout-web',
      suiteId: 'checkout-ui',
      caseId: 'payment.wallet',
      parameterKey: 'default',
    },
  },
  {
    id: 'reg-3',
    runKey: 'regression-policy-v3',
    name: 'Account / Update address',
    detail: 'Fixed · failed in baseline, now passes',
    status: 'PASSED',
    duration: '38s',
    delta: 'FIXED',
    identity: {
      applicationId: 'checkout-web',
      suiteId: 'account-ui',
      caseId: 'address.update',
      parameterKey: 'default',
    },
  },
  {
    id: 'reg-4',
    runKey: 'regression-policy-v3',
    name: 'Search / Empty query',
    detail: 'Unchanged pass',
    status: 'PASSED',
    duration: '21s',
    delta: 'SAME',
    identity: {
      applicationId: 'checkout-web',
      suiteId: 'search-api',
      caseId: 'search.empty',
      parameterKey: 'default',
    },
  },
];

export function summaryFor(type: PrototypeTestType): PrototypeTypeSummary {
  return TYPE_SUMMARIES.find((item) => item.type === type)!;
}

/** Prefer the type with the most release-blocking attention; ties keep array order. */
export function defaultSelectedType(): PrototypeTestType {
  return [...TYPE_SUMMARIES].sort((a, b) => b.attentionCount - a.attentionCount)[0]?.type ?? 'UI';
}

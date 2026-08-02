// Preview-only Cloudflare Worker adapter for the Angular build.
// The real Spring Boot API uses the same /api/v1 response shapes.
const revision = {
  commit: 'a13f9c2',
  branch: 'main',
  syncedAt: '2026-07-21T02:10:00Z',
};

const source = {
  id: 'checkout-web',
  name: 'Checkout web',
  repository: 'acme/checkout-web-e2e',
  defaultBranch: 'main',
  latestRevision: revision,
  syncStatus: 'SYNCED',
  syncError: null,
  groupCount: 4,
  entryCount: 9,
};

const step = (keyword, text) => ({ keyword, text });
const entry = (id, name, definitionKind, tags, sourcePath, line, examples = []) => ({
  id,
  name,
  testType: 'BDD',
  framework: 'cucumber',
  definitionKind,
  tags,
  sourcePath,
  line,
  caseCount: examples.length,
  status: 'NEVER_RUN',
  durationMs: null,
  lastRunAt: null,
  steps: [
    step('Given', 'the customer has an item ready to check out'),
    step('When', name.toLowerCase()),
    step('Then', 'the expected outcome is visible'),
  ],
  examples,
});

const allGroups = [
  {
    id: 'checkout-payments',
    name: 'Checkout payments',
    kind: 'FEATURE',
    tags: ['critical', 'payments'],
    sourcePath: 'features/checkout/payments.feature',
    entries: [
      entry('checkout-valid-card', 'Customer completes checkout with a valid card', 'SCENARIO', ['smoke', 'payments'], 'features/checkout/payments.feature', 18),
      entry('checkout-expired-card', 'Customer sees a message for an expired card', 'SCENARIO', ['payments', 'regression'], 'features/checkout/payments.feature', 33),
      entry('checkout-wallet', 'Customer pays with a saved wallet', 'SCENARIO_OUTLINE', ['payments'], 'features/checkout/payments.feature', 47, [{ wallet: 'Apple Pay' }, { wallet: 'Google Pay' }]),
    ],
  },
  {
    id: 'checkout-cart',
    name: 'Cart management',
    kind: 'FEATURE',
    tags: ['smoke', 'cart'],
    sourcePath: 'features/checkout/cart.feature',
    entries: [
      entry('cart-add-item', 'Customer adds a product to the cart', 'SCENARIO', ['smoke', 'cart'], 'features/checkout/cart.feature', 11),
      entry('cart-update-quantity', 'Customer updates item quantity', 'SCENARIO', ['cart'], 'features/checkout/cart.feature', 25),
    ],
  },
  {
    id: 'account-sign-in',
    name: 'Account sign-in',
    kind: 'FEATURE',
    tags: ['smoke', 'account'],
    sourcePath: 'features/account/sign-in.feature',
    entries: [
      entry('account-valid-login', 'Customer signs in with valid credentials', 'SCENARIO', ['smoke', 'account'], 'features/account/sign-in.feature', 9),
      entry('account-invalid-login', 'Customer sees an error for invalid credentials', 'SCENARIO', ['account', 'regression'], 'features/account/sign-in.feature', 23),
    ],
  },
  {
    id: 'orders-history',
    name: 'Order history',
    kind: 'FEATURE',
    tags: ['regression', 'orders'],
    sourcePath: 'features/orders/history.feature',
    entries: [
      entry('orders-history-list', 'Customer can review recent orders', 'SCENARIO', ['orders'], 'features/orders/history.feature', 12),
      entry('orders-history-filter', 'Customer filters order history by status', 'SCENARIO', ['orders', 'regression'], 'features/orders/history.feature', 29),
    ],
  },
];

const executions = [];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function allEntries() {
  return allGroups.flatMap((group) => group.entries);
}

function findEntry(id) {
  return allEntries().find((item) => item.id === id);
}

function findGroupForEntry(id) {
  return allGroups.find((group) => group.entries.some((item) => item.id === id));
}

function entrySummary(item) {
  return {
    id: item.id,
    name: item.name,
    testType: item.testType,
    framework: item.framework,
    definitionKind: item.definitionKind,
    tags: item.tags,
    sourcePath: item.sourcePath,
    line: item.line,
    caseCount: item.caseCount,
    status: item.status,
    durationMs: item.durationMs,
    lastRunAt: item.lastRunAt,
  };
}

function catalog(url) {
  const query = (url.searchParams.get('q') || '').toLowerCase();
  const status = (url.searchParams.get('status') || '').toUpperCase();
  const tags = url.searchParams.getAll('tag').map((tag) => tag.toLowerCase());
  const groups = allGroups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((item) => {
        const searchable = [group.name, item.name, item.sourcePath, item.framework, ...group.tags, ...item.tags]
          .join(' ')
          .toLowerCase();
        const matchesQuery = !query || searchable.includes(query);
        const matchesStatus = !status || status === 'ALL' || (status === 'NEVER_RUN' ? item.status === 'NEVER_RUN' : item.status === status);
        const matchesTags = tags.every((tag) => [...group.tags, ...item.tags].includes(tag));
        return matchesQuery && matchesStatus && matchesTags;
      }),
    }))
    .filter((group) => group.entries.length)
    .map((group) => ({
      id: group.id,
      name: group.name,
      kind: group.kind,
      tags: group.tags,
      sourcePath: group.sourcePath,
      entryCount: group.entries.length,
      entries: group.entries.map(entrySummary),
    }));

  const passedCount = allEntries().filter((item) => item.status === 'PASSED').length;
  const failedCount = allEntries().filter((item) => item.status === 'FAILED').length;
  const completedCount = passedCount + failedCount;
  return json({
    source: { ...source, groupCount: allGroups.length, entryCount: allEntries().length },
    revision,
    groups,
    stats: {
      groupCount: allGroups.length,
      entryCount: allEntries().length,
      passedCount,
      failedCount,
      passRate: completedCount ? (passedCount * 100) / completedCount : null,
    },
  });
}

function updateCatalogFromExecution(execution) {
  const now = execution.completedAt;
  const byEntry = new Map();
  for (const result of execution.results) {
    byEntry.set(result.entryId, result.status);
  }
  for (const [entryId, status] of byEntry) {
    const item = findEntry(entryId);
    if (item) {
      item.status = status;
      item.durationMs = 1320;
      item.lastRunAt = now;
    }
  }
}

function executionResponse(execution) {
  const elapsed = Date.now() - execution.requestedAtMs;
  if (execution.status === 'QUEUED' && elapsed > 700) {
    execution.status = execution.results.some((result) => result.entryId.includes('expired')) ? 'FAILED' : 'PASSED';
    execution.startedAt = new Date(execution.requestedAtMs + 200).toISOString();
    execution.completedAt = new Date().toISOString();
    execution.results = execution.results.map((result) => ({
      ...result,
      status: result.entryId.includes('expired') ? 'FAILED' : 'PASSED',
      durationMs: result.entryId.includes('expired') ? 820 : 1320,
      errorMessage: result.entryId.includes('expired') ? 'Expected payment rejection message was not visible' : null,
    }));
    execution.durationMs = 1320;
    updateCatalogFromExecution(execution);
  }
  const { requestedAtMs, ...response } = execution;
  return response;
}

function createExecution(body) {
  const ids = Array.isArray(body.entryIds) ? body.entryIds : body.scenarioIds;
  if (!Array.isArray(ids) || ids.length === 0) {
    return json({ code: 'BAD_REQUEST', message: 'entryIds must contain at least one entry' }, 400);
  }
  if (body.sourceId !== 'checkout-web') {
    return json({ code: 'BAD_REQUEST', message: 'sourceId is invalid' }, 400);
  }
  if (!['dev', 'qa'].includes(body.environment)) {
    return json({ code: 'BAD_REQUEST', message: 'environment must be dev or qa' }, 400);
  }
  if (body.revisionCommit && body.revisionCommit !== revision.commit) {
    return json({ code: 'BAD_REQUEST', message: 'Catalog revision is stale; refresh the catalog and try again' }, 400);
  }
  const invalidIds = ids.filter((id) => !findEntry(id));
  if (invalidIds.length) {
    return json({ code: 'BAD_REQUEST', message: `Unknown Catalog Entry: ${invalidIds[0]}` }, 400);
  }
  const selected = [...new Set(ids)].map(findEntry);
  const requestedAtMs = Date.now();
  const id = `preview-${requestedAtMs}`;
  const execution = {
    id,
    sourceId: 'checkout-web',
    revision,
    profileId: 'bdd-cucumber-simulation',
    origin: body.origin || 'rest_api',
    externalExecution: { reference: `simulation:${id}`, url: null },
    environment: body.environment,
    status: 'QUEUED',
    requestedBy: 'preview-user',
    requestedAt: new Date(requestedAtMs).toISOString(),
    startedAt: null,
    completedAt: null,
    durationMs: 0,
    errorMessage: null,
    requestedAtMs,
    results: selected.flatMap((item) => (item.examples.length ? item.examples.map((values, index) => ({
      resultId: `${item.id}#case-${index + 1}`,
      entryId: item.id,
      entryName: item.name,
      caseId: `case-${index + 1}`,
      caseValues: values,
      status: 'QUEUED',
      durationMs: 0,
      errorMessage: null,
    })) : [{
      resultId: item.id,
      entryId: item.id,
      entryName: item.name,
      caseId: null,
      caseValues: {},
      status: 'QUEUED',
      durationMs: 0,
      errorMessage: null,
    }])),
  };
  executions.unshift(execution);
  return json(executionResponse(execution), 201);
}

function entryDetails(id) {
  const item = findEntry(id);
  if (!item) return null;
  const group = findGroupForEntry(id);
  return {
    id: item.id,
    sourceId: source.id,
    groupId: group.id,
    groupName: group.name,
    name: item.name,
    testType: item.testType,
    framework: item.framework,
    definitionKind: item.definitionKind,
    tags: item.tags,
    sourcePath: item.sourcePath,
    line: item.line,
    steps: item.steps,
    examples: item.examples,
    status: item.status,
    durationMs: item.durationMs,
    lastRunAt: item.lastRunAt,
    recentExecutions: [],
  };
}

function handleApi(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (request.method === 'GET' && pathname === '/api/v1/sources') {
    return json({ items: [{ ...source, groupCount: allGroups.length, entryCount: allEntries().length }] });
  }
  if (pathname === '/api/v1/sources/checkout-web' && request.method === 'GET') {
    return json({ ...source, groupCount: allGroups.length, entryCount: allEntries().length });
  }
  if (pathname === '/api/v1/sources/checkout-web/sync' && request.method === 'POST') {
    return json({ ...source, groupCount: allGroups.length, entryCount: allEntries().length, syncStatus: 'SYNCED' }, 202);
  }
  if (request.method === 'GET' && pathname === '/api/v1/catalog') {
    return catalog(url);
  }
  if (request.method === 'GET' && (pathname.startsWith('/api/v1/catalog/entries/') || pathname.startsWith('/api/v1/catalog/scenarios/'))) {
    const id = decodeURIComponent(pathname.split('/').pop());
    const details = entryDetails(id);
    return details ? json(details) : json({ code: 'NOT_FOUND', message: 'Catalog Entry not found' }, 404);
  }
  if (request.method === 'GET' && pathname === '/api/v1/executions') {
    return json({ items: executions.map(executionResponse) });
  }
  if (request.method === 'POST' && pathname === '/api/v1/executions') {
    return request.json().then(createExecution).catch(() => json({ code: 'BAD_REQUEST', message: 'Request body must be valid JSON' }, 400));
  }
  if (request.method === 'GET' && pathname.startsWith('/api/v1/executions/')) {
    const id = decodeURIComponent(pathname.split('/').pop());
    const execution = executions.find((item) => item.id === id);
    return execution ? json(executionResponse(execution)) : json({ code: 'NOT_FOUND', message: 'Execution not found' }, 404);
  }
  if (request.method === 'POST' && pathname.endsWith('/cancel')) {
    const id = decodeURIComponent(pathname.split('/').at(-2));
    const execution = executions.find((item) => item.id === id);
    if (!execution) return json({ code: 'NOT_FOUND', message: 'Execution not found' }, 404);
    execution.status = 'CANCELLED';
    execution.completedAt = new Date().toISOString();
    execution.results = execution.results.map((result) => ({ ...result, status: 'CANCELLED', errorMessage: 'Cancelled by user' }));
    return json(executionResponse(execution));
  }
  return json({ code: 'NOT_FOUND', message: 'Preview API route not found' }, 404);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/v1/')) {
      return handleApi(request);
    }

    const leaf = url.pathname.split('/').at(-1) ?? '';
    const isAppRoute = request.method === 'GET' && !leaf.includes('.');
    if (isAppRoute) {
      return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== 'GET') {
      return asset;
    }
    return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
  },
};

export default worker;

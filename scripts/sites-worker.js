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
  featureCount: 4,
  scenarioCount: 9,
};

const step = (keyword, text) => ({ keyword, text });
const scenario = (id, name, kind, tags, sourcePath, line, examples = []) => ({
  id,
  name,
  kind,
  tags,
  sourcePath,
  line,
  exampleCount: examples.length,
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

const allFeatures = [
  {
    id: 'checkout-payments',
    name: 'Checkout payments',
    tags: ['critical', 'payments'],
    sourcePath: 'features/checkout/payments.feature',
    scenarios: [
      scenario('checkout-valid-card', 'Customer completes checkout with a valid card', 'SCENARIO', ['smoke', 'payments'], 'features/checkout/payments.feature', 18),
      scenario('checkout-expired-card', 'Customer sees a message for an expired card', 'SCENARIO', ['payments', 'regression'], 'features/checkout/payments.feature', 33),
      scenario('checkout-wallet', 'Customer pays with a saved wallet', 'SCENARIO_OUTLINE', ['payments'], 'features/checkout/payments.feature', 47, [{ wallet: 'Apple Pay' }, { wallet: 'Google Pay' }]),
    ],
  },
  {
    id: 'checkout-cart',
    name: 'Cart management',
    tags: ['smoke', 'cart'],
    sourcePath: 'features/checkout/cart.feature',
    scenarios: [
      scenario('cart-add-item', 'Customer adds a product to the cart', 'SCENARIO', ['smoke', 'cart'], 'features/checkout/cart.feature', 11),
      scenario('cart-update-quantity', 'Customer updates item quantity', 'SCENARIO', ['cart'], 'features/checkout/cart.feature', 25),
    ],
  },
  {
    id: 'account-sign-in',
    name: 'Account sign-in',
    tags: ['smoke', 'account'],
    sourcePath: 'features/account/sign-in.feature',
    scenarios: [
      scenario('account-valid-login', 'Customer signs in with valid credentials', 'SCENARIO', ['smoke', 'account'], 'features/account/sign-in.feature', 9),
      scenario('account-invalid-login', 'Customer sees an error for invalid credentials', 'SCENARIO', ['account', 'regression'], 'features/account/sign-in.feature', 23),
    ],
  },
  {
    id: 'orders-history',
    name: 'Order history',
    tags: ['regression', 'orders'],
    sourcePath: 'features/orders/history.feature',
    scenarios: [
      scenario('orders-history-list', 'Customer can review recent orders', 'SCENARIO', ['orders'], 'features/orders/history.feature', 12),
      scenario('orders-history-filter', 'Customer filters order history by status', 'SCENARIO', ['orders', 'regression'], 'features/orders/history.feature', 29),
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

function allScenarios() {
  return allFeatures.flatMap((feature) => feature.scenarios);
}

function findScenario(id) {
  return allScenarios().find((item) => item.id === id);
}

function summary(item) {
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    tags: item.tags,
    sourcePath: item.sourcePath,
    line: item.line,
    exampleCount: item.exampleCount,
    status: item.status,
    durationMs: item.durationMs,
    lastRunAt: item.lastRunAt,
  };
}

function catalog(url) {
  const query = (url.searchParams.get('q') || '').toLowerCase();
  const status = (url.searchParams.get('status') || '').toUpperCase();
  const tags = url.searchParams.getAll('tag').map((tag) => tag.toLowerCase());
  const features = allFeatures
    .map((feature) => ({
      ...feature,
      scenarios: feature.scenarios.filter((item) => {
        const searchable = [feature.name, item.name, item.sourcePath, ...feature.tags, ...item.tags]
          .join(' ')
          .toLowerCase();
        const matchesQuery = !query || searchable.includes(query);
        const matchesStatus = !status || status === 'ALL' || (status === 'NEVER_RUN' ? item.status === 'NEVER_RUN' : item.status === status);
        const matchesTags = tags.every((tag) => [...feature.tags, ...item.tags].includes(tag));
        return matchesQuery && matchesStatus && matchesTags;
      }),
    }))
    .filter((feature) => feature.scenarios.length)
    .map((feature) => ({
      id: feature.id,
      name: feature.name,
      tags: feature.tags,
      sourcePath: feature.sourcePath,
      scenarioCount: feature.scenarios.length,
      scenarios: feature.scenarios.map(summary),
    }));

  return json({
    source,
    revision,
    features,
    stats: { featureCount: 4, scenarioCount: 9, passedCount: 0, failedCount: 0, passRate: null },
  });
}

function executionResponse(execution) {
  const elapsed = Date.now() - execution.requestedAtMs;
  if (execution.status === 'QUEUED' && elapsed > 700) {
    execution.status = 'PASSED';
    execution.startedAt = new Date(execution.requestedAtMs + 200).toISOString();
    execution.completedAt = new Date().toISOString();
    execution.results = execution.results.map((result) => ({ ...result, status: 'PASSED', durationMs: 1320 }));
    execution.durationMs = 1320;
  }
  return { ...execution, requestedAtMs: undefined };
}

function createExecution(body) {
  const ids = Array.isArray(body.scenarioIds) ? body.scenarioIds : [];
  const selected = ids.map(findScenario).filter(Boolean);
  const requestedAtMs = Date.now();
  const id = `preview-${requestedAtMs}`;
  const execution = {
    id,
    sourceId: 'checkout-web',
    revision,
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
      resultId: `${item.id}#example-${index + 1}`,
      scenarioId: item.id,
      scenarioName: item.name,
      exampleValues: values,
      status: 'QUEUED',
      durationMs: 0,
      errorMessage: null,
    })) : [{
      resultId: item.id,
      scenarioId: item.id,
      scenarioName: item.name,
      exampleValues: {},
      status: 'QUEUED',
      durationMs: 0,
      errorMessage: null,
    }])),
  };
  executions.unshift(execution);
  return json(executionResponse(execution), 201);
}

function handleApi(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (request.method === 'GET' && pathname === '/api/v1/sources') {
    return json({ items: [source] });
  }
  if (pathname === '/api/v1/sources/checkout-web' && request.method === 'GET') {
    return json(source);
  }
  if (pathname === '/api/v1/sources/checkout-web/sync' && request.method === 'POST') {
    return json({ ...source, syncStatus: 'SYNCED' }, 202);
  }
  if (request.method === 'GET' && pathname === '/api/v1/catalog') {
    return catalog(url);
  }
  if (request.method === 'GET' && pathname.startsWith('/api/v1/catalog/scenarios/')) {
    const id = pathname.split('/').pop();
    const item = findScenario(id);
    if (!item) return json({ code: 'NOT_FOUND', message: 'Scenario not found' }, 404);
    return json({
      ...item,
      featureId: allFeatures.find((feature) => feature.scenarios.some((scenarioItem) => scenarioItem.id === id)).id,
      featureName: allFeatures.find((feature) => feature.scenarios.some((scenarioItem) => scenarioItem.id === id)).name,
      recentExecutions: [],
    });
  }
  if (request.method === 'GET' && pathname === '/api/v1/executions') {
    return json({ items: executions.map(executionResponse) });
  }
  if (request.method === 'POST' && pathname === '/api/v1/executions') {
    return request.json().then(createExecution);
  }
  if (request.method === 'GET' && pathname.startsWith('/api/v1/executions/')) {
    const id = pathname.split('/').pop();
    const execution = executions.find((item) => item.id === id);
    return execution ? json(executionResponse(execution)) : json({ code: 'NOT_FOUND', message: 'Execution not found' }, 404);
  }
  if (request.method === 'POST' && pathname.endsWith('/cancel')) {
    const id = pathname.split('/').at(-2);
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
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== 'GET') {
      return asset;
    }
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  },
};

export default worker;

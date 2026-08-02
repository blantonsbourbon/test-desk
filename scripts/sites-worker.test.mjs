import assert from 'node:assert/strict';
import test from 'node:test';

import worker from './sites-worker.js';

function createAssetsBinding() {
  const requestedPaths = [];

  return {
    requestedPaths,
    binding: {
      async fetch(request) {
        const url = new URL(request.url);
        requestedPaths.push(url.pathname);

        if (url.pathname === '/') {
          return new Response('<!doctype html><app-root></app-root>', {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          });
        }

        // Sites redirects both unknown static paths and /index.html to the app root.
        return Response.redirect(new URL('/', request.url), 307);
      },
    },
  };
}

test('serves the SPA shell without redirecting deep prototype links', async () => {
  for (const query of [
    'type=UI&run=TR-2209&entry=ui-account-2',
    'type=INTEGRATION&run=TR-2211&entry=api-orders-1',
    'type=REGRESSION&filter=all&entry=reg-3',
  ]) {
    const assets = createAssetsBinding();
    const request = new Request(
      `https://example.test/executions/prototype-test-types?${query}`,
      { headers: { accept: 'text/html' } },
    );

    const response = await worker.fetch(request, { ASSETS: assets.binding });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/);
    assert.match(await response.text(), /<app-root>/);
    assert.deepEqual(assets.requestedPaths, ['/']);
  }
});

test('serves preview API responses as JSON without consulting static assets', async () => {
  const assets = createAssetsBinding();
  const response = await worker.fetch(
    new Request('https://example.test/api/v1/sources'),
    { ASSETS: assets.binding },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^application\/json/);
  assert.deepEqual(assets.requestedPaths, []);
  assert.equal((await response.json()).items[0].id, 'checkout-web');
});

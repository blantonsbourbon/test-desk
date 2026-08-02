import { cp, mkdir, rm } from 'node:fs/promises';

const source = 'frontend/dist/frontend/browser';
const client = 'dist/client';
const server = 'dist/server';
const metadata = 'dist/.openai';

await Promise.all([
  rm(client, { recursive: true, force: true }),
  rm(server, { recursive: true, force: true }),
  rm(metadata, { recursive: true, force: true }),
]);
await Promise.all([
  mkdir(client, { recursive: true }),
  mkdir(server, { recursive: true }),
  mkdir(metadata, { recursive: true }),
]);
await Promise.all([
  cp(source, client, { recursive: true }),
  cp('scripts/sites-worker.js', `${server}/index.js`),
  cp('.openai/hosting.json', `${metadata}/hosting.json`),
]);

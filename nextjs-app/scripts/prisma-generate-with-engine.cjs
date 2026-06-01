#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const env = { ...process.env };

if (Object.prototype.hasOwnProperty.call(env, 'PRISMA_GENERATE_NO_ENGINE')) {
  delete env.PRISMA_GENERATE_NO_ENGINE;
  console.log('[prisma-generate] Unset PRISMA_GENERATE_NO_ENGINE to force local engine generation.');
}

const prismaCliPath = require.resolve('prisma/build/index.js', {
  paths: [path.resolve(__dirname, '..')],
});

const args = [prismaCliPath, 'generate', '--schema', 'prisma/schema.prisma'];

const result = spawnSync(process.execPath, args, {
  cwd: path.resolve(__dirname, '..'),
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error('[prisma-generate] Failed to run prisma generate:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);

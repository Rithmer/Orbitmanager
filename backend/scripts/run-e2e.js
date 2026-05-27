#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(backendDir, '..');
const composeFile = path.join(rootDir, 'docker-compose.yml');
const composeProject = 'taskmanager-e2e';
const composeProfile = 'e2e';
const serviceName = 'postgres-e2e';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const cliArgs = process.argv.slice(2);
const shouldStopAfterRun = cliArgs.includes('--down');
const command = cliArgs.find((arg) => !arg.startsWith('-')) ?? 'test';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  const envFile = resolveEnvFile();
  const testEnv = loadEnvFile(envFile);
  const databaseConfig = getDatabaseConfig(testEnv);

  switch (command) {
    case 'up':
      await ensureDatabaseIsReady(testEnv, databaseConfig);
      console.log('postgres-e2e is ready');
      return;
    case 'down':
      await stopDatabase(testEnv);
      console.log('postgres-e2e is stopped');
      return;
    case 'test':
      await runE2eSuite(testEnv, databaseConfig, shouldStopAfterRun);
      return;
    default:
      throw new Error(`Unknown command "${command}". Use "test", "up", or "down".`);
  }
}

async function runE2eSuite(testEnv, databaseConfig, stopAfterRun) {
  await ensureDatabaseIsReady(testEnv, databaseConfig);

  try {
    await runCommand(npmCommand, ['run', 'db:migrate:deploy'], {
      cwd: backendDir,
      env: testEnv,
    });
    await runCommand(npmCommand, ['run', 'test:e2e:jest'], {
      cwd: backendDir,
      env: testEnv,
    });
  } finally {
    if (stopAfterRun) {
      await stopDatabase(testEnv);
    }
  }
}

async function ensureDatabaseIsReady(testEnv, databaseConfig) {
  await runCommand('docker', composeArgs('up', '-d', serviceName), {
    cwd: rootDir,
    env: testEnv,
  });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      await runCommand(
        'docker',
        composeArgs(
          'exec',
          '-T',
          serviceName,
          'pg_isready',
          '-U',
          databaseConfig.user,
          '-d',
          databaseConfig.database,
        ),
        {
          cwd: rootDir,
          env: testEnv,
          stdio: 'ignore',
        },
      );
      return;
    } catch (error) {
      await sleep(1_000);
    }
  }

  throw new Error('Timed out while waiting for postgres-e2e to become ready.');
}

async function stopDatabase(testEnv) {
  await runCommand('docker', composeArgs('stop', serviceName), {
    cwd: rootDir,
    env: testEnv,
    allowFailure: true,
  });
}

function composeArgs(...args) {
  return [
    'compose',
    '-p',
    composeProject,
    '-f',
    composeFile,
    '--profile',
    composeProfile,
    ...args,
  ];
}

function resolveEnvFile() {
  const explicitPath = process.env.E2E_ENV_FILE;
  if (explicitPath) {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.join(backendDir, explicitPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`E2E env file not found: ${resolved}`);
    }
    return resolved;
  }

  const candidates = [
    path.join(backendDir, '.env.test'),
    path.join(backendDir, '.env.test.example'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'No e2e env file found. Expected backend/.env.test or backend/.env.test.example.',
  );
}

function loadEnvFile(filePath) {
  const parsed = parseEnvFile(fs.readFileSync(filePath, 'utf8'));
  return {
    ...parsed,
    ...process.env,
  };
}

function parseEnvFile(contents) {
  const env = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getDatabaseConfig(env) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for e2e tests.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL for e2e tests: ${databaseUrl}`);
  }

  const database = parsedUrl.pathname.replace(/^\/+/, '');
  const user = decodeURIComponent(parsedUrl.username || env.DB_USERNAME || 'postgres');

  if (!database) {
    throw new Error('DATABASE_URL for e2e tests must include a database name.');
  }

  return { database, user };
}

function runCommand(commandName, args, options = {}) {
  const {
    cwd,
    env,
    stdio = 'inherit',
    allowFailure = false,
  } = options;
  const normalized = normalizeCommand(commandName, args);

  return new Promise((resolve, reject) => {
    const child = spawn(normalized.commandName, normalized.args, {
      cwd,
      env: sanitizeEnv(env),
      stdio,
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0 || allowFailure) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Command failed (${code}): ${[normalized.commandName, ...normalized.args].join(' ')}`,
        ),
      );
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeEnv(env) {
  if (!env) {
    return process.env;
  }

  return Object.fromEntries(
    Object.entries(env).filter(
      ([key, value]) => key && !key.startsWith('=') && typeof value !== 'undefined',
    ),
  );
}

function normalizeCommand(commandName, args) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(commandName)) {
    return {
      commandName: 'cmd.exe',
      args: ['/d', '/s', '/c', commandName, ...args],
    };
  }

  return { commandName, args };
}

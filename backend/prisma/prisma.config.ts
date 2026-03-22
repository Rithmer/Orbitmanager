import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

for (const base of [process.cwd(), path.join(__dirname, '..')]) {
  const envFile = path.join(base, '.env');
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq > 0 && !process.env[t.slice(0, eq).trim()])
        process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
    break;
  }
}

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
  datasource: {
    url: process.env['DATABASE_URL']!,
  },
});

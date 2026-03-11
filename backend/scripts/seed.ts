/**
 * Seed-скрипт для JSON-режима хранения.
 * Создаёт admin-пользователя и инициализирует пустые коллекции.
 *
 * Запуск: npx ts-node scripts/seed.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as argon2 from 'argon2';

const DATA_DIR = path.resolve(__dirname, '..', 'data');

interface JsonFile {
  meta: { entity: string; lastId: number };
  items: unknown[];
}

function writeJsonFile(filename: string, data: JsonFile): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ ${filename}`);
}

async function seed(): Promise<void> {
  console.log('Seeding JSON data files...\n');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const hashedPassword = await argon2.hash('Admin123!');

  writeJsonFile('users.json', {
    meta: { entity: 'users', lastId: 1 },
    items: [
      {
        id: 1,
        login: 'admin',
        password: hashedPassword,
        fullName: 'Администратор',
        profession: 'System Administrator',
        accountStatus: 'active',
        accountRole: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });

  writeJsonFile('teams.json', {
    meta: { entity: 'teams', lastId: 0 },
    items: [],
  });

  writeJsonFile('team_members.json', {
    meta: { entity: 'team_members', lastId: 0 },
    items: [],
  });

  writeJsonFile('projects.json', {
    meta: { entity: 'projects', lastId: 0 },
    items: [],
  });

  writeJsonFile('project_members.json', {
    meta: { entity: 'project_members', lastId: 0 },
    items: [],
  });

  writeJsonFile('tasks.json', {
    meta: { entity: 'tasks', lastId: 0 },
    items: [],
  });

  writeJsonFile('audit_logs.json', {
    meta: { entity: 'audit_logs', lastId: 0 },
    items: [],
  });

  console.log('\nSeed completed. Admin user: login=admin, password=Admin123!');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
